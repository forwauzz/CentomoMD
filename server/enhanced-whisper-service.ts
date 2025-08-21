/**
 * Enhanced Whisper Service with Circuit Breaker and Error Recovery
 * Implements robust error handling and fallback strategies for ambient transcription
 */

import { transcriptionCircuitBreaker } from './transcription-circuit-breaker';
import { transcribeAudioWithWhisperMultipart } from './whisper-service';

export interface EnhancedTranscriptionOptions {
  buffer: Buffer;
  filename: string;
  mimetype?: string;
  language?: "fr" | "en" | "auto";
  temperature?: number;
  sessionId?: string;
  chunkIndex?: number;
  mode?: string;
  retryAttempts?: number;
  fallbackToLocal?: boolean;
}

export interface TranscriptionResult {
  text: string;
  chunkIndex?: number;
  source: 'whisper' | 'local-fallback' | 'cache';
  quality: 'high' | 'medium' | 'low';
  processingTime: number;
  retryCount?: number;
}

export interface TranscriptionQualityMetrics {
  confidence: number;
  wordCount: number;
  avgWordLength: number;
  hasValidStructure: boolean;
  isRepeating: boolean;
}

class EnhancedWhisperService {
  private recentTranscriptions: Map<string, { text: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;
  
  async transcribeWithRecovery(options: EnhancedTranscriptionOptions): Promise<TranscriptionResult> {
    const startTime = Date.now();
    const {
      buffer,
      filename,
      mimetype,
      language = "fr",
      temperature = 0.2,
      sessionId,
      chunkIndex = 0,
      mode = "transcribe",
      retryAttempts = this.MAX_RETRY_ATTEMPTS,
      fallbackToLocal = true
    } = options;

    // Create cache key for deduplication
    const cacheKey = this.createCacheKey(buffer, chunkIndex);
    
    // Check recent cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📋 Using cached transcription for chunk ${chunkIndex}`);
      return {
        text: cached.text,
        chunkIndex,
        source: 'cache',
        quality: 'high',
        processingTime: Date.now() - startTime
      };
    }

    // Primary transcription attempt with circuit breaker
    try {
      const result = await transcriptionCircuitBreaker.executeWithBreaker(
        'whisper-api',
        async () => {
          return await this.attemptWhisperTranscription({
            buffer,
            filename,
            mimetype,
            language,
            temperature,
            sessionId,
            chunkIndex,
            mode: mode as "transcribe" | "smart" | "word-for-word"
          });
        },
        fallbackToLocal ? () => this.localFallbackTranscription(buffer, chunkIndex) : undefined
      );

      // Validate and cache successful result
      const qualityMetrics = this.assessTranscriptionQuality(result.text);
      if (qualityMetrics.confidence > 0.7) {
        this.addToCache(cacheKey, result.text);
      }

      return {
        text: result.text,
        chunkIndex: result.chunkIndex,
        source: 'whisper',
        quality: this.getQualityLevel(qualityMetrics),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`❌ Enhanced transcription failed for chunk ${chunkIndex}:`, error);
      
      // Implement retry with exponential backoff
      if (retryAttempts > 0) {
        const retryDelay = Math.pow(2, this.MAX_RETRY_ATTEMPTS - retryAttempts) * 1000;
        console.log(`🔄 Retrying transcription in ${retryDelay}ms (${retryAttempts} attempts left)`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        return this.transcribeWithRecovery({
          ...options,
          retryAttempts: retryAttempts - 1
        });
      }

      // Final fallback: return error indication
      return {
        text: `[Transcription failed for audio chunk ${chunkIndex + 1}]`,
        chunkIndex,
        source: 'local-fallback',
        quality: 'low',
        processingTime: Date.now() - startTime,
        retryCount: this.MAX_RETRY_ATTEMPTS
      };
    }
  }

  private async attemptWhisperTranscription(options: {
    buffer: Buffer;
    filename: string;
    mimetype?: string;
    language: "fr" | "en" | "auto";
    temperature: number;
    sessionId?: string;
    chunkIndex: number;
    mode: "transcribe" | "smart" | "word-for-word";
  }): Promise<{ text: string; chunkIndex?: number }> {
    
    // Pre-validation: Check buffer quality
    if (!this.isValidAudioBuffer(options.buffer)) {
      throw new Error('Invalid audio buffer - insufficient data or corrupted');
    }

    console.log(`🎙️ Attempting Whisper transcription: chunk ${options.chunkIndex} (${(options.buffer.length / 1024).toFixed(1)}KB)`);

    return await transcribeAudioWithWhisperMultipart({
      buffer: options.buffer,
      filename: options.filename,
      mimetype: options.mimetype,
      language: options.language,
      temperature: options.temperature,
      sessionId: options.sessionId,
      chunkIndex: options.chunkIndex,
      mode: options.mode as "transcribe" | "smart" | "word-for-word"
    });
  }

  private async localFallbackTranscription(buffer: Buffer, chunkIndex: number): Promise<{ text: string; chunkIndex?: number }> {
    console.log(`🔧 Using local fallback for chunk ${chunkIndex}`);
    
    // Implement basic audio analysis fallback
    const audioSize = buffer.length;
    const estimatedDuration = audioSize / (16000 * 2); // Rough estimate for 16kHz mono
    
    if (estimatedDuration < 1) {
      return {
        text: "[Audio too short for transcription]",
        chunkIndex
      };
    }
    
    // Could implement basic speech detection here
    // For now, return a structured placeholder
    return {
      text: `[Audio chunk ${chunkIndex + 1} - ${(audioSize / 1024).toFixed(1)}KB, ~${estimatedDuration.toFixed(1)}s - Service temporarily unavailable]`,
      chunkIndex
    };
  }

  private isValidAudioBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 1024) { // Less than 1KB
      return false;
    }
    
