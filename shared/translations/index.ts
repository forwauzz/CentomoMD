// Centralized Translation System for CentomoMD
// This system provides configurable UI text while preserving medical expertise in AI prompts

export interface TranslationKey {
  fr: string;
  en: string;
}

export interface Translations {
  // Common UI elements
  common: {
    back: TranslationKey;
    save: TranslationKey;
    cancel: TranslationKey;
    delete: TranslationKey;
    edit: TranslationKey;
    loading: TranslationKey;
    error: TranslationKey;
    success: TranslationKey;
    confirm: TranslationKey;
    close: TranslationKey;
    next: TranslationKey;
    previous: TranslationKey;
    submit: TranslationKey;
    clear: TranslationKey;
    copy: TranslationKey;
    search: TranslationKey;
    filter: TranslationKey;
    export: TranslationKey;
    print: TranslationKey;
    language: TranslationKey;
    français: TranslationKey;
    english: TranslationKey;
  };

  // Authentication
  auth: {
    login: TranslationKey;
    logout: TranslationKey;
    username: TranslationKey;
    password: TranslationKey;
    loginButton: TranslationKey;
    loginSuccess: TranslationKey;
    loginError: TranslationKey;
    logoutSuccess: TranslationKey;
    logoutError: TranslationKey;
    welcomeMessage: TranslationKey;
    enterUsername: TranslationKey;
    enterPassword: TranslationKey;
    connecting: TranslationKey;
    availableAccounts: TranslationKey;
    doctorAccount: TranslationKey;
    developerAccount: TranslationKey;
  };

  // Landing page
  landing: {
    title: TranslationKey;
    subtitle: TranslationKey;
    description: TranslationKey;
    loginPrompt: TranslationKey;
    copyright: TranslationKey;
    medicalEvaluations: TranslationKey;
    secureAccess: TranslationKey;
  };

  // Form selector
  formSelector: {
    title: TranslationKey;
    description: TranslationKey;
    selectForm: TranslationKey;
    openForm: TranslationKey;
    features: TranslationKey;
    availableForms: TranslationKey;
    aiCompatible: TranslationKey;
    supportedLanguages: TranslationKey;
    miTemplate: TranslationKey;
    miTemplateDescription: TranslationKey;
    userInfo: TranslationKey;
  };

  // Dictation system
  dictation: {
    title: TranslationKey;
    backToForm: TranslationKey;
    selectSection: TranslationKey;
    selectSectionFirst: TranslationKey;
    startRecording: TranslationKey;
    stopRecording: TranslationKey;
    recording: TranslationKey;
    liveTranscript: TranslationKey;
    finalText: TranslationKey;
    copyText: TranslationKey;
    clearText: TranslationKey;
    saveToSection: TranslationKey;
    enhanceWithAI: TranslationKey;
    textCopied: TranslationKey;
    textCleared: TranslationKey;
    textSaved: TranslationKey;
  };

  // Medical form sections - UI labels only (not medical content)
  medicalForm: {
    title: TranslationKey;
    formNumber: TranslationKey;
    patientInfo: TranslationKey;
    medicalHistory: TranslationKey;
    currentMedication: TranslationKey;
    historyEvolution: TranslationKey;
    subjectiveQuestionnaire: TranslationKey;
    physicalExamination: TranslationKey;
    paraclinicalExams: TranslationKey;
    conclusion: TranslationKey;
    save: TranslationKey;
    export: TranslationKey;
    draft: TranslationKey;
    final: TranslationKey;
    print: TranslationKey;
    
    // Form actions
    autoSave: TranslationKey;
    manualSave: TranslationKey;
    saveDraft: TranslationKey;
    exportPdf: TranslationKey;
    formSaved: TranslationKey;
    formError: TranslationKey;
    validationError: TranslationKey;
    
    // Navigation
    previousSection: TranslationKey;
    nextSection: TranslationKey;
    goToSection: TranslationKey;
    sectionComplete: TranslationKey;
    formProgress: TranslationKey;
  };

  // Dynamic form system
  dynamicForm: {
    formNotFound: TranslationKey;
    configurationFor: TranslationKey;
    developmentMessage: TranslationKey;
    backToForms: TranslationKey;
    fieldRequired: TranslationKey;
    fieldInvalid: TranslationKey;
    savingForm: TranslationKey;
    formSaved: TranslationKey;
    loadingForm: TranslationKey;
  };

