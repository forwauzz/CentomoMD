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

export async function distributeSection8MedicalHistory(rawText: string, language: 'fr' | 'en' = 'fr'): Promise<{
  distributions: Record<string, string>;
  success: boolean;
}> {
  try {
    const systemPrompt = language === 'fr' ? 
      'Tu es un assistant médical spécialisé dans l\'analyse de textes médicaux. Tu dois distribuer le texte fourni dans les sous-sections appropriées de la Section 8.' :
      'You are a medical assistant specialized in analyzing medical texts. You must distribute the provided text into the appropriate Section 8 subsections.';

    const userPrompt = language === 'fr' ? 
      `Analyser ce texte médical et le distribuer dans les sous-sections de la Section 8:

1. **Appréciation subjective de l'évolution** - évaluation du patient sur son état, amélioration ou détérioration
2. **Plaintes et problèmes** - symptômes, douleurs, difficultés rapportés par le patient
3. **Impact sur AVQ/AVD** - répercussions sur les activités de la vie quotidienne et domestique

Texte à analyser:
${rawText}

Répondre en format JSON avec les clés: appreciation, plaintes, impact
Placer le contenu pertinent dans chaque catégorie selon le contexte médical.` :
      `Analyze this medical text and distribute it into Section 8 subsections:

1. **Subjective appreciation of evolution** - patient's assessment of their condition, improvement or deterioration
2. **Complaints and problems** - symptoms, pain, difficulties reported by the patient
3. **Impact on daily activities** - effects on activities of daily living and domestic activities

Text to analyze:
${rawText}

Respond in JSON format with keys: appreciation, plaintes, impact
Place relevant content in each category according to medical context.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsedContent = JSON.parse(jsonMatch[0]);
    
    return {
      distributions: {
        appreciation: parsedContent.appreciation || '',
        plaintes: parsedContent.plaintes || '',
        impact: parsedContent.impact || ''
      },
      success: true
    };
    
  } catch (error) {
    console.error('Section 8 distribution error:', error);
    return { distributions: {}, success: false };
  }
}