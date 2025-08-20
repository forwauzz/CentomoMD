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
  Settings,
  Zap,
  Wand2,
  FileText,
  Brain,
  Target,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { processTranscriptWithCommands } from "@/utils/medical-context";
import { VoiceCommandsManager } from "@/components/voice-commands-manager";
import { VerbatimCommandsManager } from "@/components/verbatim-commands-manager";
import { TranscriptionModeSelector } from "@/components/transcription-mode-selector";
import { useTranscriptionMode } from "@/hooks/use-transcription-mode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface UnifiedDictationPageProps {
  language: "fr" | "en";
}

const translations = {
  fr: {
    title: "Dictée Unifiée CentomoMD",
    modeSelection: "Mode de Transcription",
    sectionSelection: "Section Cible",
    dictationTab: "Dictée",
    settingsTab: "Paramètres",
    resultsTab: "Résultats",
    selectSection: "Sélectionner une section",
    selectMode: "Sélectionner un mode",
    startRecording: "Commencer l'enregistrement",
    stopRecording: "Arrêter",
    pauseRecording: "Pause",
    resumeRecording: "Reprendre",
    saveToSection: "Sauvegarder dans la section",
    applyAIFormatting: "Appliquer le formatage AI",
    copyText: "Copier",
    clearText: "Effacer",
    backToForm: "Retour au formulaire",
    finalText: "Texte Final",
    templateSelection: "Sélection de modèle",
    noTemplate: "Aucun modèle",
    currentMode: "Mode actuel",
    sessionStats: "Statistiques",
    processing: "Traitement...",
    ready: "Prêt",
    recording: "Enregistrement...",
    accuracy: "Précision",
    duration: "Durée",
    chunks: "Segments",
    aiEnhancement: "Amélioration AI",
    smartMode: "Mode Intelligent",
    verbatimMode: "Mode Verbatim",
    transcribeMode: "Mode Transcription",
  },
  en: {
    title: "CentomoMD Unified Dictation",
    modeSelection: "Transcription Mode",
    sectionSelection: "Target Section",
    dictationTab: "Dictation",
    settingsTab: "Settings",
    resultsTab: "Results",
    selectSection: "Select section",
    selectMode: "Select mode",
    startRecording: "Start Recording",
    stopRecording: "Stop",
    pauseRecording: "Pause",
    resumeRecording: "Resume",
    saveToSection: "Save to Section",
    applyAIFormatting: "Apply AI Formatting",
    copyText: "Copy",
    clearText: "Clear",
    backToForm: "Back to Form",
    finalText: "Final Text",
    templateSelection: "Template Selection",
    noTemplate: "No Template",
    currentMode: "Current Mode",
    sessionStats: "Session Stats",
    processing: "Processing...",
    ready: "Ready",
    recording: "Recording...",
    accuracy: "Accuracy",
    duration: "Duration",
    chunks: "Chunks",
    aiEnhancement: "AI Enhancement",
    smartMode: "Smart Mode",
    verbatimMode: "Verbatim Mode",
    transcribeMode: "Transcribe Mode",
  },
};

const sectionOptions = [
  { value: "section7", labelFr: "Section 7 - Historique et évolution", labelEn: "Section 7 - History & Evolution" },
  { value: "section8", labelFr: "Section 8 - Appréciation de l'évolution", labelEn: "Section 8 - Evolution Assessment" },
  { value: "section11", labelFr: "Section 11 - Conclusion", labelEn: "Section 11 - Conclusion" },
  { value: "section5", labelFr: "Section 5 - Antécédents", labelEn: "Section 5 - Medical History" },
  { value: "section6", labelFr: "Section 6 - Médication", labelEn: "Section 6 - Medications" },
];

const templateOptions = [
  { value: "none", labelFr: "Aucun modèle", labelEn: "No Template" },
  { value: "consultation", labelFr: "Consultation standard", labelEn: "Standard Consultation" },
  { value: "followup", labelFr: "Suivi médical", labelEn: "Medical Follow-up" },
  { value: "assessment", labelFr: "Évaluation complète", labelEn: "Complete Assessment" },
];

