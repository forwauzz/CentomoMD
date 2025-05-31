import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Mic, MicOff, ArrowLeft, Copy, Trash2, Save, Sparkles, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DictationPageProps {
  language: 'fr' | 'en';
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
      conclusionLimitationsFonctionnelles: "11. Conclusion - Limitations fonctionnelles",
      conclusionEvaluationLimitations: "11. Conclusion - Évaluation des limitations"
    }
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
      conclusionLimitationsFonctionnelles: "11. Conclusion - Functional Limitations",
      conclusionEvaluationLimitations: "11. Conclusion - Limitations Assessment"
    }
  }
};

export default function DictationPage({ language: propLanguage }: DictationPageProps) {
  const [, setLocation] = useLocation();
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [finalText, setFinalText] = useState<string>("");
  const [interimText, setInterimText] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableText, setEditableText] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<'fr' | 'en'>(propLanguage);
  const { toast } = useToast();
  
  const t = translations[currentLanguage];

  // Initialize with activeField and language from sessionStorage
  useEffect(() => {
    const activeField = sessionStorage.getItem('activeField');
    const storedLanguage = sessionStorage.getItem('dictationLanguage') as 'fr' | 'en';
    
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }
    
    if (activeField) {
      setSelectedSection(activeField);
      // Load existing text for this field if available
      const savedData = localStorage.getItem('medical-form-draft');
      if (savedData) {
        try {
          const formData = JSON.parse(savedData);
          if (formData[activeField]) {
            setFinalText(formData[activeField]);
            setEditableText(formData[activeField]);
          }
        } catch (error) {
          console.error('Error loading saved form data:', error);
        }
      }
    }
  }, []);

  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: currentLanguage === 'fr' ? 'fr-CA' : 'en-US',
    continuous: true,
    interimResults: true,
  });

  // AI formatting mutation
  const formatTextMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedSection) return text;
      
      const endpoint = selectedSection === 'historiqueEvolution' ? '/api/format-section7' : '/api/format-section8';
      const response = await apiRequest('POST', endpoint, { text, language: currentLanguage });
      const data = await response.json();
      return data.formattedText;
    },
    onSuccess: (formattedText) => {
      setFinalText(formattedText);
      setEditableText(formattedText);
      setIsEditing(true);
      toast({
        title: currentLanguage === 'fr' ? "Texte formaté" : "Text formatted",
        description: currentLanguage === 'fr' ? "Le texte a été formaté avec l'IA" : "Text has been formatted with AI",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: currentLanguage === 'fr' ? "Erreur lors du formatage" : "Error during formatting",
        variant: "destructive",
      });
    },
  });

  // Handle transcript updates
  useEffect(() => {
    if (transcript) {
      setInterimText(transcript);
    }
  }, [transcript]);

  const handleStartRecording = () => {
    if (!selectedSection) {
      toast({
        title: "Erreur",
        description: t.selectSectionFirst,
        variant: "destructive",
      });
      return;
    }
    
    resetTranscript();
    setInterimText("");
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
    if (interimText.trim()) {
      setFinalText(prev => prev ? `${prev} ${interimText}` : interimText);
      setInterimText("");
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
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleClearText = () => {
    setFinalText("");
    setInterimText("");
    resetTranscript();
    toast({
      title: t.textCleared,
      description: "",
    });
  };

  const handleSaveToSection = () => {
    const textToSave = isEditing ? editableText : finalText;
    if (!selectedSection || !textToSave) return;
    
    // Save to localStorage for form to pick up
    const savedData = localStorage.getItem('medical-form-draft');
    const formData = savedData ? JSON.parse(savedData) : {};
    
    formData[selectedSection] = textToSave;
    localStorage.setItem('medical-form-draft', JSON.stringify(formData));
    
    // Store dictation result and field for the medical form to pick up
    sessionStorage.setItem('dictationResult', textToSave);
    sessionStorage.setItem('dictationField', selectedSection);
    
    toast({
      title: t.textSaved,
      description: t.sections[selectedSection as keyof typeof t.sections],
    });

    // Clear the activeField from sessionStorage
    sessionStorage.removeItem('activeField');
    
    // Navigate back to the form
    setLocation('/');
    
    // Reset editing state
    setIsEditing(false);
    setEditableText("");
    
    // Navigate back to form
    setLocation('/');
  };

  const handleFormatText = () => {
    if (!finalText) return;
    formatTextMutation.mutate(finalText);
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

  const handleCancel = () => {
    // Clear the activeField from sessionStorage
    sessionStorage.removeItem('activeField');
    // Navigate back to form without saving
    setLocation('/');
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">
              {currentLanguage === 'fr' 
                ? "La reconnaissance vocale n'est pas supportée par votre navigateur."
                : "Speech recognition is not supported by your browser."
              }
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
                onClick={() => setLocation('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToForm}
              </Button>
              <h1 className="text-2xl font-bold text-blue-600">{t.title}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder={t.selectSection} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.sections).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
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
                  {interimText || (currentLanguage === 'fr' 
                    ? "En attente de la dictée..." 
                    : "Waiting for dictation..."
                  )}
                </div>
                {isListening && (
                  <div className="mt-4 flex items-center text-red-600">
                    <div className="animate-pulse w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                    {currentLanguage === 'fr' ? "En écoute..." : "Listening..."}
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
                        {currentLanguage === 'fr' ? 'Modifier le texte :' : 'Edit text:'}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdits}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          {currentLanguage === 'fr' ? 'Confirmer' : 'Confirm'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditing}
                        >
                          {currentLanguage === 'fr' ? 'Annuler' : 'Cancel'}
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      className="flex-1 min-h-[300px] resize-none"
                      placeholder={currentLanguage === 'fr' 
                        ? "Modifiez le texte ici..." 
                        : "Edit text here..."
                      }
                    />
                  </div>
                ) : (
                  <div className="h-full bg-gray-50 rounded-lg p-4 overflow-y-auto relative">
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {finalText || (currentLanguage === 'fr' 
                        ? "Le texte final apparaîtra ici..." 
                        : "Final text will appear here..."
                      )}
                    </div>
                    {finalText && !isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStartEditing}
                        className="absolute top-2 right-2"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {currentLanguage === 'fr' ? 'Modifier' : 'Edit'}
                      </Button>
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
                
                {/* AI Formatting Button */}
                {finalText && (selectedSection === 'historiqueEvolution' || selectedSection === 'appreciationEvolution') && (
                  <Button
                    onClick={handleFormatText}
                    disabled={formatTextMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {formatTextMutation.isPending 
                      ? (currentLanguage === 'fr' ? 'Formatage en cours...' : 'Formatting...') 
                      : (currentLanguage === 'fr' ? 'Formater avec IA' : 'Format with AI')
                    }
                  </Button>
                )}

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
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    {currentLanguage === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 text-red-600 text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}