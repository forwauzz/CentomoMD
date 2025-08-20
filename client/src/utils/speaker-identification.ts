/**
 * Simple Speaker Identification for Medical Consultations
 * Distinguishes between doctor and patient voices using basic audio characteristics
 */

import { VoiceProfile, SpeakerSegment } from '@shared/transcription-types';

export interface SpeakerIdentificationConfig {
  enabled: boolean;
  confidenceThreshold: number;
  maxSpeakers: number;
  adaptationRate: number; // How quickly to adapt to new voice characteristics
  analysisWindowMs: number; // Window size for voice analysis
}

export class SpeakerIdentifier {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private voiceProfiles: Map<string, VoiceProfile> = new Map();
  private currentSegment: SpeakerSegment | null = null;
  private lastSpeakerId: string | null = null;
  
  private config: SpeakerIdentificationConfig = {
    enabled: true,
    confidenceThreshold: 0.6,
    maxSpeakers: 3, // Doctor, Patient, and possible third party
    adaptationRate: 0.1,
    analysisWindowMs: 1000
  };

  constructor(config?: Partial<SpeakerIdentificationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.3;
    
    console.log('🎭 Speaker Identification initialized');
  }

  analyzeVoiceCharacteristics(audioData: Float32Array): VoiceProfile {
    // Simple voice characteristic extraction
    // In a production system, this would use more sophisticated analysis
    
    const pitch = this.estimatePitch(audioData);
    const tempo = this.estimateTempo(audioData);
    const frequency = this.getFrequencyDistribution(audioData);
    
    return {
      speakerId: this.generateSpeakerId(pitch, frequency),
      characteristics: {
        pitch,
        tempo,
        frequency
      },
      confidence: 0.8, // Simplified confidence scoring
      sampleCount: 1
    };
  }

  identifySpeaker(audioData: Float32Array, timestamp: number): {
    speakerId: string;
    confidence: number;
    isNewSpeaker: boolean;
    label?: 'doctor' | 'patient' | 'unknown';
  } {
    if (!this.config.enabled) {
      return {
        speakerId: 'speaker-1',
        confidence: 1.0,
        isNewSpeaker: false,
        label: 'unknown'
      };
    }

    const voiceProfile = this.analyzeVoiceCharacteristics(audioData);
    
    // Find best matching existing profile
    let bestMatch: { profile: VoiceProfile; distance: number; id: string } | null = null;
    
    this.voiceProfiles.forEach((profile, id) => {
      const distance = this.calculateVoiceDistance(voiceProfile, profile);
      
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { profile, distance, id };
      }
    });

    const threshold = 1 - this.config.confidenceThreshold;
    let speakerId: string;
    let confidence: number;
    let isNewSpeaker = false;

    if (bestMatch && bestMatch.distance < threshold) {
      // Existing speaker
      speakerId = bestMatch.profile.speakerId;
      confidence = 1 - bestMatch.distance;
      
      // Adapt existing profile
      this.adaptVoiceProfile(bestMatch.profile, voiceProfile);
    } else {
      // New speaker
      speakerId = this.generateNewSpeakerId();
      confidence = voiceProfile.confidence;
      isNewSpeaker = true;
      
      // Store new profile
      this.voiceProfiles.set(speakerId, voiceProfile);
      
      // Limit number of speakers
      if (this.voiceProfiles.size > this.config.maxSpeakers) {
        this.pruneOldestSpeaker();
      }
    }

    // Assign speaker label based on simple heuristics
    const label = this.assignSpeakerLabel(speakerId, voiceProfile);

    this.lastSpeakerId = speakerId;

