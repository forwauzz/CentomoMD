import React from 'react';
import { cn } from '@/lib/utils';

interface SoundBarProps {
  audioLevel: number; // 0-100
  isListening: boolean;
  isRecording: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SoundBar({ 
  audioLevel, 
  isListening, 
  isRecording, 
  size = 'md',
  className 
}: SoundBarProps) {
  const sizeClasses = {
    sm: 'w-16 h-2',
    md: 'w-24 h-3',
    lg: 'w-32 h-4'
  };

  const barCount = 8;
  const barsToShow = Math.ceil((audioLevel / 100) * barCount);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {/* Sound level bars */}
      <div className={cn("flex items-end gap-0.5", sizeClasses[size])}>
        {Array.from({ length: barCount }, (_, i) => {
          const isActive = i < barsToShow && isRecording;
          const barHeight = size === 'sm' ? 'h-1' : size === 'md' ? 'h-2' : 'h-3';
          const maxHeight = size === 'sm' ? 'h-2' : size === 'md' ? 'h-3' : 'h-4';
          
          // Different heights for visual variety
          const heights = [
            barHeight,
            size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2.5' : 'h-3.5',
            maxHeight,
            size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2.5' : 'h-3.5',
            maxHeight,
            barHeight,
            size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2.5' : 'h-3.5',
            maxHeight
          ];

          return (
            <div
              key={i}
              className={cn(
                "w-1 transition-all duration-75 rounded-sm",
                heights[i],
                isActive && isListening
                  ? "bg-green-500 animate-pulse"
                  : isActive
                  ? "bg-blue-500"
                  : "bg-gray-300 dark:bg-gray-600"
              )}
            />
          );
        })}
      </div>
      
      {/* Status indicator */}
      {isRecording && (
        <div className="flex items-center gap-1 ml-2">
          <div 
            className={cn(
              "w-2 h-2 rounded-full",
              isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )}
          />
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {isListening ? (audioLevel > 0 ? `${audioLevel}%` : 'Listening') : 'Quiet'}
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for floating button
export function SoundBarCompact({ 
  audioLevel, 
  isListening, 
  isRecording 
}: Pick<SoundBarProps, 'audioLevel' | 'isListening' | 'isRecording'>) {
  if (!isRecording) return null;
  
  const barCount = 4;
  const barsToShow = Math.ceil((audioLevel / 100) * barCount);

  return (
    <div className="flex items-center gap-0.5 absolute -top-1 -right-1">
      {Array.from({ length: barCount }, (_, i) => {
        const isActive = i < barsToShow;
        
        return (
          <div
            key={i}
            className={cn(
              "w-0.5 h-2 transition-all duration-75",
              isActive && isListening
                ? "bg-green-400 animate-pulse"
                : isActive
                ? "bg-blue-400"
                : "bg-gray-300 opacity-50"
            )}
          />
        );
      })}
    </div>
  );
}