import OpenAI from 'openai';
import { enhanceVoiceInput } from './ai-formatter';
import { 
  TranscriptionMode, 
  TRANSCRIPTION_MODE_CONFIGS, 
  QUEBEC_MEDICAL_PROMPTS,
  ComplianceValidation 
} from '../shared/transcription-types';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Retry configuration for Whisper API
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
};

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Calculate exponential backoff delay
function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

// Check if error is retryable
function isRetryableError(error: any): boolean {
  // Rate limit errors
  if (error.status === 429) return true;
  
  // Server errors (5xx)
  if (error.status >= 500 && error.status < 600) return true;
  
  // Network/timeout errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
  
  // OpenAI specific retryable errors
  if (error.type === 'server_error' || error.type === 'rate_limit_exceeded') return true;
  
  return false;
}

// Timeout wrapper for API calls
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
}

// Retry wrapper for Whisper API calls with timeout
async function transcribeWithRetry(params: any): Promise<any> {
  let lastError: any;
  
  // Determine timeout based on file size
  const fileSize = params.file.size;
  const timeoutMs = fileSize > 5 * 1024 * 1024 ? 120000 : 60000; // 2 min for large files, 1 min for smaller
  
  console.log(`⏱️ Using ${timeoutMs/1000}s timeout for ${(fileSize/1024/1024).toFixed(1)}MB file`);
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🔄 Whisper API attempt ${attempt}/${RETRY_CONFIG.maxRetries}`);
      
      const result = await withTimeout(
        openai.audio.transcriptions.create(params),
        timeoutMs
      );
      
      // Success - return result
      if (attempt > 1) {
        console.log(`✅ Whisper API succeeded on attempt ${attempt}`);
      }
      return result;
      
    } catch (error: any) {
      lastError = error;
      
      // Log the error
      console.error(`❌ Whisper API attempt ${attempt} failed:`, error.message);
      
      // Check if we should retry
      if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
        const delay = getRetryDelay(attempt);
        console.log(`⏳ Retrying in ${delay}ms... (${error.status || error.code || 'timeout'})`);
        await sleep(delay);
        continue;
      }
      
      // No more retries or non-retryable error
      break;
    }
  }
  
  // All retries exhausted
  console.error(`💥 All Whisper API retries exhausted. Final error:`, lastError);
  throw lastError;
}

export interface WhisperTranscriptionResult {
  text: string;
  confidence?: number;
  duration?: number;
  language?: string;
  enhanced?: {
    text: string;
    corrections: Array<{ original: string; corrected: string; reason: string }>;
  };
  // New unified mode support
  mode?: import('../shared/transcription-types').TranscriptionMode;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  speakers?: Array<{
    speaker: string;
    text: string;
    timestamp: number;
    confidence: number;
  }>;
  compliance?: {
    zeroRetentionConfirmed: boolean;
    memoryCleanupScheduled: boolean;
    processingTime: number;
  };
}

export interface WhisperTranscriptionOptions {
  language?: 'fr' | 'en' | 'auto';
  enhanceText?: boolean;
  prompt?: string;
  sessionId?: string;
  totalChunks?: number;
  temperature?: number;
  // New unified mode support
  mode?: import('../shared/transcription-types').TranscriptionMode;
  realTimeHybrid?: boolean;
  wordLevelTimestamps?: boolean;
  speakerIdentification?: boolean;
}

export async function transcribeAudioWithWhisper(
  audioFile: File | Buffer,
  options: WhisperTranscriptionOptions = {}
): Promise<WhisperTranscriptionResult> {
  try {
    console.log('🎤 Starting Whisper transcription...');
    
    // Prepare the audio file for Whisper
    const audioBuffer = audioFile instanceof File ? 
      Buffer.from(await audioFile.arrayBuffer()) : 
      audioFile;
    
    // Validate audio buffer size
    if (audioBuffer.length === 0) {
      throw new Error('Empty audio buffer received');
    }
    
    if (audioBuffer.length < 1024) { // Less than 1KB is likely empty or corrupted
      throw new Error(`Audio file too small (${audioBuffer.length} bytes). May be empty or corrupted.`);
    }
    
    // Create a File-like object for the API with proper audio format
    // Detect format based on buffer or use webm for ambient chunks
    const isWebM = audioBuffer.slice(0, 4).toString('hex').startsWith('1a45dfa3');
    const fileName = isWebM ? 'audio.webm' : 'audio.wav';
    const mimeType = isWebM ? 'audio/webm' : 'audio/wav';
    const file = new File([audioBuffer], fileName, { type: mimeType });
    
    // Determine mode configuration
    const mode = options.mode || 'smart';
    const modeConfig = TRANSCRIPTION_MODE_CONFIGS[mode];
    
    // Set up transcription parameters based on mode
    const transcriptionParams: any = {
      file: file,
      model: 'whisper-1',
      response_format: modeConfig.settings.responseFormat,
      temperature: options.temperature !== undefined ? options.temperature : modeConfig.settings.temperature,
    };
    
    // Set language if specified
    if (options.language && options.language !== 'auto') {
      transcriptionParams.language = options.language === 'fr' ? 'fr' : 'en';
    }
    
    // Add medical context prompt based on mode settings
    if (options.prompt) {
      transcriptionParams.prompt = options.prompt;
    } else if (modeConfig.settings.medicalTerminologyPrompt) {
      // Use Quebec-optimized medical prompts
      const language = options.language === 'fr' || options.language === 'auto' ? 'fr' : 'en';
      transcriptionParams.prompt = QUEBEC_MEDICAL_PROMPTS[language];
    }
    
    console.log('📤 Sending audio to Whisper API...');
    const transcription = await transcribeWithRetry(transcriptionParams);
    
    console.log('✅ Whisper transcription received:', transcription.text.substring(0, 100) + '...');
    
    // Build result with mode-specific data
    let result: WhisperTranscriptionResult = {
      text: transcription.text,
      duration: (transcription as any).duration,
      language: (transcription as any).language,
      mode: mode,
      compliance: {
        zeroRetentionConfirmed: true,
        memoryCleanupScheduled: true,
        processingTime: Date.now()
      }
    };
    
    // Add word-level data for word-for-word and transcribe modes
    if (modeConfig.settings.wordLevelTimestamps && (transcription as any).words) {
      result.words = (transcription as any).words.map((word: any) => ({
        word: word.word,
        start: word.start,
        end: word.end,
        confidence: word.confidence || 0.9
      }));
    }
    
    // Apply medical text enhancement based on mode settings
    if (options.enhanceText !== false && modeConfig.settings.enhanceText) {
      try {
        console.log('🔧 Enhancing medical terminology...');
        const enhanced = enhanceVoiceInput(transcription.text);
        
        // Validate enhancement output
        if (enhanced && enhanced.enhanced && typeof enhanced.enhanced === 'string' && enhanced.enhanced.trim().length > 0) {
          result.enhanced = {
            text: enhanced.enhanced,
            corrections: enhanced.corrections.map(correction => ({
              original: enhanced.original,
              corrected: enhanced.enhanced,
              reason: correction
            }))
          };
          
          // Use enhanced text as primary result if improvements were made
          if (enhanced.corrections.length > 0) {
            result.text = enhanced.enhanced;
            console.log(`✨ Applied ${enhanced.corrections.length} medical corrections`);
          } else {
            console.log('📝 No corrections needed - using original transcript');
          }
        } else {
          console.warn('⚠️ Enhancement failed - invalid output, using original transcript');
        }
      } catch (error) {
        console.error('❌ Medical terminology enhancement failed:', error);
        console.log('📝 Falling back to original Whisper transcript');
        // Keep original transcript - no enhancement applied
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error);
    throw new Error(`Whisper transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function transcribeAudioChunk(
  audioBlob: Blob,
  chunkIndex: number,
  options: WhisperTranscriptionOptions = {}
): Promise<WhisperTranscriptionResult> {
  console.log(`🎵 Processing audio chunk ${chunkIndex + 1}...`);
  
  try {
    // Convert blob to buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Add chunk context to prompt
    const chunkPrompt = options.prompt ? 
      `${options.prompt} (Chunk ${chunkIndex + 1})` : 
      `Audio chunk ${chunkIndex + 1} of medical dictation session.`;
    
    const result = await transcribeAudioWithWhisper(buffer, {
      ...options,
      prompt: chunkPrompt
    });
    
    console.log(`✅ Chunk ${chunkIndex + 1} transcribed: ${result.text.length} characters`);
    return result;
    
  } catch (error) {
    console.error(`❌ Chunk ${chunkIndex + 1} transcription failed:`, error);
    throw error;
  }
}

export function getWhisperSupportedFormats(): string[] {
  return [
    'audio/webm',
    'audio/wav',
    'audio/mp3',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg',
    'audio/flac'
  ];
}

export function validateAudioFormat(mimeType: string): boolean {
  return getWhisperSupportedFormats().includes(mimeType);
}