  // AI processing
  aiProcessing: {
    enhancing: TranslationKey;
    formatting: TranslationKey;
    generating: TranslationKey;
    distributing: TranslationKey;
    aiError: TranslationKey;
    aiSuccess: TranslationKey;
    processingFailed: TranslationKey;
    apiKeyMissing: TranslationKey;
    rateLimitExceeded: TranslationKey;
  };

  // Voice recognition
  voiceRecognition: {
    notSupported: TranslationKey;
    permissionDenied: TranslationKey;
    noMicrophone: TranslationKey;
    networkError: TranslationKey;
    recognitionError: TranslationKey;
    listening: TranslationKey;
    notListening: TranslationKey;
    speakNow: TranslationKey;
  };

  // Medical form section mappings for dictation
  sections: {
    diagnosticsCnesst: TranslationKey;
    modaliteEntrevue: TranslationKey;
    age: TranslationKey;
    dominance: TranslationKey;
    emploi: TranslationKey;
    section8Input: TranslationKey;
    antecedentsMedicaux: TranslationKey;
    antecedentsChirurgicaux: TranslationKey;
    antecedentsLesion: TranslationKey;
    antecedentsCnesst: TranslationKey;
    antecedentsSaaq: TranslationKey;
    antecedentsAutres: TranslationKey;
    antecedentsAllergie: TranslationKey;
    medicationActuelle: TranslationKey;
    historiqueEvolution: TranslationKey;
    appreciationEvolution: TranslationKey;
    plaintesproblemes: TranslationKey;
    impactAvq: TranslationKey;
    observationGenerale: TranslationKey;
    rachisPalpation: TranslationKey;
    rachisInspection: TranslationKey;
    hanchesPalpation: TranslationKey;
    hanchesInspection: TranslationKey;
    examensAdditionnels: TranslationKey;
    conclusionResume: TranslationKey;
    conclusionDiagnostic: TranslationKey;
    conclusionDateConsolidation: TranslationKey;
    conclusionSoinsTraitements: TranslationKey;
    conclusionAtteintePermanente: TranslationKey;
    conclusionLimitationsFonctionnelles: TranslationKey;
    conclusionEvaluationLimitations: TranslationKey;
  };
}

// Translation utility function
export function getTranslation(
  translations: Translations,
  key: string,
  language: 'fr' | 'en' = 'fr'
): string {
  const keys = key.split('.');
  let current: any = translations;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  if (current && typeof current === 'object' && language in current) {
    return current[language];
  }
  
  console.warn(`Translation not found for key: ${key}, language: ${language}`);
  return key;
}

// Hook for using translations in React components
export function useTranslation(language: 'fr' | 'en' = 'fr') {
  return {
    t: (key: string) => getTranslation(translations, key, language),
    language
  };
}

