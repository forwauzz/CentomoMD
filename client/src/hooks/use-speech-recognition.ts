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

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Speech recognition started with language:', options.language);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      
      // Process all results
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      
      // Update interim transcript for live display
      setInterimTranscript(interim);
      
      // Update final transcript and trigger callback when we have final results
      if (finalTranscript.trim()) {
        setTranscript(prev => prev + finalTranscript);
        onResult?.(finalTranscript);
        console.log('Final transcript captured:', finalTranscript);
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
      setIsListening(false);
    };

    recognition.start();
  }, [isSupported, options]);

  const stopListening = useCallback(() => {
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
