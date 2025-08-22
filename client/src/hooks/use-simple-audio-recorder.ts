import { useState, useCallback, useRef } from 'react';

interface SimpleAudioRecorderOptions {
  language?: 'fr' | 'en' | 'auto';
  enhanceText?: boolean;
}

interface SimpleAudioRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  recordingDuration: number;
  error: string | null;
  isSupported: boolean;
  audioLevel: number;
}

export function useSimpleAudioRecorder(options: SimpleAudioRecorderOptions = {}) {
  const { language = 'fr', enhanceText = false } = options;
  
  const [state, setState] = useState<SimpleAudioRecorderState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    recordingDuration: 0,
    error: null,
    isSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    audioLevel: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioDataRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Update state helper
  const updateState = useCallback((updates: Partial<SimpleAudioRecorderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      
      microphone.connect(analyser);
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (!analyserRef.current || !state.isRecording) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const level = Math.min(100, Math.round((average / 128) * 100));
        
        updateState({ audioLevel: level });
        
        if (state.isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    } catch (error) {
      console.warn('Audio level monitoring failed:', error);
    }
  }, [state.isRecording, updateState]);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    updateState({ audioLevel: 0 });
  }, [updateState]);

  // Process audio with Whisper
  const processAudio = useCallback(async (audioBlob: Blob) => {
    console.log(`🎵 Processing audio: ${(audioBlob.size / 1024).toFixed(1)}KB`);
    
    updateState({ isProcessing: true, error: null });

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      formData.append('enhanceText', enhanceText.toString());
      formData.append('chunkIndex', '0');

      const response = await fetch('/api/transcribe-whisper-chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transcription failed');
      }

      const result = await response.json();
      console.log(`✅ Transcription completed: ${result.transcription?.substring(0, 100)}...`);
      
      updateState({ 
        transcript: result.transcription || '',
        isProcessing: false 
      });
      
      return result.transcription || '';
    } catch (error) {
      console.error('❌ Transcription failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
      updateState({ 
        error: errorMessage,
        isProcessing: false 
      });
      throw error;
    }
  }, [language, enhanceText, updateState]);

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
          sampleRate: 16000,
        }
      });

      streamRef.current = stream;
      audioDataRef.current = [];
      
      // Setup MediaRecorder with proper error handling
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioDataRef.current.push(event.data);
          console.log(`📦 Audio data chunk: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Recording stopped, processing audio...');
        
        if (audioDataRef.current.length === 0) {
          updateState({ 
            error: 'No audio data captured. Please try again.',
            isRecording: false 
          });
          return;
        }

        const audioBlob = new Blob(audioDataRef.current, { type: mimeType });
        
        // Validate audio size
        if (audioBlob.size < 1024) {
          updateState({ 
            error: 'Recording too short. Please record for at least a few seconds.',
            isRecording: false 
          });
          return;
        }

        console.log(`📦 Complete recording: ${(audioBlob.size / 1024).toFixed(1)}KB`);
        
        try {
          await processAudio(audioBlob);
        } catch (error) {
          console.error('Processing failed:', error);
        }
        
        updateState({ isRecording: false });
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        updateState({ 
          error: 'Recording failed due to MediaRecorder error',
          isRecording: false 
        });
      };

      // Start recording
      mediaRecorder.start();
      startTimeRef.current = Date.now();
      
      // Setup audio level monitoring
      startAudioLevelMonitoring(stream);
      
      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        updateState({ recordingDuration: elapsed });
      }, 1000);

      updateState({
        isRecording: true,
        error: null,
        transcript: '',
        recordingDuration: 0
      });
      
      console.log('🎤 Recording started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to start recording',
        isRecording: false
      });
    }
  }, [state.isSupported, startAudioLevelMonitoring, processAudio, updateState]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping audio recording...');
    
    // Clear duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
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
  }, [stopAudioLevelMonitoring]);

  // Reset
  const reset = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    }
    
    updateState({
      transcript: '',
      error: null,
      isProcessing: false,
      recordingDuration: 0,
      audioLevel: 0
    });
    
    audioDataRef.current = [];
  }, [state.isRecording, stopRecording, updateState]);

  // Format duration helper
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    transcript: state.transcript,
    recordingDuration: state.recordingDuration,
    error: state.error,
    isSupported: state.isSupported,
    audioLevel: state.audioLevel,
    
    // Actions
    startRecording,
    stopRecording,
    reset,
    formatDuration,
    
    // Computed values
    chunkCount: state.transcript ? 1 : 0,
    currentChunkIndex: state.isProcessing ? 1 : 0,
    getProgress: () => state.isProcessing ? 50 : (state.transcript ? 100 : 0),
    confidence: 0.95, // Default confidence for simple recorder
    
    // Unused properties for compatibility
    isPaused: false,
    pauseRecording: () => {},
    resumeRecording: () => {},
  };
}