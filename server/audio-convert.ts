/**
 * Audio conversion utilities for CentomoMD
 * Converts WebM/Opus audio to WAV format for Whisper API compatibility
 */

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { Readable } from "stream";

// Set FFmpeg path for reliable execution
ffmpeg.setFfmpegPath(ffmpegPath.path);

export interface AudioConversionOptions {
  channels?: number;
  frequency?: number;
  format?: string;
}

/**
 * Convert WebM audio buffer to WAV mono 16kHz format
 * This format is optimal for OpenAI Whisper API
 */
export function webmToWavMono16k(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Validate input buffer
    if (!input || input.length === 0) {
      reject(new Error("Empty or invalid input buffer"));
      return;
    }

    if (input.length < 1024) {
      reject(new Error(`Input buffer too small: ${input.length} bytes`));
      return;
    }

    const inStream = Readable.from(input);
    const chunks: Buffer[] = [];
    
    // Enhanced FFmpeg command with better error handling
    const conversion = ffmpeg(inStream)
      .inputFormat("webm")
      .inputOptions([
        '-f', 'webm',
        '-analyzeduration', '10000000',  // 10 seconds analysis
        '-probesize', '50000000'        // 50MB probe size
      ])
      .noVideo()
      .audioChannels(1)        // Mono audio
      .audioFrequency(16000)   // 16kHz sample rate
      .audioBitrate('128k')    // Sufficient bitrate
      .format("wav")           // WAV output format
      .audioCodec('pcm_s16le') // Explicit PCM codec
      .on("error", (err: any) => {
        console.error("🔴 FFmpeg conversion error:", err.message);
        reject(new Error(`Audio conversion failed: ${err.message}`));
      })
      .on("start", (cmdline: string) => {
        console.log("🎵 Starting audio conversion:", cmdline.substring(0, 200) + "...");
      })
      .on("progress", (progress: any) => {
        if (progress.percent) {
          console.log(`🔄 Conversion progress: ${progress.percent.toFixed(1)}%`);
        }
      });
      
    const outputStream = conversion.pipe();
    
    outputStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    outputStream.on("end", () => {
      const result = Buffer.concat(chunks);
      console.log(`✅ Audio conversion complete: ${input.length} bytes → ${result.length} bytes`);
      
      if (result.length === 0) {
        reject(new Error("FFmpeg produced empty output - source audio may be corrupted"));
        return;
      }
      
      resolve(result);
    });
    
    outputStream.on("error", (err: any) => {
      console.error("🔴 Output stream error:", err);
      reject(err);
    });

    // Set timeout for conversion (30 seconds max)
    setTimeout(() => {
      reject(new Error("Audio conversion timeout - process took too long"));
    }, 30000);
  });
}

/**
 * Generic audio format converter with customizable options
 */
export function convertAudio(
  input: Buffer, 
  inputFormat: string, 
  outputFormat: string, 
  options: AudioConversionOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const inStream = Readable.from(input);
    const chunks: Buffer[] = [];
    
    const {
      channels = 1,
      frequency = 16000,
      format = outputFormat
    } = options;
    
    const conversion = ffmpeg(inStream)
      .inputFormat(inputFormat)
      .noVideo()
      .audioChannels(channels)
      .audioFrequency(frequency)
      .format(format)
      .on("error", reject)
      .on("start", (cmdline: string) => {
        console.log(`🎵 Converting ${inputFormat} → ${format}:`, cmdline);
      });
      
    const outputStream = conversion.pipe();
    
    outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    outputStream.on("error", reject);
  });
}

/**
 * Validate audio buffer format and size
 */
export function validateAudioBuffer(buffer: Buffer, minSize: number = 1024): boolean {
  if (!buffer || buffer.length < minSize) {
    console.warn(`⚠️ Audio buffer too small: ${buffer?.length || 0} bytes (min: ${minSize})`);
    return false;
  }
  
  // Check for common audio format headers
  const header = buffer.subarray(0, 12).toString('ascii', 0, 4);
  const isWebM = buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const isWAV = header === 'RIFF';
  const isMP3 = buffer.subarray(0, 3).equals(Buffer.from([0x49, 0x44, 0x33])) || 
                buffer.subarray(0, 2).equals(Buffer.from([0xff, 0xfb]));
  
  if (!isWebM && !isWAV && !isMP3) {
    console.warn("⚠️ Unknown audio format detected");
  }
  
  return true;
}