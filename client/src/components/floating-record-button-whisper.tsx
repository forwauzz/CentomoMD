import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface FloatingRecordButtonProps {
  language: 'fr' | 'en';
  onDirectDictation?: (text: string, fieldName: string) => void;
}

export function FloatingRecordButtonWhisper({ language, onDirectDictation }: FloatingRecordButtonProps) {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [activeField, setActiveField] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    isRecording,
    isProcessing,
    transcript,
    recordingDuration,
    error,
    isSupported,
    startRecording,
    stopRecording,
    reset,
    formatDuration
  } = useAudioRecorder({
    language,
    chunkDuration: 2 * 60, // Shorter chunks for field dictation (2 minutes)
    enhanceText: true,
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

  // Handle transcript completion
  useEffect(() => {
    if (transcript && !isProcessing && !isRecording && activeField && onDirectDictation) {
      console.log(`📝 Inserting transcribed text into field: ${activeField}`);
      onDirectDictation(transcript, activeField);
      
      toast({
        title: language === 'fr' ? "Transcription complétée" : "Transcription completed",
        description: language === 'fr' 
          ? `Texte inséré dans ${activeField} (${transcript.length} caractères)`
          : `Text inserted into ${activeField} (${transcript.length} characters)`,
        variant: "default",
      });
      
      // Reset after successful insertion
      setTimeout(() => {
        reset();
      }, 1000);
    }
  }, [transcript, isProcessing, isRecording, activeField, onDirectDictation, language, toast, reset]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast({
        title: language === 'fr' ? "Erreur de dictée" : "Dictation error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, language, toast]);

  const handleRecordClick = () => {
    if (!isSupported) {
      toast({
        title: language === 'fr' ? "Non supporté" : "Not supported",
        description: language === 'fr' 
          ? "L'enregistrement audio n'est pas supporté"
          : "Audio recording is not supported",
        variant: "destructive",
      });
      return;
    }

    if (!activeField) {
      // No field selected, go to full dictation page
      setLocation('/dictation');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      reset(); // Clear any previous transcript
      startRecording();
      
      toast({
        title: language === 'fr' ? "Dictée démarrée" : "Dictation started",
        description: language === 'fr' 
          ? `Enregistrement pour ${activeField}`
          : `Recording for ${activeField}`,
        variant: "default",
      });
    }
  };

  const getButtonText = () => {
    if (isProcessing) {
      return language === 'fr' ? "Traitement..." : "Processing...";
    }
    if (isRecording) {
      return language === 'fr' ? "Arrêter" : "Stop";
    }
    if (activeField) {
      return language === 'fr' ? "Dicter" : "Dictate";
    }
    return language === 'fr' ? "Dictée" : "Dictation";
  };

  const getStatusBadge = () => {
    if (isProcessing) {
      return (
        <Badge variant="secondary" className="ml-2">
          <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full mr-1" />
          {language === 'fr' ? "Traitement" : "Processing"}
        </Badge>
      );
    }
    if (isRecording) {
      return (
        <Badge variant="destructive" className="ml-2">
          <div className="w-2 h-2 bg-current rounded-full animate-pulse mr-1" />
          {formatDuration(recordingDuration)}
        </Badge>
      );
    }
    if (activeField) {
      return (
        <Badge variant="outline" className="ml-2 text-xs">
          {activeField}
        </Badge>
      );
    }
    return null;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Status badge */}
      {getStatusBadge()}
      
      {/* Main button */}
      <Button
        onClick={handleRecordClick}
        disabled={isProcessing}
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isRecording ? (
          <MicOff className="h-5 w-5 mr-2" />
        ) : activeField ? (
          <Mic className="h-5 w-5 mr-2" />
        ) : (
          <ArrowRight className="h-5 w-5 mr-2" />
        )}
        {getButtonText()}
      </Button>

      {/* Toggle visibility button */}
      <Button
        onClick={() => setIsVisible(false)}
        variant="ghost"
        size="sm"
        className="text-xs opacity-50 hover:opacity-100"
      >
        ×
      </Button>

      {/* Show button to restore visibility when hidden */}
      {!isVisible && (
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="fixed bottom-6 right-6 z-50"
        >
          <Mic className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}