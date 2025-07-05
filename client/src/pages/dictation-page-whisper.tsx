import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import {
  Mic,
  MicOff,
  ArrowLeft,
  Copy,
  Trash2,
  Save,
  Edit,
  Clock,
  Pause,
  Play,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface DictationPageProps {
  language: "fr" | "en";
}

const translations = {
  fr: {
    title: "Dictée Vocale Whisper",
    selectSection: "Sélectionner une section",
    liveTranscript: "Statut de Traitement",
    finalText: "Texte Final",
    startRecording: "Commencer l'enregistrement",
    stopRecording: "Arrêter l'enregistrement",
    pauseRecording: "Pause",
    resumeRecording: "Reprendre",
    copyText: "Copier le texte",
    clearText: "Effacer le texte",
    saveToSection: "Sauvegarder dans la section",
    backToForm: "Retour au formulaire",
    editText: "Modifier le texte",
    recordingTime: "Durée d'enregistrement",
    chunks: "Segments",
    processing: "Traitement en cours...",
    accuracy: "Précision",
    whisperPowered: "Alimenté par Whisper AI",
    chunkProgress: "Progression des segments",
    sessionStats: "Statistiques de session",
    ready: "Prêt",
    recording: "Enregistrement...",
    processingAudio: "Traitement audio..."
  },
  en: {
    title: "Whisper Voice Dictation",
    selectSection: "Select section",
    liveTranscript: "Processing Status",
    finalText: "Final Text",
    startRecording: "Start recording",
    stopRecording: "Stop recording",
    pauseRecording: "Pause",
    resumeRecording: "Resume",
    copyText: "Copy text",
    clearText: "Clear text",
    saveToSection: "Save to section",
    backToForm: "Back to form",
    editText: "Edit text",
    recordingTime: "Recording time",
    chunks: "Chunks",
    processing: "Processing...",
    accuracy: "Accuracy",
    whisperPowered: "Powered by Whisper AI",
    chunkProgress: "Chunk Progress",
    sessionStats: "Session Stats",
    ready: "Ready",
    recording: "Recording...",
    processingAudio: "Processing audio..."
  },
};

const sectionOptions = [
  { value: "section7", labelFr: "Section 7: Historique de faits et évolution", labelEn: "Section 7: History of facts and evolution" },
  { value: "section8", labelFr: "Section 8: Examen", labelEn: "Section 8: Examination" },
  { value: "section11", labelFr: "Section 11: Conclusion", labelEn: "Section 11: Conclusion" },
];

const CHUNK_DURATION = 4 * 60; // 4 minutes in seconds
const WARNING_DURATION = 20 * 60; // 20 minutes warning

export default function DictationPageWhisper({ language: propLanguage }: DictationPageProps) {
  const [, setLocation] = useLocation();
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [editableText, setEditableText] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<"fr" | "en">(propLanguage);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const { toast } = useToast();
  const t = translations[currentLanguage];

  // Audio recorder hook with Whisper integration
  const {
    isRecording,
    isProcessing,
    transcript,
    chunks,
    recordingDuration,
    chunkCount,
    currentChunkIndex,
    error,
    isSupported,
    startRecording,
    stopRecording,
    reset,
    formatDuration,
    getProgress
  } = useAudioRecorder({
    language: currentLanguage === "fr" ? "fr" : "en",
    chunkDuration: CHUNK_DURATION,
    enhanceText: true,
  });

  // Initialize component
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Update editable text when transcript changes
  useEffect(() => {
    if (transcript && !isProcessing) {
      setEditableText(transcript);
    }
  }, [transcript, isProcessing]);

  // Session warnings
  useEffect(() => {
    if (recordingDuration === WARNING_DURATION) {
      toast({
        title: currentLanguage === "fr" ? "Session longue" : "Long session",
        description: currentLanguage === "fr" 
          ? "Session de 20 minutes détectée. Le traitement par segments continue normalement."
          : "20-minute session detected. Chunk processing continues normally.",
        variant: "default",
      });
    }
  }, [recordingDuration, currentLanguage, toast]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast({
        title: currentLanguage === "fr" ? "Erreur" : "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, currentLanguage, toast]);

  const handleStartRecording = () => {
    if (!selectedSection) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une section avant de commencer",
        variant: "destructive",
      });
      return;
    }

    setEditableText("");
    startRecording();
    
    toast({
      title: currentLanguage === "fr" ? "Enregistrement démarré" : "Recording started",
      description: currentLanguage === "fr" 
        ? "Dictée Whisper activée avec précision de 95%"
        : "Whisper dictation activated with 95% accuracy",
      variant: "default",
    });
  };

  const handleStopRecording = () => {
    stopRecording();
    
    toast({
      title: currentLanguage === "fr" ? "Enregistrement arrêté" : "Recording stopped",
      description: currentLanguage === "fr" 
        ? "Traitement des segments audio en cours..."
        : "Processing audio chunks...",
      variant: "default",
    });
  };

  const handleCopyText = async () => {
    if (editableText) {
      try {
        await navigator.clipboard.writeText(editableText);
        toast({
          title: currentLanguage === "fr" ? "Copié" : "Copied",
          description: currentLanguage === "fr" ? "Texte copié dans le presse-papiers" : "Text copied to clipboard",
          variant: "default",
        });
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
  };

  const handleSaveToSection = () => {
    if (!editableText.trim()) {
      toast({
        title: currentLanguage === "fr" ? "Aucun texte" : "No text",
        description: currentLanguage === "fr" ? "Aucun texte à sauvegarder" : "No text to save",
        variant: "destructive",
      });
      return;
    }

    // Save to sessionStorage for the medical form
    const key = `dictation_${selectedSection}`;
    sessionStorage.setItem(key, editableText.trim());
    
    toast({
      title: currentLanguage === "fr" ? "Sauvegardé" : "Saved",
      description: currentLanguage === "fr" 
        ? `Texte sauvegardé pour ${selectedSection}`
        : `Text saved for ${selectedSection}`,
      variant: "default",
    });

    // Navigate back to form
    setLocation("/forms/cnesst-medical");
  };

  const handleClearText = () => {
    setEditableText("");
    reset();
    
    toast({
      title: currentLanguage === "fr" ? "Effacé" : "Cleared",
      description: currentLanguage === "fr" ? "Texte et session effacés" : "Text and session cleared",
      variant: "default",
    });
  };

  const getStatusText = () => {
    if (isProcessing) {
      if (currentChunkIndex > 0) {
        return `${t.processing} (${currentChunkIndex}/${chunkCount})`;
      }
      return t.processingAudio;
    }
    if (isRecording) {
      return t.recording;
    }
    return t.ready;
  };

  const getStatusIcon = () => {
    if (isProcessing) return <AlertCircle className="h-4 w-4 text-orange-500" />;
    if (isRecording) return <Mic className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{currentLanguage === "fr" ? "Initialisation..." : "Initializing..."}</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">
              {currentLanguage === "fr" ? "Non supporté" : "Not Supported"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {currentLanguage === "fr" 
                ? "L'enregistrement audio n'est pas supporté par votre navigateur."
                : "Audio recording is not supported in your browser."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/forms/cnesst-medical")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToForm}
        </Button>
        
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {t.whisperPowered}
          </Badge>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/forms/cnesst-medical")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentLanguage === "fr" ? "Retour à la section" : "Return to section"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Section Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.selectSection}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectSection} />
                </SelectTrigger>
                <SelectContent>
                  {sectionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {currentLanguage === "fr" ? option.labelFr : option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                {getStatusText()}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{t.accuracy}: 95%</span>
                <span>{t.recordingTime}: {formatDuration(recordingDuration)}</span>
                {chunkCount > 0 && <span>{t.chunks}: {chunkCount}</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recording Button */}
              <div className="flex gap-2">
                {!isRecording ? (
                  <Button
                    onClick={handleStartRecording}
                    disabled={!selectedSection || isProcessing}
                    className="flex-1"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {t.startRecording}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopRecording}
                    variant="destructive"
                    className="flex-1"
                  >
                    <MicOff className="h-4 w-4 mr-2" />
                    {t.stopRecording}
                  </Button>
                )}
              </div>

              {/* Processing Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t.chunkProgress}</span>
                    <span>{currentChunkIndex}/{chunkCount}</span>
                  </div>
                  <Progress value={getProgress()} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Stats */}
          {(isRecording || recordingDuration > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.sessionStats}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t.recordingTime}</div>
                    <div className="font-mono">{formatDuration(recordingDuration)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t.chunks}</div>
                    <div className="font-mono">{chunkCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Text Area */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t.finalText}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                    disabled={!editableText}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t.copyText}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearText}
                    disabled={!editableText && !isRecording}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t.clearText}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                placeholder={
                  currentLanguage === "fr"
                    ? "Le texte transcrit apparaîtra ici après traitement..."
                    : "Transcribed text will appear here after processing..."
                }
                className="min-h-[400px] resize-none font-mono text-sm"
                disabled={isProcessing}
              />
              
              {editableText && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleSaveToSection}
                    disabled={!editableText.trim() || !selectedSection}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {t.saveToSection}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}