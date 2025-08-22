import { useState, useCallback, useRef } from 'react';
import { sessionManager, generateSessionId, isSessionRecoverable } from '@/utils/session-storage';

interface AudioRecorderOptions {
  language?: 'fr' | 'en' | 'auto';
  chunkDuration?: number; // in seconds
  enhanceText?: boolean;
}

interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
  chunkIndex: number;
}

interface TranscriptionResult {
  text: string;
  enhanced?: {
    text: string;
    corrections: Array<{ original: string; corrected: string; reason: string }>;
  };
  duration?: number;
  language?: string;
  confidence?: number;
}

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  transcript: string;
  chunks: AudioChunk[];
  recordingDuration: number;
  chunkCount: number;
  currentChunkIndex: number;
  error: string | null;
  isSupported: boolean;
  failedChunks: number[];
  retryCount: number;
  audioLevel: number; // 0-100 representing audio input level
  isListening: boolean; // true when actively capturing sound
}

export function useAudioRecorder(options: AudioRecorderOptions = {}) {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    isProcessing: false,
    transcript: '',
    chunks: [],
    recordingDuration: 0,
    chunkCount: 0,
    currentChunkIndex: 0,
    error: null,
    isSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    failedChunks: [],
    retryCount: 0,
    audioLevel: 0,
    isListening: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    language = 'auto',
    chunkDuration = 2 * 60, // 2 minutes in seconds for better reliability
    enhanceText = true
  } = options;



  // Update state helper
  const updateState = useCallback((updates: Partial<AudioRecorderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Audio level detection
  const setupAudioLevelDetection = useCallback((stream: MediaStream) => {
    try {
      // Create audio context and analyzer
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Connect microphone stream to analyzer
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Configure analyzer
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      console.log('🎵 Audio level detection initialized');
    } catch (error) {
      console.warn('Audio level detection setup failed:', error);
    }
  }, []);

  // Analyze audio level
  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    try {
      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const average = sum / dataArrayRef.current.length;
      
      // Convert to 0-100 scale and apply sensitivity
      const audioLevel = Math.min(100, Math.round((average / 128) * 100));
      const isListening = audioLevel > 5; // Threshold for detecting sound
      
      updateState({ audioLevel, isListening });
      
      // Continue animation loop if recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
      }
    } catch (error) {
      console.warn('Audio analysis failed:', error);
    }
  }, [updateState]);

  // Start audio level monitoring
  const startAudioLevelMonitoring = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      console.log('🎵 Starting audio level monitoring');
      animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
    }
  }, [analyzeAudioLevel]);

  // Stop audio level monitoring
  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    dataArrayRef.current = null;
    
    updateState({ audioLevel: 0, isListening: false });
    console.log('🎵 Audio level monitoring stopped');
  }, [updateState]);

  // Process audio chunk with Whisper API with retry logic
  const processAudioChunk = useCallback(async (chunk: AudioChunk, retryAttempt: number = 0): Promise<TranscriptionResult> => {
    console.log(`🎵 Processing audio chunk ${chunk.chunkIndex + 1}... (attempt ${retryAttempt + 1})`);
    
    const formData = new FormData();
    formData.append('audio', chunk.blob, `chunk-${chunk.chunkIndex}.webm`);
    formData.append('language', language);
    formData.append('enhanceText', enhanceText.toString());
    formData.append('chunkIndex', chunk.chunkIndex.toString());

    try {
      const response = await fetch('/api/transcribe-whisper-chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transcription failed');
      }

      const result = await response.json();
      console.log(`✅ Chunk ${chunk.chunkIndex + 1} processed: ${result.transcription.substring(0, 100)}...`);
      
      return {
        text: result.transcription,
        enhanced: result.enhanced,
        duration: result.duration,
        language: result.language,
        confidence: result.confidence
      };
    } catch (error) {
      console.error(`❌ Chunk ${chunk.chunkIndex + 1} processing failed (attempt ${retryAttempt + 1}):`, error);
      
      // Retry logic with exponential backoff
      if (retryAttempt < 2) { // Max 3 attempts
        const delay = Math.min(1000 * Math.pow(2, retryAttempt), 5000); // 1s, 2s, 4s max
        console.log(`⏳ Retrying chunk ${chunk.chunkIndex + 1} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return processAudioChunk(chunk, retryAttempt + 1);
      }
      
      throw error;
    }
  }, [language, enhanceText]);

  // Storage usage monitoring
  const getStorageUsage = useCallback(() => {
    try {
      const localStorageSize = JSON.stringify(localStorage).length;
      const sessionStorageSize = JSON.stringify(sessionStorage).length;
      const totalUsed = localStorageSize + sessionStorageSize;
      const estimatedLimit = 10 * 1024 * 1024; // 10MB conservative estimate
      
      return {
        used: totalUsed,
        limit: estimatedLimit,
        percentage: (totalUsed / estimatedLimit) * 100,
        localStorageSize,
        sessionStorageSize
      };
    } catch (error) {
      console.warn('Could not calculate storage usage:', error);
      return { used: 0, limit: 10 * 1024 * 1024, percentage: 0, localStorageSize: 0, sessionStorageSize: 0 };
    }
  }, []);

  // Cleanup processed chunk to free memory
  const cleanupProcessedChunk = useCallback((chunkIndex: number, chunks: AudioChunk[]) => {
    try {
      // Clear the audio blob from memory
      if (chunks[chunkIndex]?.blob) {
        // Set to null to release memory (garbage collection will handle it)
        chunks[chunkIndex] = { ...chunks[chunkIndex], blob: null as any };
      }
      
      // Clear chunk-specific session storage
      sessionStorage.removeItem(`chunk_backup_${chunkIndex}`);
      sessionStorage.removeItem(`chunk_metadata_${chunkIndex}`);
      
      console.log(`🧹 Cleaned up chunk ${chunkIndex + 1} from memory`);
    } catch (error) {
      console.warn(`Failed to cleanup chunk ${chunkIndex}:`, error);
    }
  }, []);

  // Process all chunks and combine results
  const processAllChunks = useCallback(async (chunks: AudioChunk[]) => {
    updateState({ isProcessing: true });
    
    try {
      const results: TranscriptionResult[] = [];
      const storageUsage = getStorageUsage();
      
      // Warn if storage is getting full
      if (storageUsage.percentage > 70) {
        console.warn(`⚠️ Storage usage at ${storageUsage.percentage.toFixed(1)}% - consider saving session`);
      }
      
      // Auto-cleanup if approaching critical storage levels
      if (storageUsage.percentage > 85) {
        console.log('🧹 Auto-cleanup triggered due to high storage usage');
        try {
          // Remove old backup entries
          const keysToRemove = ['dictation_backup_old', 'dictation_emergency_backup_old'];
          keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
          });
          
          // Clean up chunk metadata for processed chunks
          for (let i = 0; i < chunks.length - 2; i++) { // Keep last 2 chunks
            sessionStorage.removeItem(`chunk_backup_${i}`);
            sessionStorage.removeItem(`chunk_metadata_${i}`);
          }
          
          console.log('✅ Auto-cleanup completed');
        } catch (error) {
          console.warn('Auto-cleanup failed:', error);
        }
      }
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`📤 Processing chunk ${i + 1} of ${chunks.length}...`);
        
        updateState({ currentChunkIndex: i + 1 });
        
        try {
          const result = await processAudioChunk(chunk);
          results.push(result);
          
          // Cleanup processed chunk immediately to free memory
          cleanupProcessedChunk(i, chunks);
        } catch (error) {
          console.error(`⚠️ Failed to process chunk ${chunk.chunkIndex + 1} after retries:`, error);
          
          // Add to failed chunks list
          updateState((prev: AudioRecorderState) => ({
            ...prev,
            failedChunks: [...prev.failedChunks, chunk.chunkIndex]
          }));
          
          // Add empty result to maintain order
          results.push({
            text: `[CHUNK ${chunk.chunkIndex + 1} FAILED - RETRY AVAILABLE]`,
            enhanced: undefined,
            duration: 0,
            language: language,
            confidence: 0
          });
        }
        
        // Create progressive transcript and save backup
        const progressiveTranscript = results.map(r => r.text).join(' ').trim();
        
        // CRITICAL: Save transcript backup immediately after each chunk
        const backupData = {
          sessionId: sessionIdRef.current,
          transcript: progressiveTranscript,
          chunkIndex: i + 1,
          totalChunks: chunks.length,
          timestamp: Date.now(),
          language: language,
          isProcessing: true
        };
        
        try {
          sessionStorage.setItem('dictation_transcript_backup', JSON.stringify(backupData));
          localStorage.setItem('dictation_emergency_backup', JSON.stringify(backupData));
          console.log(`💾 Saved transcript backup: chunk ${i + 1}/${chunks.length}, ${progressiveTranscript.length} chars`);
        } catch (error) {
          console.warn('Failed to save transcript backup:', error);
        }
        
        // Update progress
        updateState({ 
          currentChunkIndex: i + 1,
          transcript: progressiveTranscript
        });
      }
      
      // Combine all transcriptions
      const finalTranscript = results.map(r => r.text).join(' ').trim();
      const averageConfidence = results.reduce((sum, r) => sum + (r.confidence || 0.95), 0) / results.length;
      
      console.log(`✅ All chunks processed. Final transcript: ${finalTranscript.length} characters`);
      
      updateState({
        transcript: finalTranscript,
        isProcessing: false,
        currentChunkIndex: 0
      });
      
      return {
        text: finalTranscript,
        confidence: averageConfidence,
        chunks: results
      };
      
    } catch (error) {
      console.error('❌ Chunk processing failed:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Processing failed',
        isProcessing: false,
        currentChunkIndex: 0
      });
      throw error;
    }
  }, [processAudioChunk, updateState]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!state.isSupported) {
      updateState({ error: 'Audio recording is not supported in this browser' });
      return;
    }

    try {
      console.log('🎤 Starting audio recording...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Whisper prefers 16kHz
        }
      });

      streamRef.current = stream;
      
      // Setup audio level detection
      setupAudioLevelDetection(stream);
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' // Whisper-compatible format
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: AudioChunk[] = [];
      let currentChunkData: Blob[] = [];
      let chunkStartTime = Date.now();
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          currentChunkData.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (currentChunkData.length > 0) {
          const blob = new Blob(currentChunkData, { type: 'audio/webm' });
          const chunkEndTime = Date.now();
          
          chunks.push({
            blob,
            startTime: chunkStartTime,
            endTime: chunkEndTime,
            chunkIndex: chunks.length
          });
          
          console.log(`📦 Created chunk ${chunks.length}: ${blob.size} bytes`);
        }
        
        updateState({ 
          chunks,
          chunkCount: chunks.length,
          isRecording: false 
        });
        
        // Enhanced chunk validation before processing
        const minValidSize = 2048; // 2KB minimum
        const validChunks = chunks.filter(chunk => {
          const isValid = chunk.blob && chunk.blob.size > minValidSize;
          if (!isValid) {
            console.warn(`🗑️ Filtering out invalid chunk: ${chunk.blob?.size || 0} bytes`);
          }
          return isValid;
        });
        
        console.log(`📋 Chunk validation: ${validChunks.length}/${chunks.length} chunks valid`);
        
        if (validChunks.length > 0) {
          console.log(`🎬 Processing ${validChunks.length} valid chunks...`);
          processAllChunks(validChunks);
        } else {
          console.error(`💥 No valid audio chunks found from ${chunks.length} total chunks`);
          updateState({ 
            error: language === "fr"
              ? 'Enregistrement échoué - aucune donnée audio valide. Réessayez l\'enregistrement.'
              : 'Recording failed - no valid audio data captured. Please try recording again.',
            isRecording: false,
            isProcessing: false
          });
        }
      };

      // Handle chunk creation during recording with session recovery
      const createChunk = () => {
        if (mediaRecorder.state === 'recording') {
          console.log(`🔄 Creating chunk at ${chunks.length + 1}, current data size: ${currentChunkData.length} blobs`);
          
          // Validate we have audio data before stopping
          if (currentChunkData.length === 0) {
            console.warn('⚠️ No audio data available for chunk creation, retrying...');
            return;
          }
          
          mediaRecorder.stop();
          
          // Create the chunk with validation
          const blob = new Blob(currentChunkData, { type: 'audio/webm' });
          const chunkEndTime = Date.now();
          
          // Enhanced chunk validation
          const minValidSize = 2048; // 2KB minimum for valid audio
          const maxExpectedSize = 5 * 1024 * 1024; // 5MB max for 2-minute chunk
          
          if (blob.size < minValidSize) {
            console.error(`💥 Invalid chunk created: ${blob.size} bytes (min: ${minValidSize})`);
            updateState({ 
              error: language === "fr" 
                ? 'Enregistrement échoué - chunk audio invalide. Redémarrez l\'enregistrement.'
                : 'Recording failed - invalid audio chunk. Please restart recording.',
              isRecording: false 
            });
            return;
          }
          
          if (blob.size > maxExpectedSize) {
            console.warn(`⚠️ Large chunk detected: ${(blob.size / 1024 / 1024).toFixed(1)}MB - may cause issues`);
          }
          
          const newChunk = {
            blob,
            startTime: chunkStartTime,
            endTime: chunkEndTime,
            chunkIndex: chunks.length
          };
          
          chunks.push(newChunk);
          
          console.log(`📦 Auto-created chunk ${chunks.length}: ${blob.size} bytes`);
          
          // Save chunk metadata to session storage for recovery
          try {
            const sessionData = {
              chunkIndex: chunks.length,
              size: blob.size,
              startTime: chunkStartTime,
              endTime: chunkEndTime,
              timestamp: Date.now()
            };
            sessionStorage.setItem(`audioChunk_${chunks.length}`, JSON.stringify(sessionData));
            console.log(`💾 Saved chunk ${chunks.length} metadata to session storage`);
          } catch (error) {
            console.warn('Failed to save chunk to session storage:', error);
          }
          
          // Reset for next chunk
          currentChunkData = [];
          chunkStartTime = Date.now();
          
          // Start next chunk with error handling
          try {
            mediaRecorder.start();
            updateState({ chunkCount: chunks.length });
          } catch (error) {
            console.error('Failed to start next chunk:', error);
            updateState({ 
              error: 'Failed to continue recording. Please stop and restart.',
              isRecording: false 
            });
          }
        }
      };

      // Start recording
      mediaRecorder.start();
      startTimeRef.current = Date.now();
      
      // Start audio level monitoring
      startAudioLevelMonitoring();
      
      // Reset pause counters
      pauseTimeRef.current = 0;
      totalPausedTimeRef.current = 0;
      
      // Setup timers
      durationTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - totalPausedTimeRef.current) / 1000);
        updateState({ recordingDuration: elapsed });
      }, 1000);
      
      chunkTimerRef.current = setInterval(() => {
        createChunk();
      }, chunkDuration * 1000);

      updateState({ 
        isRecording: true,
        error: null,
        transcript: '',
        chunks: [],
        recordingDuration: 0,
        chunkCount: 0,
        currentChunkIndex: 0
      });
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to start recording',
        isRecording: false 
      });
    }
  }, [state.isSupported, chunkDuration, updateState, processAllChunks]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping audio recording...');
    
    // Clear timers
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop audio level monitoring
    stopAudioLevelMonitoring();
    
    mediaRecorderRef.current = null;
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!state.isRecording || state.isPaused) return;
    
    console.log('⏸️ Pausing audio recording...');
    
    try {
      // CRITICAL: Save current state before pausing to prevent data loss
      const pauseBackupData = {
        sessionId: sessionIdRef.current,
        transcript: state.transcript,
        chunks: state.chunks.length,
        recordingDuration: state.recordingDuration,
        timestamp: Date.now(),
        language: language,
        isPaused: true,
        action: 'pause'
      };
      
      try {
        sessionStorage.setItem('dictation_pause_backup', JSON.stringify(pauseBackupData));
        localStorage.setItem('dictation_emergency_backup', JSON.stringify(pauseBackupData));
        console.log(`💾 Saved pause backup: ${state.transcript.length} chars, ${state.chunks.length} chunks`);
      } catch (error) {
        console.warn('Failed to save pause backup:', error);
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      
      // Store pause time to freeze the duration
      pauseTimeRef.current = Date.now();
      
      // Pause timers
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
        chunkTimerRef.current = null;
      }
      
      updateState({ isPaused: true });
      console.log('⏸️ Recording paused successfully with backup saved');
    } catch (error) {
      console.error('❌ Failed to pause recording:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to pause recording'
      });
    }
  }, [state.isRecording, state.isPaused, state.transcript, state.chunks, state.recordingDuration, language, updateState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!state.isRecording || !state.isPaused) return;
    
    console.log('▶️ Resuming audio recording...');
    
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      
      // Calculate total paused time
      if (pauseTimeRef.current > 0) {
        totalPausedTimeRef.current += Date.now() - pauseTimeRef.current;
        pauseTimeRef.current = 0;
      }
      
      // Resume timers with pause time correction
      durationTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - totalPausedTimeRef.current) / 1000);
        updateState({ recordingDuration: elapsed });
      }, 1000);
      
      chunkTimerRef.current = setInterval(() => {
        // Chunk creation logic for resume (simplified)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('🔄 Auto-chunk timer triggered during resume');
          mediaRecorderRef.current.requestData();
        }
      }, chunkDuration * 1000);
      
      updateState({ isPaused: false });
      console.log('▶️ Recording resumed successfully');
    } catch (error) {
      console.error('❌ Failed to resume recording:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to resume recording'
      });
    }
  }, [state.isRecording, state.isPaused, chunkDuration, updateState]);

  // Reset state with data preservation
  const reset = useCallback(() => {
    console.log('🔄 Resetting audio recorder with data preservation...');
    
    // CRITICAL: Save current state before reset to prevent data loss
    if (state.transcript || state.chunks.length > 0) {
      const resetBackupData = {
        sessionId: sessionIdRef.current,
        transcript: state.transcript,
        chunks: state.chunks.length,
        recordingDuration: state.recordingDuration,
        timestamp: Date.now(),
        language: language,
        action: 'reset',
        preservedData: true
      };
      
      try {
        sessionStorage.setItem('dictation_reset_backup', JSON.stringify(resetBackupData));
        localStorage.setItem('dictation_emergency_backup', JSON.stringify(resetBackupData));
        console.log(`💾 Saved reset backup: ${state.transcript.length} chars before clearing`);
      } catch (error) {
        console.warn('Failed to save reset backup:', error);
      }
    }
    
    if (state.isRecording) {
      stopRecording();
    }
    
    // Reset pause time counters
    pauseTimeRef.current = 0;
    totalPausedTimeRef.current = 0;
    
    updateState({
      transcript: '',
      chunks: [],
      recordingDuration: 0,
      chunkCount: 0,
      currentChunkIndex: 0,
      error: null,
      isProcessing: false,
      isPaused: false
    });
    
    console.log('🔄 Reset completed with backup preserved');
  }, [state.isRecording, state.transcript, state.chunks, state.recordingDuration, language, stopRecording, updateState]);

  // Retry failed chunks
  const retryFailedChunks = useCallback(async () => {
    if (state.failedChunks.length === 0) return;
    
    console.log(`🔄 Retrying ${state.failedChunks.length} failed chunks...`);
    updateState({ isProcessing: true, retryCount: state.retryCount + 1 });
    
    try {
      const failedChunkIndices = [...state.failedChunks];
      const retryResults: TranscriptionResult[] = [];
      
      for (const chunkIndex of failedChunkIndices) {
        const chunk = state.chunks[chunkIndex];
        if (chunk && chunk.blob) {
          try {
            const result = await processAudioChunk(chunk);
            retryResults.push(result);
            
            // Remove from failed chunks
            updateState((prev: AudioRecorderState) => ({
              ...prev,
              failedChunks: prev.failedChunks.filter((idx: number) => idx !== chunkIndex)
            }));
            
            console.log(`✅ Retry successful for chunk ${chunkIndex + 1}`);
          } catch (error) {
            console.error(`❌ Retry failed for chunk ${chunkIndex + 1}:`, error);
          }
        }
      }
      
      // Update transcript with retry results
      if (retryResults.length > 0) {
        const newTranscript = retryResults.map(r => r.text).join(' ').trim();
        updateState((prev: AudioRecorderState) => ({
          ...prev,
          transcript: prev.transcript + ' ' + newTranscript
        }));
      }
      
    } catch (error) {
      console.error('Retry process failed:', error);
      updateState({ error: 'Failed to retry chunks. Please try again.' });
    } finally {
      updateState({ isProcessing: false });
    }
  }, [state.failedChunks, state.chunks, state.retryCount, state.transcript, processAudioChunk, updateState]);

  return {
    // State
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    isProcessing: state.isProcessing,
    transcript: state.transcript,
    chunks: state.chunks,
    recordingDuration: state.recordingDuration,
    chunkCount: state.chunkCount,
    currentChunkIndex: state.currentChunkIndex,
    error: state.error,
    isSupported: state.isSupported,
    audioLevel: state.audioLevel,
    isListening: state.isListening,
    
    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset: () => {
      console.log('🔄 Resetting audio recorder state');
      updateState({
        transcript: '',
        isProcessing: false,
        currentChunkIndex: 0,
        chunkCount: 0,
        chunks: [],
        error: null,
        recordingDuration: 0
      });
    },
    
    // Helpers
    formatDuration: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    getProgress: () => {
      if (!state.isProcessing || state.chunkCount === 0) return 0;
      return (state.currentChunkIndex / state.chunkCount) * 100;
    },
    
    getStorageUsage,
    
    // Storage warning levels
    getStorageWarning: () => {
      const usage = getStorageUsage();
      if (usage.percentage > 90) return 'critical';
      if (usage.percentage > 70) return 'warning';
      return 'normal';
    },

    // Failed chunks and retry functionality
    failedChunks: state.failedChunks,
    retryCount: state.retryCount,
    retryFailedChunks,
    
    // Utility functions
    hasFailedChunks: () => state.failedChunks.length > 0
  };
}