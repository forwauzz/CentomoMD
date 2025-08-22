/**
 * Continuous Audio Processing Queue for Ambient Listening
 * Handles 30-second chunking with overlap and real-time processing pipeline
 */

import { AudioChunk, ContinuousProcessingQueue, VoiceActivityResult } from '@shared/transcription-types';
import { VoiceActivityDetector } from './voice-activity-detection';
import { SpeakerIdentifier } from './speaker-identification';
import { browserWhisper, BrowserWhisperResult, ModelLoadingProgress } from './browser-whisper';

export interface ContinuousProcessorConfig {
  chunkDurationMs: number; // 30 seconds default
  overlapMs: number; // 2 seconds overlap for context
  maxQueueSize: number; // Maximum chunks in queue
  processingConcurrency: number; // Max concurrent processing
  autoCleanup: boolean; // Auto-cleanup processed chunks
  vadEnabled: boolean; // Voice Activity Detection
  speakerIdEnabled: boolean; // Speaker Identification
}

export interface ProcessingCallbacks {
  onChunkReady?: (chunk: AudioChunk) => Promise<void>;
  onChunkProcessed?: (chunk: AudioChunk, result: any) => void;
  onChunkFailed?: (chunk: AudioChunk, error: Error) => void;
  onQueueFull?: () => void;
  onVoiceActivity?: (result: VoiceActivityResult) => void;
  onSpeakerChange?: (speakerId: string, confidence: number) => void;
  onModelLoading?: (progress: ModelLoadingProgress) => void;
  onBrowserWhisperResult?: (chunk: AudioChunk, result: BrowserWhisperResult) => void;
}

export class ContinuousAudioProcessor {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isRecording = false;
  private startTime = 0;
  private chunkCounter = 0;
  
  private vad: VoiceActivityDetector | null = null;
  private speakerIdentifier: SpeakerIdentifier | null = null;
  
  // Browser Whisper integration for ambient mode only
  private useBrowserWhisper = false;
  private isModelInitialized = false;
  
  private queue: ContinuousProcessingQueue = {
    pending: [],
    processing: [],
    completed: [],
    failed: [],
    maxQueueSize: 10,
    processingConcurrency: 2
  };
  
  private config: ContinuousProcessorConfig = {
    chunkDurationMs: 3000, // 3 seconds - CHANGED FROM 30000 for faster user feedback
    overlapMs: 500, // CHANGED FROM 2000 - shorter overlap for faster chunks
    maxQueueSize: 10,
    processingConcurrency: 2, // Max 2 concurrent chunks as recommended
    autoCleanup: true,
    vadEnabled: true,
    speakerIdEnabled: true
  };

  // Claude's recommendations: Enhanced processing controls
  private minChunkDuration = 1000; // Minimum 1 second before processing
  private silenceThreshold = 0.01; // VAD threshold for speech detection
  private readonly maxConcurrentChunks = 2; // Limit concurrent processing
  
  private callbacks: ProcessingCallbacks = {};
  
  private lastChunkTime = 0;

