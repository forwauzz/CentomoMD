import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  MicOff, 
  Activity, 
  Users, 
  Clock, 
  Volume2,
  AlertCircle 
} from "lucide-react";
import { ContinuousAudioProcessor, ProcessingCallbacks } from "@/utils/continuous-audio-processor";
import { VoiceActivityDetection } from "@/utils/voice-activity-detection";
import { SpeakerIdentifier } from "@/utils/speaker-identification";
import { AudioChunk } from "@shared/transcription-types";

interface AmbientListeningPanelProps {
  isActive: boolean;
  onToggle: () => void;
  onAudioChunk: (chunk: AudioChunk) => Promise<void>;
  language: "fr" | "en";
}

interface AmbientStats {
  totalChunks: number;
  processedChunks: number;
  speakersDetected: number;
  averageAudioLevel: number;
  sessionDuration: number;
  lastActivity: Date | null;
}

interface SpeakerActivity {
  id: string;
  label: string;
  lastActive: Date;
  chunks: number;
}

const translations = {
  fr: {
    title: "Écoute Ambiante",
    status: "Statut",
    inactive: "Inactif",
    active: "Actif",
    listening: "En écoute",
    processing: "Traitement",
    startListening: "Démarrer l'écoute",
    stopListening: "Arrêter l'écoute",
    speakers: "Interlocuteurs",
    chunks: "Segments",
    processed: "Traités",
    duration: "Durée",
    audioLevel: "Niveau audio",
    lastActivity: "Dernière activité",
    noActivity: "Aucune activité",
    error: "Erreur",
  },
  en: {
    title: "Ambient Listening",
    status: "Status",
    inactive: "Inactive",
    active: "Active",
    listening: "Listening",
    processing: "Processing",
    startListening: "Start Listening",
    stopListening: "Stop Listening",
    speakers: "Speakers",
    chunks: "Chunks",
    processed: "Processed",
    duration: "Duration",
    audioLevel: "Audio Level",
    lastActivity: "Last Activity",
    noActivity: "No Activity",
    error: "Error",
  },
};

