import { enhanceVoiceInput } from "../utils/voice-enhancement";
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
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  Mic,
  MicOff,
  ArrowLeft,
  Copy,
  Trash2,
  Save,
  Edit,
  Clock,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface DictationPageProps {
  language: "fr" | "en";
}

const translations = {
  fr: {
    title: "Dictée Vocale",
    selectSection: "Sélectionner une section",
    liveTranscript: "Transcription en Direct",
    finalText: "Texte Final",
    startRecording: "Commencer l'enregistrement",
    stopRecording: "Arrêter l'enregistrement",
    copyText: "Copier le texte",
    clearText: "Effacer le texte",
    saveToSection: "Sauvegarder dans la section",
    returnToSection: "Retourner à la section",
    backToForm: "Retour au formulaire",
    selectSectionFirst: "Veuillez d'abord sélectionner une section",
    textCopied: "Texte copié dans le presse-papiers",
    textCleared: "Texte effacé",
    textSaved: "Texte sauvegardé dans la section",

    sections: {
      diagnosticsCnesst: "2. Diagnostics acceptés par la CNESST",
      modaliteEntrevue: "3. Modalité de l'entrevue",
      age: "4. Identification - Âge",
      dominance: "4. Identification - Dominance",
      emploi: "4. Identification - Emploi",
      section8Input: "8. Saisie globale - Questionnaire subjectif",
      antecedentsMedicaux: "5. Antécédents - Médicaux",
      antecedentsChirurgicaux: "5. Antécédents - Chirurgicaux",
      antecedentsLesion: "5. Antécédents - Au site et au pourtour de la lésion",
      antecedentsCnesst: "5. Antécédents - CNESST",
      antecedentsSaaq: "5. Antécédents - SAAQ",
      antecedentsAutres: "5. Antécédents - Autres",
      antecedentsAllergie: "5. Antécédents - Allergie",
      medicationActuelle: "6. Médication actuelle",
      historiqueEvolution: "7. Historique de faits et évolution",
      appreciationEvolution: "8. Appréciation subjective de l'évolution",
      plaintesproblemes: "8. Plaintes et problèmes",
      impactAvq: "8. Impact sur AVQ/AVD",
      observationGenerale: "9. Observation générale et attitude",
      rachisPalpation: "9. Rachis - Palpation",
      rachisInspection: "9. Rachis - Inspection",
      hanchesPalpation: "9. Hanches - Palpation",
      hanchesInspection: "9. Hanches - Inspection",
      examensAdditionnels: "9. Examens additionnels",
      conclusionResume: "11. Conclusion - Résumé",
      conclusionDiagnostic: "11. Conclusion - Diagnostic",
      conclusionDateConsolidation: "11. Conclusion - Date de consolidation",
      conclusionSoinsTraitements: "11. Conclusion - Nature des soins",
      conclusionAtteintePermanente: "11. Conclusion - Atteinte permanente",
      conclusionLimitationsFonctionnelles:
        "11. Conclusion - Limitations fonctionnelles",
      conclusionEvaluationLimitations:
        "11. Conclusion - Évaluation des limitations",
    },
  },
  en: {
    title: "Voice Dictation",
    selectSection: "Select a section",
    liveTranscript: "Live Transcript",
    finalText: "Final Text",
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    copyText: "Copy Text",
    clearText: "Clear Text",
    saveToSection: "Save to Section",
    returnToSection: "Return to Section",
    backToForm: "Back to Form",
    selectSectionFirst: "Please select a section first",
    textCopied: "Text copied to clipboard",
    textCleared: "Text cleared",
    textSaved: "Text saved to section",

    sections: {
      diagnosticsCnesst: "2. Diagnoses Accepted by CNESST",
      modaliteEntrevue: "3. Interview Modality",
      age: "4. Identification - Age",
      dominance: "4. Identification - Dominance",
      emploi: "4. Identification - Employment",
      section8Input: "8. Global Input - Subjective Questionnaire",
      antecedentsMedicaux: "5. Medical History - Medical",
      antecedentsChirurgicaux: "5. Medical History - Surgical",
      antecedentsLesion: "5. Medical History - At and around lesion site",
      antecedentsCnesst: "5. Medical History - CNESST",
      antecedentsSaaq: "5. Medical History - SAAQ",
      antecedentsAutres: "5. Medical History - Other",
      antecedentsAllergie: "5. Medical History - Allergies",
      medicationActuelle: "6. Current Medication",
      historiqueEvolution: "7. History of Facts and Evolution",
      appreciationEvolution: "8. Subjective Appreciation of Evolution",
      plaintesproblemes: "8. Complaints and Problems",
      impactAvq: "8. Impact on ADL/IADL",
      observationGenerale: "9. General Observation and Attitude",
      rachisPalpation: "9. Spine - Palpation",
      rachisInspection: "9. Spine - Inspection",
      hanchesPalpation: "9. Hips - Palpation",
      hanchesInspection: "9. Hips - Inspection",
      examensAdditionnels: "9. Additional Examinations",
      conclusionResume: "11. Conclusion - Summary",
      conclusionDiagnostic: "11. Conclusion - Diagnosis",
      conclusionDateConsolidation: "11. Conclusion - Consolidation Date",
      conclusionSoinsTraitements: "11. Conclusion - Nature of Care",
      conclusionAtteintePermanente: "11. Conclusion - Permanent Impairment",
      conclusionLimitationsFonctionnelles:
        "11. Conclusion - Functional Limitations",
      conclusionEvaluationLimitations:
        "11. Conclusion - Limitations Assessment",
    },
  },
};

