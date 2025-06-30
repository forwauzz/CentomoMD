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
    recognition.lang = options.language ?? 'fr-CA';
    recognition.maxAlternatives = 3;
    
    // Enhanced settings for better French medical dictation
    // Note: For Canadian French, fr-CA provides better medical terminology recognition
    console.log('Initializing speech recognition with language:', options.language);

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
      
      // Always update interim results for live feedback (even if empty to clear previous)
      setInterimTranscript(interim);
      if (interim.trim()) {
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
      
      // Provide more detailed French error messages for better user experience
      let errorMessage = '';
      if (options.language?.startsWith('fr')) {
        switch (event.error) {
          case 'network':
            errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
            break;
          case 'not-allowed':
            errorMessage = 'Accès au microphone refusé. Veuillez autoriser l\'accès au microphone.';
            break;
          case 'no-speech':
            errorMessage = 'Aucune parole détectée. Parlez plus fort ou rapprochez-vous du microphone.';
            break;
          case 'audio-capture':
            errorMessage = 'Erreur de capture audio. Vérifiez votre microphone.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Service de reconnaissance vocale non autorisé.';
            break;
          default:
            errorMessage = `Erreur de reconnaissance vocale: ${event.error}`;
        }
      } else {
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Speak louder or move closer to the microphone.';
            break;
          case 'audio-capture':
            errorMessage = 'Audio capture error. Please check your microphone.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
      }
      
      setError(errorMessage);
      setIsListening(false);
      isListeningRef.current = false;
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
    
    // Before stopping, capture any remaining interim transcript as final
    if (recognitionRef.current) {
      // Process any remaining interim transcript as final text
      const currentInterim = interimTranscript;
      if (currentInterim.trim()) {
        console.log('Converting remaining interim to final transcript:', currentInterim);
        setTranscript(prev => {
          const updated = prev + (prev ? ' ' : '') + currentInterim.trim();
          console.log('Final transcript from interim:', updated);
          return updated;
        });
        setInterimTranscript(''); // Clear interim after converting to final
      }
      
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [interimTranscript]);

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
