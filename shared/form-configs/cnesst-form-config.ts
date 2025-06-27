// CNESST Form Configuration - Phase 1
// Configuration-driven representation of the existing CNESST medical evaluation form

import type { FormConfig } from './form-config.types';
import { CommonValidationRules } from './form-validator';

export const cnesstFormConfig: FormConfig = {
  id: 'cnesst-medical-evaluation',
  title: {
    fr: 'MI Template',
    en: 'MI Template'
  },
  description: {
    fr: 'Modèle d\'évaluation médicale pour les évaluations médicales complètes',
    en: 'Medical Evaluation Template for comprehensive medical assessments'
  },
  version: '1.0.0',
  
  metadata: {
    author: 'Dr. Centomo',
    created: '2025-01-01',
    updated: '2025-01-01',
    category: 'medical-evaluation',
    tags: ['cnesst', 'workers-compensation', 'medical', 'quebec'],
  },

  settings: {
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    allowDrafts: true,
    requireAuthentication: true,
    retentionDays: 365,
    exportFormats: ['pdf', 'json'],
    languages: ['fr', 'en'],
    defaultLanguage: 'fr',
  },

  // Static sections metadata for translation
  staticSections: {
    sectionA: {
      fr: "A. RENSEIGNEMENTS SUR LE TRAVAILLEUR",
      en: "A. WORKER INFORMATION"
    },
    sectionB: {
      fr: "B. RENSEIGNEMENTS SUR LE MÉDECIN", 
      en: "B. PHYSICIAN INFORMATION"
    },
    sectionC: {
      fr: "C. RAPPORT",
      en: "C. REPORT"
    }
  },

  sections: [
    // Section 1: Mandat de l'évaluation
    {
      id: 'section1',
      title: {
        fr: '1. Mandat de l\'évaluation',
        en: '1. Evaluation Mandate'
      },
      type: 'checkbox-group',
      defaultOpen: true,
      description: {
        fr: 'Sélectionnez les éléments du mandat d\'évaluation',
        en: 'Select the elements of the evaluation mandate'
      },
      fields: [
        {
          id: 'mandatDiagnostic',
          label: {
            fr: 'Diagnostic',
            en: 'Diagnosis'
          },
          type: 'checkbox',
          required: false,
        },
        {
          id: 'mandatConsolidation',
          label: {
            fr: 'Date de consolidation',
            en: 'Consolidation Date'
          },
          type: 'checkbox',
          required: false,
        },
        {
          id: 'mandatSoins',
          label: {
            fr: 'Soins et traitements',
            en: 'Care and Treatments'
          },
          type: 'checkbox',
          required: false,
        },
        {
          id: 'mandatAtteinte',
          label: {
            fr: 'Atteinte permanente',
            en: 'Permanent Impairment'
          },
          type: 'checkbox',
          required: false,
        },
        {
          id: 'mandatAtteintePourcentage',
          label: {
            fr: 'Pourcentage d\'atteinte permanente',
            en: 'Permanent Impairment Percentage'
          },
          type: 'checkbox',
          required: false,
        },
        {
          id: 'mandatLimitations',
          label: {
            fr: 'Limitations fonctionnelles',
            en: 'Functional Limitations'
          },
          type: 'checkbox',
          required: false,
        },
        {
          id: 'mandatLimitationsEvaluation',
          label: {
            fr: 'Évaluation des limitations fonctionnelles',
            en: 'Functional Limitations Assessment'
          },
          type: 'checkbox',
          required: false,
        },
      ],
      layout: {
        columns: 2,
        gap: 'md',
      },
    },

    // Section 2: Diagnostics acceptés par la CNESST
    {
      id: 'section2',
      title: '2. Diagnostics acceptés par la CNESST',
      type: 'static',
      defaultOpen: false,
      staticContent: 'Cette section affiche les diagnostics officiellement acceptés par la CNESST pour ce dossier.',
      fields: [
        {
          id: 'diagnosticsCnesst',
          label: 'Diagnostics CNESST',
          type: 'textarea',
          placeholder: 'Entrez les diagnostics acceptés par la CNESST...',
          required: false,
        },
      ],
    },

    // Section 3: Modalité de l'entrevue
    {
      id: 'section3',
      title: '3. Modalité de l\'entrevue',
      type: 'form',
      defaultOpen: false,
      fields: [
        {
          id: 'modaliteEntrevue',
          label: 'Modalité de l\'entrevue',
          type: 'select',
          required: false,
          options: [
            { value: 'en-personne', label: 'En personne' },
            { value: 'virtuelle', label: 'Virtuelle' },
            { value: 'telephonique', label: 'Téléphonique' },
            { value: 'mixte', label: 'Mixte' },
          ],
          placeholder: 'Sélectionnez la modalité...',
        },
      ],
    },

    // Section 4: Identification
    {
      id: 'section4',
      title: '4. Identification',
      type: 'form',
      defaultOpen: false,
      fields: [
        {
          id: 'age',
          label: 'Âge',
          type: 'number',
          required: false,
          placeholder: 'Âge du patient',
          validation: [
            {
              type: 'custom',
              value: 'value >= 0 && value <= 150',
              message: 'L\'âge doit être entre 0 et 150 ans',
            },
          ],
        },
        {
          id: 'dominance',
          label: 'Dominance',
          type: 'select',
          required: false,
          options: [
            { value: 'droite', label: 'Droite' },
            { value: 'gauche', label: 'Gauche' },
            { value: 'ambidextre', label: 'Ambidextre' },
          ],
          placeholder: 'Sélectionnez la dominance...',
        },
        {
          id: 'emploi',
          label: 'Emploi',
          type: 'text',
          required: false,
          placeholder: 'Description de l\'emploi du patient',
        },
      ],
      layout: {
        columns: 3,
        gap: 'md',
      },
    },

    // Section 5: Antécédents
    {
      id: 'section5',
      title: '5. Antécédents',
      type: 'form',
      defaultOpen: false,
      fields: [
        {
          id: 'antecedentsMedicaux',
          label: 'Antécédents médicaux',
          type: 'textarea',
          required: false,
          placeholder: 'Décrivez les antécédents médicaux...',
        },
        {
          id: 'antecedentsChirurgicaux',
          label: 'Antécédents chirurgicaux',
          type: 'textarea',
          required: false,
          placeholder: 'Décrivez les antécédents chirurgicaux...',
        },
        {
          id: 'antecedentsLesion',
          label: 'Antécédents de lésions',
          type: 'textarea',
          required: false,
          placeholder: 'Décrivez les antécédents de lésions...',
        },
        {
          id: 'antecedentsCnesst',
          label: 'Antécédents CNESST',
          type: 'textarea',
          required: false,
          placeholder: 'Antécédents liés à la CNESST...',
        },
        {
          id: 'antecedentsSaaq',
          label: 'Antécédents SAAQ',
          type: 'textarea',
          required: false,
          placeholder: 'Antécédents liés à la SAAQ...',
        },
        {
          id: 'antecedentsAutres',
          label: 'Autres antécédents',
          type: 'textarea',
          required: false,
          placeholder: 'Autres antécédents pertinents...',
        },
        {
          id: 'antecedentsAllergie',
          label: 'Allergies',
          type: 'text',
          required: false,
          placeholder: 'Allergies connues...',
        },
        {
          id: 'antecedentsTabac',
          label: 'Tabac',
          type: 'text',
          required: false,
          placeholder: 'Consommation de tabac...',
        },
        {
          id: 'antecedentsCannabis',
          label: 'Cannabis',
          type: 'text',
          required: false,
          placeholder: 'Consommation de cannabis...',
        },
        {
          id: 'antecedentsAlcool',
          label: 'Alcool',
          type: 'text',
          required: false,
          placeholder: 'Consommation d\'alcool...',
        },
      ],
      layout: {
        columns: 2,
        gap: 'md',
      },
    },

    // Section 6: Médication actuelle
    {
      id: 'section6',
      title: '6. Médication actuelle',
      type: 'form',
      defaultOpen: false,
      fields: [
        {
          id: 'medicationActuelle',
          label: 'Médication actuelle',
          type: 'textarea',
          required: false,
          placeholder: 'Listez la médication actuelle du patient...',
        },
      ],
    },

    // Section 7: Historique de faits et évolution
    {
      id: 'section7',
      title: '7. Historique de faits et évolution',
      type: 'ai-enhanced',
      defaultOpen: false,
      aiProcessing: {
        type: 'format',
        prompt: 'Format this medical history text according to Quebec medical documentation standards. Organize information chronologically and ensure professional medical terminology.',
        inputFields: ['historiqueEvolution'],
        outputFields: ['historiqueEvolution'],
      },
      fields: [
        {
          id: 'historiqueEvolution',
          label: 'Historique de faits et évolution',
          type: 'ai-enhanced',
          required: false,
          placeholder: 'Décrivez l\'historique des faits et l\'évolution de la condition...',
          aiProcessing: {
            type: 'format',
            prompt: 'Format this medical history according to Quebec standards',
          },
        },
      ],
    },

    // Section 8: Questionnaire subjectif et état actuel
    {
      id: 'section8',
      title: '8. Questionnaire subjectif et état actuel',
      type: 'ai-enhanced',
      defaultOpen: false,
      aiProcessing: {
        type: 'distribute',
        prompt: 'Distribute this subjective assessment text into appropriate subsections based on medical evaluation standards.',
        inputFields: ['section8Input'],
        outputFields: ['appreciationEvolution', 'plaintesproblemes', 'impactAvq'],
      },
      fields: [
        {
          id: 'section8Input',
          label: 'Questionnaire subjectif (texte principal)',
          type: 'ai-enhanced',
          required: false,
          placeholder: 'Entrez le questionnaire subjectif complet...',
          aiProcessing: {
            type: 'distribute',
            prompt: 'Distribute into subsections',
          },
        },
        {
          id: 'appreciationEvolution',
          label: 'Appréciation de l\'évolution',
          type: 'textarea',
          required: false,
          placeholder: 'Appréciation de l\'évolution par le patient...',
        },
        {
          id: 'plaintesproblemes',
          label: 'Plaintes et problèmes',
          type: 'textarea',
          required: false,
          placeholder: 'Plaintes et problèmes rapportés...',
        },
        {
          id: 'impactAvq',
          label: 'Impact sur les AVQ',
          type: 'textarea',
          required: false,
          placeholder: 'Impact sur les activités de la vie quotidienne...',
        },
      ],
    },

    // Section 9: Examen Physique (simplified for demo)
    {
      id: 'section9',
      title: '9. Examen Physique',
      type: 'medical-exam',
      defaultOpen: false,
      fields: [
        {
          id: 'examenPoids',
          label: 'Poids (kg)',
          type: 'number',
          required: false,
          placeholder: 'Poids en kilogrammes',
        },
        {
          id: 'examenTaille',
          label: 'Taille (cm)',
          type: 'number',
          required: false,
          placeholder: 'Taille en centimètres',
        },
        {
          id: 'examenDominance',
          label: 'Dominance',
          type: 'select',
          required: false,
          options: [
            { value: 'droite', label: 'Droite' },
            { value: 'gauche', label: 'Gauche' },
          ],
        },
        {
          id: 'observationGenerale',
          label: 'Observation générale',
          type: 'textarea',
          required: false,
          placeholder: 'Observations générales de l\'examen physique...',
        },
      ],
      layout: {
        columns: 2,
        gap: 'md',
      },
    },

    // Section 10: Examens paracliniques
    {
      id: 'section10',
      title: '10. Examens paracliniques',
      type: 'static',
      defaultOpen: false,
      staticContent: 'Cette section présente les examens paracliniques pertinents pour l\'évaluation.',
    },

    // Section 11: Conclusion
    {
      id: 'section11',
      title: '11. Conclusion',
      type: 'ai-enhanced',
      defaultOpen: false,
      aiProcessing: {
        type: 'generate',
        prompt: 'Generate a comprehensive medical conclusion based on all form data, following Quebec medical documentation standards.',
        dependencies: ['section7', 'section8', 'section9'],
      },
      fields: [
        {
          id: 'resume',
          label: 'Résumé',
          type: 'textarea',
          required: false,
          placeholder: 'Résumé de l\'évaluation...',
        },
        {
          id: 'diagnostic',
          label: 'Diagnostic',
          type: 'textarea',
          required: false,
          placeholder: 'Diagnostic médical...',
        },
        {
          id: 'dateConsolidation',
          label: 'Date de consolidation',
          type: 'text',
          required: false,
          placeholder: 'Date de consolidation...',
        },
        {
          id: 'soinsTraitements',
          label: 'Soins et traitements',
          type: 'textarea',
          required: false,
          placeholder: 'Soins et traitements recommandés...',
        },
        {
          id: 'atteintePermanente',
          label: 'Atteinte permanente',
          type: 'textarea',
          required: false,
          placeholder: 'Description de l\'atteinte permanente...',
        },
        {
          id: 'limitationsFonctionnelles',
          label: 'Limitations fonctionnelles',
          type: 'textarea',
          required: false,
          placeholder: 'Description des limitations fonctionnelles...',
        },
        {
          id: 'evaluationLimitations',
          label: 'Évaluation des limitations',
          type: 'textarea',
          required: false,
          placeholder: 'Évaluation détaillée des limitations...',
        },
      ],
      layout: {
        columns: 1,
        gap: 'lg',
      },
    },
  ],

  validation: {
    crossFieldValidation: [
      {
        id: 'age-employment-consistency',
        fields: ['age', 'emploi'],
        condition: '!age || !emploi || age >= 16',
        message: 'L\'âge doit être cohérent avec l\'emploi déclaré',
      },
      {
        id: 'weight-height-realistic',
        fields: ['examenPoids', 'examenTaille'],
        condition: '!examenPoids || !examenTaille || (examenPoids > 20 && examenPoids < 300 && examenTaille > 100 && examenTaille < 250)',
        message: 'Les mesures de poids et taille doivent être réalistes',
      },
    ],
  },
};

