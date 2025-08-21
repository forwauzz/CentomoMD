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
import { AmbientListeningPanel } from "@/components/ambient-listening-panel";
import { AudioChunk } from "@shared/transcription-types";

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

const languageOptions = [
  { value: "fr", labelFr: "Français (FR)", labelEn: "French (FR)" },
  { value: "en", labelFr: "Anglais (EN)", labelEn: "English (EN)" },
  { value: "auto", labelFr: "Détection automatique (Bientôt)", labelEn: "Auto-detect (Coming Soon)", disabled: true },
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
  
  // Ambient listening state for transcribe mode
  const [ambientListening, setAmbientListening] = useState(false);
  const [ambientChunkCounter, setAmbientChunkCounter] = useState(0);
  const [ambientSessionId, setAmbientSessionId] = useState('');
  const [ambientTranscriptions, setAmbientTranscriptions] = useState<{[key: number]: string}>({});
  
  // Browser Whisper state (ambient mode only)
  const [browserWhisperEnabled, setBrowserWhisperEnabled] = useState(false);
  const [modelLoadingStatus, setModelLoadingStatus] = useState<string>('');
  const [modelLoadingProgress, setModelLoadingProgress] = useState<number>(0);
  
  const t = translations[currentLanguage];

  // Helper function to get speech recognition language code
  const getSpeechRecognitionLanguage = (lang: "fr" | "en") => {
    return lang === "fr" ? "fr-CA" : "en-US";
  };

  // Helper function to get Whisper API language code
  const getWhisperLanguage = (lang: "fr" | "en") => {
    return lang === "fr" ? "fr" : "en";
  };

  // Save language preference to localStorage for persistence
  const handleLanguageChange = (newLanguage: "fr" | "en") => {
    setCurrentLanguage(newLanguage);
    localStorage.setItem("userLanguagePreference", newLanguage);
    sessionStorage.setItem("dictationLanguage", newLanguage);
    console.log(`🌐 Language changed to: ${newLanguage} (Speech: ${getSpeechRecognitionLanguage(newLanguage)}, Whisper: ${getWhisperLanguage(newLanguage)})`);
  };

  // Initialize browser Whisper when mode changes to transcribe (ambient)
  useEffect(() => {
    const initBrowserWhisperForAmbient = async () => {
      if (currentMode === 'transcribe') {
        try {
          setBrowserWhisperEnabled(true);
          setModelLoadingStatus('Initializing speech recognition...');
          
          // Dynamically import browser Whisper to avoid loading it unnecessarily
          const { browserWhisper } = await import('../utils/browser-whisper');
          
          // Set up progress callback
          browserWhisper.onLoadingProgress((progress) => {
            setModelLoadingStatus(progress.message);
            setModelLoadingProgress(progress.progress || 0);
          });
          
          // Initialize browser Whisper for ambient mode
          await browserWhisper.ensureModelReady();
          
          setModelLoadingStatus('Speech recognition ready!');
          console.log('✅ Browser Whisper ready for ambient mode');
          
        } catch (error: any) {
          console.warn('⚠️ Browser Whisper initialization failed, using server fallback:', error.message);
          setBrowserWhisperEnabled(false);
          setModelLoadingStatus('Using server transcription');
        }
      } else {
        // Disable browser Whisper for non-ambient modes
        setBrowserWhisperEnabled(false);
        setModelLoadingStatus('');
        setModelLoadingProgress(0);
      }
    };

    // Only initialize for ambient mode, skip for other modes
    if (currentMode === 'transcribe') {
      initBrowserWhisperForAmbient();
    }
  }, [currentMode]);

  // Initialize from sessionStorage and localStorage
  useEffect(() => {
    const activeField = sessionStorage.getItem("activeField");
    const sessionLanguage = sessionStorage.getItem("dictationLanguage") as "fr" | "en";
    const preferredLanguage = localStorage.getItem("userLanguagePreference") as "fr" | "en";
    
    // Priority: sessionStorage (current session) > localStorage (user preference) > initialLanguage prop
    const languageToUse = sessionLanguage || preferredLanguage || initialLanguage;
    
    if (languageToUse && languageToUse !== currentLanguage) {
      setCurrentLanguage(languageToUse);
      sessionStorage.setItem("dictationLanguage", languageToUse);
      console.log(`🌐 Initialized with language: ${languageToUse}`);
    }
    
    if (activeField) {
      setSelectedSection(activeField);
    }
    
    setTimeout(() => setIsInitializing(false), 1000);
  }, [initialLanguage]);

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
    language: getSpeechRecognitionLanguage(currentLanguage), // Use proper speech recognition format
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

  // Handle ambient listening audio chunks for transcribe mode with browser Whisper integration
  const handleAmbientAudioChunk = async (chunk: AudioChunk) => {
    if (!selectedSection) return;
    
    try {
      console.log(`🎙️ Processing ambient chunk: ${chunk.id} (${(chunk.data.size / 1024).toFixed(1)}KB)`);
      
      let transcriptionResult: any;

      // BROWSER WHISPER: Try local processing first if enabled
      if (browserWhisperEnabled) {
        try {
          const { browserWhisper } = await import('../utils/browser-whisper');
          
          const result = await browserWhisper.transcribe(
            chunk.data, 
            currentLanguage === 'fr' ? 'fr' : 'en'
          );
          
          transcriptionResult = {
            text: result.text,
            source: 'browser-whisper',
            processingTime: result.processingTime,
            speaker: null // Speaker ID not available in browser Whisper yet
          };
          
          console.log(`✅ Browser Whisper completed chunk ${chunk.id}: "${result.text.substring(0, 50)}..."`);
          
        } catch (browserError: any) {
          console.error(`❌ Browser Whisper failed for chunk ${chunk.id}:`, browserError);
          console.warn(`🔄 Browser Whisper failed for chunk ${chunk.id}, falling back to server:`, browserError?.message || 'Unknown error');
          // Fall through to server processing
        }
      }

      // SERVER FALLBACK: Use existing server processing if browser failed or disabled  
      if (!transcriptionResult || !transcriptionResult.text?.trim()) {
        console.log(`🔄 Browser processing failed or empty, falling back to server for chunk ${chunk.id}`);
      } else {
        console.log(`🎯 Using browser result for chunk ${chunk.id}, skipping server processing`);
      }
      
      if (!transcriptionResult || !transcriptionResult.text?.trim()) {
        // Ensure the blob has correct MIME type and create proper multipart upload
        const audioBlob = new Blob([chunk.data], { type: 'audio/webm;codecs=opus' });
        
        const form = new FormData();
        form.append("file", audioBlob, `ambient-${ambientSessionId}-${ambientChunkCounter}.webm`);
        form.append("sessionId", ambientSessionId);
        form.append("chunkIndex", String(ambientChunkCounter));
        form.append("language", getWhisperLanguage(currentLanguage));
        form.append("mode", "transcribe");

        console.log(`📦 Uploading to server: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

        const response = await fetch("/api/transcribe-ambient-chunk", {
          method: "POST",
          body: form,
        });
        
        if (response.ok) {
          transcriptionResult = await response.json();
          console.log('🔍 Server ambient transcription result:', transcriptionResult);
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to transcribe ambient chunk:', response.status, errorText);
          return;
        }
      } else {
        console.log(`⚡ Skipping server processing - browser Whisper already succeeded for chunk ${chunk.id}`);
      }

      // Process transcription result (same for both browser and server)
      if (transcriptionResult?.text?.trim()) {
        // Store chunk result in order for proper concatenation
        console.log(`📝 Chunk ${ambientChunkCounter} transcription: "${transcriptionResult.text.trim()}"`);
        
        setAmbientTranscriptions(prev => {
          const updated = { ...prev, [ambientChunkCounter]: transcriptionResult.text.trim() };
          console.log(`📊 Updated transcriptions:`, Object.keys(updated).map(k => `Chunk ${k}: "${updated[parseInt(k)].substring(0, 50)}..."`));
          
          // Concatenate all chunks in order to build final transcript
          const orderedChunks = Object.keys(updated)
            .map(k => parseInt(k))
            .sort((a, b) => a - b)
            .map(index => updated[index])
            .filter(text => text?.trim());
          
          const finalTranscript = orderedChunks.join(' ');
          console.log(`🔗 Final concatenated transcript (${orderedChunks.length} chunks): "${finalTranscript.substring(0, 100)}..."`);
          
          // Format with timestamp, source, and speaker for display
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const sourceLabel = transcriptionResult.source === 'browser-whisper' ? '[Local]' : '[Server]';
          const speakerLabel = transcriptionResult.speaker ? `[${transcriptionResult.speaker}]` : '';
          const formattedText = `[${timestamp}]${sourceLabel}${speakerLabel} ${finalTranscript}`;
          
          setEditableText(formattedText);
          return updated;
        });
        
        // Increment chunk counter for next chunk
        setAmbientChunkCounter(prev => prev + 1);
        
        console.log(`✅ Chunk ${ambientChunkCounter} processed successfully via ${transcriptionResult.source || 'server'}`);
      } else {
        console.warn('⚠️ Ambient transcription returned empty text');
      }
    } catch (error) {
      console.error('❌ Error processing ambient chunk:', error);
    }
  };

  const handleStartRecording = () => {
    if (!selectedSection) {
      toast({
        title: currentLanguage === "fr" ? "Section requise" : "Section required",
        description: currentLanguage === "fr" ? "Veuillez sélectionner une section" : "Please select a section",
        variant: "destructive",
      });
      return;
    }

    if (currentMode === 'transcribe') {
      // Initialize ambient session for transcribe mode
      const sessionId = `ambient-${Date.now()}`;
      setAmbientSessionId(sessionId);
      setAmbientChunkCounter(0);
      setAmbientTranscriptions({});
      console.log(`🎙️ Starting ambient session: ${sessionId}`);
      
      // Start ambient listening for transcribe mode
      setAmbientListening(true);
    } else {
      // Start traditional recording for smart/word-for-word modes
      startRecording();
    }
  };

  const handleStopRecording = () => {
    if (currentMode === 'transcribe') {
      // Stop ambient listening and log final results
      console.log(`🏁 Stopping ambient session: ${ambientSessionId} with ${Object.keys(ambientTranscriptions).length} chunks`);
      setAmbientListening(false);
    } else {
      // Stop traditional recording
      stopRecording();
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
    <div className="h-screen bg-background flex flex-col">
      <div className="container mx-auto p-3 max-w-6xl flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="dictation" className="text-xs">{t.dictationTab}</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">{t.settingsTab}</TabsTrigger>
            <TabsTrigger value="results" className="text-xs">{t.resultsTab}</TabsTrigger>
          </TabsList>

          {/* Dictation Tab */}
          <TabsContent value="dictation" className="space-y-3">
            {/* Compact Controls Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              
              {/* Mode Selection - Compact */}
              <div className="space-y-2">
                <div className="text-xs font-medium flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  {t.modeSelection}
                </div>
                <TranscriptionModeSelector
                  currentMode={currentMode}
                  onModeChange={setMode}
                  language={currentLanguage}
                  disabled={isRecording}
                />
              </div>

              {/* Section & Options */}
              <div className="space-y-2">
                <div className="text-xs font-medium">{t.sectionSelection}</div>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="h-9">
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
                
                <div className="flex items-center gap-2">
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="h-8 text-xs">
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
                  
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id="ai-formatting"
                      checked={aiFormatting}
                      onChange={(e) => setAiFormatting(e.target.checked)}
                      className="h-3 w-3"
                    />
                    <label htmlFor="ai-formatting" className="text-xs">AI</label>
                  </div>
                </div>
              </div>

              {/* Language Selection - New */}
              <div className="space-y-2">
                <div className="text-xs font-medium">Langue / Language</div>
                <Select value={currentLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {currentLanguage === "fr" ? option.labelFr : option.labelEn}
                        {option.disabled && " ⏳"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recording Controls - Compact */}
              <div className="space-y-2">
                <div className="text-xs font-medium flex items-center justify-between">
                  <span>
                    {currentMode === 'transcribe' && ambientListening 
                      ? (currentLanguage === "fr" ? "Écoute Ambiante" : "Ambient Listening")
                      : "Recording"
                    }
                  </span>
                  <span className="text-muted-foreground">
                    {formatDuration(recordingDuration)}
                    {chunkCount > 0 && ` • ${chunkCount}`}
                    <span className="ml-2 text-blue-600">
                      {currentLanguage.toUpperCase()}
                    </span>
                    {/* Browser Whisper Status Badge */}
                    {currentMode === 'transcribe' && browserWhisperEnabled && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-1 rounded">
                        Local
                      </span>
                    )}
                  </span>
                </div>

                {/* Browser Whisper Loading Status - Show only for transcribe mode */}
                {currentMode === 'transcribe' && modelLoadingStatus && (
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <span>{modelLoadingStatus}</span>
                      {modelLoadingProgress > 0 && modelLoadingProgress < 100 && (
                        <span className="text-xs">{modelLoadingProgress}%</span>
                      )}
                    </div>
                    {modelLoadingProgress > 0 && modelLoadingProgress < 100 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${modelLoadingProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-1">
                  {/* Unified Recording Button - adapts behavior based on mode */}
                  {!(isRecording || ambientListening) ? (
                    <Button
                      onClick={handleStartRecording}
                      disabled={!selectedSection || isProcessing}
                      size="sm"
                      className="flex-1 h-9"
                    >
                      <Mic className="h-3 w-3 mr-1" />
                      <span className="text-xs">
                        {currentMode === 'transcribe' 
                          ? (currentLanguage === "fr" ? "Démarrer Écoute Ambiante" : "Start Ambient Listening")
                          : t.startRecording
                        }
                      </span>
                    </Button>
                  ) : (
                    <>
                      {/* Show different controls based on recording type */}
                      {currentMode === 'transcribe' ? (
                        // Transcribe mode - only stop button for ambient listening
                        <Button
                          onClick={handleStopRecording}
                          variant="destructive"
                          size="sm"
                          className="flex-1 h-9"
                        >
                          <MicOff className="h-3 w-3 mr-1" />
                          <span className="text-xs">
                            {currentLanguage === "fr" ? "Arrêter Écoute" : "Stop Listening"}
                          </span>
                        </Button>
                      ) : (
                        // Smart/Word-for-Word modes - traditional controls
                        <>
                          {!isPaused ? (
                            <Button
                              onClick={pauseRecording}
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9"
                            >
                              <span className="text-xs">{t.pauseRecording}</span>
                            </Button>
                          ) : (
                            <Button
                              onClick={resumeRecording}
                              variant="default"
                              size="sm"
                              className="flex-1 h-9"
                            >
                              <span className="text-xs">{t.resumeRecording}</span>
                            </Button>
                          )}
                          <Button
                            onClick={handleStopRecording}
                            variant="destructive"
                            size="sm"
                            className="flex-1 h-9"
                          >
                            <MicOff className="h-3 w-3 mr-1" />
                            <span className="text-xs">{t.stopRecording}</span>
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Processing Progress - Compact */}
                {isProcessing && (
                  <div className="space-y-1">
                    <Progress value={getProgress()} className="w-full h-1" />
                    <div className="text-xs text-muted-foreground text-center">
                      {currentChunkIndex}/{chunkCount}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between gap-2 py-2 border-b">
              <div className="flex gap-1">
                <VoiceCommandsManager language={currentLanguage} />
                <VerbatimCommandsManager language={currentLanguage} />
              </div>
              
              <div className="flex gap-1">
                <Button
                  onClick={handleCopyText}
                  disabled={!editableText}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {t.copyText}
                </Button>
                <Button
                  onClick={handleClearText}
                  disabled={!editableText && !isRecording}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t.clearText}
                </Button>
                <Button
                  onClick={handleSaveToSection}
                  disabled={!editableText || !selectedSection || isProcessing}
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {t.saveToSection}
                </Button>
              </div>
            </div>

            {/* Ambient Listening Panel - Show only when active in transcribe mode */}
            {currentMode === 'transcribe' && ambientListening && (
              <div className="mb-3">
                <AmbientListeningPanel
                  isActive={ambientListening}
                  onToggle={() => setAmbientListening(!ambientListening)}
                  onAudioChunk={handleAmbientAudioChunk}
                  language={currentLanguage}
                />
              </div>
            )}

            {/* Maximized Text Editor */}
            <div className="flex-1">
              <Textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                placeholder={
                  currentLanguage === "fr"
                    ? "Le texte transcrit apparaîtra ici..."
                    : "Transcribed text will appear here..."
                }
                className="w-full h-[calc(100vh-320px)] min-h-[400px] font-mono text-sm resize-none border-0 focus:ring-0 p-4"
                disabled={isProcessing}
              />
            </div>
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