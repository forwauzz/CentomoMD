import OpenAI from 'openai';
import { enhanceVoiceInput } from './ai-formatter';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface WhisperTranscriptionResult {
  text: string;
  confidence?: number;
  duration?: number;
  language?: string;
  enhanced?: {
    text: string;
    corrections: Array<{ original: string; corrected: string; reason: string }>;
  };
}

export interface WhisperTranscriptionOptions {
  language?: 'fr' | 'en' | 'auto';
  enhanceText?: boolean;
  prompt?: string;
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
    
    // Create a File-like object for the API
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    
    // Set up transcription parameters
    const transcriptionParams: any = {
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json', // Get detailed response with timestamps
    };
    
    // Set language if specified
    if (options.language && options.language !== 'auto') {
      transcriptionParams.language = options.language === 'fr' ? 'fr' : 'en';
    }
    
    // Add medical context prompt for better accuracy
    if (options.prompt) {
      transcriptionParams.prompt = options.prompt;
    } else {
      // Default medical context prompt
      const medicalPrompt = options.language === 'fr' || options.language === 'auto' ? 
        'Contexte médical québécois: travailleur, travailleuse, docteur, physiothérapie, IRM, EMG, supra-épineux, cortisone, infiltration cortisonée.' :
        'Medical context: worker, patient, doctor, physiotherapy, MRI, EMG, supraspinatus, cortisone, steroid injection.';
      transcriptionParams.prompt = medicalPrompt;
    }
    
    console.log('📤 Sending audio to Whisper API...');
    const transcription = await openai.audio.transcriptions.create(transcriptionParams);
    
    console.log('✅ Whisper transcription received:', transcription.text.substring(0, 100) + '...');
    
    let result: WhisperTranscriptionResult = {
      text: transcription.text,
      duration: (transcription as any).duration,
      language: (transcription as any).language,
    };
    
    // Apply medical text enhancement if requested
    if (options.enhanceText) {
      console.log('🔧 Enhancing medical terminology...');
      const enhanced = enhanceVoiceInput(transcription.text);
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