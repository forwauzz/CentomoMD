/**
 * Unified Transcription Modes System
 * TGV-Compliant zero-retention transcription with mode selection
 */

export type TranscriptionMode = 'smart' | 'word-for-word' | 'transcribe';

export interface TranscriptionModeConfig {
  id: TranscriptionMode;
  name: string;
  description: string;
  icon: string;
  settings: {
    // Whisper API configuration
    temperature: number;
    responseFormat: 'json' | 'verbose_json' | 'text';
    
    // Processing configuration
    enhanceText: boolean;
    realTimeDisplay: boolean;
    wordLevelTimestamps: boolean;
    confidenceScoring: boolean;
    
    // Session configuration
    continuousListening: boolean;
    speakerIdentification: boolean;
    chunkDuration: number; // in seconds
    maxSessionDuration: number; // in seconds
    
    // Quebec/TGV specific
    quebecFrenchOptimization: boolean;
    medicalTerminologyPrompt: boolean;
    complianceLogging: boolean;
  };
}

export interface TranscriptionSession {
  sessionId: string;
  userId: string;
  mode: TranscriptionMode;
  startTime: Date;
  endTime?: Date;
  language: 'fr' | 'en' | 'auto';
  
  // Session state (memory only - zero retention)
  totalChunks: number;
  processedChunks: number;
  totalDuration: number;
  
  // Speakers (for transcribe mode)
  speakers?: Array<{
    id: string;
    label: 'doctor' | 'patient' | 'unknown';
    confidence: number;
  }>;
  
  // Compliance tracking (no patient data)
  complianceChecks: {
    zeroRetentionValidated: boolean;
    memoryCleanupScheduled: boolean;
    auditLogCreated: boolean;
  };
}

export interface WordLevelTranscription {
  word: string;
  start: number; // timestamp in seconds
  end: number;
  confidence: number;
  speaker?: string; // for transcribe mode
}

export interface EnhancedTranscriptionResult {
  // Core transcription
  text: string;
  mode: TranscriptionMode;
  sessionId: string;
  
  // Timing and quality
  duration: number;
  confidence: number;
  language: string;
  
  // Word-level data (for word-for-word mode)
  words?: WordLevelTranscription[];
  
  // Speaker data (for transcribe mode)
  speakers?: Array<{
    speaker: string;
    text: string;
    timestamp: number;
    confidence: number;
  }>;
  
  // Enhancement data (for smart mode)
  enhanced?: {
    originalText: string;
    enhancedText: string;
    corrections: Array<{
      original: string;
      corrected: string;
      reason: string;
      medicalTerminology: boolean;
    }>;
  };
  
  // Real-time processing data
  realTime?: {
    webSpeechText: string; // Instant display
    whisperText: string; // Accuracy verification
    discrepancies: Array<{
      position: number;
      webSpeech: string;
      whisper: string;
    }>;
  };
  
  // Compliance validation
  compliance: {
    zeroRetentionConfirmed: boolean;
    memoryCleanupScheduled: boolean;
    processingTime: number;
    auditTrail: string; // Non-sensitive audit data only
  };
}

export const TRANSCRIPTION_MODE_CONFIGS: Record<TranscriptionMode, TranscriptionModeConfig> = {
  smart: {
    id: 'smart',
    name: 'Smart Dictation',
    description: 'AI-enhanced with medical formatting',
    icon: 'Brain',
    settings: {
      temperature: 0.2,
      responseFormat: 'verbose_json',
      enhanceText: true,
      realTimeDisplay: true,
      wordLevelTimestamps: false,
      confidenceScoring: false,
      continuousListening: false,
      speakerIdentification: false,
      chunkDuration: 240, // 4 minutes
      maxSessionDuration: 1800, // 30 minutes
      quebecFrenchOptimization: true,
      medicalTerminologyPrompt: true,
      complianceLogging: true,
    },
  },
  
  'word-for-word': {
    id: 'word-for-word',
    name: 'Word-for-Word',
    description: 'Verbatim transcription, no AI changes',
    icon: 'Type',
    settings: {
      temperature: 0.0, // Maximum precision
      responseFormat: 'verbose_json',
      enhanceText: false,
      realTimeDisplay: true,
      wordLevelTimestamps: true,
      confidenceScoring: true,
      continuousListening: false,
      speakerIdentification: false,
      chunkDuration: 120, // 2 minutes for better accuracy
      maxSessionDuration: 1200, // 20 minutes
      quebecFrenchOptimization: true,
      medicalTerminologyPrompt: false, // No AI prompting
      complianceLogging: true,
    },
  },
  
  transcribe: {
    id: 'transcribe',
    name: 'Transcribe',
    description: 'Continuous ambient listening',
    icon: 'Mic',
    settings: {
      temperature: 0.1,
      responseFormat: 'verbose_json',
      enhanceText: false, // Preserve conversation flow
      realTimeDisplay: true,
      wordLevelTimestamps: true,
      confidenceScoring: true,
      continuousListening: true,
      speakerIdentification: true,
      chunkDuration: 30, // 30 seconds with overlap
      maxSessionDuration: 3600, // 60 minutes
      quebecFrenchOptimization: true,
      medicalTerminologyPrompt: true,
      complianceLogging: true,
    },
  },
};

// Quebec French medical prompt optimization
export const QUEBEC_MEDICAL_PROMPTS = {
  fr: 'Contexte médical québécois CNESST: travailleur, travailleuse, docteur, physiothérapie, IRM, EMG, supra-épineux, cortisone, infiltration cortisonée, RAMQ, CMQ, consolidation, limitations fonctionnelles.',
  en: 'Quebec medical CNESST context: worker, patient, doctor, physiotherapy, MRI, EMG, supraspinatus, cortisone, steroid injection, RAMQ, CMQ, consolidation, functional limitations.',
};

// Voice activity detection thresholds for different modes
export const VAD_THRESHOLDS = {
  smart: 0.3, // Standard sensitivity
  'word-for-word': 0.2, // Higher sensitivity for precision
  transcribe: 0.4, // Lower sensitivity to avoid background noise
};

// Zero-retention compliance validation
export interface ComplianceValidation {
  dataRetentionCheck: boolean;
  memoryCleanupScheduled: boolean;
  auditLogGenerated: boolean;
  processingTimeLogged: boolean;
  sessionDataPurged: boolean;
}