    // Basic WebM header validation
    const header = buffer.slice(0, 4);
    const webmSignature = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]);
    
    return header.equals(webmSignature) || buffer.length > 10000; // Accept if > 10KB even without proper header
  }

  private assessTranscriptionQuality(text: string): TranscriptionQualityMetrics {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const avgWordLength = wordCount > 0 ? words.reduce((sum, word) => sum + word.length, 0) / wordCount : 0;
    
    // Check for repeating patterns (indicates poor quality)
    const isRepeating = this.hasRepeatingPatterns(text);
    
    // Basic structure validation (has some punctuation, reasonable length)
    const hasValidStructure = text.length > 10 && /[.!?]/.test(text) && wordCount >= 3;
    
    // Calculate confidence based on metrics
    let confidence = 0.5; // Base confidence
    
    if (hasValidStructure) confidence += 0.2;
    if (!isRepeating) confidence += 0.2;
    if (avgWordLength > 3 && avgWordLength < 10) confidence += 0.1;
    if (wordCount >= 5) confidence += 0.1;
    
    return {
      confidence: Math.min(confidence, 1.0),
      wordCount,
      avgWordLength,
      hasValidStructure,
      isRepeating
    };
  }

  private hasRepeatingPatterns(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    if (words.length < 6) return false;
    
    // Check for immediate repetitions
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] === words[i + 1] && words[i].length > 2) {
        return true;
      }
    }
    
    return false;
  }

  private getQualityLevel(metrics: TranscriptionQualityMetrics): 'high' | 'medium' | 'low' {
    if (metrics.confidence >= 0.8) return 'high';
    if (metrics.confidence >= 0.6) return 'medium';
    return 'low';
  }

  private createCacheKey(buffer: Buffer, chunkIndex: number): string {
    // Create a simple hash of buffer size + chunk index
    const bufferHash = buffer.length.toString(36) + chunkIndex.toString(36);
    return `chunk_${bufferHash}`;
  }

  private getFromCache(key: string): { text: string; timestamp: number } | null {
    const cached = this.recentTranscriptions.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    if (cached) {
      this.recentTranscriptions.delete(key); // Expired
    }
    return null;
  }

  private addToCache(key: string, text: string): void {
    this.recentTranscriptions.set(key, {
      text,
      timestamp: Date.now()
    });

    // Clean up old entries
    if (this.recentTranscriptions.size > 50) {
      const oldestKey = this.recentTranscriptions.keys().next().value;
      this.recentTranscriptions.delete(oldestKey);
    }
  }

  // Circuit breaker status for monitoring
  getServiceStatus(): any {
    return {
      circuitBreaker: transcriptionCircuitBreaker.getStatus('whisper-api'),
      cacheSize: this.recentTranscriptions.size,
      timestamp: new Date().toISOString()
    };
  }

  // Force reset for admin purposes
  resetService(): void {
    transcriptionCircuitBreaker.reset('whisper-api');
    this.recentTranscriptions.clear();
    console.log('🔄 Enhanced Whisper Service reset');
  }
}

export const enhancedWhisperService = new EnhancedWhisperService();