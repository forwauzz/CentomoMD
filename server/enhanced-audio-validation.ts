/**
 * Enhanced Audio Validation and Quality Assessment
 * Phase 1 implementation for better audio processing reliability
 */

export interface AudioValidationResult {
  isValid: boolean;
  quality: 'high' | 'medium' | 'low';
  estimatedDuration: number;
  sampleRate?: number;
  channels?: number;
  issues: string[];
  recommendations: string[];
}

export interface AudioQualityMetrics {
  fileSize: number;
  estimatedDuration: number;
  hasValidHeader: boolean;
  compressionRatio: number;
  estimatedBitrate: number;
}

export class EnhancedAudioValidator {
  private readonly MIN_VALID_SIZE = 1024; // 1KB minimum
  private readonly MAX_VALID_SIZE = 25 * 1024 * 1024; // 25MB maximum
  private readonly MIN_DURATION = 0.5; // 0.5 seconds minimum
  private readonly MAX_DURATION = 300; // 5 minutes maximum

  validateAudioBuffer(buffer: Buffer, mimeType?: string): AudioValidationResult {
    const result: AudioValidationResult = {
      isValid: true,
      quality: 'medium',
      estimatedDuration: 0,
      issues: [],
      recommendations: []
    };

    // Basic size validation
    if (buffer.length < this.MIN_VALID_SIZE) {
      result.isValid = false;
      result.quality = 'low';
      result.issues.push(`File too small: ${buffer.length} bytes (minimum: ${this.MIN_VALID_SIZE} bytes)`);
      result.recommendations.push('Ensure recording duration is at least 0.5 seconds');
      return result;
    }

    if (buffer.length > this.MAX_VALID_SIZE) {
      result.isValid = false;
      result.quality = 'low';
      result.issues.push(`File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB (maximum: 25MB)`);
      result.recommendations.push('Consider splitting long recordings into smaller chunks');
      return result;
    }

    // Format-specific validation
    const formatAnalysis = this.analyzeAudioFormat(buffer, mimeType);
    result.estimatedDuration = formatAnalysis.estimatedDuration;

    if (!formatAnalysis.hasValidHeader) {
      result.issues.push('Audio header may be corrupted or unsupported format');
      result.quality = 'low';
    }

    // Duration validation
    if (formatAnalysis.estimatedDuration < this.MIN_DURATION) {
      result.issues.push(`Recording too short: ${formatAnalysis.estimatedDuration.toFixed(1)}s (minimum: ${this.MIN_DURATION}s)`);
      result.quality = 'low';
    }

    if (formatAnalysis.estimatedDuration > this.MAX_DURATION) {
      result.issues.push(`Recording too long: ${(formatAnalysis.estimatedDuration / 60).toFixed(1)}min (maximum: ${this.MAX_DURATION / 60}min)`);
      result.recommendations.push('Consider using continuous chunking for long recordings');
    }

    // Quality assessment based on bitrate and compression
    if (formatAnalysis.estimatedBitrate > 0) {
      if (formatAnalysis.estimatedBitrate < 32000) { // Less than 32kbps
        result.quality = 'low';
        result.issues.push('Low audio bitrate may affect transcription accuracy');
        result.recommendations.push('Use higher quality recording settings (64kbps or higher)');
      } else if (formatAnalysis.estimatedBitrate > 128000) { // More than 128kbps
        result.quality = 'high';
      }
    }

    // Final validation
    if (result.issues.length === 0) {
      result.quality = formatAnalysis.estimatedBitrate > 64000 ? 'high' : 'medium';
    } else if (result.issues.length > 2) {
      result.isValid = false;
    }

    return result;
  }

  private analyzeAudioFormat(buffer: Buffer, mimeType?: string): AudioQualityMetrics {
    const metrics: AudioQualityMetrics = {
      fileSize: buffer.length,
      estimatedDuration: 0,
      hasValidHeader: false,
      compressionRatio: 0,
      estimatedBitrate: 0
    };

    // WebM/Opus analysis
    if (mimeType?.includes('webm') || this.isWebMBuffer(buffer)) {
      metrics.hasValidHeader = this.validateWebMHeader(buffer);
      metrics.estimatedDuration = this.estimateWebMDuration(buffer);
      metrics.estimatedBitrate = this.estimateWebMBitrate(buffer, metrics.estimatedDuration);
    }
    // WAV analysis
    else if (mimeType?.includes('wav') || this.isWAVBuffer(buffer)) {
      const wavAnalysis = this.analyzeWAVBuffer(buffer);
      metrics.hasValidHeader = wavAnalysis.isValid;
      metrics.estimatedDuration = wavAnalysis.duration;
      metrics.estimatedBitrate = wavAnalysis.bitrate;
    }
    // Generic audio estimation
    else {
      metrics.estimatedDuration = this.estimateGenericDuration(buffer);
      metrics.estimatedBitrate = this.estimateGenericBitrate(buffer, metrics.estimatedDuration);
      metrics.hasValidHeader = buffer.length > 44; // Minimum for most audio formats
    }

    // Calculate compression ratio
    if (metrics.estimatedDuration > 0) {
      const uncompressedSize = metrics.estimatedDuration * 44100 * 2 * 2; // 16-bit stereo at 44.1kHz
      metrics.compressionRatio = uncompressedSize / buffer.length;
    }

    return metrics;
  }

