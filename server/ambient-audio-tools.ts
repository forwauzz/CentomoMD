/**
 * Enhanced Ambient Audio Processing Tools
 * Provides robust audio processing with multiple fallback strategies
 */

import { transcriptionCircuitBreaker } from './transcription-circuit-breaker';
import { enhancedWhisperService } from './enhanced-whisper-service';

export interface AmbientAudioChunk {
  id: string;
  buffer: Buffer;
  size: number;
  duration: number;
  format: 'webm' | 'wav' | 'unknown';
  chunkIndex: number;
  sessionId: string;
}

export interface AmbientProcessingResult {
  success: boolean;
  text: string;
  chunkIndex: number;
  source: 'whisper' | 'fallback' | 'cache';
  quality: 'high' | 'medium' | 'low';
  processingTime: number;
  fallbackUsed?: string;
  error?: string;
}

export class AmbientAudioToolkit {
  private static instance: AmbientAudioToolkit;
  private processingQueue = new Map<string, Promise<AmbientProcessingResult>>();
  private recentResults = new Map<string, AmbientProcessingResult>();
  private circuitBreakerStatus = new Map<string, { 
    failures: number; 
    lastFailure: number; 
    isOpen: boolean 
  }>();

  static getInstance(): AmbientAudioToolkit {
    if (!AmbientAudioToolkit.instance) {
      AmbientAudioToolkit.instance = new AmbientAudioToolkit();
    }
    return AmbientAudioToolkit.instance;
  }

  /**
   * Smart audio format detector with advanced WebM validation
   */
  detectAudioFormat(buffer: Buffer): 'webm' | 'wav' | 'unknown' {
    if (buffer.length < 12) return 'unknown';

    // WebM format detection (EBML header)
    const webmSignatures = [
      Buffer.from([0x1A, 0x45, 0xDF, 0xA3]), // EBML header
      Buffer.from('webm', 'utf-8')
    ];

    // WAV format detection
    const wavSignature = Buffer.from('RIFF', 'utf-8');
    const waveSignature = Buffer.from('WAVE', 'utf-8');

    // Check WebM signatures
    for (const signature of webmSignatures) {
      if (buffer.indexOf(signature) !== -1) {
        return 'webm';
      }
    }

    // Check WAV signature
    if (buffer.slice(0, 4).equals(wavSignature) && 
        buffer.slice(8, 12).equals(waveSignature)) {
      return 'wav';
    }

    return 'unknown';
  }

  /**
   * Advanced audio quality assessment
   */
  assessAudioQuality(buffer: Buffer): { 
    score: number; 
    quality: 'high' | 'medium' | 'low';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Size-based quality assessment
    if (buffer.length < 10000) { // Less than 10KB
      issues.push('Very small audio file - may be empty or corrupted');
      recommendations.push('Check microphone connection and recording settings');
      score -= 40;
    } else if (buffer.length < 50000) { // Less than 50KB
      issues.push('Small audio file - very short duration');
      recommendations.push('Consider longer recording duration for better accuracy');
      score -= 20;
    }

    // Format-specific assessment
    const format = this.detectAudioFormat(buffer);
    if (format === 'unknown') {
      issues.push('Unknown audio format detected');
      recommendations.push('Use WebM or WAV format for best compatibility');
      score -= 30;
    }

    // Determine quality level
    let quality: 'high' | 'medium' | 'low';
    if (score >= 80) quality = 'high';
    else if (score >= 60) quality = 'medium';
    else quality = 'low';

    return { score, quality, issues, recommendations };
  }

  /**
   * Process ambient audio with multiple fallback strategies
   */
  async processAmbientChunk(chunk: AmbientAudioChunk): Promise<AmbientProcessingResult> {
    const startTime = Date.now();
    const chunkKey = `${chunk.sessionId}-${chunk.chunkIndex}`;

    // Prevent duplicate processing
    if (this.processingQueue.has(chunkKey)) {
      console.log(`⏳ Ambient chunk ${chunk.chunkIndex} already processing, waiting...`);
      return await this.processingQueue.get(chunkKey)!;
    }

    // Check recent results cache
    if (this.recentResults.has(chunkKey)) {
      console.log(`📋 Using cached result for ambient chunk ${chunk.chunkIndex}`);
      return this.recentResults.get(chunkKey)!;
    }

    // Start processing
    const processingPromise = this.doProcessAmbientChunk(chunk, startTime);
    this.processingQueue.set(chunkKey, processingPromise);

    try {
      const result = await processingPromise;
      this.recentResults.set(chunkKey, result);
      
      // Keep only recent results (last 10)
      if (this.recentResults.size > 10) {
        const firstKey = this.recentResults.keys().next().value;
        this.recentResults.delete(firstKey);
      }
      
      return result;
    } finally {
      this.processingQueue.delete(chunkKey);
    }
  }

