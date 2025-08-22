/**
 * Ambient Listening Panel for Enhanced Transcribe Mode
 * Real-time voice activity, speaker identification, and continuous processing
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Users, 
  Activity,
  Settings,
  Play,
  Pause,
  Square
} from 'lucide-react';

import { VoiceActivityDetector, createVoiceActivityDetector } from '@/utils/voice-activity-detection';
import { SpeakerIdentifier, createSpeakerIdentifier } from '@/utils/speaker-identification';
import { ContinuousAudioProcessor, createContinuousAudioProcessor } from '@/utils/continuous-audio-processor';
import { VoiceActivityResult, AudioChunk } from '@shared/transcription-types';

interface AmbientListeningPanelProps {
  isActive: boolean;
  onToggle: () => void;
  onAudioChunk?: (chunk: AudioChunk) => Promise<void>;
  language: 'fr' | 'en';
}

export function AmbientListeningPanel({
  isActive,
  onToggle,
  onAudioChunk,
  language
}: AmbientListeningPanelProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [vadStatus, setVadStatus] = useState<VoiceActivityResult | null>(null);
  const [speakerInfo, setSpeakerInfo] = useState<{
    currentSpeaker: string | null;
    confidence: number;
    speakerCount: number;
  }>({
    currentSpeaker: null,
    confidence: 0,
    speakerCount: 0
  });
  
  const [processingStats, setProcessingStats] = useState({
    totalChunks: 0,
    pendingChunks: 0,
    processingChunks: 0,
    completedChunks: 0,
    failedChunks: 0,
    recordingDuration: 0
  });

  const [config, setConfig] = useState({
    vadThreshold: 25,
    chunkDuration: 30000, // 30 seconds
    maxSilence: 5000, // 5 seconds
    speakerIdEnabled: true
  });

  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const speakerIdRef = useRef<SpeakerIdentifier | null>(null);
  const processorRef = useRef<ContinuousAudioProcessor | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize ambient listening system
  useEffect(() => {
    if (isActive && !isInitialized) {
      initializeAmbientListening();
    } else if (!isActive && isInitialized) {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isActive]);

  // Update processing stats periodically
  useEffect(() => {
    if (!isActive || !processorRef.current) return;

    const interval = setInterval(() => {
      const stats = processorRef.current?.getProcessingStats();
      if (stats) {
        setProcessingStats(stats);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const initializeAmbientListening = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;

      // Initialize VAD
      vadRef.current = createVoiceActivityDetector({
        threshold: config.vadThreshold,
        maxSilenceDuration: config.maxSilence
      });
      
      await vadRef.current.initialize(stream);
      vadRef.current.setCallbacks({
        onVoiceActivity: (result) => {
          setVadStatus(result);
        }
      });
      vadRef.current.start();

      // Initialize Speaker Identification
      if (config.speakerIdEnabled) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        speakerIdRef.current = createSpeakerIdentifier();
        await speakerIdRef.current.initialize(audioContext);
      }

      // Initialize Continuous Processor
      processorRef.current = createContinuousAudioProcessor({
        chunkDurationMs: config.chunkDuration,
        vadEnabled: true,
        speakerIdEnabled: config.speakerIdEnabled
      });

      await processorRef.current.initialize(stream);
      processorRef.current.setCallbacks({
        onChunkReady: async (chunk) => {
          console.log(`🎙️ Ambient chunk ready: ${chunk.id}`);
          if (onAudioChunk) {
            await onAudioChunk(chunk);
          }
        },
        onVoiceActivity: (result) => {
          setVadStatus(result);
        }
      });

      // Start continuous recording
      await processorRef.current.startContinuousRecording();

      setIsInitialized(true);
      console.log('🎭 Ambient listening system initialized');

    } catch (error) {
      console.error('❌ Failed to initialize ambient listening:', error);
      cleanup();
    }
  };

  const cleanup = () => {
    if (vadRef.current) {
      vadRef.current.cleanup();
      vadRef.current = null;
    }

    if (speakerIdRef.current) {
      speakerIdRef.current.cleanup();
      speakerIdRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.cleanup();
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsInitialized(false);
    setVadStatus(null);
    setSpeakerInfo({
      currentSpeaker: null,
      confidence: 0,
      speakerCount: 0
    });

    console.log('🧹 Ambient listening system cleaned up');
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getVoiceActivityColor = (): string => {
    if (!vadStatus) return 'bg-gray-400';
    if (vadStatus.hasVoice) return 'bg-green-500';
    return 'bg-gray-400';
  };

  const t = {
    fr: {
      ambientListening: 'Écoute Ambiante',
      voiceActivity: 'Activité Vocale',
      speakers: 'Locuteurs',
      processing: 'Traitement',
      settings: 'Paramètres',
      start: 'Démarrer',
      stop: 'Arrêter',
      audioLevel: 'Niveau Audio',
      speakerCount: 'Nombre de locuteurs',
      currentSpeaker: 'Locuteur actuel',
      confidence: 'Confiance',
      chunks: 'Segments',
      pending: 'En attente',
      processing_status: 'En cours',
      completed: 'Terminés',
      failed: 'Échecs',
      duration: 'Durée',
      threshold: 'Seuil VAD',
      chunkSize: 'Taille segment',
      maxSilence: 'Silence max'
    },
    en: {
      ambientListening: 'Ambient Listening',
      voiceActivity: 'Voice Activity',
      speakers: 'Speakers',
      processing: 'Processing',
      settings: 'Settings',
      start: 'Start',
      stop: 'Stop',
      audioLevel: 'Audio Level',
      speakerCount: 'Speaker Count',
      currentSpeaker: 'Current Speaker',
      confidence: 'Confidence',
      chunks: 'Chunks',
      pending: 'Pending',
      processing_status: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      duration: 'Duration',
      threshold: 'VAD Threshold',
      chunkSize: 'Chunk Size',
      maxSilence: 'Max Silence'
    }
  }[language];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            {t.ambientListening}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getVoiceActivityColor()} transition-colors`} />
            <Button
              onClick={onToggle}
              variant={isActive ? "destructive" : "default"}
              size="sm"
            >
              {isActive ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  {t.stop}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  {t.start}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!isActive ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{language === 'fr' ? 'Cliquez sur Démarrer pour activer l\'écoute ambiante' : 'Click Start to enable ambient listening'}</p>
          </div>
        ) : (
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="activity">{t.voiceActivity}</TabsTrigger>
              <TabsTrigger value="speakers">{t.speakers}</TabsTrigger>
              <TabsTrigger value="processing">{t.processing}</TabsTrigger>
              <TabsTrigger value="settings">{t.settings}</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t.audioLevel}</div>
                  <Progress 
                    value={vadStatus?.audioLevel || 0} 
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    {vadStatus?.audioLevel?.toFixed(1) || '0.0'} / 100
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t.confidence}</div>
                  <Progress 
                    value={(vadStatus?.confidence || 0) * 100} 
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    {((vadStatus?.confidence || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={vadStatus?.hasVoice ? "default" : "secondary"}>
                  {vadStatus?.hasVoice ? (
                    <>
                      <Volume2 className="h-3 w-3 mr-1" />
                      {language === 'fr' ? 'Voix détectée' : 'Voice detected'}
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-3 w-3 mr-1" />
                      {language === 'fr' ? 'Silence' : 'Silence'}
                    </>
                  )}
                </Badge>
                
                <div className="text-xs text-muted-foreground">
                  {t.duration}: {formatDuration(processingStats.recordingDuration)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="speakers" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">{t.speakerCount}</div>
                  <div className="text-2xl font-bold">{speakerInfo.speakerCount}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">{t.currentSpeaker}</div>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {speakerInfo.currentSpeaker || 'None'}
                  </Badge>
                </div>
              </div>

              {speakerInfo.currentSpeaker && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t.confidence}</div>
                  <Progress value={speakerInfo.confidence * 100} />
                  <div className="text-xs text-muted-foreground">
                    {(speakerInfo.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="processing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="font-medium">{t.chunks}</div>
                  <div>{processingStats.totalChunks}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="font-medium">{t.pending}</div>
                  <div>{processingStats.pendingChunks}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="font-medium">{t.processing_status}</div>
                  <div>{processingStats.processingChunks}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="font-medium">{t.completed}</div>
                  <div className="text-green-600">{processingStats.completedChunks}</div>
                </div>
              </div>

              {processingStats.failedChunks > 0 && (
                <div className="text-sm">
                  <div className="font-medium text-red-600">{t.failed}: {processingStats.failedChunks}</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t.threshold}: {config.vadThreshold}</label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={config.vadThreshold}
                    onChange={(e) => setConfig(prev => ({ ...prev, vadThreshold: parseInt(e.target.value) }))}
                    className="w-full mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">{t.chunkSize}: {config.chunkDuration / 1000}s</label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    value={config.chunkDuration / 1000}
                    onChange={(e) => setConfig(prev => ({ ...prev, chunkDuration: parseInt(e.target.value) * 1000 }))}
                    className="w-full mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">{t.maxSilence}: {config.maxSilence / 1000}s</label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={config.maxSilence / 1000}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxSilence: parseInt(e.target.value) * 1000 }))}
                    className="w-full mt-1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}