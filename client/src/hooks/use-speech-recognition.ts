import { useState, useCallback, useRef } from 'react';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  const startListening = useCallback((onResult?: (transcript: string) => void) => {
    if (!isSupported) {
      setError('Speech recognition is not supported by your browser.');
      return;
    }

    // Stop any existing recognition first
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const recognition = new window.webkitSpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.language ?? 'fr-FR';
    recognition.maxAlternatives = 1;
    
    // Enhanced settings for better continuous speech recognition
    // Note: grammars setting removed due to browser compatibility

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      console.log('Speech recognition started with language:', options.language);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      
      // Process all results from the current recognition session
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      
      // Always show interim results for live feedback
      if (interim.trim()) {
        setInterimTranscript(interim);
        console.log('Live transcript received:', interim);
      }
      
      // Accumulate final results immediately
      if (finalTranscript.trim()) {
        const newTranscript = finalTranscript.trim();
        setTranscript(prev => {
          const updated = prev + (prev ? ' ' : '') + newTranscript;
          console.log('Final transcript captured:', newTranscript);
          console.log('Total accumulated transcript:', updated);
          return updated;
        });
        onResult?.(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      const errorMessage = options.language?.startsWith('fr') 
        ? `Erreur de reconnaissance vocale: ${event.error}`
        : `Speech recognition error: ${event.error}`;
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended, should restart:', isListeningRef.current);
      // Only restart if we're still supposed to be listening (not manually stopped)
      if (isListeningRef.current && recognitionRef.current) {
        console.log('Auto-restarting speech recognition for continuous listening');
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.start();
  }, [isSupported, options]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