// Export individual sections for testing and development
export const cnesstSections = cnesstFormConfig.sections;

// Export field mappings for backward compatibility
export const cnesstFieldMappings = {
  // Section 1 mappings
  mandatDiagnostic: 'section1.mandatDiagnostic',
  mandatConsolidation: 'section1.mandatConsolidation',
  mandatSoins: 'section1.mandatSoins',
  mandatAtteinte: 'section1.mandatAtteinte',
  mandatAtteintePourcentage: 'section1.mandatAtteintePourcentage',
  mandatLimitations: 'section1.mandatLimitations',
  mandatLimitationsEvaluation: 'section1.mandatLimitationsEvaluation',
  
  // Section 2-4 mappings
  diagnosticsCnesst: 'section2.diagnosticsCnesst',
  modaliteEntrevue: 'section3.modaliteEntrevue',
  age: 'section4.age',
  dominance: 'section4.dominance',
  emploi: 'section4.emploi',
  
  // Section 5 mappings
  antecedentsMedicaux: 'section5.antecedentsMedicaux',
  antecedentsChirurgicaux: 'section5.antecedentsChirurgicaux',
  antecedentsLesion: 'section5.antecedentsLesion',
  antecedentsCnesst: 'section5.antecedentsCnesst',
  antecedentsSaaq: 'section5.antecedentsSaaq',
  antecedentsAutres: 'section5.antecedentsAutres',
  antecedentsAllergie: 'section5.antecedentsAllergie',
  antecedentsTabac: 'section5.antecedentsTabac',
  antecedentsCannabis: 'section5.antecedentsCannabis',
  antecedentsAlcool: 'section5.antecedentsAlcool',
  
  // Additional mappings can be added as needed
};