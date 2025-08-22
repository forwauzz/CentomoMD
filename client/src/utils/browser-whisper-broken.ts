/**
 * Browser-based Whisper for Ambient Dictation Only
 * Uses @xenova/transformers to process audio locally
 */

import { pipeline, env } from '@xenova/transformers';

// Configure transformers environment for better model loading
env.allowRemoteModels = true;
env.allowLocalModels = false; // Force remote loading to avoid cache issues
env.useBrowserCache = false; // Disable browser cache for now
env.backends.onnx.wasm.numThreads = 1; // Single thread for stability

export interface BrowserWhisperConfig {
  model: string;
  language?: string;
  chunk_length_s?: number;
  stride_length_s?: number;
}

export interface BrowserWhisperResult {
  text: string;
  source: 'browser-whisper';
  processingTime: number;
  modelUsed: string;
  language?: string;
}

export interface ModelLoadingProgress {
  phase: 'checking' | 'downloading' | 'loading' | 'ready' | 'error';
  progress?: number;
  message: string;
  error?: string;
}

export class BrowserWhisperProcessor {
  private static instance: BrowserWhisperProcessor;
  private pipeline: any = null;
  private modelConfig: BrowserWhisperConfig;
  private isModelReady = false;
  private loadingCallbacks: ((progress: ModelLoadingProgress) => void)[] = [];
  private loadingPromise: Promise<void> | null = null;

  constructor(config: Partial<BrowserWhisperConfig> = {}) {
    this.modelConfig = {
      model: 'Xenova/whisper-tiny.en', // Smaller, more reliable model ~40MB
      language: undefined, // Auto-detect by default
      chunk_length_s: 30,
      stride_length_s: 5,
      ...config
    };
  }

  static getInstance(config?: Partial<BrowserWhisperConfig>): BrowserWhisperProcessor {
    if (!BrowserWhisperProcessor.instance) {
      BrowserWhisperProcessor.instance = new BrowserWhisperProcessor(config);
    }
    return BrowserWhisperProcessor.instance;
  }

  /**
   * Check if browser supports local Whisper processing
   */
  static isBrowserSupported(): boolean {
    // Check for required browser features
    const hasWebAssembly = typeof WebAssembly !== 'undefined';
    const hasArrayBuffer = typeof ArrayBuffer !== 'undefined';
    const hasWorker = typeof Worker !== 'undefined';
    
    // Check for modern browser features needed by transformers.js
    const hasES2020 = typeof BigInt !== 'undefined';
    
    // Check for WebM audio codec support (critical for MediaRecorder output)
    const hasWebMAudioSupport = this.checkWebMAudioSupport();
    
    const isSupported = hasWebAssembly && hasArrayBuffer && hasWorker && hasES2020 && hasWebMAudioSupport;
    
    if (!isSupported) {
      console.warn('🚫 Browser Whisper not supported:', {
        webAssembly: hasWebAssembly,
        arrayBuffer: hasArrayBuffer,
        worker: hasWorker,
        es2020: hasES2020,
        webmAudio: hasWebMAudioSupport
      });
    }
    
    return isSupported;
  }

  /**
   * Check if browser can decode WebM audio format
   */
  private static checkWebMAudioSupport(): boolean {
    try {
      const audio = document.createElement('audio');
      
      // Check WebM audio support with Opus codec (what MediaRecorder produces)
      const webmOpusSupport = audio.canPlayType('audio/webm; codecs="opus"');
      const webmVorbisSupport = audio.canPlayType('audio/webm; codecs="vorbis"');
      
      const hasWebMSupport = webmOpusSupport !== '' || webmVorbisSupport !== '';
      
      console.log('🎵 WebM audio support check:', {
        opus: webmOpusSupport,
        vorbis: webmVorbisSupport,
        supported: hasWebMSupport
      });
      
      return hasWebMSupport;
    } catch (error) {
      console.warn('⚠️ Could not check WebM audio support:', error);
      return false; // Conservative fallback
    }
  }

  /**
   * Add callback for model loading progress
   */
  onLoadingProgress(callback: (progress: ModelLoadingProgress) => void): void {
    this.loadingCallbacks.push(callback);
  }

  /**
   * Remove loading progress callback
   */
  removeLoadingProgress(callback: (progress: ModelLoadingProgress) => void): void {
    const index = this.loadingCallbacks.indexOf(callback);
    if (index > -1) {
      this.loadingCallbacks.splice(index, 1);
    }
  }

