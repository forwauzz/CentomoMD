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
import { useTranslation } from "@shared/translations";

interface DictationPageProps {
  language: 'fr' | 'en';
}

// Field to section mapping for navigation after save
const fieldToSectionMapping: Record<string, string> = {
  'diagnosticsCnesst': 'section2',
  'modaliteEntrevue': 'section3',
  'age': 'section4',
  'dominance': 'section4',
  'emploi': 'section4',
  'antecedentsMedicaux': 'section5',
  'antecedentsChirurgicaux': 'section5',
  'antecedentsLesion': 'section5',
  'antecedentsCnesst': 'section5',
  'antecedentsSaaq': 'section5',
  'antecedentsAutres': 'section5',
  'antecedentsAllergie': 'section5',
  'medicationActuelle': 'section6',
  'historiqueEvolution': 'section7',
  'section8Input': 'section8',
  'appreciationEvolution': 'section8',
  'plaintesproblemes': 'section8',
  'impactAvq': 'section8',
  'observationGenerale': 'section9',
  'rachisPalpation': 'section9',
  'rachisInspection': 'section9',
  'hanchesPalpation': 'section9',
  'hanchesInspection': 'section9',
  'examensAdditionnels': 'section9',
  'conclusionResume': 'section11',
  'conclusionDiagnostic': 'section11',
  'conclusionDateConsolidation': 'section11',
  'conclusionSoinsTraitements': 'section11',
  'conclusionAtteintePermanente': 'section11',
  'conclusionLimitationsFonctionnelles': 'section11',
  'conclusionEvaluationLimitations': 'section11'
};

const getFormSectionFromField = (fieldId: string): string => {
  return fieldToSectionMapping[fieldId] || 'section1';
};