  private isWebMBuffer(buffer: Buffer): boolean {
    // WebM/Matroska EBML header: 0x1A 0x45 0xDF 0xA3
    if (buffer.length < 4) return false;
    const header = buffer.slice(0, 4);
    return header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3;
  }

  private isWAVBuffer(buffer: Buffer): boolean {
    // WAV header: "RIFF" + filesize + "WAVE"
    if (buffer.length < 12) return false;
    const riff = buffer.slice(0, 4).toString('ascii');
    const wave = buffer.slice(8, 12).toString('ascii');
    return riff === 'RIFF' && wave === 'WAVE';
  }

  private validateWebMHeader(buffer: Buffer): boolean {
    if (!this.isWebMBuffer(buffer)) return false;
    
    // Look for Opus codec identifier within first 1KB
    const searchWindow = buffer.slice(0, Math.min(buffer.length, 1024));
    const opusIdentifier = Buffer.from('OpusHead');
    
    for (let i = 0; i < searchWindow.length - opusIdentifier.length; i++) {
      if (searchWindow.slice(i, i + opusIdentifier.length).equals(opusIdentifier)) {
        return true;
      }
    }
    
    return buffer.length > 100; // Basic size check if no Opus header found
  }

  private estimateWebMDuration(buffer: Buffer): number {
    // Very rough estimation based on file size and typical Opus bitrates
    // This is not precise but gives a reasonable estimate for validation
    const typicalBitrate = 64000; // 64kbps typical for voice
    return (buffer.length * 8) / typicalBitrate;
  }

  private estimateWebMBitrate(buffer: Buffer, duration: number): number {
    if (duration <= 0) return 0;
    return (buffer.length * 8) / duration;
  }

  private analyzeWAVBuffer(buffer: Buffer): { isValid: boolean; duration: number; bitrate: number } {
    if (!this.isWAVBuffer(buffer)) {
      return { isValid: false, duration: 0, bitrate: 0 };
    }

    try {
      // Read WAV header information
      const fileSize = buffer.readUInt32LE(4);
      const fmtChunkSize = buffer.readUInt32LE(16);
      const audioFormat = buffer.readUInt16LE(20);
      const numChannels = buffer.readUInt16LE(22);
      const sampleRate = buffer.readUInt32LE(24);
      const byteRate = buffer.readUInt32LE(28);
      const bitsPerSample = buffer.readUInt16LE(34);

      // Calculate duration
      const dataSize = fileSize - 44; // Approximate data size
      const duration = dataSize / byteRate;
      const bitrate = byteRate * 8;

      return {
        isValid: audioFormat === 1 && numChannels > 0 && sampleRate > 0,
        duration,
        bitrate
      };
    } catch (error) {
      return { isValid: false, duration: 0, bitrate: 0 };
    }
  }

  private estimateGenericDuration(buffer: Buffer): number {
    // Very rough estimation: assume 64kbps encoding
    return (buffer.length * 8) / 64000;
  }

  private estimateGenericBitrate(buffer: Buffer, duration: number): number {
    if (duration <= 0) return 0;
    return (buffer.length * 8) / duration;
  }

  // Helper method for chunk size validation
  validateChunkSize(chunkIndex: number, totalExpectedChunks?: number): { isValid: boolean; recommendations: string[] } {
    const recommendations: string[] = [];
    let isValid = true;

    if (totalExpectedChunks && chunkIndex >= totalExpectedChunks) {
      isValid = false;
      recommendations.push(`Chunk index ${chunkIndex} exceeds expected total ${totalExpectedChunks}`);
    }

    if (chunkIndex < 0) {
      isValid = false;
      recommendations.push('Chunk index cannot be negative');
    }

    return { isValid, recommendations };
  }
}

// Global validator instance
export const audioValidator = new EnhancedAudioValidator();