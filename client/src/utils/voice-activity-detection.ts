/**
 * Voice Activity Detection (VAD) for Ambient Listening
 * Detects when someone is speaking to automatically start/stop recording
 */

import { VoiceActivityResult } from '@shared/transcription-types';

export interface VADConfig {
  threshold: number; // Audio level threshold (0-100)
  smoothing: number; // Smoothing factor for audio level (0-1)
  minSpeechDuration: number; // Minimum speech duration in ms
  maxSilenceDuration: number; // Maximum silence before stopping in ms
  sampleRate: number; // Audio sample rate
  fftSize: number; // FFT size for frequency analysis
}

export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isActive = false;
  private lastVoiceTime = 0;
  private lastSilenceTime = 0;
  private smoothedLevel = 0;
  
  private config: VADConfig = {
    threshold: 30, // Adjusted for medical office environment
    smoothing: 0.8,
    minSpeechDuration: 500, // 500ms minimum speech
    maxSilenceDuration: 2000, // 2 seconds of silence stops recording
    sampleRate: 44100,
    fftSize: 2048
  };

  private callbacks: {
    onVoiceStart?: () => void;
    onVoiceEnd?: () => void;
    onVoiceActivity?: (result: VoiceActivityResult) => void;
  } = {};

  constructor(config?: Partial<VADConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async initialize(stream: MediaStream): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // Connect microphone
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // Initialize data array
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      console.log('🎤 Voice Activity Detection initialized');
    } catch (error) {
      console.error('❌ Failed to initialize VAD:', error);
      throw error;
    }
  }

  start(): void {
    if (!this.analyser || !this.dataArray) {
      throw new Error('VAD not initialized');
    }

    this.isActive = true;
    this.lastVoiceTime = 0;
    this.lastSilenceTime = Date.now();
    this.smoothedLevel = 0;
    
    this.processAudio();
    console.log('🎯 Voice Activity Detection started');
  }

  stop(): void {
    this.isActive = false;
    console.log('⏹️ Voice Activity Detection stopped');
  }

  setCallbacks(callbacks: {
    onVoiceStart?: () => void;
    onVoiceEnd?: () => void;
    onVoiceActivity?: (result: VoiceActivityResult) => void;
  }): void {
    this.callbacks = callbacks;
  }

  updateConfig(config: Partial<VADConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private processAudio(): void {
    if (!this.isActive || !this.analyser || !this.dataArray) {
      return;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate average audio level
    const sum = this.dataArray.reduce((acc, value) => acc + value, 0);
    const average = sum / this.dataArray.length;
    
    // Apply smoothing
    this.smoothedLevel = this.smoothedLevel * this.config.smoothing + 
                       average * (1 - this.config.smoothing);

    const now = Date.now();
    const hasVoice = this.smoothedLevel > this.config.threshold;

    // Create voice activity result
    const result: VoiceActivityResult = {
      hasVoice,
      confidence: Math.min(this.smoothedLevel / this.config.threshold, 1),
      timestamp: now,
      audioLevel: this.smoothedLevel
    };

    // Call activity callback
    if (this.callbacks.onVoiceActivity) {
      this.callbacks.onVoiceActivity(result);
    }

    // Detect voice start/end
    if (hasVoice) {
      if (this.lastVoiceTime === 0) {
        // Potential voice start
        this.lastVoiceTime = now;
      } else if (now - this.lastVoiceTime >= this.config.minSpeechDuration) {
        // Confirmed voice activity
        if (this.lastSilenceTime > 0) {
          // Voice started after silence
          this.callbacks.onVoiceStart?.();
          this.lastSilenceTime = 0;
        }
      }
    } else {
      if (this.lastVoiceTime > 0) {
        // Voice ended
        this.lastVoiceTime = 0;
        this.lastSilenceTime = now;
      } else if (this.lastSilenceTime > 0 && 
                 now - this.lastSilenceTime >= this.config.maxSilenceDuration) {
        // Extended silence detected
        this.callbacks.onVoiceEnd?.();
        this.lastSilenceTime = now; // Reset to prevent multiple calls
      }
    }

    // Continue processing
    requestAnimationFrame(() => this.processAudio());
  }

  getStatus(): {
    isActive: boolean;
    currentLevel: number;
    threshold: number;
    hasVoice: boolean;
    lastVoiceTime: number;
    lastSilenceTime: number;
  } {
    return {
      isActive: this.isActive,
      currentLevel: this.smoothedLevel,
      threshold: this.config.threshold,
      hasVoice: this.smoothedLevel > this.config.threshold,
      lastVoiceTime: this.lastVoiceTime,
      lastSilenceTime: this.lastSilenceTime
    };
  }

  cleanup(): void {
    this.stop();
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.dataArray = null;
    console.log('🧹 Voice Activity Detection cleaned up');
  }
}

// Factory function for easy instantiation
export function createVoiceActivityDetector(config?: Partial<VADConfig>): VoiceActivityDetector {
  return new VoiceActivityDetector(config);
}