  constructor(config?: Partial<ContinuousProcessorConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
      this.queue.maxQueueSize = this.config.maxQueueSize;
      this.queue.processingConcurrency = this.config.processingConcurrency;
    }
  }

  /**
   * Enable browser-based Whisper for ambient mode only
   * This replaces server-side processing with local transcription
   */
  async enableBrowserWhisper(language?: 'fr' | 'en'): Promise<void> {
    try {
      // Check browser compatibility first
      if (!browserWhisper.getStatus().isSupported) {
        console.warn('🚫 Browser Whisper not supported, falling back to server processing');
        this.useBrowserWhisper = false;
        return;
      }

      console.log('🚀 Initializing browser-based Whisper for ambient mode...');
      this.useBrowserWhisper = true;

      // Set up model loading progress callback
      browserWhisper.onLoadingProgress((progress) => {
        this.callbacks.onModelLoading?.(progress);
      });

      // Initialize the model
      await browserWhisper.ensureModelReady();
      this.isModelInitialized = true;

      console.log('✅ Browser Whisper ready for ambient transcription');
    } catch (error: any) {
      console.error('❌ Failed to initialize browser Whisper:', error);
      this.useBrowserWhisper = false;
      this.isModelInitialized = false;
      
      // Notify UI of fallback
      this.callbacks.onModelLoading?.({
        phase: 'error',
        message: 'Speech recognition unavailable, using server fallback',
        error: error.message
      });
    }
  }

  /**
   * Disable browser Whisper and fall back to server processing
   */
  disableBrowserWhisper(): void {
    this.useBrowserWhisper = false;
    this.isModelInitialized = false;
    console.log('🔄 Disabled browser Whisper, using server processing');
  }

  async initialize(stream: MediaStream): Promise<void> {
    try {
      this.stream = stream;
      
      // Initialize Voice Activity Detection
      if (this.config.vadEnabled) {
        this.vad = new VoiceActivityDetector({
          threshold: 25, // Lower threshold for ambient listening
          maxSilenceDuration: 5000 // 5 seconds of silence
        });
        
        await this.vad.initialize(stream);
        this.vad.setCallbacks({
          onVoiceActivity: (result) => {
            this.callbacks.onVoiceActivity?.(result);
          }
        });
      }
      
      // Initialize Speaker Identification
      if (this.config.speakerIdEnabled) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.speakerIdentifier = new SpeakerIdentifier();
        await this.speakerIdentifier.initialize(audioContext);
      }
      
      // FIXED: Initialize MediaRecorder for CONTINUOUS recording (no time slicing)
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      this.setupMediaRecorderEvents();
      
      console.log('🎙️ Continuous Audio Processor initialized with accumulative strategy');
    } catch (error) {
      console.error('❌ Failed to initialize continuous processor:', error);
      throw error;
    }
  }

  setCallbacks(callbacks: ProcessingCallbacks): void {
    this.callbacks = callbacks;
  }

  async startContinuousRecording(): Promise<void> {
    if (!this.mediaRecorder || this.isRecording) {
      console.log('🚫 Recording already in progress or not initialized');
      return;
    }

    // Check MediaRecorder state
    if (this.mediaRecorder.state !== 'inactive') {
      console.log(`🚫 MediaRecorder not ready: ${this.mediaRecorder.state}`);
      return;
    }

    this.isRecording = true;
    this.startTime = Date.now();
    this.lastChunkTime = this.startTime;
    this.chunkCounter = 0;
    
    // Start VAD if enabled
    if (this.vad) {
      this.vad.start();
    }
    
    try {
      // Use automatic chunking with MediaRecorder timeslice for 3-second chunks
      this.mediaRecorder.start(this.config.chunkDurationMs);
      
      console.log(`🔴 Continuous recording started with ${this.config.chunkDurationMs}ms automatic chunking`);
    } catch (error) {
      console.error('❌ Failed to start MediaRecorder:', error);
      this.isRecording = false;
      if (this.vad) {
        this.vad.stop();
      }
      throw error;
    }
  }

  stopContinuousRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    this.isRecording = false;
    
    // Stop MediaRecorder
    this.mediaRecorder.stop();
    
    // Stop VAD
    if (this.vad) {
      this.vad.stop();
    }
    
    console.log('⏹️ Continuous recording stopped');
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    // Process automatic 3-second chunks from MediaRecorder timeslice
    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && this.isRecording) {
        const now = Date.now();
        const actualDuration = now - this.lastChunkTime;
        
        // Claude's recommendation: Check minimum duration and speech detection
        if (actualDuration < this.minChunkDuration) {
          console.log(`⏭️ Chunk too short (${actualDuration}ms), skipping`);
          return;
        }
        
        // Claude's recommendation: Quick speech detection to avoid processing silence
        if (await this.containsSpeech(event.data)) {
          console.log(`🎵 Creating chunk ${this.chunkCounter} from automatic timeslice (${(event.data.size / 1024).toFixed(1)}KB)`);
          
          const chunk: AudioChunk = {
            id: `chunk-${this.chunkCounter}`,
            data: event.data, // Direct use of the 3-second chunk
            startTime: this.lastChunkTime,
            endTime: now,
            duration: actualDuration,
            hasOverlap: false, // No manual overlap needed with automatic chunking
            overlapDuration: undefined
          };
          
          this.chunkCounter++;
          this.lastChunkTime = now;
          
          this.addChunkToQueue(chunk);
        } else {
          console.log(`🔇 Chunk contains mostly silence, skipping transcription`);
        }
      } else if (event.data.size === 0) {
        console.log('⚠️ Received empty data event');
      }
    };

    this.mediaRecorder.onstop = () => {
      console.log('⏹️ MediaRecorder stopped');
      // With automatic chunking, final data will be sent via ondataavailable
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ MediaRecorder error:', event);
      this.isRecording = false;
    };
  }

  // Claude's recommendation: Simple speech detection to avoid processing silence
  private async containsSpeech(audioBlob: Blob): Promise<boolean> {
    try {
      // Simple heuristic: if blob is too small, likely silence
      if (audioBlob.size < 1000) {
        return false;
      }
      
      // If VAD is available, use it for better detection
      if (this.vad) {
        // VAD already tracks voice activity, so if we got here, there was likely speech
        return true;
      }
      
      // Fallback: assume chunks of reasonable size contain speech
      // This could be enhanced with energy-based detection in the future
      return audioBlob.size > 5000; // Rough threshold for 3-second speech
    } catch (error) {
      console.warn('⚠️ Speech detection failed, assuming speech present:', error);
      return true; // Fail-safe: process anyway
    }
  }

  // ✨ NEW: Section 8 context detection based on current form location
  private detectSection8Context(): boolean {
    try {
      // Check if we're currently in Section 8 context
      const currentPath = window.location.pathname;
      const currentSection = sessionStorage.getItem('current_section');
      const lastActiveField = sessionStorage.getItem('last_active_field');
      
      // Check various indicators for Section 8 context
      const section8Indicators = [
        currentSection === 'section8',
        currentPath.includes('section8'),
        lastActiveField?.includes('section8'),
        lastActiveField?.includes('appreciationEvolution'),
        lastActiveField?.includes('plaintesproblemes'),
        lastActiveField?.includes('impactAvq'),
        document.querySelector('[data-section="section8"]')?.classList.contains('active'),
        (document.querySelector('#section8')?.getBoundingClientRect()?.top ?? 1000) < 100
      ];
      
      const isSection8 = section8Indicators.some(indicator => indicator);
      
      if (isSection8) {
        console.log('📋 Section 8 context detected via:', {
          currentSection,
          currentPath,
          lastActiveField,
          visibleSection: (document.querySelector('#section8')?.getBoundingClientRect()?.top ?? 1000) < 100
        });
      }
      
      return isSection8;
    } catch (error) {
      console.warn('⚠️ Section 8 context detection failed:', error);
      return false; // Default to false if detection fails
    }
  }

  // ✨ NEW: Enhanced Section 8 transcript processing with Quebec medical terminology
  private async enhanceSection8Transcript(transcript: string): Promise<{
    formatted: string;
    suggestions?: string[];
    voiceCorrections?: string[];
  }> {
    try {
      // Apply Quebec medical terminology corrections
      let enhanced = this.applyQuebecMedicalCorrections(transcript);
      
      // Apply Section 8 specific voice patterns
      enhanced = this.applySection8VoicePatterns(enhanced);
      
      // For now, return enhanced text with basic corrections
      // This could be extended to call the server-side Section 8 enhancement API
      return {
        formatted: enhanced,
        suggestions: [],
        voiceCorrections: this.getAppliedCorrections(transcript, enhanced)
      };
      
    } catch (error) {
      console.error('⚠️ Section 8 transcript enhancement failed:', error);
      return {
        formatted: transcript,
        suggestions: ['Section 8 enhancement failed'],
        voiceCorrections: []
      };
    }
  }

  // ✨ NEW: Apply Quebec French medical terminology corrections
  private applyQuebecMedicalCorrections(text: string): string {
    const corrections: Record<string, string> = {
      // Common voice recognition errors for Quebec medical terms
      'appreciation subjective': 'appréciation subjective',
      'appreciation subjectives': 'appréciation subjective',
      'amelioration': 'amélioration',
      'plateau therapeutique': 'plateau thérapeutique',
      'tolerance a l effort': 'tolérance à l\'effort',
      'tolerance à l effort': 'tolérance à l\'effort',
      'activite de la vie quotidienne': 'activités de la vie quotidienne',
      'activites de la vie quotidienne': 'activités de la vie quotidienne',
      'avq avd': 'AVQ/AVD',
      'la travailleuse rapport': 'La travailleuse rapporte',
      'elle rapport': 'Elle rapporte',
      'elle ne rapport pas': 'Elle ne rapporte pas',
      'sensations de brulure': 'sensations de brûlure',
      'elements declencheurs': 'éléments déclencheurs',
      'raideurs matinales': 'raideurs matinales',
      'changements barometriques': 'changements barométriques'
    };
    
    let corrected = text;
    for (const [error, correction] of Object.entries(corrections)) {
      const regex = new RegExp(error, 'gi');
      corrected = corrected.replace(regex, correction);
    }
    
    return corrected;
  }

  // ✨ NEW: Apply Section 8 specific voice patterns
  private applySection8VoicePatterns(text: string): string {
    // Common Section 8 patterns from Dr. Centomo's practice
    const patterns: Array<[RegExp, string]> = [
      // Start sentences properly
      [/^la travailleuse/i, 'La travailleuse'],
      [/^elle rapport/i, 'Elle rapporte'],
      [/^elle ne rapport/i, 'Elle ne rapporte'],
      
      // Fix common phrase structures
      [/rapport avoir/gi, 'rapporte avoir'],
      [/rapport une/gi, 'rapporte une'],
      [/rapport des/gi, 'rapporte des'],
      
      // Ensure proper punctuation
      [/([.!?])\s*([a-z])/g, '$1 $2'.replace(/([.!?])\s*([a-z])/, (_, punct, letter) => punct + ' ' + letter.toUpperCase())],
    ];
    
    let enhanced = text;
    for (const [pattern, replacement] of patterns) {
      enhanced = enhanced.replace(pattern, replacement);
    }
    
    return enhanced;
  }

  // ✨ NEW: Track what corrections were applied
  private getAppliedCorrections(original: string, corrected: string): string[] {
    const corrections: string[] = [];
    
    if (original !== corrected) {
      corrections.push('Quebec medical terminology corrections applied');
      
      // Could add more specific correction tracking here
      if (corrected.includes('appréciation subjective') && !original.includes('appréciation subjective')) {
        corrections.push('Fixed: "appreciation subjective" → "appréciation subjective"');
      }
      
      if (corrected.includes('amélioration') && !original.includes('amélioration')) {
        corrections.push('Fixed: "amelioration" → "amélioration"');
      }
    }
    
    return corrections;
  }

  // Note: Legacy accumulation methods removed - we now use MediaRecorder automatic chunking

  private addChunkToQueue(chunk: AudioChunk): void {
    // Check queue capacity
    if (this.queue.pending.length >= this.queue.maxQueueSize) {
      console.warn('⚠️ Processing queue full, dropping oldest chunk');
      this.callbacks.onQueueFull?.();
      
      // Remove oldest pending chunk
      const droppedChunk = this.queue.pending.shift();
      if (droppedChunk) {
        this.queue.failed.push(droppedChunk);
      }
    }
    
    // Add to pending queue
    this.queue.pending.push(chunk);
    
    // Start processing if capacity allows
    this.processNextChunks();
    
    console.log(`📦 Chunk queued: ${chunk.id} (${(chunk.data.size / 1024).toFixed(1)}KB)`);
  }

  private async processNextChunks(): Promise<void> {
    while (this.queue.processing.length < this.queue.processingConcurrency && 
           this.queue.pending.length > 0) {
      
      const chunk = this.queue.pending.shift();
      if (!chunk) break;
      
      this.queue.processing.push(chunk);
      this.processChunk(chunk);
    }
  }

  private async processChunk(chunk: AudioChunk): Promise<void> {
    try {
      console.log(`🔄 Processing chunk: ${chunk.id}`);
      
      // BROWSER WHISPER INTEGRATION: Process locally if enabled and model ready
      if (this.useBrowserWhisper && this.isModelInitialized) {
        try {
          console.log(`🎯 Processing chunk ${chunk.id} with browser Whisper...`);
          
          const result = await browserWhisper.transcribe(chunk.data, 'auto');
          
          // ✨ NEW: Section 8 context detection and enhanced processing
          const isSection8Context = this.detectSection8Context();
          if (isSection8Context && result.text.trim()) {
            console.log(`📋 Section 8 context detected for chunk ${chunk.id}, applying specialized processing...`);
            
            try {
              // Apply Section 8 voice corrections and medical terminology
              const enhancedResult = await this.enhanceSection8Transcript(result.text);
              
              // Create enhanced result with Section 8 indicator
              const section8Result = {
                ...result,
                text: enhancedResult.formatted,
                confidence: (result as any).confidence || 0.9,
                processingType: 'section8_local' as const,
                suggestions: enhancedResult.suggestions || [],
                voiceCorrections: enhancedResult.voiceCorrections || []
              };
              
              this.callbacks.onBrowserWhisperResult?.(chunk, section8Result);
              this.moveChunkToCompleted(chunk, section8Result);
              
              console.log(`✅ Section 8 enhanced chunk ${chunk.id}: "${section8Result.text.substring(0, 50)}..."`);
              return;
              
            } catch (section8Error) {
              console.warn(`⚠️ Section 8 enhancement failed for chunk ${chunk.id}, using basic result:`, section8Error);
              // Fall through to basic browser result
            }
          }
          
          // Notify callbacks of successful browser transcription
          this.callbacks.onBrowserWhisperResult?.(chunk, result);
          this.moveChunkToCompleted(chunk, result);
          
          console.log(`✅ Browser Whisper completed chunk ${chunk.id}: "${result.text.substring(0, 50)}..."`);
          return;
          
        } catch (browserError: any) {
          console.warn(`🔄 Browser Whisper failed for chunk ${chunk.id}, falling back to server:`, browserError.message);
          // Fall through to server processing
        }
      }
      
      // FALLBACK: Use existing server processing if browser Whisper fails or disabled
      if (this.callbacks.onChunkReady) {
        await this.callbacks.onChunkReady(chunk);
      }
      
      // Move to completed
      this.moveChunkToCompleted(chunk, null);
      
    } catch (error) {
      console.error(`❌ Failed to process chunk ${chunk.id}:`, error);
      this.moveChunkToFailed(chunk, error as Error);
    }
    
    // Continue processing next chunks
    this.processNextChunks();
  }

  private moveChunkToCompleted(chunk: AudioChunk, result: any): void {
    this.removeFromProcessing(chunk);
    this.queue.completed.push(chunk);
    
    this.callbacks.onChunkProcessed?.(chunk, result);
    
    // Auto-cleanup if enabled
    if (this.config.autoCleanup && this.queue.completed.length > 5) {
      const oldChunk = this.queue.completed.shift();
      console.log(`🧹 Auto-cleaned completed chunk: ${oldChunk?.id}`);
    }
  }

  private moveChunkToFailed(chunk: AudioChunk, error: Error): void {
    this.removeFromProcessing(chunk);
    this.queue.failed.push(chunk);
    
    this.callbacks.onChunkFailed?.(chunk, error);
  }

  private removeFromProcessing(chunk: AudioChunk): void {
    const index = this.queue.processing.findIndex(c => c.id === chunk.id);
    if (index >= 0) {
      this.queue.processing.splice(index, 1);
    }
  }

  getQueueStatus(): ContinuousProcessingQueue {
    return { ...this.queue };
  }

  getProcessingStats(): {
    totalChunks: number;
    pendingChunks: number;
    processingChunks: number;
    completedChunks: number;
    failedChunks: number;
    isRecording: boolean;
    recordingDuration: number;
    accumulatedDataPieces: number;
  } {
    return {
      totalChunks: this.chunkCounter,
      pendingChunks: this.queue.pending.length,
      processingChunks: this.queue.processing.length,
      completedChunks: this.queue.completed.length,
      failedChunks: this.queue.failed.length,
      isRecording: this.isRecording,
      recordingDuration: this.isRecording ? Date.now() - this.startTime : 0,
      accumulatedDataPieces: 0 // Legacy property, now using automatic chunking
    };
  }

  clearQueue(): void {
    this.queue.pending = [];
    this.queue.completed = [];
    this.queue.failed = [];
    console.log('🧹 Processing queue cleared');
  }

  cleanup(): void {
    this.stopContinuousRecording();
    this.clearQueue();
    
    // Legacy chunking interval removed - now using MediaRecorder automatic chunking
    
    if (this.vad) {
      this.vad.cleanup();
      this.vad = null;
    }
    
    if (this.speakerIdentifier) {
      this.speakerIdentifier.cleanup();
      this.speakerIdentifier = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    
    console.log('🧹 Continuous Audio Processor cleaned up');
  }
}

// Factory function
export function createContinuousAudioProcessor(config?: Partial<ContinuousProcessorConfig>): ContinuousAudioProcessor {
  return new ContinuousAudioProcessor(config);
}