export function AmbientListeningPanel({
  isActive,
  onToggle,
  onAudioChunk,
  language,
}: AmbientListeningPanelProps) {
  const [processor, setProcessor] = useState<ContinuousAudioProcessor | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AmbientStats>({
    totalChunks: 0,
    processedChunks: 0,
    speakersDetected: 0,
    averageAudioLevel: 0,
    sessionDuration: 0,
    lastActivity: null,
  });
  const [speakers, setSpeakers] = useState<SpeakerActivity[]>([]);
  const [currentAudioLevel, setCurrentAudioLevel] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const t = translations[language];

  // Initialize processor when panel becomes active
  useEffect(() => {
    if (isActive && !processor) {
      initializeProcessor();
    }
    
    return () => {
      if (processor) {
        cleanup();
      }
    };
  }, [isActive]);

  // Update session duration timer
  useEffect(() => {
    if (!isListening || !startTime) return;
    
    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setStats(prev => ({ ...prev, sessionDuration: duration }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isListening, startTime]);

  const initializeProcessor = async () => {
    try {
      setError(null);
      
      const audioProcessor = new ContinuousAudioProcessor({
        chunkDurationMs: 30000, // 30 seconds
        overlapMs: 3000, // 3 second overlap
        vadEnabled: true,
        speakerIdEnabled: true,
      });

      const callbacks: ProcessingCallbacks = {
        onChunkReady: handleChunkReady,
        onVoiceActivity: handleVoiceActivity,
        onSpeakerDetected: handleSpeakerDetected,
        onError: handleProcessingError,
        onAudioLevel: setCurrentAudioLevel,
      };

      await audioProcessor.initialize();
      audioProcessor.setCallbacks(callbacks);
      
      setProcessor(audioProcessor);
      console.log('🎙️ Ambient listening processor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ambient processor:', error);
      setError(error instanceof Error ? error.message : 'Initialization failed');
    }
  };

  const handleChunkReady = async (chunk: AudioChunk) => {
    console.log(`🎙️ Ambient chunk ready: ${chunk.id}`);
    
    setStats(prev => ({
      ...prev,
      totalChunks: prev.totalChunks + 1,
      lastActivity: new Date(),
    }));

    try {
      setIsProcessing(true);
      await onAudioChunk(chunk);
      
      setStats(prev => ({
        ...prev,
        processedChunks: prev.processedChunks + 1,
      }));
      
      console.log(`✅ Ambient chunk processed: ${chunk.id}`);
    } catch (error) {
      console.error(`❌ Failed to process ambient chunk ${chunk.id}:`, error);
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceActivity = (isActive: boolean, level: number) => {
    setCurrentAudioLevel(level);
    
    if (isActive) {
      setStats(prev => ({
        ...prev,
        averageAudioLevel: (prev.averageAudioLevel + level) / 2,
        lastActivity: new Date(),
      }));
    }
  };

  const handleSpeakerDetected = (speakerId: string, label: string) => {
    setSpeakers(prev => {
      const existing = prev.find(s => s.id === speakerId);
      if (existing) {
        return prev.map(s => 
          s.id === speakerId 
            ? { ...s, lastActive: new Date(), chunks: s.chunks + 1 }
            : s
        );
      } else {
        setStats(prevStats => ({
          ...prevStats,
          speakersDetected: prevStats.speakersDetected + 1,
        }));
        
        return [...prev, {
          id: speakerId,
          label,
          lastActive: new Date(),
          chunks: 1,
        }];
      }
    });
  };

  const handleProcessingError = (error: Error) => {
    console.error('❌ Ambient processing error:', error);
    setError(error.message);
  };

  const toggleListening = async () => {
    if (!processor) {
      setError('Processor not initialized');
      return;
    }

    try {
      if (isListening) {
        await processor.stopContinuousRecording();
        setIsListening(false);
        setStartTime(null);
        setCurrentAudioLevel(0);
      } else {
        await processor.startContinuousRecording();
        setIsListening(true);
        setStartTime(new Date());
        setError(null);
      }
    } catch (error) {
      console.error('❌ Failed to toggle ambient listening:', error);
      setError(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  const cleanup = () => {
    if (processor) {
      processor.cleanup();
      setProcessor(null);
    }
    setIsListening(false);
    setIsProcessing(false);
    setCurrentAudioLevel(0);
    setStartTime(null);
    setStats({
      totalChunks: 0,
      processedChunks: 0,
      speakersDetected: 0,
      averageAudioLevel: 0,
      sessionDuration: 0,
      lastActivity: null,
    });
    setSpeakers([]);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (error) return 'destructive';
    if (isProcessing) return 'secondary';
    if (isListening) return 'default';
    return 'outline';
  };

  const getStatusText = () => {
    if (error) return t.error;
    if (isProcessing) return t.processing;
    if (isListening) return t.listening;
    return isActive ? t.active : t.inactive;
  };

  if (!isActive) {
    return null;
  }

  return (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            {t.title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()} className="text-xs">
              {getStatusText()}
            </Badge>
            
            <Button
              onClick={isActive ? toggleListening : onToggle}
              variant={isListening ? "destructive" : "default"}
              size="sm"
              disabled={!!error}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-1" />
                  {t.stopListening}
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-1" />
                  {t.startListening}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Audio Level Monitor */}
        {isListening && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Volume2 className="h-4 w-4" />
                {t.audioLevel}
              </span>
              <span>{currentAudioLevel}%</span>
            </div>
            <Progress value={currentAudioLevel} className="h-2" />
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-2 bg-white rounded-lg border">
            <div className="font-semibold text-blue-600">{stats.totalChunks}</div>
            <div className="text-muted-foreground">{t.chunks}</div>
          </div>
          
          <div className="text-center p-2 bg-white rounded-lg border">
            <div className="font-semibold text-green-600">{stats.processedChunks}</div>
            <div className="text-muted-foreground">{t.processed}</div>
          </div>
          
          <div className="text-center p-2 bg-white rounded-lg border">
            <div className="font-semibold text-purple-600">{stats.speakersDetected}</div>
            <div className="text-muted-foreground">{t.speakers}</div>
          </div>
          
          <div className="text-center p-2 bg-white rounded-lg border">
            <div className="font-semibold text-orange-600">
              {formatDuration(stats.sessionDuration)}
            </div>
            <div className="text-muted-foreground">{t.duration}</div>
          </div>
        </div>

        {/* Speaker Activity */}
        {speakers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              {t.speakers} ({speakers.length})
            </div>
            <div className="space-y-1">
              {speakers.map(speaker => (
                <div key={speaker.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {speaker.label}
                    </Badge>
                    <span>{speaker.chunks} chunks</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {speaker.lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Activity */}
        {stats.lastActivity && (
          <div className="text-xs text-muted-foreground text-center">
            {t.lastActivity}: {stats.lastActivity.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}