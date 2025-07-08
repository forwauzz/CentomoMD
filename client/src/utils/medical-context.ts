// Enhanced medical context processing for Quebec healthcare
// Provides medical abbreviation expansion and terminology correction
// Integrated with voice commands processing for comprehensive text enhancement

import { 
  processVoiceCommands, 
  separateProtectedRegions, 
  unmarkTemplates,
  hasProtectedRegions,
  type CommandProcessingResult 
} from './voice-commands';

interface MedicalCorrection {
  pattern: RegExp;
  replacement: string;
  confidence: number;
}

// Quebec medical abbreviations and common terms
const quebecMedicalTerms: MedicalCorrection[] = [
  // Common abbreviations
  { pattern: /\bm\.?i\.?\b/gi, replacement: "myocardial infarction", confidence: 0.9 },
  { pattern: /\bc\.?v\.?a\.?\b/gi, replacement: "accident vasculaire cérébral", confidence: 0.9 },
  { pattern: /\bi\.?v\.?\b/gi, replacement: "intraveineux", confidence: 0.8 },
  { pattern: /\bp\.?o\.?\b/gi, replacement: "per os", confidence: 0.8 },
  { pattern: /\bs\.?c\.?\b/gi, replacement: "sous-cutané", confidence: 0.8 },
  { pattern: /\bi\.?m\.?\b/gi, replacement: "intramusculaire", confidence: 0.8 },
  
  // Anatomical terms
  { pattern: /\bgenou droit\b/gi, replacement: "genou droit", confidence: 1.0 },
  { pattern: /\bgenou gauche\b/gi, replacement: "genou gauche", confidence: 1.0 },
  { pattern: /\bépaule droite\b/gi, replacement: "épaule droite", confidence: 1.0 },
  { pattern: /\bépaule gauche\b/gi, replacement: "épaule gauche", confidence: 1.0 },
  
  // Medical conditions (French)
  { pattern: /\barthrose\b/gi, replacement: "arthrose", confidence: 1.0 },
  { pattern: /\barthrite\b/gi, replacement: "arthrite", confidence: 1.0 },
  { pattern: /\btendinite\b/gi, replacement: "tendinite", confidence: 1.0 },
  { pattern: /\bbursite\b/gi, replacement: "bursite", confidence: 1.0 },
  { pattern: /\bfracture\b/gi, replacement: "fracture", confidence: 1.0 },
  { pattern: /\bluxation\b/gi, replacement: "luxation", confidence: 1.0 },
  { pattern: /\bentorse\b/gi, replacement: "entorse", confidence: 1.0 },
  
  // Ligament terms
  { pattern: /\bl\.?c\.?i\.?\b/gi, replacement: "ligament croisé interne", confidence: 0.9 },
  { pattern: /\bl\.?c\.?e\.?\b/gi, replacement: "ligament croisé externe", confidence: 0.9 },
  { pattern: /\blachman\b/gi, replacement: "Lachman", confidence: 1.0 },
  { pattern: /\bpivot\b/gi, replacement: "pivot", confidence: 1.0 },
  
  // Common medical phrases
  { pattern: /\bdouleur chronique\b/gi, replacement: "douleur chronique", confidence: 1.0 },
  { pattern: /\bdouleur aiguë\b/gi, replacement: "douleur aiguë", confidence: 1.0 },
  { pattern: /\bhistorique de\b/gi, replacement: "historique de", confidence: 1.0 },
  { pattern: /\bantécédents\b/gi, replacement: "antécédents", confidence: 1.0 },
];

// English medical terms for bilingual support
const englishMedicalTerms: MedicalCorrection[] = [
  // Common abbreviations
  { pattern: /\bm\.?i\.?\b/gi, replacement: "myocardial infarction", confidence: 0.9 },
  { pattern: /\bc\.?v\.?a\.?\b/gi, replacement: "cerebrovascular accident", confidence: 0.9 },
  { pattern: /\bi\.?v\.?\b/gi, replacement: "intravenous", confidence: 0.8 },
  { pattern: /\bp\.?o\.?\b/gi, replacement: "per os", confidence: 0.8 },
  { pattern: /\bs\.?c\.?\b/gi, replacement: "subcutaneous", confidence: 0.8 },
  { pattern: /\bi\.?m\.?\b/gi, replacement: "intramuscular", confidence: 0.8 },
  
  // Anatomical terms
  { pattern: /\bright knee\b/gi, replacement: "right knee", confidence: 1.0 },
  { pattern: /\bleft knee\b/gi, replacement: "left knee", confidence: 1.0 },
  { pattern: /\bright shoulder\b/gi, replacement: "right shoulder", confidence: 1.0 },
  { pattern: /\bleft shoulder\b/gi, replacement: "left shoulder", confidence: 1.0 },
  
  // Ligament terms
  { pattern: /\ba\.?c\.?l\.?\b/gi, replacement: "anterior cruciate ligament", confidence: 0.9 },
  { pattern: /\bp\.?c\.?l\.?\b/gi, replacement: "posterior cruciate ligament", confidence: 0.9 },
  { pattern: /\blachman\b/gi, replacement: "Lachman", confidence: 1.0 },
];

export function enhanceMedicalTranscript(
  text: string, 
  language: 'fr' | 'en' = 'fr'
): { enhanced: string; corrections: number } {
  if (!text.trim()) return { enhanced: text, corrections: 0 };
  
  const terms = language === 'fr' ? quebecMedicalTerms : englishMedicalTerms;
  let enhanced = text;
  let corrections = 0;
  
  terms.forEach(term => {
    const matches = enhanced.match(term.pattern);
    if (matches && term.confidence > 0.7) {
      enhanced = enhanced.replace(term.pattern, term.replacement);
      corrections += matches.length;
    }
  });
  
  return { enhanced, corrections };
}

