import React, { useState } from 'react';
import { ArrowLeft, Brain, Type, Mic, Zap, Activity, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UnifiedDictationModes } from "@/components/unified-dictation-modes";
import { TranscriptionModeSelector } from "@/components/transcription-mode-selector";
import { useTranscriptionMode } from "@/hooks/use-transcription-mode";
import { TranscriptionMode, TRANSCRIPTION_MODE_CONFIGS } from "@shared/transcription-types";

interface TranscriptionModesDemoProps {
  language: "fr" | "en";
}

const translations = {
  fr: {
    title: "Modes de Transcription TGV",
    subtitle: "Trois modes conformes TGV pour tous vos besoins de transcription médicale",
    backToHome: "Retour à l'accueil",
    overview: "Aperçu",
    liveDemo: "Démonstration en temps réel",
    integration: "Intégration",
    features: "Fonctionnalités",
    compliance: "Conformité",
    smartMode: "Mode Intelligent",
    wordForWordMode: "Mode Mot-à-mot",
    transcribeMode: "Mode Transcription",
    smartDescription: "IA améliore le texte avec terminologie médicale québécoise",
    wordForWordDescription: "Transcription exacte sans modification IA",
    transcribeDescription: "Écoute ambiante continue pour consultations",
    keyFeatures: "Fonctionnalités clés",
    aiEnhanced: "Amélioré par IA",
    quebecOptimized: "Optimisé Québec",
    medicalTerminology: "Terminologie médicale",
    realTimeProcessing: "Traitement temps réel",
    verbatimAccuracy: "Précision verbatim",
    wordLevelTimestamps: "Horodatage mot-à-mot",
    zeroTemperature: "Température zéro",
    maxPrecision: "Précision maximale",
    continuousListening: "Écoute continue",
    speakerIdentification: "Identification locuteur",
    ambientRecording: "Enregistrement ambiant",
    longSessions: "Sessions longues",
    tgvCompliance: "Conformité TGV garantie",
    zeroRetention: "Zéro rétention des données",
    auditTrail: "Piste d'audit complète",
    memoryCleanup: "Nettoyage mémoire automatique",
    tryMode: "Essayer ce mode",
    currentlyTesting: "Test en cours",
    sessionComplete: "Session terminée",
    integrationInfo: "Informations d'intégration",
    integrationText: "Chaque mode peut être intégré dans vos flux de travail existants avec une compatibilité complète avec les composants CentomoMD.",
    modeComparison: "Comparaison des modes",
    duration: "Durée max",
    chunkSize: "Taille segment",
    temperature: "Température",
    enhanceText: "Amélioration IA",
    minutes: "min",
    seconds: "sec",
    yes: "Oui",
    no: "Non",
  },
  en: {
    title: "TGV Transcription Modes",
    subtitle: "Three TGV-compliant modes for all your medical transcription needs",
    backToHome: "Back to Home",
    overview: "Overview",
    liveDemo: "Live Demo",
    integration: "Integration",
    features: "Features",
    compliance: "Compliance",
    smartMode: "Smart Mode",
    wordForWordMode: "Word-for-Word Mode",
    transcribeMode: "Transcribe Mode",
    smartDescription: "AI enhances text with Quebec medical terminology",
    wordForWordDescription: "Exact transcription with no AI modification",
    transcribeDescription: "Continuous ambient listening for consultations",
    keyFeatures: "Key Features",
    aiEnhanced: "AI Enhanced",
    quebecOptimized: "Quebec Optimized",
    medicalTerminology: "Medical Terminology",
    realTimeProcessing: "Real-time Processing",
    verbatimAccuracy: "Verbatim Accuracy",
    wordLevelTimestamps: "Word-level Timestamps",
    zeroTemperature: "Zero Temperature",
    maxPrecision: "Maximum Precision",
    continuousListening: "Continuous Listening",
    speakerIdentification: "Speaker Identification",
    ambientRecording: "Ambient Recording",
    longSessions: "Long Sessions",
    tgvCompliance: "TGV Compliance Guaranteed",
    zeroRetention: "Zero Data Retention",
    auditTrail: "Complete Audit Trail",
    memoryCleanup: "Automatic Memory Cleanup",
    tryMode: "Try This Mode",
    currentlyTesting: "Currently Testing",
    sessionComplete: "Session Complete",
    integrationInfo: "Integration Information",
    integrationText: "Each mode can be integrated into your existing workflows with full compatibility with CentomoMD components.",
    modeComparison: "Mode Comparison",
    duration: "Max Duration",
    chunkSize: "Chunk Size",
    temperature: "Temperature",
    enhanceText: "AI Enhancement",
    minutes: "min",
    seconds: "sec",
    yes: "Yes",
    no: "No",
  },
};

const modeIcons = {
  smart: Brain,
  'word-for-word': Type,
  transcribe: Mic,
};