export function UnifiedDictationPage({ language: initialLanguage }: UnifiedDictationPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentMode, setMode, modeConfig } = useTranscriptionMode();
  
  // State management
  const [currentLanguage, setCurrentLanguage] = useState<"fr" | "en">(initialLanguage);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [editableText, setEditableText] = useState<string>("");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [activeTab, setActiveTab] = useState("dictation");
  const [isInitializing, setIsInitializing] = useState(true);
  const [aiFormatting, setAiFormatting] = useState(false);
  
  const t = translations[currentLanguage];

  // Initialize from sessionStorage
  useEffect(() => {
    const activeField = sessionStorage.getItem("activeField");
    const storedLanguage = sessionStorage.getItem("dictationLanguage") as "fr" | "en";
    
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }
    
    if (activeField) {
      setSelectedSection(activeField);
    }
    
    setTimeout(() => setIsInitializing(false), 1000);
  }, []);

  // Configure audio recorder with current mode settings
  const {
    isRecording,
    isProcessing,
    isPaused,
    transcript,
    recordingDuration,
    error,
    isSupported,
    confidence,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    formatDuration,
    chunkCount,
    currentChunkIndex,
    getProgress,
  } = useAudioRecorder({
    language: currentLanguage,
    chunkDuration: modeConfig.settings.chunkDuration,
    enhanceText: modeConfig.settings.enhanceText,
    realTimeHybrid: modeConfig.settings.realTimeDisplay,
    wordLevelTimestamps: modeConfig.settings.wordLevelTimestamps,
    speakerIdentification: modeConfig.settings.speakerIdentification,
  });

  // Handle transcript completion with voice commands
  useEffect(() => {
    if (transcript && !isProcessing && !isRecording) {
      const processedResult = processTranscriptWithCommands(transcript, currentLanguage);
      
      setEditableText(prev => {
        const separator = prev ? " " : "";
        return prev + separator + processedResult.finalText;
      });

      if (processedResult.commandsUsed.length > 0) {
        console.log("🎤 Voice commands processed:", processedResult.commandsUsed);
      }
    }
  }, [transcript, isProcessing, isRecording, currentLanguage]);

  const handleStartRecording = () => {
    if (!selectedSection) {
      toast({
        title: currentLanguage === "fr" ? "Section requise" : "Section required",
        description: currentLanguage === "fr" ? "Veuillez sélectionner une section" : "Please select a section",
        variant: "destructive",
      });
      return;
    }
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
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

    let finalText = editableText.trim();

    // Apply AI formatting if enabled
    if (aiFormatting && (selectedSection === 'section7' || selectedSection === 'section8')) {
      try {
        toast({
          title: currentLanguage === "fr" ? "Formatage AI" : "AI Formatting",
          description: currentLanguage === "fr" ? "Application du formatage intelligent..." : "Applying intelligent formatting...",
          variant: "default",
        });

        // Apply AI enhancement based on section
        const endpoint = selectedSection === 'section8' ? '/api/ai/distribute-section8' : '/api/ai/enhance-section7';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: finalText,
            language: currentLanguage,
            template: selectedTemplate !== 'none' ? selectedTemplate : undefined
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          if (selectedSection === 'section8' && result.appreciation) {
            // Handle Section 8 distribution
            sessionStorage.setItem('dictationResult_appreciationEvolution', result.appreciation);
            sessionStorage.setItem('dictationField_appreciationEvolution', 'appreciationEvolution');
            if (result.plaintes) {
              sessionStorage.setItem('dictationResult_plaintesproblemes', result.plaintes);
              sessionStorage.setItem('dictationField_plaintesproblemes', 'plaintesproblemes');
            }
            if (result.impact) {
              sessionStorage.setItem('dictationResult_impactAvq', result.impact);
              sessionStorage.setItem('dictationField_impactAvq', 'impactAvq');
            }
            sessionStorage.setItem('section8_distributed', 'true');
          } else if (result.enhancedText) {
            finalText = result.enhancedText;
          }
        }
      } catch (error) {
        console.error('AI formatting failed:', error);
      }
    }

    // Map section to field name for consistent storage
    const sectionToFieldMap: { [key: string]: string } = {
      'section7': 'historiqueEvolution',
      'section8': 'section8Input',
      'section11': 'conclusionResume',
      'section5': 'antecedentsMedicaux',
      'section6': 'medicationActuelle'
    };

    const fieldName = sectionToFieldMap[selectedSection] || selectedSection;

    // Save using sessionStorage patterns
    sessionStorage.setItem('dictationResult', finalText);
    sessionStorage.setItem('dictationField', fieldName);
    sessionStorage.setItem('scrollToSection', selectedSection);
    sessionStorage.setItem('highlightField', fieldName);
    
    // Create backup storage
    const backupData = {
      result: finalText,
      field: fieldName,
      timestamp: Date.now(),
      mode: currentMode,
      template: selectedTemplate
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
    handleReturnToForm();
  };

  const handleReturnToForm = () => {
    const returnToSection = sessionStorage.getItem('dictation_return_section');
    if (returnToSection) {
      setLocation(`/forms/cnesst-medical#${returnToSection}`);
    } else {
      setLocation("/forms/cnesst-medical");
    }
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

  const handleClearText = () => {
    setEditableText("");
    reset();
    
    toast({
      title: currentLanguage === "fr" ? "Effacé" : "Cleared",
      description: currentLanguage === "fr" ? "Texte et session effacés" : "Text and session cleared",
      variant: "default",
    });
  };

  const getModeIcon = () => {
    switch (currentMode) {
      case 'smart': return <Brain className="h-4 w-4" />;
      case 'word-for-word': return <Target className="h-4 w-4" />;
      case 'transcribe': return <Mic className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getModeDescription = () => {
    switch (currentMode) {
      case 'smart': return t.smartMode;
      case 'word-for-word': return t.verbatimMode;
      case 'transcribe': return t.transcribeMode;
      default: return modeConfig.name;
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
      <div className="container mx-auto p-4 max-w-6xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReturnToForm}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.backToForm}
            </Button>
            <h1 className="text-2xl font-bold">{t.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getModeIcon()}
              {getModeDescription()}
            </Badge>
            {modeConfig.settings.quebecFrenchOptimization && (
              <Badge variant="outline" className="bg-blue-50 border-blue-200">QC</Badge>
            )}
            {modeConfig.settings.enhanceText && (
              <Badge variant="outline" className="bg-green-50 border-green-200">AI</Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dictation">{t.dictationTab}</TabsTrigger>
            <TabsTrigger value="settings">{t.settingsTab}</TabsTrigger>
            <TabsTrigger value="results">{t.resultsTab}</TabsTrigger>
          </TabsList>

          {/* Dictation Tab */}
          <TabsContent value="dictation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Left Column - Configuration */}
              <div className="space-y-4">
                {/* Mode Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {t.modeSelection}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <TranscriptionModeSelector
                        currentMode={currentMode}
                        onModeChange={setMode}
                        language={currentLanguage}
                        disabled={isRecording}
                      />
                      <div className="text-xs text-muted-foreground">
                        {modeConfig.settings.enhanceText ? "AI Enhanced" : "Raw"} | 
                        {modeConfig.settings.quebecFrenchOptimization ? "QC Optimized" : "Standard"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section & Template Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t.sectionSelection}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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

                    <div className="space-y-2">
                      <label className="text-xs font-medium">{t.templateSelection}</label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {templateOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {currentLanguage === "fr" ? option.labelFr : option.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="ai-formatting"
                        checked={aiFormatting}
                        onChange={(e) => setAiFormatting(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor="ai-formatting" className="text-sm">
                        {t.aiEnhancement}
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Recording Controls */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Recording Controls</span>
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(recordingDuration)}
                        {chunkCount > 0 && ` • ${chunkCount} chunks`}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Recording Buttons */}
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
                        <>
                          {!isPaused ? (
                            <Button
                              onClick={pauseRecording}
                              variant="outline"
                              className="flex-1"
                            >
                              {t.pauseRecording}
                            </Button>
                          ) : (
                            <Button
                              onClick={resumeRecording}
                              variant="default"
                              className="flex-1"
                            >
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

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t.processing}</span>
                          <span>{currentChunkIndex}/{chunkCount}</span>
                        </div>
                        <Progress value={getProgress()} className="w-full" />
                      </div>
                    )}

                    {/* Session Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center text-xs border-t pt-3">
                      <div>
                        <div className="font-medium">{t.accuracy}</div>
                        <div className="text-muted-foreground">{confidence || 95}%</div>
                      </div>
                      <div>
                        <div className="font-medium">{t.duration}</div>
                        <div className="text-muted-foreground">{formatDuration(recordingDuration)}</div>
                      </div>
                      <div>
                        <div className="font-medium">{t.chunks}</div>
                        <div className="text-muted-foreground">{chunkCount || 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <VoiceCommandsManager language={currentLanguage} />
                  <VerbatimCommandsManager language={currentLanguage} />
                </div>
              </div>
            </div>

            {/* Text Editor */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{t.finalText}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyText}
                      disabled={!editableText}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {t.copyText}
                    </Button>
                    <Button
                      onClick={handleClearText}
                      disabled={!editableText && !isRecording}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t.clearText}
                    </Button>
                    <Button
                      onClick={handleSaveToSection}
                      disabled={!editableText || !selectedSection || isProcessing}
                      size="sm"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {t.saveToSection}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  placeholder={
                    currentLanguage === "fr"
                      ? "Le texte transcrit apparaîtra ici..."
                      : "Transcribed text will appear here..."
                  }
                  className="min-h-[300px] font-mono text-sm"
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced transcription settings and preferences will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detailed session analytics and transcription history will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}