export default function DictationPage({
  language: propLanguage,
}: DictationPageProps) {
  const [, setLocation] = useLocation();
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [finalText, setFinalText] = useState<string>("");
  const [interimText, setInterimText] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableText, setEditableText] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<"fr" | "en">(
    propLanguage,
  );
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // NEW: Timer state
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const t = translations[currentLanguage];

  // Initialize with activeField and language from sessionStorage
  useEffect(() => {
    const activeField = sessionStorage.getItem("activeField");
    const storedLanguage = sessionStorage.getItem("dictationLanguage") as
      | "fr"
      | "en";

    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }

    if (activeField) {
      setSelectedSection(activeField);

      // Check if this is a new visit by looking at the return path and URL parameters
      const returnPath = sessionStorage.getItem("dictationReturnPath") || "";
      const currentUrl = window.location.href;
      const isNewVisit =
        returnPath.includes("visit=new") || currentUrl.includes("visit=new");

      // Only load existing text if NOT a new visit
      if (!isNewVisit) {
        // Try multiple localStorage keys used by the form system
        const savedDataKeys = ["medical-form-draft", "centMD_formData"];
        let formData = null;

        for (const key of savedDataKeys) {
          const savedData = localStorage.getItem(key);
          if (savedData) {
            try {
              formData = JSON.parse(savedData);
              if (formData && formData[activeField]) {
                setFinalText(formData[activeField]);
                setEditableText(formData[activeField]);
                break;
              }
            } catch (error) {
              console.error(
                `Error loading saved form data from ${key}:`,
                error,
              );
            }
          }
        }
      } else {
        // For new visits, ensure everything starts blank
        setFinalText("");
        setEditableText("");
        setInterimText("");

        // Comprehensively clear all potential localStorage keys that might contain old form data
        localStorage.removeItem("medical-form-draft");
        localStorage.removeItem("centMD_formData");
        localStorage.removeItem("medical-form-data");
        localStorage.removeItem("medical-form-autosave");

        console.log(
          "New visit detected - clearing dictation state and localStorage. Return path:",
          returnPath,
        );
      }
    }

    // Simulate initialization delay for speech recognition setup
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: currentLanguage === "fr" ? "fr-CA" : "en-US",
    continuous: true,
    interimResults: true,
  });

  // NEW: Timer management for recording duration
  useEffect(() => {
    if (isListening) {
      const startTime = sessionStartTime || Date.now();
      setSessionStartTime(startTime);

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isListening, sessionStartTime]);

  // Handle transcript updates - ENHANCED VERSION with voice correction
  useEffect(() => {
    if (transcript) {
      console.log("Dictation page received transcript:", transcript);

      // NEW: Apply voice enhancement before processing
      const enhanced = enhanceVoiceInput(transcript);
      console.log("Enhanced transcript:", enhanced.enhanced);
      console.log("Corrections applied:", enhanced.corrections);

      // Use enhanced text instead of raw transcript
      setFinalText((prev) => {
        const newText = prev
          ? `${prev} ${enhanced.enhanced}`
          : enhanced.enhanced;
        console.log("Updated final text with enhancements:", newText);
        setEditableText(newText); // Keep editable text in sync
        return newText;
      });

      // Show corrections if any were applied
      if (enhanced.corrections.length > 0) {
        toast({
          title: currentLanguage === "fr" ? "Texte amélioré" : "Text enhanced",
          description:
            currentLanguage === "fr"
              ? `${enhanced.corrections.length} corrections appliquées`
              : `${enhanced.corrections.length} corrections applied`,
          variant: "default",
        });

        console.log("Voice enhancement corrections:", enhanced.corrections);
      }

      // Clear transcript after processing
      setTimeout(() => {
        resetTranscript();
      }, 100);
    }
  }, [transcript, resetTranscript, currentLanguage, toast]);

  // Update interim display for live transcription
  useEffect(() => {
    console.log("Interim transcript updated:", interimTranscript);
    setInterimText(interimTranscript);
  }, [interimTranscript]);

  // Debug logging for speech recognition state
  useEffect(() => {
    console.log("Speech recognition state:", {
      isListening,
      isSupported,
      transcript,
      interimTranscript,
      error,
      recordingDuration, // NEW: Include duration in debug logs
    });
  }, [
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    recordingDuration,
  ]);

  // NEW: Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = () => {
    if (!selectedSection) {
      toast({
        title: "Erreur",
        description: t.selectSectionFirst,
        variant: "destructive",
      });
      return;
    }

    console.log("Starting recording with language:", currentLanguage);

    // NEW: Initialize timer
    setSessionStartTime(Date.now());
    setRecordingDuration(0);

    resetTranscript();
    setInterimText("");
    startListening((newTranscript) => {
      console.log("Live transcript received:", newTranscript);
    });
  };

  const handleStopRecording = () => {
    console.log("Stopping recording");
    stopListening();

    // NEW: Clean up timer
    setSessionStartTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCopyText = async () => {
    if (finalText) {
      try {
        await navigator.clipboard.writeText(finalText);
        toast({
          title: t.textCopied,
          description: "",
        });
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
  };

  const handleClearText = () => {
    setFinalText("");
    setInterimText("");

    // NEW: Reset timer when clearing
    setRecordingDuration(0);
    setSessionStartTime(0);

    resetTranscript();
    toast({
      title: t.textCleared,
      description: "",
    });
  };

  // Mapping of dictation fields to their corresponding form sections for navigation
  const getFormSectionFromField = (fieldKey: string): string => {
    const fieldToSectionMap: { [key: string]: string } = {
      // Section 2
      diagnosticsCnesst: "section2",
      // Section 3
      modaliteEntrevue: "section3",
      // Section 4
      age: "section4",
      dominance: "section4",
      emploi: "section4",
      // Section 5
      antecedentsMedicaux: "section5",
      antecedentsChirurgicaux: "section5",
      antecedentsLesion: "section5",
      antecedentsCnesst: "section5",
      antecedentsSaaq: "section5",
      antecedentsAutres: "section5",
      antecedentsAllergie: "section5",
      // Section 6
      medicationActuelle: "section6",
      // Section 7
      historiqueEvolution: "section7",
      // Section 8
      section8Input: "section8",
      appreciationEvolution: "section8",
      plaintesproblemes: "section8",
      impactAvq: "section8",
      // Section 9
      observationGenerale: "section9",
      rachisPalpation: "section9",
      rachisInspection: "section9",
      hanchesPalpation: "section9",
      hanchesInspection: "section9",
      examensAdditionnels: "section9",
      // Section 11
      conclusionResume: "section11",
      conclusionDiagnostic: "section11",
      conclusionDateConsolidation: "section11",
      conclusionSoinsTraitements: "section11",
      conclusionAtteintePermanente: "section11",
      conclusionLimitationsFonctionnelles: "section11",
      conclusionEvaluationLimitations: "section11",
    };
    return fieldToSectionMap[fieldKey] || "section1";
  };

  const handleSaveToSection = () => {
    const textToSave = isEditing ? editableText : finalText;
    if (!selectedSection || !textToSave) {
      console.warn("Cannot save: missing section or text", {
        selectedSection,
        hasText: !!textToSave,
      });
      return;
    }

    console.log("Saving dictation to section:", {
      selectedSection,
      textLength: textToSave.length,
      duration: recordingDuration, // NEW: Include duration in save logs
    });

    // Check if this is a new visit
    const returnPath = sessionStorage.getItem("dictationReturnPath") || "";
    const isNewVisit = returnPath.includes("visit=new");

    // Save to localStorage for form to pick up
    let formData: Record<string, any> = {};

    if (!isNewVisit) {
      // For existing visits, load and merge with existing data
      const savedData = localStorage.getItem("medical-form-draft");
      formData = savedData ? JSON.parse(savedData) : {};
    }
    // For new visits, start with empty formData to avoid mixing old data

    formData[selectedSection] = textToSave;
    localStorage.setItem("medical-form-draft", JSON.stringify(formData));

    // Store dictation result and field for the medical form to pick up
    sessionStorage.setItem("dictationResult", textToSave);
    sessionStorage.setItem("dictationField", selectedSection);

    // PRODUCTION FIX: Add multiple redundant storage mechanisms
    // Store with timestamp for debugging production issues
    const timestamp = Date.now();
    sessionStorage.setItem("dictationTimestamp", timestamp.toString());
    localStorage.setItem(
      "dictationBackup",
      JSON.stringify({
        result: textToSave,
        field: selectedSection,
        timestamp: timestamp,
        duration: recordingDuration, // NEW: Include duration in backup
      }),
    );

    console.log("Stored in sessionStorage:", {
      dictationField: selectedSection,
      resultLength: textToSave.length,
      preview: textToSave.substring(0, 100) + "...",
      timestamp: timestamp,
      sessionDuration: recordingDuration, // NEW: Log session duration
    });

    // Store the target section for navigation and auto-scroll
    const targetSection = getFormSectionFromField(selectedSection);
    sessionStorage.setItem("scrollToSection", targetSection);
    sessionStorage.setItem("highlightField", selectedSection);

    toast({
      title: t.textSaved,
      description: t.sections[selectedSection as keyof typeof t.sections],
    });

    // Clear the activeField from sessionStorage
    sessionStorage.removeItem("activeField");

    // Reset editing state
    setIsEditing(false);
    setEditableText("");

    // Navigate back to the original form with section anchor for immediate navigation
    const finalReturnPath = returnPath || "/forms/cnesst-medical-evaluation";
    console.log("Navigating back to:", finalReturnPath + "#" + targetSection);
    setLocation(finalReturnPath + "#" + targetSection);
  };

  const handleStartEditing = () => {
    setEditableText(finalText);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditableText("");
  };

  const handleSaveEdits = () => {
    setFinalText(editableText);
    setIsEditing(false);
  };

  const handleReturnToSection = () => {
    if (!selectedSection) {
      toast({
        title: "Erreur",
        description: t.selectSectionFirst,
        variant: "destructive",
      });
      return;
    }

    const returnPath =
      sessionStorage.getItem("dictationReturnPath") ||
      "/forms/cnesst-medical-evaluation";

    // Get the target section for navigation
    const targetSection = getFormSectionFromField(selectedSection);

    // Store the section to scroll to and highlight
    sessionStorage.setItem("scrollToSection", targetSection);
    sessionStorage.setItem("highlightField", selectedSection);

    // Navigate back to the form with section anchor
    const finalReturnPath = returnPath + "#" + targetSection;
    console.log("Returning to section:", finalReturnPath);
    setLocation(finalReturnPath);
  };

  const handleCancel = () => {
    const returnPath = sessionStorage.getItem("dictationReturnPath") || "/";

    // Clear any stored data
    sessionStorage.removeItem("activeField");
    sessionStorage.removeItem("dictationResult");
    sessionStorage.removeItem("dictationField");
    sessionStorage.removeItem("dictationReturnPath");

    setLocation(returnPath);
  };

  // Show loading spinner while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-600">
            {currentLanguage === "fr"
              ? "Initialisation de la reconnaissance vocale..."
              : "Initializing speech recognition..."}
          </div>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">
              {currentLanguage === "fr"
                ? "La reconnaissance vocale n'est pas supportée par votre navigateur."
                : "Speech recognition is not supported by your browser."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToForm}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-600">{t.title}</h1>
                <div className="flex items-center gap-4 text-sm">
                  {(() => {
                    const returnPath =
                      sessionStorage.getItem("dictationReturnPath") || "";
                    const isNewVisit = returnPath.includes("visit=new");
                    return isNewVisit ? (
                      <p className="text-green-600 font-medium">
                        {currentLanguage === "fr"
                          ? "• Nouvelle visite - formulaire vierge"
                          : "• New visit - blank form"}
                      </p>
                    ) : null;
                  })()}

                  {/* NEW: Recording duration display */}
                  {(isListening || recordingDuration > 0) && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono">
                        Recording: {formatDuration(recordingDuration)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger className="w-80">
                  <SelectValue placeholder={t.selectSection} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.sections).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Live Transcript */}
          <Card className="flex flex-col">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mic className="w-5 h-5" />
                {t.liveTranscript}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <div className="h-full bg-gray-50 rounded-lg p-4 overflow-y-auto">
                <div className="text-gray-800 whitespace-pre-wrap">
                  {/* Show interim transcript first, then final text while building */}
                  {interimText && (
                    <div className="text-blue-600 italic">{interimText}</div>
                  )}
                  {finalText && (
                    <div className="text-gray-800">{finalText}</div>
                  )}
                  {!interimText && !finalText && (
                    <div className="text-gray-500">
                      {currentLanguage === "fr"
                        ? "En attente de la dictée..."
                        : "Waiting for dictation..."}
                    </div>
                  )}
                </div>
                {isListening && (
                  <div className="mt-4 flex items-center text-red-600">
                    <div className="animate-pulse w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                    {currentLanguage === "fr" ? "En écoute..." : "Listening..."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Final Text & Controls */}
          <Card className="flex flex-col">
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="text-lg">{t.finalText}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 flex flex-col">
              {/* Final Text Display/Editor */}
              <div className="flex-1 mb-6">
                {isEditing ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {currentLanguage === "fr"
                          ? "Modifier le texte :"
                          : "Edit text:"}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdits}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          {currentLanguage === "fr" ? "Confirmer" : "Confirm"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditing}
                        >
                          {currentLanguage === "fr" ? "Annuler" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      className="flex-1 min-h-[300px] resize-none"
                      placeholder={
                        currentLanguage === "fr"
                          ? "Modifiez le texte ici..."
                          : "Edit text here..."
                      }
                    />
                  </div>
                ) : (
                  <div className="h-full bg-gray-50 rounded-lg p-4 overflow-y-auto relative">
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {finalText ||
                        (currentLanguage === "fr"
                          ? "Le texte final apparaîtra ici..."
                          : "Final text will appear here...")}
                    </div>
                    {finalText && !isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStartEditing}
                        className="absolute top-2 right-2"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {currentLanguage === "fr" ? "Modifier" : "Edit"}
                      </Button>
                    )}

                    {/* NEW: Session stats in corner */}
                    {recordingDuration > 0 && (
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {formatDuration(recordingDuration)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  {!isListening ? (
                    <Button
                      onClick={handleStartRecording}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      disabled={!selectedSection}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {t.startRecording}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopRecording}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <MicOff className="w-4 h-4 mr-2" />
                      {t.stopRecording}
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyText}
                    disabled={!finalText}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t.copyText}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleClearText}
                    disabled={!finalText && !interimText}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.clearText}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveToSection}
                    disabled={!selectedSection || (!finalText && !editableText)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t.saveToSection}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleReturnToSection}
                    disabled={!selectedSection}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t.returnToSection}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    {currentLanguage === "fr" ? "Annuler" : "Cancel"}
                  </Button>
                </div>
              </div>

              {/* Enhanced error display with timer info */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-600 text-sm font-medium">
                    {currentLanguage === "fr"
                      ? "Erreur de reconnaissance vocale:"
                      : "Speech recognition error:"}
                  </div>
                  <div className="text-red-500 text-sm mt-1">{error}</div>
                  {recordingDuration > 300 && ( // Show timeout hint after 5 minutes
                    <div className="text-gray-600 text-xs mt-2">
                      {currentLanguage === "fr"
                        ? `Session longue détectée (${formatDuration(recordingDuration)}). Le chunking automatique sera bientôt disponible.`
                        : `Long session detected (${formatDuration(recordingDuration)}). Auto-chunking will be available soon.`}
                    </div>
                  )}
                </div>
              )}

              {/* NEW: Long session warning */}
              {recordingDuration > 300 &&
                !error && ( // Warn after 5 minutes
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-yellow-700 text-sm">
                      {currentLanguage === "fr"
                        ? `Session longue en cours (${formatDuration(recordingDuration)}). Considérez sauvegarder bientôt.`
                        : `Long session in progress (${formatDuration(recordingDuration)}). Consider saving soon.`}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
