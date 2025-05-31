import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, MicOff, X } from "lucide-react";

interface DictationModalProps {
  open: boolean;
  onClose: () => void;
  isListening: boolean;
  onStartDictation: () => void;
  onStopDictation: () => void;
  error?: string | null;
  language?: 'fr' | 'en';
}

export function DictationModal({
  open,
  onClose,
  isListening,
  onStartDictation,
  onStopDictation,
  error,
  language = 'fr'
}: DictationModalProps) {
  const translations = {
    fr: {
      title: "Dictée vocale",
      listening: "En écoute... Parlez maintenant",
      clickToStart: "Cliquez pour commencer la dictée",
      stop: "Arrêter",
      start: "Commencer",
      close: "Fermer"
    },
    en: {
      title: "Voice Dictation",
      listening: "Listening... Speak now",
      clickToStart: "Click to start dictation",
      stop: "Stop",
      start: "Start",
      close: "Close"
    }
  };

  const t = translations[language];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <div 
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isListening 
                ? 'bg-red-500 animate-pulse' 
                : 'bg-blue-600'
            }`}
          >
            <Mic className="w-8 h-8 text-white" />
          </div>
          
          <p className="text-center text-gray-600">
            {isListening ? t.listening : t.clickToStart}
          </p>
          
          {error && (
            <p className="text-center text-red-500 text-sm">{error}</p>
          )}
          
          <div className="flex gap-3">
            {isListening ? (
              <Button 
                onClick={onStopDictation}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <MicOff className="w-4 h-4" />
                {t.stop}
              </Button>
            ) : (
              <Button 
                onClick={onStartDictation}
                className="flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                {t.start}
              </Button>
            )}
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
