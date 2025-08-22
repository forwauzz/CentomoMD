/**
 * Browser-based Whisper for Ambient Dictation Only
 * Enhanced with multiple audio conversion methods for WebM compatibility
 */

import { pipeline, env } from '@xenova/transformers';

// Configure transformers environment for better model loading
env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = false;
env.backends.onnx.wasm.numThreads = 1;

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
      model: 'Xenova/whisper-tiny.en',
      language: undefined,
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

  static isBrowserSupported(): boolean {
    const hasWebAssembly = typeof WebAssembly !== 'undefined';
    const hasArrayBuffer = typeof ArrayBuffer !== 'undefined';
    const hasWorker = typeof Worker !== 'undefined';
    const hasES2020 = typeof BigInt !== 'undefined';
    const hasWebMAudioSupport = this.checkWebMAudioSupport();
    
    const isSupported = hasWebAssembly && hasArrayBuffer && hasWorker && hasES2020 && hasWebMAudioSupport;
    
    if (!isSupported) {
      console.warn('Browser Whisper not supported:', {
        webAssembly: hasWebAssembly,
        arrayBuffer: hasArrayBuffer,
        worker: hasWorker,
        es2020: hasES2020,
        webmAudio: hasWebMAudioSupport
      });
    }
    
    return isSupported;
  }

  private static checkWebMAudioSupport(): boolean {
    try {
      const audio = document.createElement('audio');
      const webmOpusSupport = audio.canPlayType('audio/webm; codecs="opus"');
      const webmVorbisSupport = audio.canPlayType('audio/webm; codecs="vorbis"');
      const hasWebMSupport = webmOpusSupport !== '' || webmVorbisSupport !== '';
      
      console.log('WebM audio support check:', {
        opus: webmOpusSupport,
        vorbis: webmVorbisSupport,
        supported: hasWebMSupport
      });
      
      return hasWebMSupport;
    } catch (error) {
      console.warn('Could not check WebM audio support:', error);
      return false;
    }
  }

  onLoadingProgress(callback: (progress: ModelLoadingProgress) => void): void {
    this.loadingCallbacks.push(callback);
  }

  removeLoadingCallback(callback: (progress: ModelLoadingProgress) => void): void {
    this.loadingCallbacks = this.loadingCallbacks.filter(cb => cb !== callback);
  }

  private notifyProgress(progress: ModelLoadingProgress): void {
    this.loadingCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.warn('Loading callback error:', error);
      }
    });
  }

  async ensureModelReady(): Promise<void> {
    if (this.isModelReady && this.pipeline) {
      return;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadModel();
    return this.loadingPromise;
  }

  private async loadModel(): Promise<void> {
    try {
      this.notifyProgress({ phase: 'checking', message: 'Checking browser compatibility...' });
      
      if (!BrowserWhisperProcessor.isBrowserSupported()) {
        throw new Error('Browser does not support local Whisper processing');
      }

      this.notifyProgress({ phase: 'downloading', progress: 0, message: 'Downloading Whisper model...' });
      
      this.pipeline = await pipeline('automatic-speech-recognition', this.modelConfig.model, {
        chunk_length_s: this.modelConfig.chunk_length_s,
        stride_length_s: this.modelConfig.stride_length_s,
        progress_callback: (progress: any) => {
          if (progress.status === 'progress' && progress.progress) {
            this.notifyProgress({
              phase: 'downloading',
              progress: Math.round(progress.progress),
              message: `Downloading ${progress.name || 'model'}... ${Math.round(progress.progress)}%`
            });
          } else if (progress.status === 'done') {
            console.log('Model file download complete:', progress.name);
          }
        }
      });

      this.notifyProgress({ phase: 'loading', progress: 90, message: 'Initializing model...' });
      
      // Test the model with a small dummy audio
      await this.testModelWithDummyAudio();
      
      this.isModelReady = true;
      this.notifyProgress({ phase: 'ready', progress: 100, message: 'Browser Whisper ready for transcription' });
      
      console.log('Browser Whisper model loaded successfully');
      
    } catch (error: any) {
      this.isModelReady = false;
      this.pipeline = null;
      
      const errorMessage = `Failed to load Browser Whisper: ${error.message}`;
      this.notifyProgress({ phase: 'error', message: errorMessage, error: error.message });
      
      console.error('Browser Whisper loading failed:', error);
      throw new Error(errorMessage);
    } finally {
      this.loadingPromise = null;
    }
  }

  private async testModelWithDummyAudio(): Promise<void> {
    try {
      // Create a small dummy audio buffer (1 second of silence at 16kHz)
      const sampleRate = 16000;
      const duration = 0.1; // 100ms
      const samples = Math.floor(sampleRate * duration);
      const dummyAudio = new Float32Array(samples).fill(0.001); // Very quiet noise
      
      await this.pipeline(dummyAudio, {
        language: 'en',
        task: 'transcribe',
        return_timestamps: false
      });
      
      console.log('Model test successful');
    } catch (error) {
      console.warn('Model test failed (but continuing):', error);
    }
  }

  /**
   * Enhanced audio conversion with multiple fallback methods
   */
  private async audioToFloat32Array(audioBlob: Blob): Promise<Float32Array> {
    console.log(`Converting audio blob: ${(audioBlob.size / 1024).toFixed(1)}KB, type: ${audioBlob.type}`);
    
    try {
      // Method 1: Direct Web Audio API
      return await this.directWebAudioConversion(audioBlob);
    } catch (error: any) {
      console.warn('Direct conversion failed, trying alternative methods:', error.message);
      
      try {
        // Method 2: MediaStream conversion approach
        return await this.mediaStreamConversion(audioBlob);
      } catch (error2: any) {
        console.warn('MediaStream conversion failed, trying format conversion:', error2.message);
        
        try {
          // Method 3: Format conversion via HTMLAudioElement
          return await this.htmlAudioConversion(audioBlob);
        } catch (error3: any) {
          console.error('All audio conversion methods failed:', error3.message);
          throw new Error(`Audio conversion failed: ${error3.message}`);
        }
      }
    }
  }

  private async directWebAudioConversion(audioBlob: Blob): Promise<Float32Array> {
    let audioContext: AudioContext | null = null;
    
    try {
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Empty or invalid audio blob');
      }
      
      const audioBuffer = await audioBlob.arrayBuffer();
      
      if (audioBuffer.byteLength < 100) {
        throw new Error('Audio buffer too small (likely invalid WebM)');
      }
      
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      
      const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
      const float32Data = decodedAudio.getChannelData(0);
      
      if (float32Data.length === 0) {
        throw new Error('Decoded audio is empty');
      }
      
      console.log(`Direct conversion: ${decodedAudio.duration.toFixed(1)}s, ${decodedAudio.sampleRate}Hz`);
      
      // Resample to 16kHz if needed
      if (decodedAudio.sampleRate !== 16000) {
        return this.resampleAudio(float32Data, decodedAudio.sampleRate, 16000);
      }
      
      return float32Data;
      
    } finally {
      if (audioContext) {
        audioContext.close();
      }
    }
  }

  private async mediaStreamConversion(audioBlob: Blob): Promise<Float32Array> {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      const cleanup = () => URL.revokeObjectURL(audioUrl);
      
      audio.onloadeddata = async () => {
        let audioContext: AudioContext | null = null;
        try {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000
          });
          
          const source = audioContext.createMediaElementSource(audio);
          const analyser = audioContext.createAnalyser();
          source.connect(analyser);
          
          await new Promise(r => setTimeout(r, 100));
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Float32Array(bufferLength);
          analyser.getFloatTimeDomainData(dataArray);
          
          console.log(`MediaStream conversion: ${dataArray.length} samples`);
          resolve(dataArray);
        } catch (error) {
          reject(error);
        } finally {
          if (audioContext) audioContext.close();
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
    const wavBlob = await this.convertWebMToWAV(audioBlob);
    return await this.directWebAudioConversion(wavBlob);
  }

  private async convertWebMToWAV(webmBlob: Blob): Promise<Blob> {
    let audioContext: AudioContext | null = null;
    
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const wavBuffer = this.audioBufferToWAV(audioBuffer);
      
      console.log(`WebM→WAV conversion: ${(wavBuffer.byteLength / 1024).toFixed(1)}KB`);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } finally {
      if (audioContext) audioContext.close();
    }
  }

  private audioBufferToWAV(audioBuffer: AudioBuffer): ArrayBuffer {
    const numChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
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
    
    // Audio data
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return buffer;
  }

  private resampleAudio(audioData: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array {
    if (fromSampleRate === toSampleRate) {
      return new Float32Array(audioData);
    }
    
    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = Math.floor(i * ratio);
      const nextIndex = Math.min(srcIndex + 1, audioData.length - 1);
      const fraction = (i * ratio) - srcIndex;
      
      result[i] = audioData[srcIndex] * (1 - fraction) + audioData[nextIndex] * fraction;
    }
    
    return result;
  }

  async diagnoseAudioPipeline(audioBlob: Blob): Promise<void> {
    console.log(`Diagnosing audio blob: ${(audioBlob.size / 1024).toFixed(1)}KB, type: ${audioBlob.type}`);
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log(`Blob readable: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB`);
    } catch (error: any) {
      console.error('Cannot read blob:', error.message);
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log(`AudioContext decode successful: ${audioBuffer.duration.toFixed(1)}s, ${audioBuffer.sampleRate}Hz`);
      audioContext.close();
    } catch (error: any) {
      console.error('AudioContext decode failed:', error.message);
    }

    try {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      await new Promise((resolve, reject) => {
        audio.onloadeddata = resolve;
        audio.onerror = reject;
        audio.load();
      });
      console.log(`HTMLAudioElement load successful: ${audio.duration?.toFixed(1) || 'unknown'}s`);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('HTMLAudioElement load failed:', error.message);
    }
  }

  async transcribe(audioBlob: Blob, language?: 'fr' | 'en' | 'auto'): Promise<BrowserWhisperResult> {
    const startTime = Date.now();

    if (!this.isModelReady || !this.pipeline) {
      console.log('Model not ready, attempting to reload...');
      await this.ensureModelReady();
      
      if (!this.isModelReady || !this.pipeline) {
        throw new Error('Browser Whisper model failed to load');
      }
    }

    try {
      console.log(`Browser Whisper processing: ${(audioBlob.size / 1024).toFixed(1)}KB`);

      const audioArray = await this.audioToFloat32Array(audioBlob);
      
      if (!audioArray || audioArray.length === 0) {
        throw new Error('Audio conversion produced empty array');
      }
      
      const durationSeconds = audioArray.length / 16000;
      if (durationSeconds > 300) {
        console.warn(`Audio is very long (${durationSeconds.toFixed(1)}s), truncating to 5 minutes`);
        const maxSamples = 16000 * 300;
        audioArray.slice(0, maxSamples);
      }
      
      console.log(`Processing ${(audioArray.length / 16000).toFixed(1)}s of audio data`);
      
      const transcriptionOptions: any = {
        task: 'transcribe',
        return_timestamps: false,
        chunk_length_s: this.modelConfig.chunk_length_s,
        stride_length_s: this.modelConfig.stride_length_s
      };
      
      if (language && language !== 'auto') {
        transcriptionOptions.language = language;
      }
      
      const result = await this.pipeline(audioArray, transcriptionOptions);
      
      const transcript = result?.text || '';
      const processingTime = Date.now() - startTime;
      
      console.log(`Browser Whisper completed in ${processingTime}ms: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`);
      
      return {
        text: transcript,
        source: 'browser-whisper',
        processingTime,
        modelUsed: this.modelConfig.model,
        language: language || 'auto'
      };
      
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error('Browser transcription failed:', error);
      
      throw new Error(`Browser transcription failed after ${processingTime}ms: ${error.message}`);
    }
  }

  getStatus(): {
    isSupported: boolean;
    isReady: boolean;
    modelConfig: BrowserWhisperConfig;
    supportsWebM: boolean;
  } {
    return {
      isSupported: BrowserWhisperProcessor.isBrowserSupported(),
      isReady: this.isModelReady,
      modelConfig: this.modelConfig,
      supportsWebM: BrowserWhisperProcessor.checkWebMAudioSupport()
    };
  }

  async cleanup(): Promise<void> {
    if (this.pipeline) {
      try {
        if (typeof this.pipeline.dispose === 'function') {
          await this.pipeline.dispose();
        }
      } catch (error) {
        console.warn('Error disposing pipeline:', error);
      }
      this.pipeline = null;
    }
    
    this.isModelReady = false;
    this.loadingCallbacks = [];
    this.loadingPromise = null;
  }
}

// Export singleton instance
export const browserWhisper = BrowserWhisperProcessor.getInstance();