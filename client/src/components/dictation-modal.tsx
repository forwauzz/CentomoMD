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
}

export function DictationModal({
  open,
  onClose,
  isListening,
  onStartDictation,
  onStopDictation,
  error
}: DictationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dictée vocale</DialogTitle>
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
            {isListening ? "En écoute... Parlez maintenant" : "Cliquez pour commencer la dictée"}
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
                Arrêter
              </Button>
            ) : (
              <Button 
                onClick={onStartDictation}
                className="flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                Commencer
              </Button>
            )}
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
