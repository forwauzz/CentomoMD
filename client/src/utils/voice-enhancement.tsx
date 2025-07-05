// Client-side voice enhancement (no OpenAI dependency)
// Extracted from server ai-formatter.ts for browser use

export interface VoiceEnhancementResult {
  original: string;
  enhanced: string;
  corrections: string[];
}

export function enhanceVoiceInput(transcript: string): VoiceEnhancementResult {
  if (!transcript || transcript.trim() === "") {
    return {
      original: transcript,
      enhanced: transcript,
      corrections: [],
    };
  }

  let enhanced = transcript;
  const corrections: string[] = [];

  // Medical terminology corrections
  const medicalCorrections = [
    // Common voice recognition errors
    { from: /\bdocter\b/gi, to: "docteur", desc: 'Fixed "docteur" spelling' },
    { from: /\bdokteur\b/gi, to: "docteur", desc: 'Fixed "docteur" spelling' },
    { from: /\bdoctore\b/gi, to: "docteur", desc: 'Fixed "docteur" spelling' },

    // Quebec worker terminology (CRITICAL for CNESST compliance)
    {
      from: /\ble patient\b/gi,
      to: "le travailleur",
      desc: "Applied Quebec worker terminology",
    },
    {
      from: /\bla patiente\b/gi,
      to: "la travailleuse",
      desc: "Applied Quebec worker terminology",
    },
    {
      from: /\bdu patient\b/gi,
      to: "du travailleur",
      desc: "Applied Quebec worker terminology",
    },
    {
      from: /\bde la patiente\b/gi,
      to: "de la travailleuse",
      desc: "Applied Quebec worker terminology",
    },

    // Medical examination terminology
    {
      from: /\bI\.R\.M\b/gi,
      to: "IRM",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bE\.M\.G\b/gi,
      to: "EMG",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bE\.C\.G\b/gi,
      to: "ECG",
      desc: "Applied medical terminology corrections",
    },

    // Anatomical terms
    {
      from: /\bsupra épineu\b/gi,
      to: "supra-épineux",
      desc: "Corrected medical terminology",
    },
    {
      from: /\bsupra épineux\b/gi,
      to: "supra-épineux",
      desc: "Corrected medical terminology",
    },
    {
      from: /\binfra épineu\b/gi,
      to: "infra-épineux",
      desc: "Corrected medical terminology",
    },
    {
      from: /\binfra épineux\b/gi,
      to: "infra-épineux",
      desc: "Corrected medical terminology",
    },

    // Treatment terminology
    {
      from: /\binfiltration cortisone\b/gi,
      to: "infiltration cortisonée",
      desc: "Fixed treatment terminology",
    },
    {
      from: /\bphysio thérapie\b/gi,
      to: "physiothérapie",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bphysiothérapie\b/gi,
      to: "physiothérapie",
      desc: "Applied medical terminology corrections",
    },

    // Equipment and procedures
    {
      from: /\bdopler\b/gi,
      to: "doppler",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bdoppler\b/gi,
      to: "doppler",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\béchograpie\b/gi,
      to: "échographie",
      desc: "Applied medical terminology corrections",
    },

    // Common medical terms
    {
      from: /\bradio graphie\b/gi,
      to: "radiographie",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bradio logie\b/gi,
      to: "radiologie",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\borthopédie\b/gi,
      to: "orthopédie",
      desc: "Applied medical terminology corrections",
    },

    // Spine-related terms
    {
      from: /\bcervical\b/gi,
      to: "cervical",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bthoracique\b/gi,
      to: "thoracique",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\blombaire\b/gi,
      to: "lombaire",
      desc: "Applied medical terminology corrections",
    },

    // Joint terms
    {
      from: /\barticulaire\b/gi,
      to: "articulaire",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bméniscal\b/gi,
      to: "méniscal",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bligamentaire\b/gi,
      to: "ligamentaire",
      desc: "Applied medical terminology corrections",
    },

    // Pain and symptoms
    {
      from: /\bdouloureux\b/gi,
      to: "douloureux",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\binflammation\b/gi,
      to: "inflammation",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\boedème\b/gi,
      to: "œdème",
      desc: "Applied medical terminology corrections",
    },

    // Mobility terms
    {
      from: /\bmobilité\b/gi,
      to: "mobilité",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bflexion\b/gi,
      to: "flexion",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\bextension\b/gi,
      to: "extension",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\babduction\b/gi,
      to: "abduction",
      desc: "Applied medical terminology corrections",
    },
    {
      from: /\badduction\b/gi,
      to: "adduction",
      desc: "Applied medical terminology corrections",
    },
  ];

  // Apply corrections
  for (const correction of medicalCorrections) {
    const before = enhanced;
    enhanced = enhanced.replace(correction.from, correction.to);
    if (before !== enhanced) {
      corrections.push(correction.desc);
    }
  }

  return {
    original: transcript,
    enhanced: enhanced.trim(),
    corrections: [...new Set(corrections)], // Remove duplicates
  };
}