export default function DictationPage({ language: propLanguage }: DictationPageProps) {
  const { t } = useTranslation(propLanguage);
  const [, setLocation] = useLocation();
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [finalText, setFinalText] = useState<string>("");
  const [interimText, setInterimText] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableText, setEditableText] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<'fr' | 'en'>(propLanguage);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const { toast } = useToast();

  // Initialize with activeField and language from sessionStorage
  useEffect(() => {
    const activeField = sessionStorage.getItem('activeField');
    const storedLanguage = sessionStorage.getItem('dictationLanguage') as 'fr' | 'en';

    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }

    if (activeField) {
      setSelectedSection(activeField);
    }

    // Clear any existing transcript to start fresh
    setFinalText("");
    setInterimText("");

    setIsInitializing(false);
  }, []);

  // Speech recognition setup
  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    interimTranscript,
    error
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: currentLanguage === 'fr' ? 'fr-CA' : 'en-US',
    onTranscriptChange: (newTranscript) => {
      if (newTranscript) {
        setFinalText(newTranscript);
      }
    },
    onInterimChange: (newInterim) => {
      setInterimText(newInterim);
    }
  });

  // Handle transcript updates
  useEffect(() => {
    if (!isListening && transcript) {
      setFinalText(prev => {
        const newText = prev + (prev ? ' ' : '') + transcript;
        return newText;
      });
      setInterimText("");
    }
  }, [isListening, isSupported, transcript, interimTranscript, error]);

  const handleStartRecording = () => {
    if (!selectedSection) {
      toast({
        title: t('common.error'),
        description: t('dictation.selectSectionFirst'),
        variant: "destructive",
      });
      return;
    }

    setIsEditing(false);
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
  };

  const handleCopyText = async () => {
    if (finalText) {
      try {
        await navigator.clipboard.writeText(finalText);
        toast({
          title: t('dictation.textCopied'),
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
      title: t('dictation.textCleared'),
      description: "",
    });
  };

  // Enhanced text mutation
  const enhanceTextMutation = useMutation({
    mutationFn: async (text: string) => {
      const formData = JSON.parse(localStorage.getItem('medicalFormData') || '{}');
      
      const response = await apiRequest('/api/ai/process-field', {
        method: 'POST',
        body: {
          fieldId: selectedSection,
          processingType: 'enhance',
          language: currentLanguage,
          formData: { [selectedSection]: text, ...formData },
          formType: 'cnesst-medical'
        }
      });
      
      if (!response.success || !response.processedData) {
        throw new Error('Enhancement failed');
      }
      
      return response.processedData[selectedSection] || text;
    },
    onSuccess: (enhancedText) => {
      setFinalText(enhancedText);
      toast({
        title: t('aiProcessing.aiSuccess'),
        description: t('dictation.enhanceWithAI'),
      });
    },
    onError: (error) => {
      console.error('Enhancement error:', error);
      toast({
        title: t('aiProcessing.aiError'),
        description: error.message || t('aiProcessing.processingFailed'),
        variant: "destructive",
      });
    }
  });

  const handleEnhanceText = () => {
    if (finalText.trim()) {
      enhanceTextMutation.mutate(finalText);
    }
  };

  const handleSaveToSection = () => {
    if (!selectedSection || !finalText.trim()) return;

    // Save to localStorage
    const currentData = JSON.parse(localStorage.getItem('medicalFormData') || '{}');
    currentData[selectedSection] = finalText;
    localStorage.setItem('medicalFormData', JSON.stringify(currentData));

    // Store the target section for navigation and auto-scroll
    const targetSection = getFormSectionFromField(selectedSection);
    sessionStorage.setItem('scrollToSection', targetSection);
    sessionStorage.setItem('highlightField', selectedSection);

    toast({
      title: t('dictation.textSaved'),
      description: t('sections.' + selectedSection),
    });

    // Clear the activeField from sessionStorage
    sessionStorage.removeItem('activeField');

    // Reset editing state
    setIsEditing(false);

    // Navigate back to medical form
    setLocation('/forms/cnesst');
  };

  const handleEditText = () => {
    setEditableText(finalText);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setFinalText(editableText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditableText("");
    setIsEditing(false);
  };

  const handleBackToForm = () => {
    sessionStorage.removeItem('activeField');
    setLocation('/forms/cnesst');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">{t('voiceRecognition.notSupported')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackToForm} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('dictation.backToForm')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={handleBackToForm}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('dictation.backToForm')}</span>
            </Button>
            <h1 className="text-2xl font-bold text-blue-900">{t('dictation.title')}</h1>
            <div></div>
          </div>

          {/* Section Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('dictation.selectSection')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder={t('dictation.selectSection')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(fieldToSectionMapping).map((field) => (
                    <SelectItem key={field} value={field}>
                      {t('sections.' + field)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Live Transcript and Final Text - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Live Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-5 h-5" />
                  <span>{t('dictation.liveTranscript')}</span>
                  {isListening && (
                    <div className="flex items-center space-x-1 text-red-500">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">{t('dictation.recording')}</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[200px] p-4 bg-gray-50 rounded-md border">
                  {isListening ? (
                    <div className="text-gray-700">
                      {interimText || t('voiceRecognition.speakNow')}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">
                      {t('voiceRecognition.notListening')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Final Text */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('dictation.finalText')}</span>
                  {finalText && !isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditText}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>{t('common.edit')}</span>
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      className="min-h-[200px]"
                      placeholder={t('dictation.finalText')}
                    />
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveEdit} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        {t('common.save')}
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={finalText}
                    readOnly
                    className="min-h-[200px] bg-gray-50"
                    placeholder={t('dictation.finalText')}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Recording Controls */}
            {!isListening ? (
              <Button
                onClick={handleStartRecording}
                disabled={!selectedSection}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Mic className="w-4 h-4" />
                <span>{t('dictation.startRecording')}</span>
              </Button>
            ) : (
              <Button
                onClick={handleStopRecording}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
              >
                <MicOff className="w-4 h-4" />
                <span>{t('dictation.stopRecording')}</span>
              </Button>
            )}

            {/* AI Enhancement */}
            <Button
              onClick={handleEnhanceText}
              disabled={!finalText.trim() || enhanceTextMutation.isPending}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {enhanceTextMutation.isPending 
                  ? t('aiProcessing.enhancing') 
                  : t('dictation.enhanceWithAI')
                }
              </span>
            </Button>

            {/* Text Actions */}
            <Button
              onClick={handleCopyText}
              disabled={!finalText}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>{t('dictation.copyText')}</span>
            </Button>

            <Button
              onClick={handleClearText}
              disabled={!finalText}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('dictation.clearText')}</span>
            </Button>

            <Button
              onClick={handleSaveToSection}
              disabled={!selectedSection || !finalText.trim()}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              <span>{t('dictation.saveToSection')}</span>
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="mt-6 border-red-200">
              <CardContent className="pt-6">
                <div className="text-red-600">
                  {t('voiceRecognition.recognitionError')}: {error}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}