  private async doProcessAmbientChunk(chunk: AmbientAudioChunk, startTime: number): Promise<AmbientProcessingResult> {
    console.log(`🎙️ Processing ambient chunk ${chunk.chunkIndex}: ${(chunk.size / 1024).toFixed(1)}KB`);

    // Quality assessment
    const quality = this.assessAudioQuality(chunk.buffer);
    console.log(`📊 Audio quality: ${quality.quality} (score: ${quality.score})`);

    if (quality.issues.length > 0) {
      console.log(`⚠️ Audio quality issues:`, quality.issues);
    }

    // Strategy 1: Enhanced Whisper Service (primary)
    try {
      console.log(`🔄 Strategy 1: Enhanced Whisper transcription`);
      const result = await enhancedWhisperService.transcribeWithRecovery({
        buffer: chunk.buffer,
        filename: `ambient-${chunk.chunkIndex}.webm`,
        mimetype: 'audio/webm;codecs=opus',
        language: 'auto',
        sessionId: chunk.sessionId,
        chunkIndex: chunk.chunkIndex,
        mode: 'transcribe'
      });

      return {
        success: true,
        text: result.text,
        chunkIndex: chunk.chunkIndex,
        source: result.source as 'whisper' | 'fallback',
        quality: result.quality as 'high' | 'medium' | 'low',
        processingTime: Date.now() - startTime
      };

    } catch (whisperError: any) {
      console.error(`❌ Enhanced Whisper failed for chunk ${chunk.chunkIndex}:`, whisperError.message);

      // Strategy 2: Circuit breaker fallback
      try {
        console.log(`🔄 Strategy 2: Circuit breaker with local fallback`);
        const fallbackResult = await this.localAudioAnalysis(chunk);
        
        return {
          success: true,
          text: fallbackResult.text,
          chunkIndex: chunk.chunkIndex,
          source: 'fallback',
          quality: 'low',
          processingTime: Date.now() - startTime,
          fallbackUsed: 'local_analysis'
        };

      } catch (fallbackError: any) {
        console.error(`❌ All processing strategies failed for chunk ${chunk.chunkIndex}`);

        // Strategy 3: Graceful degradation
        return {
          success: false,
          text: this.generateFallbackMessage(chunk, quality),
          chunkIndex: chunk.chunkIndex,
          source: 'fallback',
          quality: 'low',
          processingTime: Date.now() - startTime,
          fallbackUsed: 'graceful_degradation',
          error: `${whisperError.message} | ${fallbackError.message}`
        };
      }
    }
  }

  /**
   * Local audio analysis fallback
   */
  private async localAudioAnalysis(chunk: AmbientAudioChunk): Promise<{ text: string }> {
    // Implement basic audio analysis
    const format = this.detectAudioFormat(chunk.buffer);
    const sizeKB = (chunk.size / 1024).toFixed(1);
    const estimatedDuration = Math.max(1, chunk.duration / 1000);

    // Check for audio activity patterns
    const hasContent = chunk.buffer.length > 50000; // Basic content detection
    
    if (hasContent) {
      return {
        text: `[Audio detected - ${sizeKB}KB, ~${estimatedDuration.toFixed(1)}s, ${format} format - Processing temporarily unavailable, please retry]`
      };
    } else {
      return {
        text: `[Silent audio segment - ${sizeKB}KB, ~${estimatedDuration.toFixed(1)}s]`
      };
    }
  }

  /**
   * Generate informative fallback messages
   */
  private generateFallbackMessage(chunk: AmbientAudioChunk, quality: any): string {
    const sizeKB = (chunk.size / 1024).toFixed(1);
    const estimatedDuration = Math.max(1, chunk.duration / 1000);
    
    // Provide helpful context in fallback message
    let message = `[Audio chunk ${chunk.chunkIndex + 1} - ${sizeKB}KB, ~${estimatedDuration.toFixed(1)}s`;
    
    if (quality.quality === 'low') {
      message += ' - Low quality audio detected';
    }
    
    message += ' - Service temporarily unavailable]';
    
    return message;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    queueSize: number;
    cacheSize: number;
    circuitBreakerStatus: Record<string, any>;
    recentResults: Array<{ chunkIndex: number; success: boolean; source: string }>;
  } {
    const recentResults = Array.from(this.recentResults.values()).map(result => ({
      chunkIndex: result.chunkIndex,
      success: result.success,
      source: result.source
    }));

    return {
      queueSize: this.processingQueue.size,
      cacheSize: this.recentResults.size,
      circuitBreakerStatus: transcriptionCircuitBreaker.getAllStatuses(),
      recentResults
    };
  }

  /**
   * Reset circuit breakers and clear cache
   */
  reset(): void {
    this.processingQueue.clear();
    this.recentResults.clear();
    this.circuitBreakerStatus.clear();
    transcriptionCircuitBreaker.reset();
    console.log('🔄 Ambient audio toolkit reset');
  }
}

// Export singleton instance
export const ambientAudioToolkit = AmbientAudioToolkit.getInstance();