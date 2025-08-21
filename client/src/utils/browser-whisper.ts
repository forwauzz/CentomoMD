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
    
    return hasWebAssembly && hasArrayBuffer && hasWorker && hasES2020;
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
   * Convert audio blob to Float32Array for Whisper processing
   */
  private async audioToFloat32Array(audioBlob: Blob): Promise<Float32Array> {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000 // Whisper expects 16kHz
    });

    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get the first channel (mono)
      const channelData = audioBuffer.getChannelData(0);
      
      // Resample to 16kHz if needed
      if (audioBuffer.sampleRate !== 16000) {
        console.log(`🔄 Resampling from ${audioBuffer.sampleRate}Hz to 16kHz`);
        const resampledLength = Math.round(channelData.length * 16000 / audioBuffer.sampleRate);
        const resampled = new Float32Array(resampledLength);
        
        for (let i = 0; i < resampledLength; i++) {
          const srcIndex = Math.round(i * audioBuffer.sampleRate / 16000);
          resampled[i] = channelData[srcIndex] || 0;
        }
        
        return resampled;
      }
      
      return channelData;
      
    } finally {
      // Clean up audio context
      try {
        await audioContext.close();
      } catch (error) {
        console.warn('Failed to close audio context:', error);
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

    if (!this.isModelReady || !this.pipeline) {
      throw new Error('Browser Whisper model not ready. Call ensureModelReady() first.');
    }

    try {
      console.log(`🎙️ Browser Whisper processing: ${(audioBlob.size / 1024).toFixed(1)}KB`);

      // Convert audio to the format expected by Whisper
      const audioArray = await this.audioToFloat32Array(audioBlob);
      
      // Prepare transcription options
      const options: any = {
        chunk_length_s: this.modelConfig.chunk_length_s,
        stride_length_s: this.modelConfig.stride_length_s,
        return_timestamps: false, // We don't need timestamps for ambient
        temperature: 0.2 // Low temperature for consistency
      };

      // Set language if specified
      if (language && language !== 'auto') {
        options.language = language === 'fr' ? 'french' : 'english';
      }

      // Run transcription
      const result = await this.pipeline(audioArray, options);
      
      const processingTime = Date.now() - startTime;
      const text = typeof result === 'string' ? result : result.text || '';

      console.log(`✅ Browser Whisper completed in ${processingTime}ms: "${text.substring(0, 50)}..."`);

      return {
        text: text.trim(),
        source: 'browser-whisper',
        processingTime,
        modelUsed: this.modelConfig.model,
        language: options.language
      };

    } catch (error: any) {
      console.error('❌ Browser Whisper transcription failed:', error);
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