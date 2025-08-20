import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Square, 
  Settings, 
  Activity,
  Clock,
  Target,
  Users,
  Zap
} from "lucide-react";
import { TranscriptionModeSelector } from "./transcription-mode-selector";
import { useTranscriptionMode } from "@/hooks/use-transcription-mode";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { TranscriptionMode } from "@shared/transcription-types";

interface UnifiedDictationModesProps {
  language: 'fr' | 'en';
  onTranscriptComplete?: (text: string, mode: TranscriptionMode) => void;
  disabled?: boolean;
  autoStart?: boolean;
}

const translations = {
  fr: {
    title: "Modes de Transcription Unifiés",
    status: "Statut",
    ready: "Prêt",
    recording: "Enregistrement",
    processing: "Traitement",
    paused: "En pause",
    completed: "Complété",
    error: "Erreur",
    startRecording: "Démarrer",
    stopRecording: "Arrêter",
    pauseRecording: "Pause",
    resumeRecording: "Reprendre",
    switchMode: "Changer de mode",
    sessionStats: "Statistiques de session",
    duration: "Durée",
    chunks: "Segments",
    words: "Mots",
    confidence: "Confiance",
    speakers: "Locuteurs",
    realTimeActive: "Temps réel actif",
    hybridMode: "Mode hybride",
    wordLevel: "Niveau mot",
    zeroRetention: "Zéro rétention",
    settings: "Paramètres",
    québecOptimized: "Optimisé Québec",
  },
  en: {
    title: "Unified Transcription Modes",
    status: "Status",
    ready: "Ready",
    recording: "Recording",
    processing: "Processing",
    paused: "Paused",
    completed: "Completed",
    error: "Error",
    startRecording: "Start",
    stopRecording: "Stop",
    pauseRecording: "Pause",
    resumeRecording: "Resume",
    switchMode: "Switch Mode",
    sessionStats: "Session Stats",
    duration: "Duration",
    chunks: "Chunks",
    words: "Words",
    confidence: "Confidence",
    speakers: "Speakers",
    realTimeActive: "Real-time active",
    hybridMode: "Hybrid mode",
    wordLevel: "Word level",
    zeroRetention: "Zero retention",
    settings: "Settings",
    québecOptimized: "Quebec optimized",
  },
};

export function UnifiedDictationModes({
  language,
  onTranscriptComplete,
  disabled = false,
  autoStart = false,
}: UnifiedDictationModesProps) {
  const { currentMode, setMode, modeConfig } = useTranscriptionMode();
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalWords: 0,
    averageConfidence: 0,
    speakerCount: 0,
    chunksProcessed: 0,
  });

  const t = translations[language];

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
  } = useAudioRecorder({
    language,
    chunkDuration: modeConfig.settings.chunkDuration,
    enhanceText: modeConfig.settings.enhanceText,
    // Remove mode property that doesn't exist in AudioRecorderOptions interface
    realTimeHybrid: modeConfig.settings.realTimeDisplay,
    wordLevelTimestamps: modeConfig.settings.wordLevelTimestamps,
    speakerIdentification: modeConfig.settings.speakerIdentification,
  });

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && isSupported && !isRecording) {
      startRecording();
    }
  }, [autoStart, isSupported, isRecording]); // Removed startRecording to prevent infinite loops

  // Handle transcript completion
  useEffect(() => {
    if (transcript && !isProcessing && !isRecording && onTranscriptComplete) {
      onTranscriptComplete(transcript, currentMode);
      
      // Update session stats based on mode
      if (currentMode === 'word-for-word' || currentMode === 'transcribe') {
        const wordCount = transcript.split(/\s+/).length;
        setSessionStats(prev => ({
          ...prev,
          totalWords: prev.totalWords + wordCount,
          averageConfidence: confidence || prev.averageConfidence,
          chunksProcessed: prev.chunksProcessed + 1,
        }));
      }
    }
  }, [transcript, isProcessing, isRecording, currentMode, confidence]); // Removed onTranscriptComplete to prevent infinite loops

  // Get status info
  const getStatus = () => {
    if (error) return { text: t.error, variant: 'destructive' as const, icon: Square };
    if (isProcessing) return { text: t.processing, variant: 'secondary' as const, icon: Activity };
    if (isPaused) return { text: t.paused, variant: 'secondary' as const, icon: Pause };
    if (isRecording) return { text: t.recording, variant: 'default' as const, icon: Mic };
    if (transcript) return { text: t.completed, variant: 'default' as const, icon: Target };
    return { text: t.ready, variant: 'outline' as const, icon: Mic };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Calculate progress for session limits
  const maxDuration = modeConfig.settings.maxSessionDuration;
  const progressPercentage = Math.min((recordingDuration / maxDuration) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Mode Selector Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {modeConfig.name}
          </Badge>
          {modeConfig.settings.quebecFrenchOptimization && (
            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
              QC
            </Badge>
          )}
          {modeConfig.settings.enhanceText && (
            <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
              AI
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowModeSelector(!showModeSelector)}
          disabled={disabled || isRecording}
        >
          <Settings className="h-4 w-4 mr-1" />
          {t.switchMode}
        </Button>
      </div>

      {/* Mode Selector Panel */}
      {showModeSelector && (
        <TranscriptionModeSelector
          currentMode={currentMode}
          onModeChange={(mode) => {
            setMode(mode);
            setShowModeSelector(false);
            reset(); // Reset current session when switching modes
          }}
          language={language}
          disabled={disabled || isRecording}
        />
      )}

      {/* Recording Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              {t.status}: {status.text}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isRecording && (
                <Badge variant="default" className="animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              )}
              {modeConfig.settings.realTimeDisplay && (
                <Badge variant="outline" className="text-xs">
                  {t.realTimeActive}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar for Session Limits */}
          {isRecording && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t.duration}: {formatDuration(recordingDuration)}</span>
                <span>Max: {formatDuration(maxDuration)}</span>
              </div>
              <Progress 
                value={progressPercentage} 
                className={`h-2 ${progressPercentage > 90 ? 'bg-red-100' : ''}`}
              />
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={disabled || !isSupported}
                className="flex-1"
              >
                <Mic className="h-4 w-4 mr-2" />
                {t.startRecording}
              </Button>
            ) : (
              <>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  {t.stopRecording}
                </Button>
                <Button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  variant="outline"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t.resumeRecording}
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      {t.pauseRecording}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Mode-Specific Features */}
          {currentMode === 'word-for-word' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t.confidence}:</span>
                <div className="font-medium">
                  {confidence ? `${Math.round(confidence * 100)}%` : '--'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">{t.words}:</span>
                <div className="font-medium">{sessionStats.totalWords}</div>
              </div>
            </div>
          )}

          {currentMode === 'transcribe' && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t.speakers}:</span>
                <div className="font-medium">{sessionStats.speakerCount || 0}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t.chunks}:</span>
                <div className="font-medium">{sessionStats.chunksProcessed}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t.confidence}:</span>
                <div className="font-medium">
                  {sessionStats.averageConfidence ? `${Math.round(sessionStats.averageConfidence * 100)}%` : '--'}
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* Compliance Indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>{t.zeroRetention}</span>
              <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                ✓ TGV
              </Badge>
            </div>
            {modeConfig.settings.quebecFrenchOptimization && (
              <span>{t.québecOptimized}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Transcript Preview (if available) */}
      {transcript && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Live Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm max-h-32 overflow-y-auto">
              {transcript}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}