import { useState, useCallback, useEffect } from 'react';
import { TranscriptionMode, TRANSCRIPTION_MODE_CONFIGS } from '@shared/transcription-types';

// Storage key for mode persistence
const TRANSCRIPTION_MODE_KEY = 'centomomd_transcription_mode';

interface TranscriptionModeHook {
  currentMode: TranscriptionMode;
  setMode: (mode: TranscriptionMode) => void;
  modeConfig: typeof TRANSCRIPTION_MODE_CONFIGS[TranscriptionMode];
  isSupported: (mode: TranscriptionMode) => boolean;
  getAllModes: () => TranscriptionMode[];
  resetToDefault: () => void;
}

export function useTranscriptionMode(defaultMode: TranscriptionMode = 'smart'): TranscriptionModeHook {
  // Initialize mode from localStorage or default
  const [currentMode, setCurrentMode] = useState<TranscriptionMode>(() => {
    try {
      const stored = localStorage.getItem(TRANSCRIPTION_MODE_KEY);
      if (stored && (stored === 'smart' || stored === 'word-for-word' || stored === 'transcribe')) {
        return stored as TranscriptionMode;
      }
    } catch (error) {
      console.warn('Failed to load transcription mode from localStorage:', error);
    }
    return defaultMode;
  });

  // Get configuration for current mode
  const modeConfig = TRANSCRIPTION_MODE_CONFIGS[currentMode];

  // Set mode with persistence and validation
  const setMode = useCallback((mode: TranscriptionMode) => {
    if (!TRANSCRIPTION_MODE_CONFIGS[mode]) {
      console.error(`Invalid transcription mode: ${mode}`);
      return;
    }

    setCurrentMode(mode);
    
    try {
      localStorage.setItem(TRANSCRIPTION_MODE_KEY, mode);
      console.log(`🎛️ Transcription mode changed to: ${mode}`);
    } catch (error) {
      console.warn('Failed to save transcription mode to localStorage:', error);
    }
  }, []);

  // Check if a mode is supported in current environment
  const isSupported = useCallback((mode: TranscriptionMode): boolean => {
    const config = TRANSCRIPTION_MODE_CONFIGS[mode];
    if (!config) return false;

    // Check browser capabilities
    if (config.settings.realTimeDisplay && !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return false;
    }

    // Check for continuous listening support
    if (config.settings.continuousListening && !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    return true;
  }, []);

  // Get all available modes
  const getAllModes = useCallback((): TranscriptionMode[] => {
    return Object.keys(TRANSCRIPTION_MODE_CONFIGS) as TranscriptionMode[];
  }, []);

  // Reset to default mode
  const resetToDefault = useCallback(() => {
    setMode(defaultMode);
  }, [defaultMode, setMode]);

  // Validate current mode on mount
  useEffect(() => {
    if (!isSupported(currentMode)) {
      console.warn(`Current transcription mode ${currentMode} is not supported, falling back to smart mode`);
      setMode('smart');
    }
  }, [currentMode, isSupported, setMode]);

  return {
    currentMode,
    setMode,
    modeConfig,
    isSupported,
    getAllModes,
    resetToDefault,
  };
}

// Legacy compatibility hook for existing components
export function useTranscriptionModeCompatibility() {
  const { currentMode, setMode, modeConfig } = useTranscriptionMode();
  
  // Convert new mode configurations to legacy format
  const getLegacyOptions = useCallback(() => {
    return {
      enhanceText: modeConfig.settings.enhanceText,
      temperature: modeConfig.settings.temperature,
      chunkDuration: modeConfig.settings.chunkDuration,
      quebecOptimized: modeConfig.settings.quebecFrenchOptimization,
      realTimeDisplay: modeConfig.settings.realTimeDisplay,
    };
  }, [modeConfig]);

  return {
    currentMode,
    setMode,
    modeConfig,
    legacyOptions: getLegacyOptions(),
  };
}