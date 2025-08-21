/**
 * Simple Audio Format Converter for Ambient Audio
 * Focuses on fixing WebM conversion issues with minimal complexity
 */

import { webmToWavMono16k } from './audio-convert';
import { toFile } from 'openai/uploads';

export interface SimpleAudioProcessingResult {
  success: boolean;
  convertedBuffer?: Buffer;
  originalFormat: 'webm' | 'wav' | 'unknown';
  targetFormat: 'wav';
  error?: string;
  processingTimeMs: number;
}

export class SimpleAudioConverter {
  private static instance: SimpleAudioConverter;

  static getInstance(): SimpleAudioConverter {
    if (!SimpleAudioConverter.instance) {
      SimpleAudioConverter.instance = new SimpleAudioConverter();
    }
    return SimpleAudioConverter.instance;
  }

  /**
   * Simple audio format detector
   */
  detectFormat(buffer: Buffer): 'webm' | 'wav' | 'unknown' {
    if (buffer.length < 12) return 'unknown';

    // WebM detection (EBML header)
    if (buffer.slice(0, 4).equals(Buffer.from([0x1A, 0x45, 0xDF, 0xA3]))) {
      return 'webm';
    }

    // WAV detection
    if (buffer.slice(0, 4).equals(Buffer.from('RIFF', 'utf-8')) && 
        buffer.slice(8, 12).equals(Buffer.from('WAVE', 'utf-8'))) {
      return 'wav';
    }

    return 'unknown';
  }

  /**
   * Convert WebM to WAV with simple error handling
   */
  async convertWebMToWAV(buffer: Buffer): Promise<SimpleAudioProcessingResult> {
    const startTime = Date.now();
    const originalFormat = this.detectFormat(buffer);

    // Quick validation
    if (buffer.length < 1024) {
      return {
        success: false,
        originalFormat,
        targetFormat: 'wav',
        error: 'Audio buffer too small (less than 1KB)',
        processingTimeMs: Date.now() - startTime
      };
    }

    // If already WAV, return as-is
    if (originalFormat === 'wav') {
      return {
        success: true,
        convertedBuffer: buffer,
        originalFormat,
        targetFormat: 'wav',
        processingTimeMs: Date.now() - startTime
      };
    }

    // Convert WebM to WAV
    if (originalFormat === 'webm') {
      try {
        console.log(`🔄 Converting WebM to WAV: ${(buffer.length / 1024).toFixed(1)}KB`);
        const wavBuffer = await webmToWavMono16k(buffer);
        
        if (wavBuffer.length === 0) {
          return {
            success: false,
            originalFormat,
            targetFormat: 'wav',
            error: 'Conversion produced empty buffer',
            processingTimeMs: Date.now() - startTime
          };
        }

        console.log(`✅ WebM to WAV conversion successful: ${(wavBuffer.length / 1024).toFixed(1)}KB`);
        return {
          success: true,
          convertedBuffer: wavBuffer,
          originalFormat,
          targetFormat: 'wav',
          processingTimeMs: Date.now() - startTime
        };

      } catch (error: any) {
        console.error('❌ WebM to WAV conversion failed:', error.message);
        return {
          success: false,
          originalFormat,
          targetFormat: 'wav',
          error: `Conversion failed: ${error.message}`,
          processingTimeMs: Date.now() - startTime
        };
      }
    }

    return {
      success: false,
      originalFormat,
      targetFormat: 'wav',
      error: `Unsupported format: ${originalFormat}`,
      processingTimeMs: Date.now() - startTime
    };
  }

  /**
   * Create proper audio file with fallback strategies
   */
  async createAudioFileForAPI(buffer: Buffer, filename: string): Promise<{
    file: any;
    format: string;
    success: boolean;
    error?: string;
  }> {
    // Try conversion first
    const conversionResult = await this.convertWebMToWAV(buffer);
    
    if (conversionResult.success && conversionResult.convertedBuffer) {
      try {
        const wavFile = await toFile(
          conversionResult.convertedBuffer,
          filename.replace(/\.webm$/i, '.wav'),
          { type: 'audio/wav' }
        );
        
        return {
          file: wavFile,
          format: 'wav',
          success: true
        };
      } catch (error: any) {
        console.error('❌ Failed to create WAV file object:', error.message);
      }
    }

    // Fallback: try original buffer as WebM
    try {
      const webmFile = await toFile(
        buffer,
        filename,
        { type: 'audio/webm;codecs=opus' }
      );
      
      return {
        file: webmFile,
        format: 'webm',
        success: true
      };
    } catch (error: any) {
      console.error('❌ Failed to create WebM file object:', error.message);
      return {
        file: null,
        format: 'unknown',
        success: false,
        error: `Failed to create audio file: ${error.message}`
      };
    }
  }
}

// Export singleton instance
export const simpleAudioConverter = SimpleAudioConverter.getInstance();