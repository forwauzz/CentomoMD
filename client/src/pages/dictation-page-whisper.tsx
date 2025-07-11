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
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { processTranscriptWithCommands } from "@/utils/medical-context";
import { testVoiceCommands } from "@/utils/voice-commands";
import { VoiceCommandsManager } from "@/components/voice-commands-manager";
import { VerbatimCommandsManager } from "@/components/verbatim-commands-manager";
import { Badge } from "@/components/ui/badge";
import { SoundBar } from "@/components/ui/sound-bar";

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
    verbatimSections: "Sections Verbatim",
    verbatimActive: "Mode Verbatim Actif",
    verbatimCount: "sections",
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
    verbatimSections: "Verbatim Sections",
    verbatimActive: "Verbatim Mode Active",
    verbatimCount: "sections",
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
  const [returnToSection, setReturnToSection] = useState<string | null>(null);
  const [verbatimSections, setVerbatimSections] = useState<string[]>([]);
  const [hasVerbatim, setHasVerbatim] = useState<boolean>(false);
  const [customVerbatimUsed, setCustomVerbatimUsed] = useState<boolean>(false);
  const [verbatimTriggers, setVerbatimTriggers] = useState<string[]>([]);

  const { toast } = useToast();
  const t = translations[currentLanguage];

  // Audio recorder hook with Whisper integration
  const {
    isRecording,
    isPaused,
    isProcessing,
    transcript,
    chunks,
    recordingDuration,
    chunkCount,
    currentChunkIndex,
    error,
    isSupported,
    audioLevel,
    isListening,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    formatDuration,
    getProgress,
    getStorageUsage,
    getStorageWarning,
    failedChunks,
    retryCount,
    retryFailedChunks,
    hasFailedChunks
  } = useAudioRecorder({
    language: currentLanguage === "fr" ? "fr" : "en",
    chunkDuration: CHUNK_DURATION,
    enhanceText: true,
  });

  // Initialize component and check for return section
  useEffect(() => {
    // Check URL parameters for return section
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    // Check sessionStorage for return section
    const savedSection = sessionStorage.getItem('dictation_return_section');
    
    if (section) {
      setReturnToSection(section);
      setSelectedSection(section);
    } else if (savedSection) {
      setReturnToSection(savedSection);
      setSelectedSection(savedSection);
    }
    
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Update editable text when transcript changes - with voice commands and medical enhancement
  useEffect(() => {
    if (transcript && !isProcessing) {
      try {
        // Process transcript with voice commands and medical enhancement
        const result = processTranscriptWithCommands(transcript, currentLanguage);
        setEditableText(result.finalText);
        
        // Update verbatim state
        setVerbatimSections(result.verbatimSections || []);
        setHasVerbatim(result.hasVerbatim || false);
        setCustomVerbatimUsed(result.customVerbatimUsed || false);
        setVerbatimTriggers(result.verbatimTriggers || []);
        
        // Show feedback if commands were used
        if (result.commandsUsed.length > 0) {
          const commandTypes = result.commandsUsed.includes('verbatim') 
            ? (currentLanguage === "fr" ? "Commandes vocales et verbatim appliquées" : "Voice commands and verbatim applied")
            : (currentLanguage === "fr" ? "Commandes vocales appliquées" : "Voice commands applied");
            
          toast({
            title: commandTypes,
            description: currentLanguage === "fr" 
              ? `${result.commandsUsed.length} commande(s) traitée(s): ${result.commandsUsed.join(', ')}`
              : `${result.commandsUsed.length} command(s) processed: ${result.commandsUsed.join(', ')}`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Error processing transcript with commands:', error);
        // Fallback to original transcript if processing fails
        setEditableText(transcript);
      }
    }
  }, [transcript, isProcessing, currentLanguage, toast]);

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

  const handleSaveToSection = async () => {
    if (!editableText.trim()) {
      toast({
        title: currentLanguage === "fr" ? "Aucun texte" : "No text",
        description: currentLanguage === "fr" ? "Aucun texte à sauvegarder" : "No text to save",
        variant: "destructive",
      });
      return;
    }

    // Map section to field name for consistent storage
    const sectionToFieldMap: { [key: string]: string } = {
      'section7': 'historiqueEvolution',
      'section8': 'section8Input',
      'section11': 'conclusionResume'
    };

    const fieldName = sectionToFieldMap[selectedSection] || selectedSection;
    let finalText = editableText.trim();
    
    // Handle Section 8 special case - distribute to subfields
    if (selectedSection === 'section8') {
      try {
        toast({
          title: currentLanguage === "fr" ? "Distribution Section 8" : "Distributing Section 8",
          description: currentLanguage === "fr" 
            ? "Distribution du texte vers les sous-sections..."
            : "Distributing text to subsections...",
          variant: "default",
        });

        // Call the AI distribution API
        const response = await fetch('/api/ai/distribute-section8', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: finalText,
            language: currentLanguage
          }),
        });

        if (response.ok) {
          const distributedData = await response.json();
          
          // Store distributed content for each subfield
          if (distributedData.appreciation) {
            sessionStorage.setItem('dictationResult_appreciationEvolution', distributedData.appreciation);
            sessionStorage.setItem('dictationField_appreciationEvolution', 'appreciationEvolution');
          }
          if (distributedData.plaintes) {
            sessionStorage.setItem('dictationResult_plaintesproblemes', distributedData.plaintes);
            sessionStorage.setItem('dictationField_plaintesproblemes', 'plaintesproblemes');
          }
          if (distributedData.impact) {
            sessionStorage.setItem('dictationResult_impactAvq', distributedData.impact);
            sessionStorage.setItem('dictationField_impactAvq', 'impactAvq');
          }
          
          // Set marker for Section 8 distribution
          sessionStorage.setItem('section8_distributed', 'true');
          
          toast({
            title: currentLanguage === "fr" ? "Distribution réussie" : "Distribution successful",
            description: currentLanguage === "fr" 
              ? "Texte distribué vers les sous-sections de Section 8"
              : "Text distributed to Section 8 subsections",
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Section 8 distribution failed:', error);
        toast({
          title: currentLanguage === "fr" ? "Échec de la distribution" : "Distribution failed",
          description: currentLanguage === "fr" 
            ? "Utilisation du texte original pour Section 8"
            : "Using original text for Section 8",
          variant: "destructive",
        });
      }
    }
    
    // Save using the same mechanism as medical form expects
    sessionStorage.setItem('dictationResult', finalText);
    sessionStorage.setItem('dictationField', fieldName);
    sessionStorage.setItem('scrollToSection', selectedSection);
    sessionStorage.setItem('highlightField', fieldName);
    
    // Create backup storage for reliability
    const backupData = {
      result: finalText,
      field: fieldName,
      timestamp: Date.now()
    };
    localStorage.setItem('dictationBackup', JSON.stringify(backupData));
    
    toast({
      title: currentLanguage === "fr" ? "Sauvegardé" : "Saved",
      description: currentLanguage === "fr" 
        ? `Texte sauvegardé pour ${selectedSection}`
        : `Text saved for ${selectedSection}`,
      variant: "default",
    });

    // Navigate back to form
    handleReturnToSection();
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
      const duration = recordingDuration;
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      if (isPaused) {
        return currentLanguage === "fr" 
          ? `⏸️ En pause: ${minutes}:${seconds.toString().padStart(2, '0')}`
          : `⏸️ Paused: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      if (duration >= 240) { // 4+ minutes
        return currentLanguage === "fr" 
          ? `⚠️ Enregistrement long: ${minutes}:${seconds.toString().padStart(2, '0')} - Considérez arrêter bientôt`
          : `⚠️ Long recording: ${minutes}:${seconds.toString().padStart(2, '0')} - Consider stopping soon`;
      } else if (duration >= 180) { // 3+ minutes
        return currentLanguage === "fr" 
          ? `🔶 ${minutes}:${seconds.toString().padStart(2, '0')} - Bientôt 4 minutes`
          : `🔶 ${minutes}:${seconds.toString().padStart(2, '0')} - Nearly 4 minutes`;
      }
      
      return `${t.recording} ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return t.ready;
  };

  const getStatusIcon = () => {
    if (isProcessing) {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />
          {chunkCount > 0 && (
            <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">
              {currentChunkIndex}/{chunkCount}
            </span>
          )}
        </div>
      );
    }
    if (isRecording) {
      if (isPaused) {
        return <Pause className="h-4 w-4 text-orange-500" />;
      }
      return <Mic className="h-4 w-4 text-red-500 animate-pulse" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const handleReturnToSection = () => {
    // Clean up session storage
    sessionStorage.removeItem('dictation_return_section');
    
    if (returnToSection) {
      // Return to specific section with hash anchor
      setLocation(`/forms/cnesst-medical#${returnToSection}`);
    } else {
      // Return to general form
      setLocation("/forms/cnesst-medical");
    }
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReturnToSection}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.backToForm}
            </Button>
            
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{t.title}</h1>
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {t.whisperPowered}
              </Badge>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReturnToSection}
            className="flex items-center gap-2 hidden sm:flex"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentLanguage === "fr" ? "Retour à la section" : "Return to section"}
          </Button>
        </div>

        {/* Top Row - Section Selection and Recording Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
          <Card className={isPaused ? "border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20" : ""}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isPaused ? "text-orange-800 dark:text-orange-200" : ""}`}>
                {getStatusIcon()}
                {getStatusText()}
              </CardTitle>
              <div className={`flex items-center gap-4 text-sm ${isPaused ? "text-orange-700 dark:text-orange-300" : "text-muted-foreground"}`}>
                <span>{t.accuracy}: 95%</span>
                <span>{t.recordingTime}: {formatDuration(recordingDuration)}</span>
                {chunkCount > 0 && <span>{t.chunks}: {chunkCount}</span>}
              </div>
              {/* Subtle Progress Bar for Multi-Chunk Processing */}
              {isProcessing && chunkCount > 1 && (
                <div className="mt-2">
                  <Progress 
                    value={(currentChunkIndex / chunkCount) * 100} 
                    className="h-1 w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentLanguage === "fr" 
                      ? `Traitement du segment ${currentChunkIndex} sur ${chunkCount}`
                      : `Processing chunk ${currentChunkIndex} of ${chunkCount}`
                    }
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recording Controls */}
              <div className="flex flex-col sm:flex-row gap-2">
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
                  <>
                    {!isPaused ? (
                      <Button
                        onClick={pauseRecording}
                        variant="outline"
                        className="flex-1"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        {t.pauseRecording}
                      </Button>
                    ) : (
                      <Button
                        onClick={resumeRecording}
                        variant="default"
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {t.resumeRecording}
                      </Button>
                    )}
                    <Button
                      onClick={handleStopRecording}
                      variant="destructive"
                      className="flex-1"
                    >
                      <MicOff className="h-4 w-4 mr-2" />
                      {t.stopRecording}
                    </Button>
                  </>
                )}
              </div>

              {/* Audio Level Indicator */}
              {isRecording && (
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {currentLanguage === "fr" ? "Niveau audio" : "Audio Level"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {isListening ? 
                        (currentLanguage === "fr" ? "Écoute active" : "Listening") : 
                        (currentLanguage === "fr" ? "Silencieux" : "Quiet")
                      }
                    </span>
                  </div>
                  <SoundBar 
                    audioLevel={audioLevel} 
                    isListening={isListening} 
                    isRecording={isRecording}
                    size="lg"
                  />
                </div>
              )}

              {/* Processing Progress */}
              {isProcessing && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{t.chunkProgress}</span>
                    <span>{currentChunkIndex}/{chunkCount}</span>
                  </div>
                  <Progress value={getProgress()} className="w-full" />
                  <Button 
                    onClick={() => {
                      console.log('🚫 User cancelled processing');
                      reset();
                      toast({
                        title: currentLanguage === "fr" ? "Traitement annulé" : "Processing cancelled",
                        description: currentLanguage === "fr" ? "Vous pouvez recommencer l'enregistrement" : "You can start recording again",
                        variant: "default",
                      });
                    }}
                    variant="outline" 
                    size="sm"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {currentLanguage === "fr" ? "Annuler le traitement" : "Cancel Processing"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <VoiceCommandsManager language={currentLanguage} />
          <VerbatimCommandsManager language={currentLanguage} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Test both default and any custom commands
              const testTexts = [
                "Insérez l'examen physique. Ouvrir parenthèse. Radiographie normale. Fermer parenthèse. Insérez le suivi.",
                "Insert physical exam. Open parenthesis. X-ray shows normal findings. Close parenthesis. Insert follow up.",
                "Rapport radiologique. Radiographie thoracique révèle opacités bilatérales. Fin rapport. Texte normal continue.",
                "Citation patient. Je ressens une douleur lancinante. Fin citation. Diagnostic établi.",
                "Commencer verbatim. Section verbatim complète. Terminer verbatim. Texte normal continue."
              ];
              
              const allResults = testTexts.map(testText => {
                const processedResult = processTranscriptWithCommands(testText, currentLanguage);
                console.log(`🧪 Testing: "${testText}"`);
                console.log(`   → Commands used: ${processedResult.commandsUsed.length} (${processedResult.commandsUsed.join(', ')})`);
                console.log(`   → Verbatim sections: ${processedResult.verbatimSections.length}`);
                console.log(`   → Custom verbatim: ${processedResult.customVerbatimUsed}`);
                if (processedResult.verbatimTriggers.length > 0) {
                  console.log(`   → Verbatim triggers: ${processedResult.verbatimTriggers.join(', ')}`);
                }
                return processedResult;
              });
              
              // Use the first test for display
              const mainResult = allResults[0];
              setEditableText(mainResult.finalText);
              
              const totalCommands = allResults.reduce((sum, result) => sum + result.commandsUsed.length, 0);
              const totalVerbatim = allResults.reduce((sum, result) => sum + result.verbatimSections.length, 0);
              const customVerbatimCount = allResults.filter(result => result.customVerbatimUsed).length;
              
              toast({
                title: currentLanguage === "fr" ? "Test des commandes vocales et verbatim" : "Voice and verbatim commands test",
                description: currentLanguage === "fr" 
                  ? `${totalCommands} commandes, ${totalVerbatim} sections verbatim (${customVerbatimCount} personnalisées). Voir console.`
                  : `${totalCommands} commands, ${totalVerbatim} verbatim sections (${customVerbatimCount} custom). Check console.`,
                variant: totalCommands > 0 || totalVerbatim > 0 ? "default" : "destructive",
              });
              
              console.log("🧪 Summary:");
              console.log(`   → Total commands: ${totalCommands}`);
              console.log(`   → Total verbatim sections: ${totalVerbatim}`);
              console.log(`   → Custom verbatim tests: ${customVerbatimCount}`);
              console.log(`   → All commands used: [${[...new Set(allResults.flatMap(r => r.commandsUsed))].join(', ')}]`);
            }}
          >
            🧪 Test
          </Button>
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

        {/* Main Text Area */}
        <Card>
          <CardHeader>
            <CardTitle>{t.finalText}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              placeholder={
                currentLanguage === "fr"
                  ? "Le texte transcrit apparaîtra ici. Utilisez 'ouvrir parenthèse' et 'fermer parenthèse' pour le mode verbatim..."
                  : "Transcribed text will appear here. Use 'open parenthesis' and 'close parenthesis' for verbatim mode..."
              }
              className="min-h-[500px] max-h-[75vh] resize-none font-mono text-sm overflow-y-auto"
              disabled={isProcessing}
            />
            
            {/* Verbatim sections preview */}
            {hasVerbatim && verbatimSections.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-1">
                  📝 {t.verbatimSections} ({verbatimSections.length})
                </h4>
                <div className="space-y-2">
                  {verbatimSections.map((section, index) => (
                    <div 
                      key={index}
                      className="text-xs bg-white p-2 rounded border-l-4 border-yellow-400"
                    >
                      <span className="text-yellow-600 font-mono">#{index + 1}:</span>{" "}
                      <span className="text-gray-700">{section.substring(0, 150)}{section.length > 150 ? '...' : ''}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  {currentLanguage === "fr" 
                    ? "Ces sections ont été préservées sans modification par l'IA" 
                    : "These sections have been preserved without AI modification"}
                </p>
              </div>
            )}

            {/* Save to Section Button */}
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={handleSaveToSection}
                disabled={!editableText || !selectedSection || isProcessing}
                className="w-full"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {t.saveToSection}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session Stats and Additional Info */}
        {(isRecording || recordingDuration > 0) && (
          <Card className="mt-4">
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
                {/* Verbatim Sections Indicator */}
                {hasVerbatim && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground text-xs mb-1">{t.verbatimSections}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        📝 {verbatimSections.length} {t.verbatimCount}
                      </Badge>
                      {customVerbatimUsed && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                          🔧 Custom
                        </Badge>
                      )}
                      <span className="text-xs text-yellow-600">{t.verbatimActive}</span>
                    </div>
                    {verbatimTriggers.length > 0 && (
                      <div className="mt-1 text-xs text-blue-600">
                        {currentLanguage === "fr" ? "Déclencheurs:" : "Triggers:"} {verbatimTriggers.join(", ")}
                      </div>
                    )}
                  </div>
                )}
                {/* Storage Usage Monitor */}
                <div className="col-span-2 mt-2">
                  <div className="text-muted-foreground text-xs mb-1">
                    {currentLanguage === "fr" ? "Stockage utilisé" : "Storage used"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={getStorageUsage().percentage} 
                      className={`flex-1 h-2 ${
                        getStorageWarning() === 'critical' ? 'bg-red-100' :
                        getStorageWarning() === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}
                    />
                    <span className={`text-xs font-mono ${
                        getStorageWarning() === 'critical' ? 'text-red-600' :
                        getStorageWarning() === 'warning' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {getStorageUsage().percentage.toFixed(0)}%
                      </span>
                    </div>
                    {getStorageWarning() !== 'normal' && (
                      <div className={`text-xs mt-1 ${
                        getStorageWarning() === 'critical' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {currentLanguage === "fr" 
                          ? (getStorageWarning() === 'critical' 
                              ? "⚠️ Stockage critique - sauvegardez bientôt" 
                              : "🔶 Stockage élevé") 
                          : (getStorageWarning() === 'critical' 
                              ? "⚠️ Critical storage - save soon" 
                              : "🔶 High storage usage")
                        }
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Failed Chunks Retry Section */}
                {hasFailedChunks() && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700">
                          {currentLanguage === "fr" 
                            ? `${failedChunks.length} chunks échoués` 
                            : `${failedChunks.length} chunks failed`}
                        </span>
                      </div>
                      <Button
                        onClick={retryFailedChunks}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                      >
                        {isProcessing ? (
                          <>
                            <Clock className="w-3 h-3 mr-1 animate-spin" />
                            {currentLanguage === "fr" ? "Retry..." : "Retry..."}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {currentLanguage === "fr" ? "Réessayer" : "Retry"}
                          </>
                        )}
                      </Button>
                    </div>
                    {retryCount > 0 && (
                      <div className="text-xs text-yellow-600 mt-1">
                        {currentLanguage === "fr" 
                          ? `Tentatives: ${retryCount}` 
                          : `Attempts: ${retryCount}`}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        
      </div>
    </div>
  );
}