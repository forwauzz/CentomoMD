import { AIProcessingConfig } from './ai-processing-types';

// CNESST Form AI Processing Configuration
export const cnsstAIConfig: AIProcessingConfig = {
  formType: 'cnesst-medical',
  globalContext: {
    medicalTerminology: true,
    documentType: 'MI Template Medical Assessment',
    language: 'fr'
  },
  rules: [
    // Section 7 - Histoire et évolution (History and Evolution)
    {
      fieldId: 'histoire_evolution',
      processingType: 'format',
      language: 'fr',
      contextFields: ['diagnostic_principal', 'date_accident'],
      prompt: 'Format this medical history text according to Quebec medical documentation standards. Ensure proper medical terminology and professional presentation suitable for CNESST assessment.'
    },
    
    // Section 7 - Voice dictation enhancement
    {
      fieldId: 'histoire_evolution_dictation',
      processingType: 'enhance',
      language: 'fr',
      contextFields: ['diagnostic_principal'],
      prompt: 'Enhanced voice transcript for medical history section. Correct medical terminology and improve readability while maintaining the original meaning.'
    },

    // Section 8 - Distribution fields
    {
      fieldId: 'examen_physique_input',
      processingType: 'distribute',
      language: 'fr',
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

    // Section 8 - Voice dictation enhancement
    {
      fieldId: 'examen_physique_dictation',
      processingType: 'enhance',
      language: 'fr',
      contextFields: ['diagnostic_principal'],
      prompt: 'Enhanced voice transcript for physical examination section. Correct medical terminology and improve readability.'
    },

    // Section 11 - Conclusion generation
    {
      fieldId: 'conclusion_generate',
      processingType: 'generate',
      language: 'fr',
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
    }
  ]
};