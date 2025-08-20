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
  const t = translations[language];

  return (
    <div className="space-y-2">
      {/* Compact 3-button layout */}
      <div className="flex gap-2">
        {(Object.keys(TRANSCRIPTION_MODE_CONFIGS) as TranscriptionMode[]).map((mode) => {
          const config = TRANSCRIPTION_MODE_CONFIGS[mode];
          const IconComponent = modeIcons[config.icon as keyof typeof modeIcons];
          const isActive = currentMode === mode;
          
          // Get just the first word for compact display
          const shortName = config.name.split(' ')[0];
          
          return (
            <Button
              key={mode}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={`flex-1 h-10 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onModeChange(mode)}
              disabled={disabled}
            >
              <IconComponent className="h-4 w-4 mr-2" />
              <span className="text-xs font-medium">
                {shortName}
              </span>
            </Button>
          );
        })}
      </div>
      
      {/* Minimal status line */}
      <div className="text-xs text-muted-foreground text-center">
        {TRANSCRIPTION_MODE_CONFIGS[currentMode]?.settings.enhanceText 
          ? (language === 'fr' ? 'IA Améliorée' : 'AI Enhanced')
          : (language === 'fr' ? 'Brut' : 'Raw')
        } • {TRANSCRIPTION_MODE_CONFIGS[currentMode]?.settings.quebecFrenchOptimization 
          ? 'QC' : 'STD'
        }
      </div>
    </div>
  );
}