/**
 * Continuous Audio Processing Queue for Ambient Listening
 * Handles 30-second chunking with overlap and real-time processing pipeline
 */

import { AudioChunk, ContinuousProcessingQueue, VoiceActivityResult } from '@shared/transcription-types';
import { VoiceActivityDetector } from './voice-activity-detection';
import { SpeakerIdentifier } from './speaker-identification';

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
}

export class ContinuousAudioProcessor {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isRecording = false;
  private startTime = 0;
  private chunkCounter = 0;
  
  private vad: VoiceActivityDetector | null = null;
  private speakerIdentifier: SpeakerIdentifier | null = null;
  
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
  private recordingData: Blob[] = [];
  private lastChunkTime = 0;

  constructor(config?: Partial<ContinuousProcessorConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
      this.queue.maxQueueSize = this.config.maxQueueSize;
      this.queue.processingConcurrency = this.config.processingConcurrency;
    }
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
      
      // Initialize MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });
      
      this.setupMediaRecorderEvents();
      
      console.log('🎙️ Continuous Audio Processor initialized');
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
    this.chunkCounter = 0;
    this.lastChunkTime = this.startTime;
    this.recordingData = [];
    
    // Start VAD if enabled
    if (this.vad) {
      this.vad.start();
    }
    
    try {
      // Start recording with time slicing for continuous chunks
      this.mediaRecorder.start(this.config.chunkDurationMs);
      console.log(`🔴 Continuous recording started (${this.config.chunkDurationMs}ms chunks)`);
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
    this.mediaRecorder.stop();
    
    // Stop VAD
    if (this.vad) {
      this.vad.stop();
    }
    
    // Process final chunk if any
    if (this.recordingData.length > 0) {
      this.createFinalChunk();
    }
    
    console.log('⏹️ Continuous recording stopped');
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.isRecording) {
        // Create chunk from each time slice
        this.createChunkFromData([event.data]);
        console.log(`🔄 Processing chunk: ${this.chunkCounter - 1}`);
      }
    };

    this.mediaRecorder.onstop = () => {
      console.log('⏹️ MediaRecorder stopped');
      // Process any remaining data
      if (this.recordingData.length > 0) {
        this.createFinalChunk();
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ MediaRecorder error:', event);
      this.isRecording = false;
    };
  }

  private scheduleNextChunk(): void {
    // MediaRecorder with time slicing handles this automatically
    // No need for manual scheduling
  }

  private createChunkFromData(data: Blob[]): void {
    const now = Date.now();
    const chunkBlob = new Blob(data, { type: 'audio/webm' });
    
    const chunk: AudioChunk = {
      id: `chunk-${this.chunkCounter++}`,
      data: chunkBlob,
      startTime: this.lastChunkTime,
      endTime: now,
      duration: now - this.lastChunkTime,
      hasOverlap: this.chunkCounter > 1,
      overlapDuration: this.chunkCounter > 1 ? this.config.overlapMs : undefined
    };
    
    this.addChunkToQueue(chunk);
    this.lastChunkTime = now - this.config.overlapMs; // Account for overlap
  }

  private createFinalChunk(): void {
    if (this.recordingData.length === 0) return;
    
    const finalBlob = new Blob(this.recordingData, { type: 'audio/webm' });
    const now = Date.now();
    
    const chunk: AudioChunk = {
      id: `chunk-final-${this.chunkCounter++}`,
      data: finalBlob,
      startTime: this.lastChunkTime,
      endTime: now,
      duration: now - this.lastChunkTime,
      hasOverlap: false
    };
    
    this.addChunkToQueue(chunk);
    this.recordingData = [];
  }

  private processAccumulatedData(): void {
    if (this.recordingData.length > 0) {
      this.createFinalChunk();
    }
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
      
      // Call processing callback
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
  } {
    return {
      totalChunks: this.chunkCounter,
      pendingChunks: this.queue.pending.length,
      processingChunks: this.queue.processing.length,
      completedChunks: this.queue.completed.length,
      failedChunks: this.queue.failed.length,
      isRecording: this.isRecording,
      recordingDuration: this.isRecording ? Date.now() - this.startTime : 0
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
    this.recordingData = [];
    
    console.log('🧹 Continuous Audio Processor cleaned up');
  }
}

// Factory function
export function createContinuousAudioProcessor(config?: Partial<ContinuousProcessorConfig>): ContinuousAudioProcessor {
  return new ContinuousAudioProcessor(config);
}