  private notifyLoadingProgress(progress: ModelLoadingProgress): void {
    this.loadingCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.warn('Loading progress callback failed:', error);
      }
    });
  }

  /**
   * Ensure model is ready for transcription
   */
  async ensureModelReady(): Promise<void> {
    if (this.isModelReady && this.pipeline) {
      return;
    }

    // If already loading, wait for existing load
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadModel();
    return this.loadingPromise;
  }

  private async loadModel(): Promise<void> {
    try {
      this.notifyLoadingProgress({
        phase: 'checking',
        message: 'Checking speech recognition model...'
      });

      // Check if model is already cached
      let attemptCount = 0;
      const maxAttempts = 2;

      while (attemptCount < maxAttempts) {
        try {
          this.notifyLoadingProgress({
            phase: 'downloading',
            progress: 0,
            message: attemptCount === 0 ? 
              'Loading speech recognition model...' : 
              'Re-downloading model (cache cleared)...'
          });

          // Create the pipeline with explicit configuration for better reliability
          this.pipeline = await pipeline('automatic-speech-recognition', this.modelConfig.model, {
            // Configure for remote loading
            local_files_only: false,
            revision: 'main',
            // Configure progress callback
            progress_callback: (progress: any) => {
              console.log('📥 Download progress:', progress);
              if (progress.status === 'downloading' && progress.total) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                this.notifyLoadingProgress({
                  phase: 'downloading',
                  progress: percent,
                  message: `Downloading model... ${percent}% (${(progress.loaded / 1024 / 1024).toFixed(1)}MB)`
                });
              } else if (progress.status === 'loading') {
                this.notifyLoadingProgress({
                  phase: 'loading',
                  message: 'Loading model into memory...'
                });
              } else if (progress.status === 'ready') {
                this.notifyLoadingProgress({
                  phase: 'ready',
                  message: 'Model ready for transcription!'
                });
              }
            }
          });

          this.notifyLoadingProgress({
            phase: 'loading',
            message: 'Initializing model...'
          });

          // Test the model with a small audio buffer to ensure it's working
          const testBuffer = new Float32Array(16000); // 1 second of silence at 16kHz
          await this.pipeline(testBuffer, {
            language: 'english',
            chunk_length_s: 5,
            stride_length_s: 1
          });

          this.isModelReady = true;
          this.notifyLoadingProgress({
            phase: 'ready',
            message: 'Speech recognition ready!'
          });

          console.log('✅ Browser Whisper model loaded successfully');
          break;

        } catch (error: any) {
          attemptCount++;
          console.warn(`Model load attempt ${attemptCount} failed:`, error.message);

          if (attemptCount >= maxAttempts) {
            throw error;
          }

          // Clear any cached model before retry
          this.pipeline = null;
          this.isModelReady = false;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error: any) {
      this.isModelReady = false;
      this.pipeline = null;
      
      this.notifyLoadingProgress({
        phase: 'error',
        message: 'Speech recognition unavailable, using fallback',
        error: error.message
      });

      console.error('❌ Failed to load browser Whisper model:', error);
      throw new Error(`Browser Whisper initialization failed: ${error.message}`);
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Convert audio blob to Float32Array for Whisper processing - Enhanced with multiple fallback methods
   */
  private async audioToFloat32Array(audioBlob: Blob): Promise<Float32Array> {
    let audioContext: AudioContext | null = null;
    
    try {
      // Validate blob first
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Empty or invalid audio blob');
      }
      
      console.log(`🎵 Converting audio blob: ${(audioBlob.size / 1024).toFixed(1)}KB, type: ${audioBlob.type}`);
      
      // Create audio context
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000 // Whisper expects 16kHz
      });

      const audioBuffer = await audioBlob.arrayBuffer();
      
      // Add explicit format validation
      if (audioBuffer.byteLength < 100) {
        throw new Error('Audio buffer too small (likely invalid WebM)');
      }
      
      console.log(`🔄 Decoding ${audioBuffer.byteLength} bytes of audio data`);
      
      // Decode audio data with enhanced error handling
      let decodedAudio: AudioBuffer;
      try {
        decodedAudio = await audioContext.decodeAudioData(audioBuffer);
      } catch (decodeError: any) {
        console.warn('WebM decoding failed, trying with different approach:', decodeError.message);
        
        // Try with a fresh buffer
        const freshBuffer = await audioBlob.arrayBuffer();
        decodedAudio = await audioContext.decodeAudioData(freshBuffer);
      }
      
      if (!decodedAudio || decodedAudio.length === 0) {
        throw new Error('Decoded audio buffer is empty');
      }
      
      console.log(`✅ Audio decoded: ${decodedAudio.duration.toFixed(1)}s, ${decodedAudio.sampleRate}Hz, ${decodedAudio.numberOfChannels} channels`);
      
      // Get the first channel (mono)
      const channelData = decodedAudio.getChannelData(0);
      
      // Validate audio data
      if (!channelData || channelData.length === 0) {
        throw new Error('No audio channel data found');
      }



  private async mediaStreamConversion(audioBlob: Blob): Promise<Float32Array> {
    // Alternative method using createObjectURL
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onloadeddata = async () => {
        let audioContext: AudioContext | null = null;
        try {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000
          });
          
          const source = audioContext.createMediaElementSource(audio);
          const analyser = audioContext.createAnalyser();
          source.connect(analyser);
          
          // Wait for audio to be ready
          await new Promise(r => setTimeout(r, 100));
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Float32Array(bufferLength);
          analyser.getFloatTimeDomainData(dataArray);
          
          console.log(`✅ MediaStream conversion: ${dataArray.length} samples`);
          resolve(dataArray);
        } catch (error) {
          reject(error);
        } finally {
          if (audioContext) {
            audioContext.close();
          }
          cleanup();
        }
      };
      
      audio.onerror = () => {
        cleanup();
        reject(new Error('Audio element failed to load'));
      };
      
      audio.load();
    });
  }

  private async htmlAudioConversion(audioBlob: Blob): Promise<Float32Array> {
    // Last resort: convert to different format first
    const wavBlob = await this.convertWebMToWAV(audioBlob);
    return await this.directWebAudioConversion(wavBlob);
  }

  private async convertWebMToWAV(webmBlob: Blob): Promise<Blob> {
    // Simple WebM → WAV conversion using MediaRecorder
    let audioContext: AudioContext | null = null;
    
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const wavBuffer = this.audioBufferToWAV(audioBuffer);
      
      console.log(`✅ WebM→WAV conversion: ${(wavBuffer.byteLength / 1024).toFixed(1)}KB`);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } finally {
      if (audioContext) {
        audioContext.close();
      }
    }
  }

  private audioBufferToWAV(audioBuffer: AudioBuffer): ArrayBuffer {
    const numChannels = 1; // Force mono for Whisper
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = new ArrayBuffer(44 + audioBuffer.length * blockAlign);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.length * blockAlign, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, audioBuffer.length * blockAlign, true);

    // Audio data - use first channel only (mono)
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  }
      }
      
      // Check for silent audio (might indicate a problem)
      let maxAmplitude = 0;
      for (let i = 0; i < channelData.length; i++) {
        const amplitude = Math.abs(channelData[i]);
        if (amplitude > maxAmplitude) {
          maxAmplitude = amplitude;
        }
      }
      if (maxAmplitude < 0.001) {
        console.warn('⚠️ Audio appears to be very quiet or silent', { maxAmplitude, samples: channelData.length });
        // Still process quiet audio, but log the issue
      } else {
        console.log(`🔊 Audio quality check: max amplitude ${maxAmplitude.toFixed(4)}, ${channelData.length} samples`);
      }
      
      // Resample to 16kHz if needed
      if (audioBuffer.sampleRate !== 16000) {
        console.log(`🔄 Resampling from ${audioBuffer.sampleRate}Hz to 16kHz`);
        const resampledLength = Math.round(channelData.length * 16000 / audioBuffer.sampleRate);
        const resampled = new Float32Array(resampledLength);
        
        for (let i = 0; i < resampledLength; i++) {
          const srcIndex = Math.round(i * audioBuffer.sampleRate / 16000);
          resampled[i] = channelData[srcIndex] || 0;
        }
        
        console.log(`✅ Resampled to ${resampled.length} samples (${(resampled.length / 16000).toFixed(1)}s)`);
        return resampled;
      }
      
      console.log(`✅ Audio ready: ${channelData.length} samples (${(channelData.length / 16000).toFixed(1)}s)`);
      return new Float32Array(channelData); // Create copy to avoid memory issues
      
    } catch (error: any) {
      console.error('❌ Audio conversion failed:', error);
      throw new Error(`Audio conversion failed: ${error.message}`);
    } finally {
      // Clean up audio context
      if (audioContext) {
        try {
          await audioContext.close();
        } catch (error) {
          console.warn('Failed to close audio context:', error);
        }
      }
    }
  }

  /**
   * Transcribe audio blob using browser Whisper
   */
  async transcribe(
    audioBlob: Blob, 
    language?: 'fr' | 'en' | 'auto'
  ): Promise<BrowserWhisperResult> {
    const startTime = Date.now();

    // Ensure model is ready
    if (!this.isModelReady || !this.pipeline) {
      console.log('🔄 Model not ready, attempting to reload...');
      await this.ensureModelReady();
      
      if (!this.isModelReady || !this.pipeline) {
        throw new Error('Browser Whisper model failed to load');
      }
    }

    try {
      console.log(`🎙️ Browser Whisper processing: ${(audioBlob.size / 1024).toFixed(1)}KB`);

      // Convert audio to the format expected by Whisper
      let audioArray = await this.audioToFloat32Array(audioBlob);
      
      // Validate audio array
      if (!audioArray || audioArray.length === 0) {
        throw new Error('Audio conversion produced empty array');
      }
      
      // Check audio length (must be reasonable for processing)
      const durationSeconds = audioArray.length / 16000;
      if (durationSeconds > 300) { // 5 minutes max
        console.warn(`⚠️ Audio is very long (${durationSeconds.toFixed(1)}s), truncating to 5 minutes`);
        const maxSamples = 16000 * 300;
        audioArray = audioArray.slice(0, maxSamples);
      }
      
      console.log(`🎵 Processing ${(audioArray.length / 16000).toFixed(1)}s of audio data`);
      
      // Prepare transcription options
      const options: any = {
        chunk_length_s: Math.min(this.modelConfig.chunk_length_s!, 30), // Max 30s chunks
        stride_length_s: Math.min(this.modelConfig.stride_length_s!, 5), // Max 5s stride
        return_timestamps: false,
        temperature: 0.1, // Very low temperature for consistency
        condition_on_previous_text: false // Don't use previous context to avoid accumulating errors
      };

      // Set language if specified
      if (language && language !== 'auto') {
        options.language = language === 'fr' ? 'french' : 'english';
      }

      console.log(`🔧 Transcription options:`, { 
        language: options.language, 
        chunk_length: options.chunk_length_s,
        audio_duration: durationSeconds.toFixed(1) 
      });

      // Run transcription with timeout
      let result: any;
      const transcriptionPromise = this.pipeline(audioArray, options);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transcription timeout after 15 seconds')), 15000);
      });
      
      try {
        result = await Promise.race([transcriptionPromise, timeoutPromise]);
      } catch (transcriptionError: any) {
        console.error('❌ Transcription failed, attempting model recovery:', transcriptionError.message);
        
        // Try to recover the model
        this.isModelReady = false;
        this.pipeline = null;
        
        throw transcriptionError;
      }
      
      const processingTime = Date.now() - startTime;
      
      // Extract text from result
      let text = '';
      if (typeof result === 'string') {
        text = result;
      } else if (result && typeof result === 'object') {
        text = result.text || result.output || '';
      }
      
      // Validate result
      if (!text || typeof text !== 'string') {
        throw new Error('Transcription returned invalid result format');
      }
      
      text = text.trim();
      
      if (!text) {
        console.warn('⚠️ Transcription returned empty text');
        throw new Error('Transcription returned empty result');
      }

      console.log(`✅ Browser Whisper completed in ${processingTime}ms: "${text.substring(0, 50)}..."`);

      return {
        text,
        source: 'browser-whisper',
        processingTime,
        modelUsed: this.modelConfig.model,
        language: options.language
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Browser Whisper transcription failed after ${processingTime}ms:`, error);
      
      // Mark model as potentially corrupted for future recovery
      if (error.message.includes('timeout') || error.message.includes('invalid')) {
        console.warn('🔧 Marking model for potential reload due to error type');
        this.isModelReady = false;
      }
      
      throw new Error(`Browser transcription failed: ${error.message}`);
    }
  }

  /**
   * Get model status information
   */
  getStatus(): {
    isReady: boolean;
    modelConfig: BrowserWhisperConfig;
    isSupported: boolean;
  } {
    return {
      isReady: this.isModelReady,
      modelConfig: this.modelConfig,
      isSupported: BrowserWhisperProcessor.isBrowserSupported()
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.pipeline = null;
    this.isModelReady = false;
    this.loadingCallbacks = [];
    this.loadingPromise = null;
    console.log('🧹 Browser Whisper cleaned up');
  }
}

// Export singleton instance
export const browserWhisper = BrowserWhisperProcessor.getInstance();