export function validateMedicalContext(text: string, language: 'fr' | 'en' = 'fr'): {
  isValid: boolean;
  confidence: number;
  suggestions: string[];
} {
  const medicalKeywords = language === 'fr' 
    ? ['douleur', 'historique', 'antécédents', 'évolution', 'examen', 'diagnostic']
    : ['pain', 'history', 'examination', 'diagnosis', 'symptoms', 'treatment'];
  
  const wordCount = text.split(/\s+/).length;
  const medicalWords = medicalKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  
  const confidence = wordCount > 0 ? (medicalWords / Math.min(wordCount, 20)) : 0;
  const isValid = confidence > 0.1 || wordCount < 5; // Short phrases are usually valid
  
  const suggestions: string[] = [];
  if (!isValid && language === 'fr') {
    suggestions.push("Considérez inclure des termes médicaux comme 'douleur', 'historique', ou 'évolution'");
  } else if (!isValid && language === 'en') {
    suggestions.push("Consider including medical terms like 'pain', 'history', or 'examination'");
  }
  
  return { isValid, confidence, suggestions };
}

// Confidence scoring for transcript quality
export function calculateTranscriptConfidence(
  originalText: string,
  enhancedText: string,
  corrections: number
): number {
  const originalLength = originalText.length;
  const enhancedLength = enhancedText.length;
  
  if (originalLength === 0) return 0;
  
  // Base confidence on text length and correction ratio
  const lengthScore = Math.min(originalLength / 100, 1); // Longer text = higher confidence
  const correctionPenalty = corrections / originalLength; // Too many corrections = lower confidence
  
  return Math.max(0.5, lengthScore - correctionPenalty * 0.3);
}

// Verbatim sections processing - handles "open/close parenthesis" voice commands
export function processVerbatimSections(transcript: string): {
  processedText: string;
  hasVerbatim: boolean;
  verbatimSections: string[];
  verbatimCount: number;
} {
  if (!transcript.trim()) {
    return {
      processedText: transcript,
      hasVerbatim: false,
      verbatimSections: [],
      verbatimCount: 0
    };
  }

  // First process voice commands to convert triggers to markers
  const commandResult = processVoiceCommands(transcript);
  let text = commandResult.processedText;
  
  // Find and protect verbatim sections
  const verbatimRegex = /___VERBATIM_START___(.*?)___VERBATIM_END___/gs;
  const verbatimSections: string[] = [];
  
  text = text.replace(verbatimRegex, (match, content) => {
    const trimmedContent = content.trim();
    verbatimSections.push(trimmedContent);
    // Use a different marker to distinguish from template protection
    return ` ___VERBATIM_PROTECTED_${verbatimSections.length - 1}___ `;
  });
  
  return {
    processedText: text,
    hasVerbatim: verbatimSections.length > 0,
    verbatimSections,
    verbatimCount: verbatimSections.length
  };
}

// Restore verbatim sections after AI processing
export function restoreVerbatimSections(
  processedText: string, 
  verbatimSections: string[]
): string {
  let finalText = processedText;
  
  verbatimSections.forEach((section, index) => {
    const marker = `___VERBATIM_PROTECTED_${index}___`;
    finalText = finalText.replace(marker, section);
  });
  
  return finalText;
}

// Enhanced text processing: Voice Commands → Verbatim Protection → Medical Enhancement
export function processTranscriptWithCommands(
  transcript: string,
  language: 'fr' | 'en' = 'fr'
): {
  finalText: string;
  commandsUsed: string[];
  medicalCorrections: number;
  confidence: number;
  verbatimSections: string[];
  hasVerbatim: boolean;
} {
  if (!transcript.trim()) {
    return {
      finalText: transcript,
      commandsUsed: [],
      medicalCorrections: 0,
      confidence: 0,
      verbatimSections: [],
      hasVerbatim: false
    };
  }

  // Step 1: Process verbatim sections first (handles "open/close parenthesis")
  const verbatimResult = processVerbatimSections(transcript);
  
  // Step 2: Separate protected (template) and unprotected (user) regions
  const { regions } = separateProtectedRegions(verbatimResult.processedText);
  
  // Step 3: Apply medical enhancement only to unprotected regions
  let finalText = '';
  let totalCorrections = 0;
  
  for (const region of regions) {
    if (region.isProtected) {
      // Template regions: keep exactly as-is
      finalText += region.text;
    } else {
      // User dictated regions: enhance medically
      const { enhanced, corrections } = enhanceMedicalTranscript(region.text, language);
      finalText += enhanced;
      totalCorrections += corrections;
    }
  }
  
  // Step 4: Restore verbatim sections (bypass AI enhancement)
  const textWithVerbatim = restoreVerbatimSections(finalText, verbatimResult.verbatimSections);
  
  // Step 5: Remove template markers to get clean final text
  const cleanText = unmarkTemplates(textWithVerbatim);
  
  // Step 6: Calculate confidence
  const confidence = calculateTranscriptConfidence(transcript, cleanText, totalCorrections);
  
  return {
    finalText: cleanText,
    commandsUsed: [...(verbatimResult.processedText.includes('___VERBATIM_') ? ['verbatim'] : []), ...processVoiceCommands(transcript).commandsUsed],
    medicalCorrections: totalCorrections,
    confidence,
    verbatimSections: verbatimResult.verbatimSections,
    hasVerbatim: verbatimResult.hasVerbatim
  };
}