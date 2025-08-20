import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Type, Mic, Info, Zap, Clock, Shield } from "lucide-react";
import { TranscriptionMode, TRANSCRIPTION_MODE_CONFIGS } from "@shared/transcription-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TranscriptionModeSelectorProps {
  currentMode: TranscriptionMode;
  onModeChange: (mode: TranscriptionMode) => void;
  language: 'fr' | 'en';
  disabled?: boolean;
}

const modeIcons = {
  Brain: Brain,
  Type: Type,
  Mic: Mic,
};

const translations = {
  fr: {
    selectMode: "Sélectionner le mode de transcription",
    currentMode: "Mode actuel",
    features: "Fonctionnalités",
    aiEnhanced: "Amélioré par IA",
    wordLevel: "Niveau mot",
    continuous: "Continu",
    speaker: "Identification locuteur",
    realTime: "Temps réel",
    precision: "Précision maximale",
    confidence: "Score de confiance",
    tgvCompliant: "Conforme TGV",
    zeroRetention: "Zéro rétention",
    quebecOptimized: "Optimisé Québec",
    maxDuration: "Durée max",
    chunkSize: "Taille segment",
    smartDescription: "Amélioration IA avec terminologie médicale",
    wordForWordDescription: "Transcription mot à mot sans modification IA",
    transcribeDescription: "Écoute ambiante continue pour consultations",
    minutes: "min",
    seconds: "sec",
  },
  en: {
    selectMode: "Select transcription mode",
    currentMode: "Current mode",
    features: "Features",
    aiEnhanced: "AI Enhanced",
    wordLevel: "Word Level",
    continuous: "Continuous",
    speaker: "Speaker ID",
    realTime: "Real-time",
    precision: "Maximum precision",
    confidence: "Confidence scoring",
    tgvCompliant: "TGV Compliant",
    zeroRetention: "Zero retention",
    quebecOptimized: "Quebec optimized",
    maxDuration: "Max duration",
    chunkSize: "Chunk size",
    smartDescription: "AI enhancement with medical terminology",
    wordForWordDescription: "Verbatim transcription with no AI changes",
    transcribeDescription: "Continuous ambient listening for consultations",
    minutes: "min",
    seconds: "sec",
  },
};

export function TranscriptionModeSelector({
  currentMode,
  onModeChange,
  language,
  disabled = false,
}: TranscriptionModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<TranscriptionMode | null>(null);
  const t = translations[language];

  const getModeFeatures = (mode: TranscriptionMode) => {
    const config = TRANSCRIPTION_MODE_CONFIGS[mode];
    const features = [];

    if (config.settings.enhanceText) features.push(t.aiEnhanced);
    if (config.settings.wordLevelTimestamps) features.push(t.wordLevel);
    if (config.settings.continuousListening) features.push(t.continuous);
    if (config.settings.speakerIdentification) features.push(t.speaker);
    if (config.settings.realTimeDisplay) features.push(t.realTime);
    if (config.settings.confidenceScoring) features.push(t.confidence);
    if (config.settings.temperature === 0.0) features.push(t.precision);

    return features;
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 60) {
      return `${Math.floor(seconds / 60)} ${t.minutes}`;
    }
    return `${seconds} ${t.seconds}`;
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            {t.selectMode}
          </CardTitle>
          {currentMode && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t.currentMode}:</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                {React.createElement(modeIcons[TRANSCRIPTION_MODE_CONFIGS[currentMode].icon as keyof typeof modeIcons], {
                  className: "h-3 w-3"
                })}
                {language === 'fr' 
                  ? TRANSCRIPTION_MODE_CONFIGS[currentMode].name
                  : TRANSCRIPTION_MODE_CONFIGS[currentMode].name
                }
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(TRANSCRIPTION_MODE_CONFIGS) as TranscriptionMode[]).map((mode) => {
              const config = TRANSCRIPTION_MODE_CONFIGS[mode];
              const IconComponent = modeIcons[config.icon as keyof typeof modeIcons];
              const isActive = currentMode === mode;
              const isHovered = hoveredMode === mode;
              const features = getModeFeatures(mode);

              return (
                <Card
                  key={mode}
                  className={`cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : isHovered
                      ? 'ring-1 ring-blue-300 bg-blue-25 dark:bg-blue-950/10'
                      : 'hover:shadow-md'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onMouseEnter={() => !disabled && setHoveredMode(mode)}
                  onMouseLeave={() => setHoveredMode(null)}
                  onClick={() => !disabled && onModeChange(mode)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-5 w-5 ${
                        isActive ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{config.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'fr' ? (
                            mode === 'smart' ? t.smartDescription :
                            mode === 'word-for-word' ? t.wordForWordDescription :
                            t.transcribeDescription
                          ) : config.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Features */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {t.features}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {features.slice(0, 3).map((feature, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs px-1 py-0"
                            >
                              {feature}
                            </Badge>
                          ))}
                          {features.length > 3 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  +{features.length - 3}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  {features.slice(3).map((feature, index) => (
                                    <div key={index} className="text-xs">{feature}</div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Technical specs */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">{t.maxDuration}:</span>
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

                      {/* Compliance badges */}
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs px-1 py-0 bg-green-50 border-green-200">
                              <Shield className="h-2 w-2 mr-1" />
                              TGV
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              {t.tgvCompliant} - {t.zeroRetention}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        {config.settings.quebecFrenchOptimization && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 border-blue-200">
                                QC
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">{t.quebecOptimized}</div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Mode change button for mobile */}
          <div className="mt-4 md:hidden">
            <Button
              className="w-full"
              disabled={disabled}
              onClick={() => {
                const modes: TranscriptionMode[] = ['smart', 'word-for-word', 'transcribe'];
                const currentIndex = modes.indexOf(currentMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                onModeChange(modes[nextIndex]);
              }}
            >
              <Clock className="h-4 w-4 mr-2" />
              Switch Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}