export function TranscriptionModesDemo({ language }: TranscriptionModesDemoProps) {
  const [, setLocation] = useLocation();
  const { currentMode, setMode } = useTranscriptionMode();
  const [activeDemo, setActiveDemo] = useState<TranscriptionMode | null>(null);
  const [transcripts, setTranscripts] = useState<Record<TranscriptionMode, string>>({
    smart: '',
    'word-for-word': '',
    transcribe: '',
  });

  const t = translations[language];

  const handleTranscriptComplete = (text: string, mode: TranscriptionMode) => {
    setTranscripts(prev => ({
      ...prev,
      [mode]: text,
    }));
    setActiveDemo(null);
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 60) {
      return `${Math.floor(seconds / 60)} ${t.minutes}`;
    }
    return `${seconds} ${t.seconds}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToHome}
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
      </div>

      {/* TGV Compliance Alert */}
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          <strong>{t.tgvCompliance}</strong> - {t.zeroRetention}, {t.auditTrail}, {t.memoryCleanup}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t.overview}</TabsTrigger>
          <TabsTrigger value="demo">{t.liveDemo}</TabsTrigger>
          <TabsTrigger value="integration">{t.integration}</TabsTrigger>
          <TabsTrigger value="comparison">{t.modeComparison}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(TRANSCRIPTION_MODE_CONFIGS) as TranscriptionMode[]).map((mode) => {
              const config = TRANSCRIPTION_MODE_CONFIGS[mode];
              const IconComponent = modeIcons[mode];
              const isActive = currentMode === mode;

              return (
                <Card 
                  key={mode} 
                  className={`relative ${isActive ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mode === 'smart' ? t.smartDescription :
                       mode === 'word-for-word' ? t.wordForWordDescription :
                       t.transcribeDescription}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{t.keyFeatures}</h4>
                      <div className="flex flex-wrap gap-1">
                        {mode === 'smart' && (
                          <>
                            <Badge variant="outline" className="text-xs">{t.aiEnhanced}</Badge>
                            <Badge variant="outline" className="text-xs">{t.quebecOptimized}</Badge>
                            <Badge variant="outline" className="text-xs">{t.medicalTerminology}</Badge>
                            <Badge variant="outline" className="text-xs">{t.realTimeProcessing}</Badge>
                          </>
                        )}
                        {mode === 'word-for-word' && (
                          <>
                            <Badge variant="outline" className="text-xs">{t.verbatimAccuracy}</Badge>
                            <Badge variant="outline" className="text-xs">{t.wordLevelTimestamps}</Badge>
                            <Badge variant="outline" className="text-xs">{t.zeroTemperature}</Badge>
                            <Badge variant="outline" className="text-xs">{t.maxPrecision}</Badge>
                          </>
                        )}
                        {mode === 'transcribe' && (
                          <>
                            <Badge variant="outline" className="text-xs">{t.continuousListening}</Badge>
                            <Badge variant="outline" className="text-xs">{t.speakerIdentification}</Badge>
                            <Badge variant="outline" className="text-xs">{t.ambientRecording}</Badge>
                            <Badge variant="outline" className="text-xs">{t.longSessions}</Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t.duration}:</span>
                        <div className="font-medium">
                          {formatDuration(config.settings.maxSessionDuration)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t.chunkSize}:</span>
                        <div className="font-medium">
                          {formatDuration(config.settings.chunkDuration)}
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant={isActive ? "default" : "outline"}
                      onClick={() => {
                        setMode(mode);
                        setActiveDemo(mode);
                      }}
                    >
                      {activeDemo === mode ? t.currentlyTesting : t.tryMode}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="demo" className="space-y-6">
          <UnifiedDictationModes
            language={language}
            onTranscriptComplete={handleTranscriptComplete}
            autoStart={false}
          />

          {/* Results Display */}
          {Object.entries(transcripts).some(([, text]) => text) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t.sessionComplete}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(transcripts).map(([mode, text]) => {
                  if (!text) return null;
                  const config = TRANSCRIPTION_MODE_CONFIGS[mode as TranscriptionMode];
                  const IconComponent = modeIcons[mode as TranscriptionMode];
                  
                  return (
                    <div key={mode} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium">{config.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {text.split(/\s+/).length} words
                        </Badge>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm max-h-32 overflow-y-auto">
                        {text}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.integrationInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{t.integrationText}</p>
              
              <TranscriptionModeSelector
                currentMode={currentMode}
                onModeChange={setMode}
                language={language}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.modeComparison}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Mode</th>
                      <th className="text-left p-2">{t.duration}</th>
                      <th className="text-left p-2">{t.chunkSize}</th>
                      <th className="text-left p-2">{t.temperature}</th>
                      <th className="text-left p-2">{t.enhanceText}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(TRANSCRIPTION_MODE_CONFIGS) as TranscriptionMode[]).map((mode) => {
                      const config = TRANSCRIPTION_MODE_CONFIGS[mode];
                      const IconComponent = modeIcons[mode];
                      
                      return (
                        <tr key={mode} className="border-b">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {config.name}
                            </div>
                          </td>
                          <td className="p-2">{formatDuration(config.settings.maxSessionDuration)}</td>
                          <td className="p-2">{formatDuration(config.settings.chunkDuration)}</td>
                          <td className="p-2">{config.settings.temperature}</td>
                          <td className="p-2">{config.settings.enhanceText ? t.yes : t.no}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}