    return {
      speakerId,
      confidence,
      isNewSpeaker,
      label
    };
  }

  createSpeakerSegment(
    text: string, 
    startTime: number, 
    endTime: number, 
    speakerId: string, 
    confidence: number
  ): SpeakerSegment {
    const label = this.getSpeakerLabel(speakerId);
    
    return {
      speakerId,
      startTime,
      endTime,
      text,
      confidence,
      label
    };
  }

  getSpeakerProfiles(): VoiceProfile[] {
    const profiles: VoiceProfile[] = [];
    this.voiceProfiles.forEach((profile) => {
      profiles.push(profile);
    });
    return profiles;
  }

  getSpeakerLabel(speakerId: string): 'doctor' | 'patient' | 'unknown' {
    const profile = this.voiceProfiles.get(speakerId);
    if (!profile) return 'unknown';
    
    // Simple heuristic: first speaker is often doctor, second is patient
    const speakerKeys: string[] = [];
    this.voiceProfiles.forEach((_, id) => {
      speakerKeys.push(id);
    });
    const speakerIndex = speakerKeys.indexOf(speakerId);
    
    switch (speakerIndex) {
      case 0: return 'doctor';
      case 1: return 'patient';
      default: return 'unknown';
    }
  }

  reset(): void {
    this.voiceProfiles.clear();
    this.currentSegment = null;
    this.lastSpeakerId = null;
    console.log('🔄 Speaker profiles reset');
  }

  private estimatePitch(audioData: Float32Array): number {
    // Simple autocorrelation-based pitch estimation
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
    
    let bestCorrelation = 0;
    let bestPeriod = minPeriod;
    
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < audioData.length - period; i++) {
        correlation += audioData[i] * audioData[i + period];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return sampleRate / bestPeriod; // Fundamental frequency
  }

  private estimateTempo(audioData: Float32Array): number {
    // Simple energy-based tempo estimation
    const windowSize = 1024;
    let energySum = 0;
    let energyCount = 0;
    
    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += audioData[i + j] * audioData[i + j];
      }
      energySum += energy;
      energyCount++;
    }
    
    return energySum / energyCount; // Average energy (proxy for tempo)
  }

  private getFrequencyDistribution(audioData: Float32Array): number[] {
    // Simple frequency band energy distribution
    const bands = [200, 500, 1000, 2000, 4000]; // Hz boundaries
    const distribution: number[] = [];
    
    // This is a simplified version - real implementation would use FFT
    for (let i = 0; i < bands.length; i++) {
      let energy = 0;
      const start = Math.floor((audioData.length * i) / bands.length);
      const end = Math.floor((audioData.length * (i + 1)) / bands.length);
      
      for (let j = start; j < end; j++) {
        energy += audioData[j] * audioData[j];
      }
      
      distribution.push(energy / (end - start));
    }
    
    return distribution;
  }

  private calculateVoiceDistance(profile1: VoiceProfile, profile2: VoiceProfile): number {
    // Simple Euclidean distance between voice characteristics
    const pitchDiff = Math.abs(profile1.characteristics.pitch - profile2.characteristics.pitch) / 400; // Normalize
    const tempoDiff = Math.abs(profile1.characteristics.tempo - profile2.characteristics.tempo) / 1000; // Normalize
    
    let freqDiff = 0;
    for (let i = 0; i < Math.min(profile1.characteristics.frequency.length, profile2.characteristics.frequency.length); i++) {
      freqDiff += Math.abs(profile1.characteristics.frequency[i] - profile2.characteristics.frequency[i]);
    }
    freqDiff /= profile1.characteristics.frequency.length;
    
    return Math.sqrt(pitchDiff * pitchDiff + tempoDiff * tempoDiff + freqDiff * freqDiff);
  }

  private adaptVoiceProfile(existing: VoiceProfile, newProfile: VoiceProfile): void {
    const rate = this.config.adaptationRate;
    
    // Exponential moving average for adaptation
    existing.characteristics.pitch = existing.characteristics.pitch * (1 - rate) + 
                                   newProfile.characteristics.pitch * rate;
    existing.characteristics.tempo = existing.characteristics.tempo * (1 - rate) + 
                                   newProfile.characteristics.tempo * rate;
    
    for (let i = 0; i < existing.characteristics.frequency.length; i++) {
      existing.characteristics.frequency[i] = existing.characteristics.frequency[i] * (1 - rate) + 
                                            newProfile.characteristics.frequency[i] * rate;
    }
    
    existing.sampleCount++;
  }

  private generateSpeakerId(pitch: number, frequency: number[]): string {
    // Generate consistent ID based on voice characteristics
    const pitchBucket = Math.floor(pitch / 50) * 50; // Round to nearest 50 Hz
    const freqSum = frequency.reduce((sum, f) => sum + f, 0);
    return `speaker-${pitchBucket}-${Math.floor(freqSum * 1000)}`;
  }

  private generateNewSpeakerId(): string {
    return `speaker-${this.voiceProfiles.size + 1}`;
  }

  private assignSpeakerLabel(speakerId: string, profile: VoiceProfile): 'doctor' | 'patient' | 'unknown' {
    // Simple heuristic: lower pitch typically indicates male (often doctor in consultations)
    // Higher pitch typically indicates female (could be patient or female doctor)
    // This is a very basic heuristic and should be improved in production
    
    const speakerKeys: string[] = [];
    this.voiceProfiles.forEach((_, id) => {
      speakerKeys.push(id);
    });
    const speakerIndex = speakerKeys.indexOf(speakerId);
    
    if (speakerIndex === 0) {
      return 'doctor'; // First speaker is usually the doctor
    } else if (speakerIndex === 1) {
      return 'patient'; // Second speaker is usually the patient
    } else {
      return 'unknown'; // Additional speakers
    }
  }

  private pruneOldestSpeaker(): void {
    // Remove speaker with lowest sample count
    let oldestSpeaker: string | null = null;
    let lowestSampleCount = Infinity;
    
    this.voiceProfiles.forEach((profile, id) => {
      if (profile.sampleCount < lowestSampleCount) {
        lowestSampleCount = profile.sampleCount;
        oldestSpeaker = id;
      }
    });
    
    if (oldestSpeaker) {
      this.voiceProfiles.delete(oldestSpeaker);
      console.log(`🗑️ Pruned speaker profile: ${oldestSpeaker}`);
    }
  }

  cleanup(): void {
    this.reset();
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    this.audioContext = null;
    console.log('🧹 Speaker Identification cleaned up');
  }
}

// Factory function
export function createSpeakerIdentifier(config?: Partial<SpeakerIdentificationConfig>): SpeakerIdentifier {
  return new SpeakerIdentifier(config);
}