// Main translations object - will be populated below
export const translations: Translations = {
  common: {
    back: { fr: 'Retour', en: 'Back' },
    save: { fr: 'Sauvegarder', en: 'Save' },
    cancel: { fr: 'Annuler', en: 'Cancel' },
    delete: { fr: 'Supprimer', en: 'Delete' },
    edit: { fr: 'Modifier', en: 'Edit' },
    loading: { fr: 'Chargement...', en: 'Loading...' },
    error: { fr: 'Erreur', en: 'Error' },
    success: { fr: 'Succès', en: 'Success' },
    confirm: { fr: 'Confirmer', en: 'Confirm' },
    close: { fr: 'Fermer', en: 'Close' },
    next: { fr: 'Suivant', en: 'Next' },
    previous: { fr: 'Précédent', en: 'Previous' },
    submit: { fr: 'Soumettre', en: 'Submit' },
    clear: { fr: 'Effacer', en: 'Clear' },
    copy: { fr: 'Copier', en: 'Copy' },
    search: { fr: 'Rechercher', en: 'Search' },
    filter: { fr: 'Filtrer', en: 'Filter' },
    export: { fr: 'Exporter', en: 'Export' },
    print: { fr: 'Imprimer', en: 'Print' },
    language: { fr: 'Langue', en: 'Language' },
    français: { fr: 'Français', en: 'Français' },
    english: { fr: 'English', en: 'English' }
  },

  auth: {
    login: { fr: 'Connexion', en: 'Login' },
    logout: { fr: 'Déconnexion', en: 'Logout' },
    username: { fr: 'Nom d\'utilisateur', en: 'Username' },
    password: { fr: 'Mot de passe', en: 'Password' },
    loginButton: { fr: 'Se connecter', en: 'Sign In' },
    loginSuccess: { fr: 'Connexion réussie', en: 'Login successful' },
    loginError: { fr: 'Erreur de connexion', en: 'Login error' },
    logoutSuccess: { fr: 'Déconnexion réussie', en: 'Logout successful' },
    logoutError: { fr: 'Erreur lors de la déconnexion', en: 'Error during logout' },
    welcomeMessage: { fr: 'Bienvenue dans CentomoMD', en: 'Welcome to CentomoMD' },
    enterUsername: { fr: 'Entrez votre nom d\'utilisateur', en: 'Enter your username' },
    enterPassword: { fr: 'Entrez votre mot de passe', en: 'Enter your password' },
    connecting: { fr: 'Connexion...', en: 'Connecting...' },
    availableAccounts: { fr: 'Comptes disponibles :', en: 'Available accounts:' },
    doctorAccount: { fr: 'Dr. Centomo:', en: 'Dr. Centomo:' },
    developerAccount: { fr: 'Développeur:', en: 'Developer:' }
  },

  landing: {
    title: { fr: 'CentomoMD', en: 'CentomoMD' },
    subtitle: { fr: 'Évaluations Médicales', en: 'Medical Evaluations' },
    description: { fr: 'Accès sécurisé aux formulaires d\'évaluation médicale', en: 'Secure access to medical evaluation forms' },
    loginPrompt: { fr: 'Connexion', en: 'Login' },
    copyright: { fr: '© 2025 CentomoMD', en: '© 2025 CentomoMD' },
    medicalEvaluations: { fr: 'CNESST', en: 'CNESST' },
    secureAccess: { fr: 'Plateforme d\'évaluation médicale digitale', en: 'Digital medical evaluation platform' }
  },

  formSelector: {
    title: { fr: 'Sélection de formulaire', en: 'Form Selection' },
    description: { fr: 'Choisissez le type de formulaire que vous souhaitez utiliser', en: 'Choose the type of form you want to use' },
    selectForm: { fr: 'Sélectionner un formulaire', en: 'Select a form' },
    openForm: { fr: 'Ouvrir le formulaire', en: 'Open Form' },
    features: { fr: 'Fonctionnalités:', en: 'Features:' },
    availableForms: { fr: 'Formulaires disponibles', en: 'Available Forms' },
    aiCompatible: { fr: 'Compatibilité IA', en: 'AI Compatible' },
    supportedLanguages: { fr: 'Langues supportées', en: 'Supported Languages' },
    miTemplate: { fr: 'MI Template', en: 'MI Template' },
    miTemplateDescription: { fr: 'Modèle d\'évaluation médicale complet avec IA intégrée', en: 'Complete medical evaluation template with integrated AI' },
    userInfo: { fr: 'Informations utilisateur', en: 'User information' }
  },

  dictation: {
    title: { fr: 'Dictée Médicale', en: 'Voice Dictation' },
    backToForm: { fr: 'Retour au formulaire', en: 'Back to Form' },
    selectSection: { fr: 'Sélectionner une section', en: 'Select a section' },
    selectSectionFirst: { fr: 'Veuillez d\'abord sélectionner une section', en: 'Please select a section first' },
    startRecording: { fr: 'Commencer l\'enregistrement', en: 'Start Recording' },
    stopRecording: { fr: 'Arrêter l\'enregistrement', en: 'Stop Recording' },
    recording: { fr: 'Enregistrement en cours...', en: 'Recording...' },
    liveTranscript: { fr: 'Transcription en direct', en: 'Live Transcript' },
    finalText: { fr: 'Texte final', en: 'Final Text' },
    copyText: { fr: 'Copier le texte', en: 'Copy Text' },
    clearText: { fr: 'Effacer le texte', en: 'Clear Text' },
    saveToSection: { fr: 'Sauvegarder dans la section', en: 'Save to Section' },
    enhanceWithAI: { fr: 'Améliorer avec l\'IA', en: 'Enhance with AI' },
    textCopied: { fr: 'Texte copié dans le presse-papiers', en: 'Text copied to clipboard' },
    textCleared: { fr: 'Texte effacé', en: 'Text cleared' },
    textSaved: { fr: 'Texte sauvegardé dans la section', en: 'Text saved to section' }
  },

  medicalForm: {
    title: { fr: 'MI Template', en: 'MI Template' },
    formNumber: { fr: 'Numéro de formulaire', en: 'Form number' },
    patientInfo: { fr: 'Informations patient', en: 'Patient information' },
    medicalHistory: { fr: 'Antécédents médicaux', en: 'Medical history' },
    currentMedication: { fr: 'Médication actuelle', en: 'Current medication' },
    historyEvolution: { fr: 'Historique et évolution', en: 'History and evolution' },
    subjectiveQuestionnaire: { fr: 'Questionnaire subjectif', en: 'Subjective questionnaire' },
    physicalExamination: { fr: 'Examen physique', en: 'Physical examination' },
    paraclinicalExams: { fr: 'Examens paracliniques', en: 'Paraclinical examinations' },
    conclusion: { fr: 'Conclusion', en: 'Conclusion' },
    save: { fr: 'Sauvegarder', en: 'Save' },
    export: { fr: 'Exporter', en: 'Export' },
    draft: { fr: 'Brouillon', en: 'Draft' },
    final: { fr: 'Final', en: 'Final' },
    print: { fr: 'Imprimer', en: 'Print' },
    
    autoSave: { fr: 'Sauvegarde automatique', en: 'Auto save' },
    manualSave: { fr: 'Sauvegarde manuelle', en: 'Manual save' },
    saveDraft: { fr: 'Sauvegarder le brouillon', en: 'Save draft' },
    exportPdf: { fr: 'Exporter en PDF', en: 'Export as PDF' },
    formSaved: { fr: 'Formulaire sauvegardé', en: 'Form saved' },
    formError: { fr: 'Erreur de formulaire', en: 'Form error' },
    validationError: { fr: 'Erreur de validation', en: 'Validation error' },
    
    previousSection: { fr: 'Section précédente', en: 'Previous section' },
    nextSection: { fr: 'Section suivante', en: 'Next section' },
    goToSection: { fr: 'Aller à la section', en: 'Go to section' },
    sectionComplete: { fr: 'Section complète', en: 'Section complete' },
    formProgress: { fr: 'Progression du formulaire', en: 'Form progress' }
  },

  dynamicForm: {
    formNotFound: { fr: 'Formulaire non trouvé', en: 'Form Not Found' },
    configurationFor: { fr: 'Configuration de formulaire dynamique pour:', en: 'Dynamic form configuration for:' },
    developmentMessage: { fr: 'Cette page sera développée avec le rendu dynamique des champs de formulaire.', en: 'This page will be developed with dynamic form field rendering.' },
    backToForms: { fr: 'Retour aux formulaires', en: 'Back to Forms' },
    fieldRequired: { fr: 'Ce champ est requis', en: 'This field is required' },
    fieldInvalid: { fr: 'Ce champ est invalide', en: 'This field is invalid' },
    savingForm: { fr: 'Sauvegarde du formulaire...', en: 'Saving form...' },
    formSaved: { fr: 'Formulaire sauvegardé', en: 'Form saved' },
    loadingForm: { fr: 'Chargement du formulaire...', en: 'Loading form...' }
  },

  aiProcessing: {
    enhancing: { fr: 'Amélioration IA en cours...', en: 'AI enhancing...' },
    formatting: { fr: 'Formatage IA en cours...', en: 'AI formatting...' },
    generating: { fr: 'Génération IA en cours...', en: 'AI generating...' },
    distributing: { fr: 'Distribution IA en cours...', en: 'AI distributing...' },
    aiError: { fr: 'Erreur IA', en: 'AI error' },
    aiSuccess: { fr: 'Traitement IA réussi', en: 'AI processing successful' },
    processingFailed: { fr: 'Échec du traitement', en: 'Processing failed' },
    apiKeyMissing: { fr: 'Clé API manquante', en: 'API key missing' },
    rateLimitExceeded: { fr: 'Limite de taux dépassée', en: 'Rate limit exceeded' }
  },

  voiceRecognition: {
    notSupported: { fr: 'Reconnaissance vocale non supportée', en: 'Voice recognition not supported' },
    permissionDenied: { fr: 'Permission microphone refusée', en: 'Microphone permission denied' },
    noMicrophone: { fr: 'Aucun microphone détecté', en: 'No microphone detected' },
    networkError: { fr: 'Erreur réseau', en: 'Network error' },
    recognitionError: { fr: 'Erreur de reconnaissance', en: 'Recognition error' },
    listening: { fr: 'Écoute...', en: 'Listening...' },
    notListening: { fr: 'Arrêté', en: 'Stopped' },
    speakNow: { fr: 'Parlez maintenant', en: 'Speak now' }
  },

  sections: {
    diagnosticsCnesst: { fr: '2. Diagnostics acceptés par la CNESST', en: '2. Diagnoses Accepted by CNESST' },
    modaliteEntrevue: { fr: '3. Modalité de l\'entrevue', en: '3. Interview Modality' },
    age: { fr: '4. Identification - Âge', en: '4. Identification - Age' },
    dominance: { fr: '4. Identification - Dominance', en: '4. Identification - Dominance' },
    emploi: { fr: '4. Identification - Emploi', en: '4. Identification - Employment' },
    section8Input: { fr: '8. Saisie globale - Questionnaire subjectif', en: '8. Global Input - Subjective Questionnaire' },
    antecedentsMedicaux: { fr: '5. Antécédents - Médicaux', en: '5. Medical History - Medical' },
    antecedentsChirurgicaux: { fr: '5. Antécédents - Chirurgicaux', en: '5. Medical History - Surgical' },
    antecedentsLesion: { fr: '5. Antécédents - Au site et au pourtour de la lésion', en: '5. Medical History - At and around lesion site' },
    antecedentsCnesst: { fr: '5. Antécédents - CNESST', en: '5. Medical History - CNESST' },
    antecedentsSaaq: { fr: '5. Antécédents - SAAQ', en: '5. Medical History - SAAQ' },
    antecedentsAutres: { fr: '5. Antécédents - Autres', en: '5. Medical History - Other' },
    antecedentsAllergie: { fr: '5. Antécédents - Allergie', en: '5. Medical History - Allergies' },
    medicationActuelle: { fr: '6. Médication actuelle', en: '6. Current Medication' },
    historiqueEvolution: { fr: '7. Historique de faits et évolution', en: '7. History of Facts and Evolution' },
    appreciationEvolution: { fr: '8. Appréciation subjective de l\'évolution', en: '8. Subjective Appreciation of Evolution' },
    plaintesproblemes: { fr: '8. Plaintes et problèmes', en: '8. Complaints and Problems' },
    impactAvq: { fr: '8. Impact sur AVQ/AVD', en: '8. Impact on ADL/IADL' },
    observationGenerale: { fr: '9. Observation générale et attitude', en: '9. General Observation and Attitude' },
    rachisPalpation: { fr: '9. Rachis - Palpation', en: '9. Spine - Palpation' },
    rachisInspection: { fr: '9. Rachis - Inspection', en: '9. Spine - Inspection' },
    hanchesPalpation: { fr: '9. Hanches - Palpation', en: '9. Hips - Palpation' },
    hanchesInspection: { fr: '9. Hanches - Inspection', en: '9. Hips - Inspection' },
    examensAdditionnels: { fr: '9. Examens additionnels', en: '9. Additional Examinations' },
    conclusionResume: { fr: '11. Conclusion - Résumé', en: '11. Conclusion - Summary' },
    conclusionDiagnostic: { fr: '11. Conclusion - Diagnostic', en: '11. Conclusion - Diagnosis' },
    conclusionDateConsolidation: { fr: '11. Conclusion - Date de consolidation', en: '11. Conclusion - Consolidation Date' },
    conclusionSoinsTraitements: { fr: '11. Conclusion - Nature des soins', en: '11. Conclusion - Nature of Care' },
    conclusionAtteintePermanente: { fr: '11. Conclusion - Atteinte permanente', en: '11. Conclusion - Permanent Impairment' },
    conclusionLimitationsFonctionnelles: { fr: '11. Conclusion - Limitations fonctionnelles', en: '11. Conclusion - Functional Limitations' },
    conclusionEvaluationLimitations: { fr: '11. Conclusion - Évaluation des limitations', en: '11. Conclusion - Limitations Assessment' }
  }
};