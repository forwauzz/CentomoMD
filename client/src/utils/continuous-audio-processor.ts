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
    chunkDurationMs: 30000, // 30 seconds
    overlapMs: 2000, // 2 seconds overlap
    maxQueueSize: 10,
    processingConcurrency: 2,
    autoCleanup: true,
    vadEnabled: true,
    speakerIdEnabled: true
  };
  
  private callbacks: ProcessingCallbacks = {};
  
  // FIXED: Accumulative recording strategy
  private allRecordedData: Blob[] = [];
  private chunkingInterval: NodeJS.Timeout | null = null;
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
    this.allRecordedData = [];
    
    // Start VAD if enabled
    if (this.vad) {
      this.vad.start();
    }
    
    try {
      // FIXED: Start CONTINUOUS recording (no time slicing)
      this.mediaRecorder.start();
      
      // FIXED: Set up manual chunking interval with data request
      this.chunkingInterval = setInterval(() => {
        // Request data from MediaRecorder to trigger ondataavailable
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          console.log(`🔄 Requesting data from MediaRecorder (state: ${this.mediaRecorder.state})`);
          this.mediaRecorder.requestData();
        }
        this.createChunkFromAccumulatedData();
      }, this.config.chunkDurationMs);
      
      console.log(`🔴 Continuous recording started with ${this.config.chunkDurationMs}ms manual chunking`);
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
    
    // Clear chunking interval
    if (this.chunkingInterval) {
      clearInterval(this.chunkingInterval);
      this.chunkingInterval = null;
    }
    
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

    // FIXED: Accumulate ALL data instead of processing individual chunks
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.isRecording) {
        console.log(`📦 Accumulating data: ${(event.data.size / 1024).toFixed(1)}KB (total pieces: ${this.allRecordedData.length + 1})`);
        this.allRecordedData.push(event.data);
      } else if (event.data.size === 0) {
        console.log('⚠️ Received empty data event');
      }
    };

    this.mediaRecorder.onstop = () => {
      console.log('⏹️ MediaRecorder stopped');
      // Process any remaining accumulated data as final chunk
      if (this.allRecordedData.length > 0) {
        this.createFinalChunkFromAccumulatedData();
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ MediaRecorder error:', event);
      this.isRecording = false;
    };
  }

  // FIXED: Create chunks from accumulated data instead of individual fragments
  private createChunkFromAccumulatedData(): void {
    if (this.allRecordedData.length === 0) {
      console.log('⚠️ No accumulated data to chunk');
      return;
    }

    const now = Date.now();
    
    // FIXED: Create complete WebM file from all accumulated data
    const completeWebM = new Blob(this.allRecordedData, { type: 'audio/webm;codecs=opus' });
    
    console.log(`🎵 Creating chunk ${this.chunkCounter} from ${this.allRecordedData.length} data pieces (${(completeWebM.size / 1024).toFixed(1)}KB)`);
    
    const chunk: AudioChunk = {
      id: `chunk-${this.chunkCounter}`,
      data: completeWebM,
      startTime: this.lastChunkTime,
      endTime: now,
      duration: now - this.lastChunkTime,
      hasOverlap: this.chunkCounter > 0,
      overlapDuration: this.chunkCounter > 0 ? this.config.overlapMs : undefined
    };
    
    this.chunkCounter++;
    
    this.addChunkToQueue(chunk);
    
    // FIXED: Reset accumulated data for next chunk (or keep overlap if needed)
    if (this.config.overlapMs > 0 && this.chunkCounter > 1) {
      // Keep some overlap data for context (only after first chunk)
      const overlapRatio = this.config.overlapMs / this.config.chunkDurationMs;
      const keepCount = Math.max(1, Math.floor(this.allRecordedData.length * overlapRatio));
      this.allRecordedData = this.allRecordedData.slice(-keepCount);
      console.log(`🔗 Keeping ${keepCount} data pieces for overlap`);
    } else {
      // No overlap for first chunk - clear all data
      this.allRecordedData = [];
      console.log(`🧹 Cleared accumulated data (chunk ${this.chunkCounter - 1})`);
    }
    
    this.lastChunkTime = now - this.config.overlapMs;
  }

  private createFinalChunkFromAccumulatedData(): void {
    if (this.allRecordedData.length === 0) return;
    
    const finalWebM = new Blob(this.allRecordedData, { type: 'audio/webm;codecs=opus' });
    const now = Date.now();
    
    console.log(`🎵 Creating final chunk from ${this.allRecordedData.length} data pieces (${(finalWebM.size / 1024).toFixed(1)}KB)`);
    
    const chunk: AudioChunk = {
      id: `chunk-final-${this.chunkCounter}`,
      data: finalWebM,
      startTime: this.lastChunkTime,
      endTime: now,
      duration: now - this.lastChunkTime,
      hasOverlap: false
    };
    
    this.chunkCounter++;
    
    this.addChunkToQueue(chunk);
    this.allRecordedData = [];
  }

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
      accumulatedDataPieces: this.allRecordedData.length
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
    
    if (this.chunkingInterval) {
      clearInterval(this.chunkingInterval);
      this.chunkingInterval = null;
    }
    
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
    this.allRecordedData = [];
    
    console.log('🧹 Continuous Audio Processor cleaned up');
  }
}

// Factory function
export function createContinuousAudioProcessor(config?: Partial<ContinuousProcessorConfig>): ContinuousAudioProcessor {
  return new ContinuousAudioProcessor(config);
}