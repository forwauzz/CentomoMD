import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useLocation } from "wouter";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useToast } from "@/hooks/use-toast";

interface FloatingRecordButtonProps {
  language: 'fr' | 'en';
  onDirectDictation?: (text: string, fieldName: string) => void;
}

export function FloatingRecordButton({ language, onDirectDictation }: FloatingRecordButtonProps) {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [activeField, setActiveField] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition({
    language: language === 'fr' ? 'fr-CA' : 'en-US',
    continuous: true,
    interimResults: true,
  });

  // Track focused input fields
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const fieldName = target.getAttribute('name') || target.getAttribute('data-field-name');
        if (fieldName) {
          setActiveField(fieldName);
        }
      }
    };

    const handleBlur = () => {
      // Keep a small delay to prevent immediate field loss when clicking record button
      setTimeout(() => setActiveField(null), 100);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Handle transcript updates during listening - improved to capture all transcripts
  useEffect(() => {
    if (transcript && activeField && onDirectDictation) {
      console.log('Floating button captured transcript:', transcript);
      onDirectDictation(transcript, activeField);
      // Clear transcript after processing to prevent duplication
      resetTranscript();
    }
  }, [transcript, activeField, onDirectDictation, resetTranscript]);

  // Hide button when scrolling (optional UX improvement)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsVisible(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsVisible(true), 150);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleClick = () => {
    if (!isSupported) {
      toast({
        title: "Erreur",
        description: language === 'fr' 
          ? "La reconnaissance vocale n'est pas supportée par votre navigateur."
          : "Speech recognition is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }

    // If we're in a text field, do direct dictation
    if (activeField && onDirectDictation) {
      if (isListening) {
        stopListening();
      } else {
        resetTranscript();
        startListening();
      }
    } else {
      // Navigate to dedicated dictation page with proper language persistence
      if (activeField) {
        sessionStorage.setItem('activeField', activeField);
      }
      // Always store current language for persistence
      sessionStorage.setItem('dictationLanguage', language);
      console.log('Navigating to dictation page with language:', language);
      setLocation('/dictation');
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-75'
      }`}
    >
      <Button
        onClick={handleClick}
        className={`w-16 h-16 rounded-full shadow-lg transition-all duration-200 ${
          isListening 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : activeField
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
        size="lg"
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </Button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
        <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isListening 
            ? (language === 'fr' ? "Arrêter l'enregistrement" : "Stop recording")
            : activeField
            ? (language === 'fr' ? "Dicter dans ce champ" : "Dictate to this field")
            : (language === 'fr' ? "Ouvrir la dictée" : "Open dictation")
          }
        </div>
      </div>
    </div>
  );
}