import { aiProcessingEngine } from './ai-processing-engine';

// Legacy wrapper functions for backward compatibility
// These maintain the existing API while using the new processing engine

export async function formatSection7Text(rawText: string, language: 'fr' | 'en' = 'fr'): Promise<string> {
  const result = await aiProcessingEngine.processField(
    {
      fieldId: 'histoire_evolution',
      processingType: 'format',
      language: language,
      contextFields: ['diagnostic_principal'],
      prompt: 'Format this medical history text according to Quebec medical documentation standards. Ensure proper medical terminology and professional presentation suitable for CNESST assessment.'
    },
    {
      formData: { 'histoire_evolution': rawText },
      formType: 'cnesst-medical',
      language: language
    }
  );

  if (result.success && result.processedData) {
    return result.processedData['histoire_evolution'] || rawText;
  }
  
  return rawText;
}

export async function enhanceSection7Dictation(transcript: string, language: 'fr' | 'en' = 'fr'): Promise<{
  enhancedText: string;
  confidence: number;
}> {
  const result = await aiProcessingEngine.processField(
    {
      fieldId: 'histoire_evolution_dictation',
      processingType: 'enhance',
      language: language,
      contextFields: ['diagnostic_principal'],
      prompt: 'Enhanced voice transcript for medical history section. Correct medical terminology and improve readability while maintaining the original meaning.'
    },
    {
      formData: { 'histoire_evolution_dictation': transcript },
      formType: 'cnesst-medical',
      language: language
    }
  );

  if (result.success && result.processedData) {
    return {
      enhancedText: result.processedData['histoire_evolution_dictation'] || transcript,
      confidence: result.processedData.confidence || 0.9
    };
  }
  
  return { enhancedText: transcript, confidence: 0.5 };
}

export async function formatSection8Text(rawText: string, language: 'fr' | 'en' = 'fr'): Promise<string> {
  const result = await aiProcessingEngine.processField(
    {
      fieldId: 'examen_physique_input',
      processingType: 'distribute',
      language: language,
      targetFields: [
        'examen_attitude_marche',
        'examen_inspection_palpation',
        'examen_amplitudes_articulaires',
        'examen_force_musculaire',
        'examen_reflexes',
        'examen_tests_speciaux',
        'examen_membre_sain'
      ],
      contextFields: ['diagnostic_principal', 'histoire_evolution'],
      prompt: 'Distribute this physical examination description into the appropriate subsections. Analyze the text and place relevant content in each category.'
    },
    {
      formData: { 'examen_physique_input': rawText },
      formType: 'cnesst-medical',
      language: language
    }
  );

  if (result.success && result.processedData) {
    // Return a summary or the original text - the actual distribution is handled separately
    return `Distributed to ${Object.keys(result.processedData).length} sections`;
  }
  
  return rawText;
}

export async function enhanceSection8Dictation(transcript: string, language: 'fr' | 'en' = 'fr'): Promise<{
  enhancedText: string;
  confidence: number;
}> {
  const result = await aiProcessingEngine.processField(
    {
      fieldId: 'examen_physique_dictation',
      processingType: 'enhance',
      language: language,
      contextFields: ['diagnostic_principal'],
      prompt: 'Enhanced voice transcript for physical examination section. Correct medical terminology and improve readability.'
    },
    {
      formData: { 'examen_physique_dictation': transcript },
      formType: 'cnesst-medical',
      language: language
    }
  );

  if (result.success && result.processedData) {
    return {
      enhancedText: result.processedData['examen_physique_dictation'] || transcript,
      confidence: result.processedData.confidence || 0.9
    };
  }
  
  return { enhancedText: transcript, confidence: 0.5 };
}

export async function generateSection11Conclusion(formData: any, language: 'fr' | 'en' = 'fr'): Promise<{
  conclusion: string;
  confidence: number;
}> {
  const result = await aiProcessingEngine.processField(
    {
      fieldId: 'conclusion_generate',
      processingType: 'generate',
      language: language,
      contextFields: [
        'diagnostic_principal',
        'histoire_evolution',
        'examen_attitude_marche',
        'examen_inspection_palpation',
        'examen_amplitudes_articulaires',
        'examen_force_musculaire',
        'limitations_fonctionnelles'
      ],
      dependencies: ['diagnostic_principal'],
      prompt: 'Generate a comprehensive medical conclusion for this CNESST assessment based on the provided examination findings and patient history.'
    },
    {
      formData: formData,
      formType: 'cnesst-medical',
      language: language
    }
  );

  if (result.success && result.processedData) {
    return {
      conclusion: result.processedData['conclusion_generate'] || '',
      confidence: result.processedData.confidence || 0.9
    };
  }
  
  return { conclusion: '', confidence: 0.5 };
}

// New function for distributed section 8 processing
export async function distributeSection8Text(rawText: string, language: 'fr' | 'en' = 'fr'): Promise<{
  distributions: Record<string, string>;
  success: boolean;
}> {
  const result = await aiProcessingEngine.processField(
    {
      fieldId: 'examen_physique_input',
      processingType: 'distribute',
      language: language,
      targetFields: [
        'examen_attitude_marche',
        'examen_inspection_palpation',
        'examen_amplitudes_articulaires',
        'examen_force_musculaire',
        'examen_reflexes',
        'examen_tests_speciaux',
        'examen_membre_sain'
      ],
      contextFields: ['diagnostic_principal', 'histoire_evolution'],
      prompt: 'Distribute this physical examination description into the appropriate subsections. Analyze the text and place relevant content in each category.'
    },
    {
      formData: { 'examen_physique_input': rawText },
      formType: 'cnesst-medical',
      language: language
    }
  );

  if (result.success && result.processedData) {
    return {
      distributions: result.processedData,
      success: true
    };
  }
  
  return { distributions: {}, success: false };
}