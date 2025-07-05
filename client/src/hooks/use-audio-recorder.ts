import { useState, useCallback, useRef } from 'react';

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
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const {
    language = 'auto',
    chunkDuration = 2 * 60, // 2 minutes in seconds for better reliability
    enhanceText = true
  } = options;



  // Update state helper
  const updateState = useCallback((updates: Partial<AudioRecorderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Process audio chunk with Whisper API
  const processAudioChunk = useCallback(async (chunk: AudioChunk): Promise<TranscriptionResult> => {
    console.log(`🎵 Processing audio chunk ${chunk.chunkIndex + 1}...`);
    
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
      console.error(`❌ Chunk ${chunk.chunkIndex + 1} processing failed:`, error);
      throw error;
    }
  }, [language, enhanceText]);

  // Process all chunks and combine results
  const processAllChunks = useCallback(async (chunks: AudioChunk[]) => {
    updateState({ isProcessing: true });
    
    try {
      const results: TranscriptionResult[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`📤 Processing chunk ${i + 1} of ${chunks.length}...`);
        
        const result = await processAudioChunk(chunk);
        results.push(result);
        
        // Update progress
        updateState({ 
          currentChunkIndex: i + 1,
          transcript: results.map(r => r.text).join(' ').trim()
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
        
        // Validate and process chunks
        const validChunks = chunks.filter(chunk => chunk.blob.size > 1024); // At least 1KB
        
        if (validChunks.length > 0) {
          console.log(`📋 Processing ${validChunks.length} valid chunks (filtered from ${chunks.length} total)`);
          processAllChunks(validChunks);
        } else {
          console.error(`💥 No valid audio chunks found. All ${chunks.length} chunks were empty or too small.`);
          updateState({ error: 'Recording failed - no valid audio data captured. Please try recording again.' });
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
          
          if (blob.size < 1024) { // Less than 1KB indicates failed recording
            console.error(`💥 Invalid chunk created: ${blob.size} bytes - audio data lost!`);
            updateState({ 
              error: 'Audio recording failed - invalid chunk created. Please stop and restart recording.',
              isRecording: false 
            });
            return;
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
      
      // Setup timers
      durationTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
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
    
    mediaRecorderRef.current = null;
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!state.isRecording || state.isPaused) return;
    
    console.log('⏸️ Pausing audio recording...');
    
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      
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
      console.log('⏸️ Recording paused successfully');
    } catch (error) {
      console.error('❌ Failed to pause recording:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to pause recording'
      });
    }
  }, [state.isRecording, state.isPaused, updateState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!state.isRecording || !state.isPaused) return;
    
    console.log('▶️ Resuming audio recording...');
    
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      
      // Resume timers
      durationTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
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

  // Reset state
  const reset = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    }
    
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
  }, [state.isRecording, stopRecording, updateState]);

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
    }
  };
}