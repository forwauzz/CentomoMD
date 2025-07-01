import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CollapsibleSection } from "@/components/collapsible-section";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MedicalSelect } from "@/components/ui/medical-select";
import { DictationModal } from "@/components/dictation-modal";
import { FloatingRecordButton } from "@/components/floating-record-button";
import { FloatingNavigation } from "@/components/floating-navigation";
import { LeftNavigationPane } from "@/components/left-navigation-pane-v2";
import { AIFormatSection7 } from "@/components/ai-format-section7";
import { AIFormatSection8 } from "@/components/ai-format-section8";
import { AIGenerateSection11 } from "@/components/ai-generate-section11";
import { CopySection11 } from "@/components/copy-section11";
import { SaveFormDialog } from "@/components/save-form-dialog";
import { SavedFormsManager } from "@/components/saved-forms-manager";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useAuth } from "@/hooks/useAuth";
import { exportToPDF } from "@/lib/pdf-export";
import { exportToWord } from "@/lib/word-export-simple";
import { Mic, Save, Printer, Trash2, Eye, FileText, Globe, LogOut, User, Archive, FolderOpen, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  // Section 1: Mandat de l'évaluation (checkboxes)
  mandatDiagnostic: z.boolean().optional(),
  mandatConsolidation: z.boolean().optional(),
  mandatSoins: z.boolean().optional(),
  mandatAtteinte: z.boolean().optional(),
  mandatAtteintePourcentage: z.boolean().optional(),
  mandatLimitations: z.boolean().optional(),
  mandatLimitationsEvaluation: z.boolean().optional(),
  
  // Section 2: Diagnostics acceptés par la CNESST
  diagnosticsCnesst: z.string().optional(),
  
  // Section 3: Modalité de l'entrevue
  modaliteEntrevue: z.string().optional(),
  
  // Section 4: Identification
  age: z.string().optional(),
  dominance: z.string().optional(),
  emploi: z.string().optional(),
  
  // Section 5: Antécédents
  antecedentsMedicaux: z.string().optional(),
  antecedentsChirurgicaux: z.string().optional(),
  antecedentsLesion: z.string().optional(),
  antecedentsCnesst: z.string().optional(),
  antecedentsSaaq: z.string().optional(),
  antecedentsAutres: z.string().optional(),
  antecedentsAllergie: z.string().optional(),
  antecedentsTabac: z.string().optional(),
  antecedentsCannabis: z.string().optional(),
  antecedentsAlcool: z.string().optional(),
  
  // Section 6: Médication actuelle
  medicationActuelle: z.string().optional(),
  
  // Section 7: Historique de faits et évolution
  historiqueEvolution: z.string().optional(),
  
  // Section 8: Questionnaire subjectif et état actuel
  section8Input: z.string().optional(),
  appreciationEvolution: z.string().optional(),
  plaintesproblemes: z.string().optional(),
  impactAvq: z.string().optional(),
  
  // Section 9: Examen Physique
  examenPoids: z.string().optional(),
  examenTaille: z.string().optional(),
  examenImc: z.string().optional(),
  examenDominance: z.string().optional(),
  observationGenerale: z.string().optional(),
  rachisPalpation: z.string().optional(),
  rachisInspection: z.string().optional(),
  rachisFlexion: z.string().optional(),
  rachisExtension: z.string().optional(),
  rachisFlexionLateraleG: z.string().optional(),
  rachisFlexionLateraleD: z.string().optional(),
  rachisRotationG: z.string().optional(),
  rachisRotationD: z.string().optional(),
  rachisSlrDroit: z.string().optional(),
  rachisSlrGauche: z.string().optional(),
  rachisTripodeDroit: z.string().optional(),
  rachisTripodesGauche: z.string().optional(),
  rachisLasegueDroit: z.string().optional(),
  rachisLasegueGauche: z.string().optional(),
  rachisLasegueInverseDroit: z.string().optional(),
  rachisLasegueInverseGauche: z.string().optional(),
  hanchesPalpation: z.string().optional(),
  hanchesInspection: z.string().optional(),
  hanchesFlexionDroitActif: z.string().optional(),
  hanchesFlexionDroitPassif: z.string().optional(),
  hanchesFlexionGaucheActif: z.string().optional(),
  hanchesFlexionGauchePassif: z.string().optional(),
  hanchesExtensionDroitActif: z.string().optional(),
  hanchesExtensionDroitPassif: z.string().optional(),
  hanchesExtensionGaucheActif: z.string().optional(),
  hanchesExtensionGauchePassif: z.string().optional(),
  hanchesRotationInterneDroitActif: z.string().optional(),
  hanchesRotationInterneDroitPassif: z.string().optional(),
  hanchesRotationInterneGaucheActif: z.string().optional(),
  hanchesRotationInterneGauchePassif: z.string().optional(),
  hanchesRotationExterneDroitActif: z.string().optional(),
  hanchesRotationExterneDroitPassif: z.string().optional(),
  hanchesRotationExterneGaucheActif: z.string().optional(),
  hanchesRotationExterneGauchePassif: z.string().optional(),
  hanchesAbductionDroitActif: z.string().optional(),
  hanchesAbductionDroitPassif: z.string().optional(),
  hanchesAbductionGaucheActif: z.string().optional(),
  hanchesAbductionGauchePassif: z.string().optional(),
  hanchesAdductionDroitActif: z.string().optional(),
  hanchesAdductionDroitPassif: z.string().optional(),
  hanchesAdductionGaucheActif: z.string().optional(),
  hanchesAdductionGauchePassif: z.string().optional(),
  
  // Genoux
  genouxPalpation: z.string().optional(),
  genouxInspection: z.string().optional(),
  genouxFlexionDroitActif: z.string().optional(),
  genouxFlexionDroitPassif: z.string().optional(),
  genouxFlexionGaucheActif: z.string().optional(),
  genouxFlexionGauchePassif: z.string().optional(),
  genouxExtensionDroitActif: z.string().optional(),
  genouxExtensionDroitPassif: z.string().optional(),
  genouxExtensionGaucheActif: z.string().optional(),
  genouxExtensionGauchePassif: z.string().optional(),
  
  // Manœuvres ligamentaires genoux
  genouxLci0Droit: z.string().optional(),
  genouxLci0Gauche: z.string().optional(),
  genouxLci20Droit: z.string().optional(),
  genouxLci20Gauche: z.string().optional(),
  genouxLce0Droit: z.string().optional(),
  genouxLce0Gauche: z.string().optional(),
  genouxLce20Droit: z.string().optional(),
  genouxLce20Gauche: z.string().optional(),
  genouxLachmanDroit: z.string().optional(),
  genouxLachmanGauche: z.string().optional(),
  genouxPivotDroit: z.string().optional(),
  genouxPivotGauche: z.string().optional(),
  genouxTiroirAnterieurDroit: z.string().optional(),
  genouxTiroirAnterieurGauche: z.string().optional(),
  genouxTiroirPosterieurDroit: z.string().optional(),
  genouxTiroirPosterieurGauche: z.string().optional(),
  genouxSagPosterieurDroit: z.string().optional(),
  genouxSagPosterieurGauche: z.string().optional(),
  genouxDial30Droit: z.string().optional(),
  genouxDial30Gauche: z.string().optional(),
  genouxDial90Droit: z.string().optional(),
  genouxDial90Gauche: z.string().optional(),
  
  // Manœuvres méniscales genoux
  genouxApleyDroit: z.string().optional(),
  genouxApleyGauche: z.string().optional(),
  genouxMcMurrayDroit: z.string().optional(),
  genouxMcMurrayGauche: z.string().optional(),
  genouxThessalyDroit: z.string().optional(),
  genouxThessalyGauche: z.string().optional(),
  
  // Manoeuvres rotules
  genouxTrackingRotuleDroit: z.string().optional(),
  genouxTrackingRotuleGauche: z.string().optional(),
  genouxJSignDroit: z.string().optional(),
  genouxJSignGauche: z.string().optional(),
  genouxTranslationDroit: z.string().optional(),
  genouxTranslationGauche: z.string().optional(),
  
  // Circonférence genoux
  genouxCirconferenceCuisseDroit: z.string().optional(),
  genouxCirconferenceCuisseGauche: z.string().optional(),
  genouxCirconferenceMolletDroit: z.string().optional(),
  genouxCirconferenceMolletGauche: z.string().optional(),
  
  atrophieMusculaire: z.string().optional(),
  
  // Pieds / Chevilles
  piedsCheillesPalpation: z.string().optional(),
  piedsChevillesInspection: z.string().optional(),
  
  // Amplitude articulaire pieds/chevilles
  piedsDorsiflexionCheville: z.string().optional(),
  piedsPlantifexionCheville: z.string().optional(),
  piedsMvtsSousAstragaliensActifDroit: z.string().optional(),
  piedsMvtsSousAstragaliensPassifDroit: z.string().optional(),
  piedsMvtsSousAstragaliensActifGauche: z.string().optional(),
  piedsMvtsSousAstragaliensPassifGauche: z.string().optional(),
  piedsMvtsMidTarsienActifDroit: z.string().optional(),
  piedsMvtsMidTarsienPassifDroit: z.string().optional(),
  piedsMvtsMidTarsienActifGauche: z.string().optional(),
  piedsMvtsMidTarsienPassifGauche: z.string().optional(),
  
  // Manœuvres ligamentaires pieds/chevilles
  piedsTiroir0Droit: z.string().optional(),
  piedsTiroir0Gauche: z.string().optional(),
  piedsTiroir20Droit: z.string().optional(),
  piedsTiroir20Gauche: z.string().optional(),
  piedsVarusStressDroit: z.string().optional(),
  piedsVarusStressGauche: z.string().optional(),
  piedsLaxiteCalcaneoFibulaireDroit: z.string().optional(),
  piedsLaxiteCalcaneoFibulaireGauche: z.string().optional(),
  piedsSqueezeTestDroit: z.string().optional(),
  piedsSqueezeTestGauche: z.string().optional(),
  
  // Manœuvres spécifiques tendons pieds/chevilles
  piedsSingleHeelRaiseDroit: z.string().optional(),
  piedsSingleHeelRaiseGauche: z.string().optional(),
  piedsThompsonDroit: z.string().optional(),
  piedsThompsonGauche: z.string().optional(),
  piedsTestApprehensionDroit: z.string().optional(),
  piedsTestApprehensionGauche: z.string().optional(),
  
  // Neuro-vasculaire pieds/chevilles
  piedsNeuroVasculaire: z.string().optional(),
  
  // Forces neuro pieds/chevilles
  piedsForceL2Droit: z.string().optional(),
  piedsForceL2Gauche: z.string().optional(),
  piedsForceL3Droit: z.string().optional(),
  piedsForceL3Gauche: z.string().optional(),
  piedsForceL4Droit: z.string().optional(),
  piedsForceL4Gauche: z.string().optional(),
  piedsForceL5Droit: z.string().optional(),
  piedsForceL5Gauche: z.string().optional(),
  piedsForceS1Droit: z.string().optional(),
  piedsForceS1Gauche: z.string().optional(),
  
  // Sensibilités neuro pieds/chevilles
  piedsSensibiliteL2Droit: z.string().optional(),
  piedsSensibiliteL2Gauche: z.string().optional(),
  piedsSensibiliteL3Droit: z.string().optional(),
  piedsSensibiliteL3Gauche: z.string().optional(),
  piedsSensibiliteL4Droit: z.string().optional(),
  piedsSensibiliteL4Gauche: z.string().optional(),
  piedsSensibiliteL5Droit: z.string().optional(),
  piedsSensibiliteL5Gauche: z.string().optional(),
  piedsSensibiliteS1Droit: z.string().optional(),
  piedsSensibiliteS1Gauche: z.string().optional(),
  
  // Réflexes neuro pieds/chevilles
  piedsReflexeRotulienDroit: z.string().optional(),
  piedsReflexeRotulienGauche: z.string().optional(),
  piedsReflexeAchilleenDroit: z.string().optional(),
  piedsReflexeAchilleenGauche: z.string().optional(),
  piedsReflexeBabinskiDroit: z.string().optional(),
  piedsReflexeBabinskiGauche: z.string().optional(),
  
  // Pouls neuro pieds/chevilles
  piedsPoulsTibialPosterieurDroit: z.string().optional(),
  piedsPoulsTibialPosterieurGauche: z.string().optional(),
  piedsPoulsPedieuxDroit: z.string().optional(),
  piedsPoulsPedieuxGauche: z.string().optional(),
  
  examensAdditionnels: z.string().optional(),
  
  // Section 11: Conclusion
  conclusionResume: z.string().optional(),
  conclusionDiagnostic: z.string().optional(),
  conclusionDateConsolidation: z.string().optional(),
  conclusionSoinsTraitements: z.string().optional(),
  conclusionAtteintePermanente: z.string().optional(),
  conclusionLimitationsFonctionnelles: z.string().optional(),
  conclusionEvaluationLimitations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Language translations
const translations = {
  fr: {
    title: "CentomoMD",
    subtitle: "MI Template",
    save: "Sauvegarder",
    print: "Imprimer",
    clear: "Effacer",
    language: "Langue",
    notSaved: "Non sauvegardé",
    saved: "Sauvegardé",
    formCleared: "Formulaire effacé",
    allDataDeleted: "Toutes les données ont été supprimées.",
    confirmClear: "Êtes-vous sûr de vouloir effacer toutes les données du formulaire?",
    clearAll: "Effacer tout",
    sectionCleared: "Section effacée",
    sectionDataCleared: "Les données de la section C ont été supprimées.",
    lastSaved: "Dernière sauvegarde :",
    
    // Section A
    sectionA: "A. RENSEIGNEMENTS SUR LE TRAVAILLEUR",
    workerName: "Nom :",
    workerFirstName: "Prénom :",
    healthInsuranceNo: "No d'assurance maladie :",
    birthDate: "Date de naissance :",
    address: "Adresse :",
    phone: "Téléphone :",
    workerFileNo: "No de dossier du travailleur :",
    originEventDate: "Date de l'évènement d'origine :",
    recurrenceDate: "Date de la récidive, rechute ou aggravation :",
    
    // Section B
    sectionB: "B. RENSEIGNEMENTS SUR LE MÉDECIN",
    doctorName: "Nom :",
    doctorFirstName: "Prénom :",
    licenseNo: "No permis :",
    doctorAddress: "Adresse :",
    doctorPhone: "Téléphone :",
    email: "Courriel :",
    
    // Section C
    sectionC: "C. RAPPORT",
    evaluationMandate: "1. Mandat de l'évaluation",
    acceptedDiagnosis: "2. Diagnostics acceptés par la CNESST",
    interviewModality: "3. Modalité de l'entrevue",
    identification: "4. Identification",
    
    // Section 5
    section5: "5. Antécédents",
    medicalHistory: "Médicaux :",
    surgicalHistory: "Chirurgicaux :",
    lesionHistory: "Au site et au pourtour de la lésion :",
    cnsstHistory: "CNESST :",
    saaqHistory: "SAAQ :",
    otherHistory: "Autres :",
    allergies: "Allergie :",
    tobacco: "Tabac :",
    cannabis: "Cannabis :",
    alcohol: "Alcool :",
    
    // Section 6
    section6: "6. Médication actuelle et mesures thérapeutiques en cours",
    currentMedication: "Médication actuelle :",
    
    // Section 7
    section7: "7. Historique de faits et évolution",
    historyEvolution: "Historique de faits et évolution :",
    
    // Section 8
    section8: "8. Questionnaire subjectif et état actuel",
    evolutionAppreciation: "Appréciation subjective de l'évolution :",
    complaintsProblems: "Plaintes et problèmes :",
    avqImpact: "Impact sur AVQ/AVD :",
    
    // Section 9
    section9: "9. Examen Physique",
    weight: "Poids :",
    height: "Taille :",
    dominance: "Dominance :",
    generalObservation: "Observation générale et attitude :",
    lumbarSpine: "Rachis Lombaire :",
    palpation: "Palpation :",
    inspection: "Inspection :",
    flexion: "Flexion :",
    extension: "Extension :",
    lateralFlexionL: "Flexion Latérale G. :",
    lateralFlexionR: "Flexion Latérale D. :",
    rotationL: "Rotation G. :",
    rotationR: "Rotation D. :",
    radicularManeuvers: "Manœuvres radiculaires :",
    slrRight: "S.L.R. Droit :",
    slrLeft: "S.L.R. Gauche :",
    tripodeRight: "Tripode Droit :",
    tripodeLeft: "Tripode Gauche :",
    lasegueRight: "Lasègue Droit :",
    lasegueLeft: "Lasègue Gauche :",
    reverseLasegueRight: "Lasègue inversé Droit :",
    reverseLasegueLeft: "Lasègue inversé Gauche :",
    hips: "Hanches :",
    hipsPalpation: "Palpation :",
    hipsInspection: "Inspection :",
    articulateRange: "Amplitude articulaire :",
    activeRight: "Actif Droit :",
    passiveRight: "Passif Droit :",
    activeLeft: "Actif Gauche :",
    passiveLeft: "Passif Gauche :",
    hipsFlexion: "Flexion :",
    hipsExtension: "Extension :",
    internalRotation: "Rotation interne :",
    externalRotation: "Rotation externe :",
    abduction: "Abduction :",
    adduction: "Adduction :",
    additionalExams: "Examens additionnels :",
    
    // Section 10
    section10: "10. Examens paracliniques",
    paraclinicalExamsText: "Vous référez au point 7, Historique des faits et évolution.",
    
    // Section 11
    section11: "11. Conclusion",
    conclusionSummary: "Résumé :",
    conclusionDiagnosis: "Diagnostic :",
    conclusionConsolidationDate: "Date de consolidation :",
    conclusionCareNecessity: "Nature, nécessité́, suffisance, durée des soins ou traitements administrés ou prescrits :",
    conclusionPermanentImpairment: "Existence de l'atteinte permanente à l'intégrité́ physique ou psychique :",
    conclusionFunctionalLimitations: "Existence de limitations fonctionnelles résultant de la lésion professionnelle :",
    conclusionLimitationsEvaluation: "Évaluation des limitations fonctionnelles résultant de la lésion professionnelle :"
  },
  en: {
    title: "CentomoMD",
    subtitle: "MI Template",
    save: "Save",
    print: "Print",
    clear: "Clear",
    language: "Language",
    notSaved: "Not saved",
    saved: "Saved",
    formCleared: "Form cleared",
    allDataDeleted: "All data has been deleted.",
    confirmClear: "Are you sure you want to clear all form data?",
    clearAll: "Clear All",
    sectionCleared: "Section cleared",
    sectionDataCleared: "Section C data has been cleared.",
    lastSaved: "Last saved:",
    
    // Section A
    sectionA: "A. WORKER INFORMATION",
    workerName: "Last Name:",
    workerFirstName: "First Name:",
    healthInsuranceNo: "Health Insurance No:",
    birthDate: "Date of Birth:",
    address: "Address:",
    phone: "Phone:",
    workerFileNo: "Worker File No:",
    originEventDate: "Original Event Date:",
    recurrenceDate: "Recurrence, Relapse or Aggravation Date:",
    
    // Section B
    sectionB: "B. PHYSICIAN INFORMATION",
    doctorName: "Last Name:",
    doctorFirstName: "First Name:",
    licenseNo: "License No:",
    doctorAddress: "Address:",
    doctorPhone: "Phone:",
    email: "Email:",
    
    // Section C
    sectionC: "C. REPORT",
    evaluationMandate: "1. Evaluation Mandate",
    acceptedDiagnosis: "2. Diagnoses Accepted by CNESST",
    interviewModality: "3. Interview Modality",
    identification: "4. Identification",
    
    // Section 5
    section5: "5. Medical History",
    medicalHistory: "Medical:",
    surgicalHistory: "Surgical:",
    lesionHistory: "At and around lesion site:",
    cnsstHistory: "CNESST:",
    saaqHistory: "SAAQ:",
    otherHistory: "Other:",
    allergies: "Allergies:",
    tobacco: "Tobacco:",
    cannabis: "Cannabis:",
    alcohol: "Alcohol:",
    
    // Section 6
    section6: "6. Current Medication and Ongoing Therapeutic Measures",
    currentMedication: "Current Medication:",
    
    // Section 7
    section7: "7. History of Facts and Evolution",
    historyEvolution: "History of Facts and Evolution:",
    
    // Section 8
    section8: "8. Subjective Questionnaire and Current State",
    evolutionAppreciation: "Subjective Appreciation of Evolution:",
    complaintsProblems: "Complaints and Problems:",
    avqImpact: "Impact on ADL/IADL:",
    
    // Section 9
    section9: "9. Physical Examination",
    weight: "Weight:",
    height: "Height:",
    dominance: "Dominance:",
    generalObservation: "General Observation and Attitude:",
    lumbarSpine: "Lumbar Spine:",
    palpation: "Palpation:",
    inspection: "Inspection:",
    flexion: "Flexion:",
    extension: "Extension:",
    lateralFlexionL: "Lateral Flexion L:",
    lateralFlexionR: "Lateral Flexion R:",
    rotationL: "Rotation L:",
    rotationR: "Rotation R:",
    radicularManeuvers: "Radicular Maneuvers:",
    slrRight: "S.L.R. Right:",
    slrLeft: "S.L.R. Left:",
    tripodeRight: "Tripod Right:",
    tripodeLeft: "Tripod Left:",
    lasegueRight: "Lasègue Right:",
    lasegueLeft: "Lasègue Left:",
    reverseLasegueRight: "Reverse Lasègue Right:",
    reverseLasegueLeft: "Reverse Lasègue Left:",
    hips: "Hips:",
    hipsPalpation: "Palpation:",
    hipsInspection: "Inspection:",
    articulateRange: "Range of Motion:",
    activeRight: "Active Right:",
    passiveRight: "Passive Right:",
    activeLeft: "Active Left:",
    passiveLeft: "Passive Left:",
    hipsFlexion: "Flexion:",
    hipsExtension: "Extension:",
    internalRotation: "Internal Rotation:",
    externalRotation: "External Rotation:",
    abduction: "Abduction:",
    adduction: "Adduction:",
    additionalExams: "Additional Examinations:",
    
    // Section 10
    section10: "10. Paraclinical Examinations",
    paraclinicalExamsText: "You refer to point 7, History of facts and evolution.",
    
    // Section 11
    section11: "11. Conclusion",
    conclusionSummary: "Summary:",
    conclusionDiagnosis: "Diagnosis:",
    conclusionConsolidationDate: "Consolidation Date:",
    conclusionCareNecessity: "Nature, necessity, sufficiency, duration of care or treatments administered or prescribed:",
    conclusionPermanentImpairment: "Existence of permanent impairment to physical or psychological integrity:",
    conclusionFunctionalLimitations: "Existence of functional limitations resulting from occupational injury:",
    conclusionLimitationsEvaluation: "Evaluation of functional limitations resulting from occupational injury:"
  }
};

interface MedicalFormProps {
  language: 'fr' | 'en';
  onLanguageChange: (language: 'fr' | 'en') => void;
}

export default function MedicalForm({ language, onLanguageChange }: MedicalFormProps) {
  const [, setLocation] = useLocation();
  const [currentDictationField, setCurrentDictationField] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string>("Non sauvegardé");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedForms, setShowSavedForms] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showSavedCopies, setShowSavedCopies] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [useLeftNavigation, setUseLeftNavigation] = useState(true); // Feature flag for new navigation
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [showGenderWarning, setShowGenderWarning] = useState(false);
  const [genderInconsistencies, setGenderInconsistencies] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({
    section1: false,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
    section6: false,
    section7: false,
    section8: false,
    section9: false,
  });
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Query for draft forms count
  const { data: draftForms = [] } = useQuery<any[]>({
    queryKey: ["/api/saved-forms", "draft"],
    queryFn: () => fetch("/api/saved-forms?formType=draft", { credentials: "include" }).then(res => res.json()),
    retry: false,
  });
  
  // Query for copy forms count  
  const { data: copyForms = [] } = useQuery<any[]>({
    queryKey: ["/api/saved-forms", "copy"],
    queryFn: () => fetch("/api/saved-forms?formType=copy", { credentials: "include" }).then(res => res.json()),
    retry: false,
  });
  
  const t = translations[language];

  // Gender-aware text adaptation
  // Check for gender inconsistencies in the form
  const checkGenderConsistency = () => {
    if (!selectedGender) return;
    
    const inconsistencies: string[] = [];
    const oppositeGenderTerms = selectedGender === 'male' 
      ? ['la patiente', 'la travailleuse', 'Elle', 'elle', 'femme', 'droitière', 'gauchère', 'Madame']
      : ['le patient', 'le travailleur', 'Il', 'il', 'homme', 'droitier', 'gaucher', 'Monsieur'];
    
    // Check key fields for inconsistencies
    const fieldsToCheck = [
      { field: 'modaliteEntrevue', name: 'Modalité de l\'entrevue' },
      { field: 'age', name: 'Âge' },
      { field: 'emploi', name: 'Emploi' },
      { field: 'appreciationEvolution', name: 'Appréciation de l\'évolution' },
      { field: 'plaintesproblemes', name: 'Plaintes et problèmes' },
      { field: 'observationGenerale', name: 'Observation générale' }
    ];
    
    fieldsToCheck.forEach(({ field, name }) => {
      const value = form.getValues(field as any) || '';
      if (oppositeGenderTerms.some(term => value.includes(term))) {
        inconsistencies.push(name);
      }
    });
    
    setGenderInconsistencies(inconsistencies);
    setShowGenderWarning(inconsistencies.length > 0);
  };

  const adaptTextForGender = (text: string, gender: 'male' | 'female' | null): string => {
    if (!gender || !text) return text;
    
    const replacements = {
      // Patient references
      'la patiente': gender === 'male' ? 'le patient' : 'la patiente',
      'La patiente': gender === 'male' ? 'Le patient' : 'La patiente',
      'la travailleuse': gender === 'male' ? 'le travailleur' : 'la travailleuse',
      'La travailleuse': gender === 'male' ? 'Le travailleur' : 'La travailleuse',
      
      // Pronouns
      'Elle': gender === 'male' ? 'Il' : 'Elle',
      'elle': gender === 'male' ? 'il' : 'elle',
      
      // Descriptors
      'Madame': gender === 'male' ? 'Monsieur' : 'Madame',
      'femme': gender === 'male' ? 'homme' : 'femme',
      'Une femme': gender === 'male' ? 'Un homme' : 'Une femme',
      'une femme': gender === 'male' ? 'un homme' : 'une femme',
      
      // Past participles and adjectives
      'présentée': gender === 'male' ? 'présenté' : 'présentée',
      'vêtue': gender === 'male' ? 'vêtu' : 'vêtue',
      
      // Dominance
      'droitière': gender === 'male' ? 'droitier' : 'droitière',
      'gauchère': gender === 'male' ? 'gaucher' : 'gauchère',
    };
    
    let adaptedText = text;
    Object.entries(replacements).forEach(([from, to]) => {
      adaptedText = adaptedText.replace(new RegExp(from, 'g'), to);
    });
    
    return adaptedText;
  };

  const updateFormFieldsForGender = (gender: 'male' | 'female') => {
    // Update age field
    const currentAge = form.getValues('age') || '';
    const adaptedAge = adaptTextForGender(currentAge, gender);
    if (adaptedAge !== currentAge) {
      form.setValue('age', adaptedAge);
    }

    // Update modalite field
    const currentModalite = form.getValues('modaliteEntrevue') || '';
    const adaptedModalite = adaptTextForGender(currentModalite, gender);
    if (adaptedModalite !== currentModalite) {
      form.setValue('modaliteEntrevue', adaptedModalite);
    }

    // Update emploi field
    const currentEmploi = form.getValues('emploi') || '';
    const adaptedEmploi = adaptTextForGender(currentEmploi, gender);
    if (adaptedEmploi !== currentEmploi) {
      form.setValue('emploi', adaptedEmploi);
    }

    // Update section 8 fields
    const currentAppreciation = form.getValues('appreciationEvolution') || '';
    const adaptedAppreciation = adaptTextForGender(currentAppreciation, gender);
    if (adaptedAppreciation !== currentAppreciation) {
      form.setValue('appreciationEvolution', adaptedAppreciation);
    }

    const currentPlaintes = form.getValues('plaintesproblemes') || '';
    const adaptedPlaintes = adaptTextForGender(currentPlaintes, gender);
    if (adaptedPlaintes !== currentPlaintes) {
      form.setValue('plaintesproblemes', adaptedPlaintes);
    }

    // Update observation generale if it contains gender-specific text
    const currentObservation = form.getValues('observationGenerale') || '';
    const adaptedObservation = adaptTextForGender(currentObservation, gender);
    if (adaptedObservation !== currentObservation) {
      form.setValue('observationGenerale', adaptedObservation);
    }
  };

  const handleGenderChange = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
    
    // Check for inconsistencies before updating
    setTimeout(() => checkGenderConsistency(), 100);
    
    updateFormFieldsForGender(gender);
    
    // Update dominance field with gender-appropriate options
    form.setValue('examenDominance', ''); // Reset dominance field
  };

  const handleUpdateAllForGender = () => {
    if (!selectedGender) return;
    
    updateFormFieldsForGender(selectedGender);
    setShowGenderWarning(false);
    setGenderInconsistencies([]);
    
    toast({
      title: "Textes mis à jour",
      description: "Tous les textes ont été adaptés au genre sélectionné.",
    });
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleSectionNavigate = (sectionId: string) => {
    // Handler for left navigation section clicks
    // The actual scrolling is handled in the LeftNavigationPane component
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Section 1: Mandat de l'évaluation checkboxes
      mandatDiagnostic: false,
      mandatConsolidation: false,
      mandatSoins: false,
      mandatAtteinte: false,
      mandatAtteintePourcentage: false,
      mandatLimitations: false,
      mandatLimitationsEvaluation: false,
      
      // Section 2: Diagnostics acceptés par la CNESST
      diagnosticsCnesst: "Déchirure mollet droit.",
      
      // Section 3: Modalité de l'entrevue (Default to Site A template)
      modaliteEntrevue: `L'évaluation suivante s'est tenue dans les locaux de la clinique du Complexe Médical Nord-de-Île (CMNDI). Nous avons clairement expliqué à notre mandat d'évaluateur indépendant désigné par la CNESST dans le cadre de l'application de l'article 204 de la LATMP. Nous lui avons précisé que nous n'agirons pas en tant que médecins traitants. Notre rapport d'évaluation sera d'abord envoyé́ à la CNESST.

Nous avons procédé́ au questionnaire subjectif ainsi qu'à un examen physique détaillé́ en relation avec les lésions à évaluer, nous nous sommes assurés à la fin de l'entrevue d'avoir couvert l'ensemble de la problématique.

Nous avons revu le dossier CNESST de même que le dossier médical. Nous avons pu consulter l'ensemble des rapports et des bilans radiologiques réalisés dans le cadre de l'évaluation de la lésion.

L'entrevue s'est effectuée cordialement, la patiente participait pleinement à son entrevue. L'entrevue s'est déroulée entre.

À la fin de l'entrevue, nous avons demandé́ à si elle avait d'autres commentaires ou informations à nous divulguer. Cette dernière nous a répondu par la négative.`,
      
      // Section 4: Identification
      age: "",
      dominance: "",
      emploi: "",
      
      antecedentsMedicaux: "Diabète type 2, syndrome tunnel carpien",
      antecedentsChirurgicaux: "décompression tunnel carpien bilatéral (2014), hystérectomie (2016)",
      antecedentsLesion: "Aucun",
      antecedentsCnesst: "Aucun",
      antecedentsSaaq: "Aucun",
      antecedentsAutres: "Aucun",
      antecedentsAllergie: "Pénicilline et sulfonamides",
      antecedentsTabac: "négatif",
      antecedentsCannabis: "négatif",
      antecedentsAlcool: "négatif",
      medicationActuelle: "Arrêt de tout traitement en lien avec sa lésion (physiothérapie et ergothérapie) : atteinte de plateau thérapeutique;\n\nExercices à domicile",
      historiqueEvolution: "",
      section8Input: "",
      appreciationEvolution: "La travailleuse rapporte une nette amélioration depuis son accident. Elle rapporte que dans les derniers mois, elle a observé peu d'amélioration au niveau de sa condition et juge d'elle-même qu'elle a atteint un plateau thérapeutique en physiothérapie et ergothérapie...",
      plaintesproblemes: "Elle se plaint principalement de sensations de brûlure intermittente au niveau de son mollet droite et au niveau antérieur de sa jambe droite. Elle ne peut rapporter d'éléments déclencheurs de ses douleurs et elles surviennent subitement...",
      impactAvq: "cf feuille en annexe.",
      examenPoids: "60kg",
      examenTaille: "1.60m",
      examenImc: "",
      examenDominance: "Droitière",
      observationGenerale: "La travailleuse s'est présentée avec 10 minutes de retard pour son évaluation. À l'accueil elle se lève spontanément et l'attitude générale est exempt de positionnement antalgique...",
      rachisPalpation: "apophyses épineuses et para spinal sans douleur",
      rachisInspection: "lordose lombaire conservée",
      rachisFlexion: "90",
      rachisExtension: "30",
      rachisFlexionLateraleG: "30",
      rachisFlexionLateraleD: "30",
      rachisRotationG: "30",
      rachisRotationD: "30",
      rachisSlrDroit: "Négatif",
      rachisSlrGauche: "Négatif",
      rachisTripodeDroit: "Négatif",
      rachisTripodesGauche: "Négatif",
      rachisLasegueDroit: "Négatif",
      rachisLasegueGauche: "Négatif",
      rachisLasegueInverseDroit: "Négatif",
      rachisLasegueInverseGauche: "Négatif",
      hanchesPalpation: "grands trochanters sans douleur",
      hanchesInspection: "pas d'atrophie fessiers ou cuisse. Aucune cicatrice",
      hanchesFlexionDroitActif: "120",
      hanchesFlexionDroitPassif: "-",
      hanchesFlexionGaucheActif: "120",
      hanchesFlexionGauchePassif: "-",
      hanchesExtensionDroitActif: "30",
      hanchesExtensionDroitPassif: "-",
      hanchesExtensionGaucheActif: "30",
      hanchesExtensionGauchePassif: "-",
      hanchesRotationInterneDroitActif: "40",
      hanchesRotationInterneDroitPassif: "-",
      hanchesRotationInterneGaucheActif: "40",
      hanchesRotationInterneGauchePassif: "-",
      hanchesRotationExterneDroitActif: "50",
      hanchesRotationExterneDroitPassif: "-",
      hanchesRotationExterneGaucheActif: "50",
      hanchesRotationExterneGauchePassif: "-",
      hanchesAbductionDroitActif: "40",
      hanchesAbductionDroitPassif: "-",
      hanchesAbductionGaucheActif: "40",
      hanchesAbductionGauchePassif: "-",
      hanchesAdductionDroitActif: "20",
      hanchesAdductionDroitPassif: "-",
      hanchesAdductionGaucheActif: "20",
      hanchesAdductionGauchePassif: "-",
      
      // Genoux default values
      genouxPalpation: "",
      genouxInspection: "",
      genouxFlexionDroitActif: "",
      genouxFlexionDroitPassif: "",
      genouxFlexionGaucheActif: "",
      genouxFlexionGauchePassif: "",
      genouxExtensionDroitActif: "",
      genouxExtensionDroitPassif: "",
      genouxExtensionGaucheActif: "",
      genouxExtensionGauchePassif: "",
      
      // Manœuvres ligamentaires defaults
      genouxLci0Droit: "Sec",
      genouxLci0Gauche: "Sec",
      genouxLci20Droit: "Sec",
      genouxLci20Gauche: "Sec",
      genouxLce0Droit: "Sec",
      genouxLce0Gauche: "Sec",
      genouxLce20Droit: "Sec",
      genouxLce20Gauche: "Sec",
      genouxLachmanDroit: "Sec",
      genouxLachmanGauche: "Sec",
      genouxPivotDroit: "Sec",
      genouxPivotGauche: "Sec",
      genouxTiroirAnterieurDroit: "Sec",
      genouxTiroirAnterieurGauche: "Sec",
      genouxTiroirPosterieurDroit: "Sec",
      genouxTiroirPosterieurGauche: "Sec",
      genouxSagPosterieurDroit: "Sec",
      genouxSagPosterieurGauche: "Sec",
      genouxDial30Droit: "Sec",
      genouxDial30Gauche: "Sec",
      genouxDial90Droit: "Sec",
      genouxDial90Gauche: "Sec",
      
      // Manœuvres méniscales defaults
      genouxApleyDroit: "Négatif",
      genouxApleyGauche: "Négatif",
      genouxMcMurrayDroit: "Négatif",
      genouxMcMurrayGauche: "Négatif",
      genouxThessalyDroit: "Négatif",
      genouxThessalyGauche: "Négatif",
      
      // Manoeuvres rotules defaults
      genouxTrackingRotuleDroit: "Normal",
      genouxTrackingRotuleGauche: "Normal",
      genouxJSignDroit: "Négatif",
      genouxJSignGauche: "Négatif",
      genouxTranslationDroit: "Normale",
      genouxTranslationGauche: "Normale",
      
      // Circonférence defaults (empty for measurements)
      genouxCirconferenceCuisseDroit: "",
      genouxCirconferenceCuisseGauche: "",
      genouxCirconferenceMolletDroit: "",
      genouxCirconferenceMolletGauche: "",
      
      // Atrophie musculaire default
      atrophieMusculaire: "TBD by Dr Centomo",
      
      // Pieds / Chevilles defaults
      piedsCheillesPalpation: "",
      piedsChevillesInspection: "",
      
      // Amplitude articulaire pieds/chevilles defaults
      piedsDorsiflexionCheville: "20",
      piedsPlantifexionCheville: "40",
      piedsMvtsSousAstragaliensActifDroit: "Normal",
      piedsMvtsSousAstragaliensPassifDroit: "Normal",
      piedsMvtsSousAstragaliensActifGauche: "Normal",
      piedsMvtsSousAstragaliensPassifGauche: "Normal",
      piedsMvtsMidTarsienActifDroit: "Normal",
      piedsMvtsMidTarsienPassifDroit: "Normal",
      piedsMvtsMidTarsienActifGauche: "Normal",
      piedsMvtsMidTarsienPassifGauche: "Normal",
      
      // Manœuvres ligamentaires pieds/chevilles defaults
      piedsTiroir0Droit: "Négatif",
      piedsTiroir0Gauche: "Négatif",
      piedsTiroir20Droit: "Négatif",
      piedsTiroir20Gauche: "Négatif",
      piedsVarusStressDroit: "Négatif",
      piedsVarusStressGauche: "Négatif",
      piedsLaxiteCalcaneoFibulaireDroit: "Négatif",
      piedsLaxiteCalcaneoFibulaireGauche: "Négatif",
      piedsSqueezeTestDroit: "Négatif",
      piedsSqueezeTestGauche: "Négatif",
      
      // Manœuvres spécifiques tendons pieds/chevilles defaults
      piedsSingleHeelRaiseDroit: "Négatif",
      piedsSingleHeelRaiseGauche: "Négatif",
      piedsThompsonDroit: "Négatif",
      piedsThompsonGauche: "Négatif",
      piedsTestApprehensionDroit: "Négatif",
      piedsTestApprehensionGauche: "Négatif",
      
      // Neuro-vasculaire pieds/chevilles default
      piedsNeuroVasculaire: "",
      
      // Forces neuro pieds/chevilles defaults
      piedsForceL2Droit: "5/5",
      piedsForceL2Gauche: "5/5",
      piedsForceL3Droit: "5/5",
      piedsForceL3Gauche: "5/5",
      piedsForceL4Droit: "5/5",
      piedsForceL4Gauche: "5/5",
      piedsForceL5Droit: "5/5",
      piedsForceL5Gauche: "5/5",
      piedsForceS1Droit: "5/5",
      piedsForceS1Gauche: "5/5",
      
      // Sensibilités neuro pieds/chevilles defaults
      piedsSensibiliteL2Droit: "2/2",
      piedsSensibiliteL2Gauche: "2/2",
      piedsSensibiliteL3Droit: "2/2",
      piedsSensibiliteL3Gauche: "2/2",
      piedsSensibiliteL4Droit: "2/2",
      piedsSensibiliteL4Gauche: "2/2",
      piedsSensibiliteL5Droit: "2/2",
      piedsSensibiliteL5Gauche: "2/2",
      piedsSensibiliteS1Droit: "2/2",
      piedsSensibiliteS1Gauche: "2/2",
      
      // Réflexes neuro pieds/chevilles defaults
      piedsReflexeRotulienDroit: "2+",
      piedsReflexeRotulienGauche: "2+",
      piedsReflexeAchilleenDroit: "2+",
      piedsReflexeAchilleenGauche: "2+",
      piedsReflexeBabinskiDroit: "Négatif",
      piedsReflexeBabinskiGauche: "Négatif",
      
      // Pouls neuro pieds/chevilles defaults
      piedsPoulsTibialPosterieurDroit: "2",
      piedsPoulsTibialPosterieurGauche: "2",
      piedsPoulsPedieuxDroit: "2",
      piedsPoulsPedieuxGauche: "2",
    },
  });

  const { saveData, loadData, clearData, debouncedSave } = useAutoSave({
    key: 'centMD_formData',
    onSave: () => {
      const timeString = new Date().toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US');
      setLastSaved(language === 'fr' ? `Sauvegardé à ${timeString}` : `Saved at ${timeString}`);
    },
  });

  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: language === 'fr' ? 'fr-FR' : 'en-US',
    continuous: true,
    interimResults: true,
  });

  // Update speech recognition language when language changes
  useEffect(() => {
    if (isListening) {
      stopListening();
    }
  }, [language, stopListening, isListening]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadData();
    if (savedData) {
      form.reset(savedData);
      setLastSaved('Données récupérées');
    }
  }, [form, loadData]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      debouncedSave(data);
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  // Handle dictation results when returning from dictation page
  useEffect(() => {
    const dictationResult = sessionStorage.getItem('dictationResult');
    const dictationField = sessionStorage.getItem('dictationField');
    const scrollToSection = sessionStorage.getItem('scrollToSection');
    const highlightField = sessionStorage.getItem('highlightField');
    
    if (dictationResult && dictationField) {
      // Get current value of the field
      const currentValue = form.getValues(dictationField as any) || '';
      
      // Append the dictation result to the existing content
      const newValue = currentValue ? `${currentValue}\n\n${dictationResult}` : dictationResult;
      
      // Update the form field
      form.setValue(dictationField as any, newValue);
      
      // Clear the dictation session storage
      sessionStorage.removeItem('dictationResult');
      sessionStorage.removeItem('dictationField');
      
      // Show success message with toast
      toast({
        title: language === 'fr' ? "Dictée ajoutée" : "Dictation added",
        description: language === 'fr' 
          ? `Contenu ajouté au champ: ${dictationField}` 
          : `Content added to field: ${dictationField}`,
      });
      
      console.log(`Dictation result added to field: ${dictationField}`);
    }

    // Handle section navigation after dictation
    if (scrollToSection) {
      setTimeout(() => {
        const sectionElement = document.getElementById(scrollToSection);
        if (sectionElement) {
          sectionElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          
          // Highlight the specific field if specified
          if (highlightField) {
            const fieldElement = document.querySelector(`[name="${highlightField}"]`) as HTMLElement;
            if (fieldElement) {
              fieldElement.focus();
              fieldElement.style.outline = '3px solid #3b82f6';
              fieldElement.style.outlineOffset = '2px';
              
              // Remove highlight after 2 seconds
              setTimeout(() => {
                fieldElement.style.outline = '';
                fieldElement.style.outlineOffset = '';
              }, 2000);
            }
          }
        }
        
        // Clear navigation session storage
        sessionStorage.removeItem('scrollToSection');
        sessionStorage.removeItem('highlightField');
      }, 100); // Small delay to ensure DOM is ready
    }
  }, []); // Run only on mount

  const handleDictation = (fieldName: string) => {
    // Store the field name and language in sessionStorage for the dictation page
    sessionStorage.setItem('activeField', fieldName);
    sessionStorage.setItem('dictationLanguage', language);
    
    // Navigate to the dedicated dictation page using router
    setLocation('/dictation');
  };

  const handleDirectDictation = (text: string, fieldName: string) => {
    const currentValue = form.getValues(fieldName as keyof FormData) || '';
    form.setValue(fieldName as keyof FormData, currentValue + ' ' + text);
  };

  const handleStopDictation = () => {
    stopListening();
    setCurrentDictationField(null);
  };

  const handleClearForm = () => {
    if (confirm(t.confirmClear)) {
      form.reset();
      clearData();
      setLastSaved(t.notSaved);
      toast({
        title: t.formCleared,
        description: t.allDataDeleted,
      });
    }
  };

  const handleClearSectionC = () => {
    if (confirm(t.confirmClear)) {
      // Clear only Section C fields
      const sectionCFields = [
        'mandatDiagnostic', 'mandatConsolidation', 'mandatSoins', 'mandatAtteinte', 
        'mandatAtteintePourcentage', 'mandatLimitations', 'mandatLimitationsEvaluation',
        'diagnosticsCnesst', 'modaliteEntrevue', 'age', 'dominance', 'emploi',
        'antecedentsMedicaux', 'antecedentsChirurgicaux', 'antecedentsLesion',
        'antecedentsCnesst', 'antecedentsSaaq', 'antecedentsAutres', 'antecedentsAllergie',
        'antecedentsTabac', 'antecedentsCannabis', 'antecedentsAlcool',
        'medicamentActuel', 'historiqueEvolution'
      ];
      
      const currentValues = form.getValues();
      const resetValues = { ...currentValues };
      
      sectionCFields.forEach(field => {
        const fieldName = field as keyof FormData;
        if (typeof currentValues[fieldName] === 'boolean') {
          resetValues[fieldName] = false as any;
        } else {
          resetValues[fieldName] = '' as any;
        }
      });
      
      form.reset(resetValues);
      setLastSaved(t.notSaved);
      toast({
        title: t.sectionCleared,
        description: t.sectionDataCleared,
      });
    }
  };

  const parseSection8Content = (formattedText: string) => {
    const sections = {
      appreciation: '',
      plaintes: '',
      impact: ''
    };

    const lines = formattedText.split('\n').filter(line => line.trim());
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('Appréciation subjective de l\'évolution') || 
          trimmedLine.includes('Appréciation subjective') ||
          trimmedLine.includes('évolution')) {
        currentSection = 'appreciation';
        continue;
      } else if (trimmedLine.includes('Plaintes et problèmes') || 
                 trimmedLine.includes('Plaintes') ||
                 trimmedLine.includes('problèmes')) {
        currentSection = 'plaintes';
        continue;
      } else if (trimmedLine.includes('Impact sur AVQ/AVD') || 
                 trimmedLine.includes('Impact sur AVQ') ||
                 trimmedLine.includes('Impact')) {
        currentSection = 'impact';
        continue;
      }
      
      if (currentSection && trimmedLine && !trimmedLine.includes(':')) {
        if (currentSection === 'appreciation') {
          sections.appreciation += (sections.appreciation ? '\n' : '') + trimmedLine;
        } else if (currentSection === 'plaintes') {
          sections.plaintes += (sections.plaintes ? '\n' : '') + trimmedLine;
        } else if (currentSection === 'impact') {
          sections.impact += (sections.impact ? '\n' : '') + trimmedLine;
        }
      }
    }
    
    return sections;
  };

  const handleSave = () => {
    setShowDraftDialog(true);
  };

  const handleSaveToDraft = async () => {
    const data = form.getValues();
    const title = language === 'fr' ? "Brouillon" : "Draft";
    
    try {
      const response = await fetch("/api/saved-forms", {
        method: "POST",
        body: JSON.stringify({
          title: `${title} - ${new Date().toLocaleDateString()}`,
          formData: data,
          retentionDays: 30,
          formType: "draft"
        }),
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to save draft");
      }
      
      // Invalidate queries to update counts
      queryClient.invalidateQueries({ queryKey: ["/api/saved-forms", "draft"] });
      
      setShowDraftDialog(false);
      toast({
        title: language === 'fr' ? "Sauvegardé en brouillon" : "Saved to Draft",
        description: language === 'fr' ? "Le formulaire a été sauvegardé en brouillon avec succès." : "The form has been saved to drafts successfully.",
      });
    } catch (error) {
      console.error('Save draft error:', error);
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Erreur lors de la sauvegarde" : "Error saving draft",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const data = form.getValues();
    exportToPDF(data);
  };

  const handleExportWord = () => {
    const data = form.getValues();
    const filename = `medical-evaluation-${new Date().toISOString().split('T')[0]}.docx`;
    exportToWord(data, filename);
  };

  const handleLoadForm = (formData: any) => {
    form.reset(formData);
    setLastSaved("Formulaire chargé");
    setShowSavedForms(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur est survenue lors de la déconnexion.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row lg:gap-0">
      {/* Left Navigation Pane */}
      {useLeftNavigation && (
        <LeftNavigationPane
          language={language}
          onSectionNavigate={handleSectionNavigate}
          onSavedForms={() => setShowSavedForms(true)}
          onDrafts={() => setShowDrafts(true)}
          onSavedCopies={() => setShowSavedCopies(true)}
          onSaveDialog={() => setShowSaveDialog(true)}
          onSave={handleSave}
          onPrint={handlePrint}
          onExport={handleExportPDF}
          onClearForm={handleClearForm}
          savedFormsCount={Array.isArray(copyForms) ? copyForms.length : 0}
          completedFormsCount={Array.isArray(draftForms) ? draftForms.length : 0}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 ${useLeftNavigation ? 'lg:ml-0' : ''} w-full`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="w-full px-2 sm:px-4 py-3">
          {/* Top Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-8 w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/forms')}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">{language === 'fr' ? 'Retour' : 'Back'}</span>
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-blue-600 leading-tight truncate">{t.title}</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">{t.subtitle}</p>
                </div>
              </div>
              
              <div className="text-center hidden lg:block">
                <div className="text-base font-medium text-gray-700 leading-tight">
                  Bon retour, Dr. Centomo
                </div>
                <div className="text-xs text-gray-500">
                  Rapport d'Évaluation Médicale
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Select value={language} onValueChange={(value: 'fr' | 'en') => onLanguageChange(value)}>
                <SelectTrigger className="w-16 sm:w-20">
                  <Globe className="w-3 h-3" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">FR</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
              >
                <LogOut className="w-3 h-3" />
                <span className="ml-1 text-xs hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
          
          {/* Bottom Row - Action Buttons - Only show when left navigation is disabled */}
          {!useLeftNavigation && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4" />
                  <span className="ml-1">Sauvegarder</span>
                </Button>
                
                <Button onClick={() => setShowSaveDialog(true)} size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Archive className="w-4 h-4" />
                  <span className="ml-1">Sauvegarder</span>
                </Button>
                
                <Button onClick={() => setShowSavedForms(true)} size="sm" variant="outline">
                  <FolderOpen className="w-4 h-4" />
                  <span className="ml-1">Charger</span>
                </Button>
                
                <Button onClick={handleExportPDF} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Printer className="w-4 h-4" />
                  <span className="ml-1">Imprimer</span>
                </Button>

                <Button onClick={handleExportWord} size="sm" className="bg-green-600 hover:bg-green-700">
                  <FileText className="w-4 h-4" />
                  <span className="ml-1">Export Word</span>
                </Button>
                
                <Button onClick={handleClearForm} size="sm" variant="destructive">
                  <Trash2 className="w-4 h-4" />
                  <span className="ml-1">Effacer</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Form */}
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-8">
        <Form {...form}>
          <form className="space-y-4 sm:space-y-6">
            
            {/* Save Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6 no-print">
              <Button
                type="button"
                onClick={handleSave}
                className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 sm:px-6"
              >
                <Save className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Sauvegarder' : 'Save'}
              </Button>
              
              <Button
                type="button"
                onClick={() => setShowSaveDialog(true)}
                className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 sm:px-6"
              >
                <Archive className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Sauvegarder copie' : 'Save Copy'}
              </Button>
            </div>
            
            {/* Section A: Renseignements sur le travailleur (Static) */}
            <CollapsibleSection id="section1" title={t.sectionA}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="field-group">
                  <label className="field-label">{t.workerName}</label>
                  <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]"></div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t.workerFirstName}</label>
                  <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]"></div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t.healthInsuranceNo}</label>
                  <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]"></div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t.birthDate}</label>
                  <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]"></div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t.address}</label>
                  <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]"></div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t.phone}</label>
                  <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]"></div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t.workerFileNo}</label>
                  <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]"></div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t.originEventDate}</label>
                  <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]"></div>
                </div>
                <div className="field-group col-span-2">
                  <label className="field-label">{t.recurrenceDate}</label>
                  <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">Nil</div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Section B: Renseignements sur le médecin (Static) */}
            <CollapsibleSection id="sectionB" title={t.sectionB}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="field-group">
                    <label className="field-label">{t.doctorName}</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">CENTOMO</div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">{t.doctorFirstName}</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">Hugo</div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">{t.licenseNo}</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">1-18154</div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">{t.doctorPhone}</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">514-331-1400</div>
                  </div>
                  <div className="field-group col-span-2">
                    <label className="field-label">{t.doctorAddress}</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">5777 Boul. Gouin Ouest, Suite 370, Montréal, Qc, H4J 1E3</div>
                  </div>
                  <div className="field-group col-span-2">
                    <label className="field-label">{t.email}</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">adjointe.orthopedie@gmail.com</div>
                  </div>
                </div>
            </CollapsibleSection>

            {/* Section C: Rapport */}
            <CollapsibleSection 
              id="sectionC" 
              title={t.sectionC}
              headerActions={
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleClearSectionC}
                  className="ml-2 bg-red-600 hover:bg-red-700 text-white no-print"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t.clearAll}
                </Button>
              }
            >
              <div className="space-y-4">

                {/* 1. Mandat de l'évaluation */}
                <CollapsibleSection title="1. Mandat de l'évaluation" defaultOpen={false} id="mandat-evaluation">
                  <div className="space-y-3 text-sm">
                    <p>Le but de l'évaluation est de répondre aux points suivants de l'article de la LATMP :</p>
                    <div className="space-y-3 pl-4">
                      <FormField
                        control={form.control}
                        name="mandatDiagnostic"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              1) Diagnostic.
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mandatConsolidation"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              2) Date de consolidation.
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mandatSoins"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              3) Nature, nécessité́, suffisance, durée des soins ou traitements administrés ou prescrits.
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <p className="text-sm font-normal">4)</p>
                        <div className="pl-4 space-y-3">
                          <FormField
                            control={form.control}
                            name="mandatAtteinte"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  a) Existence de l'atteinte permanente à l'intégrité́ physique ou psychique.
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="mandatAtteintePourcentage"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  b) Pourcentage de l'atteinte permanente à l'intégrité́ physique ou psychique.
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-normal">5)</p>
                        <div className="pl-4 space-y-3">
                          <FormField
                            control={form.control}
                            name="mandatLimitations"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  a) Existence de limitations fonctionnelles résultant de la lésion professionnelle.
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="mandatLimitationsEvaluation"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  b) Évaluation des limitations fonctionnelles résultant de la lésion professionnelle.
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* 2. Diagnostics acceptés par la CNESST */}
                <CollapsibleSection title="2. Diagnostics acceptés par la CNESST" defaultOpen={false} id="section2">
                  <FormField
                    control={form.control}
                    name="diagnosticsCnesst"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-semibold text-gray-700">Diagnostics acceptés :</FormLabel>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleDictation('diagnosticsCnesst')}
                              className="no-print bg-blue-600 hover:bg-blue-700"
                            >
                              <Mic className="w-4 h-4" />
                            </Button>
                          </div>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                              placeholder="Ex: Déchirure mollet droit, entorse cheville gauche..."
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </CollapsibleSection>

                {/* 3. Modalité de l'entrevue */}
                <CollapsibleSection title="3. Modalité de l'entrevue" defaultOpen={false} id="section3">
                  <FormField
                    control={form.control}
                    name="modaliteEntrevue"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-semibold text-gray-700">Modalité de l'entrevue :</FormLabel>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const cnsstTemplateText = language === 'fr' 
                                    ? `L'évaluation suivante s'est tenue dans les locaux de la clinique du Complexe Médical Nord-de-Île (CMNDI). Nous avons clairement expliqué à notre mandat d'évaluateur indépendant désigné par la CNESST dans le cadre de l'application de l'article 204 de la LATMP. Nous lui avons précisé que nous n'agirons pas en tant que médecins traitants. Notre rapport d'évaluation sera d'abord envoyé́ à la CNESST.

Nous avons procédé́ au questionnaire subjectif ainsi qu'à un examen physique détaillé́ en relation avec les lésions à évaluer, nous nous sommes assurés à la fin de l'entrevue d'avoir couvert l'ensemble de la problématique.

Nous avons revu le dossier CNESST de même que le dossier médical. Nous avons pu consulter l'ensemble des rapports et des bilans radiologiques réalisés dans le cadre de l'évaluation de la lésion.

L'entrevue s'est effectuée cordialement, la patiente participait pleinement à son entrevue. L'entrevue s'est déroulée entre.

À la fin de l'entrevue, nous avons demandé́ à si elle avait d'autres commentaires ou informations à nous divulguer. Cette dernière nous a répondu par la négative.`
                                    : `The following evaluation was held at the Complexe Médical Nord-de-Île (CMNDI) clinic premises. We clearly explained our mandate as an independent evaluator designated by the CNESST under article 204 of the LATMP. We specified that we will not act as treating physicians. Our evaluation report will first be sent to the CNESST.

We conducted a subjective questionnaire as well as a detailed physical examination in relation to the injuries to be evaluated, ensuring at the end of the interview that we had covered the entire problem.

We reviewed the CNESST file as well as the medical file. We were able to consult all the reports and radiological assessments carried out as part of the injury evaluation.

The interview was conducted cordially, the patient participated fully in the interview. The interview took place between.

At the end of the interview, we asked if she had any other comments or information to share with us. She answered in the negative.`;
                                  
                                  field.onChange(cnsstTemplateText);
                                }}
                                className="text-xs px-3 py-1 h-auto bg-green-50 hover:bg-green-100 text-green-700 border-green-200 no-print"
                              >
                                Site A (CMNDI)
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const valDorTemplateText = language === 'fr'
                                    ? `L'évaluation suivante s'est tenue dans les locaux de la Clinique Médicale de l'Or et des Bois, Val-d'Or. Nous avons clairement expliqué à notre mandat d'évaluateur indépendant désigné par la CNESST dans le cadre de l'application de l'article 204 de la LATMP. Nous lui avons précisé que nous n'agirons pas en tant que médecins traitants. Notre rapport d'évaluation sera d'abord envoyé́ à la CNESST.

Nous avons procédé́ au questionnaire subjectif ainsi qu'à un examen physique détaillé́ en relation avec les lésions à évaluer, nous nous sommes assurés à la fin de l'entrevue d'avoir couvert l'ensemble de la problématique.

Nous avons revu le dossier CNESST de même que le dossier médical. Nous avons pu consulter l'ensemble des rapports et des bilans radiologiques réalisés dans le cadre de l'évaluation de la lésion.

L'entrevue s'est effectuée cordialement, la patiente participait pleinement à son entrevue. L'entrevue s'est déroulée entre.

À la fin de l'entrevue, nous avons demandé́ à si elle avait d'autres commentaires ou informations à nous divulguer. Cette dernière nous a répondu par la négative.`
                                    : `The following evaluation was held at the Clinique Médicale de l'Or et des Bois, Val-d'Or. We clearly explained our mandate as an independent evaluator designated by the CNESST under article 204 of the LATMP. We specified that we will not act as treating physicians. Our evaluation report will first be sent to the CNESST.

We conducted a subjective questionnaire as well as a detailed physical examination in relation to the injuries to be evaluated, ensuring at the end of the interview that we had covered the entire problem.

We reviewed the CNESST file as well as the medical file. We were able to consult all the reports and radiological assessments carried out as part of the injury evaluation.

The interview was conducted cordially, the patient participated fully in the interview. The interview took place between.

At the end of the interview, we asked if she had any other comments or information to share with us. She answered in the negative.`;
                                  
                                  field.onChange(valDorTemplateText);
                                }}
                                className="text-xs px-3 py-1 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 no-print"
                              >
                                Site B (Val-d'Or)
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('modaliteEntrevue')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                              placeholder="Décrivez la modalité de l'entrevue..."
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </CollapsibleSection>

                {/* 4. Identification */}
                <CollapsibleSection title="4. Identification" defaultOpen={false} id="section4">
                  <div className="space-y-6">
                    {/* Gender Selection */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <FormLabel className="text-sm font-semibold text-blue-800 mb-3 block">
                        Sélection du genre (adapte automatiquement tous les textes) :
                      </FormLabel>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedGender === 'male' ? "default" : "outline"}
                          onClick={() => handleGenderChange('male')}
                          className="px-4 py-2"
                        >
                          Homme
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedGender === 'female' ? "default" : "outline"}
                          onClick={() => handleGenderChange('female')}
                          className="px-4 py-2"
                        >
                          Femme
                        </Button>
                      </div>
                      {selectedGender && (
                        <p className="text-xs text-blue-600 mt-2">
                          ✓ Genre sélectionné: {selectedGender === 'male' ? 'Homme' : 'Femme'}. 
                          Tous les textes du formulaire s'adaptent automatiquement.
                        </p>
                      )}
                      
                      {/* Gender Inconsistency Warning */}
                      {showGenderWarning && genderInconsistencies.length > 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-yellow-800">
                                Incohérences de genre détectées
                              </h4>
                              <p className="text-sm text-yellow-700 mt-1">
                                Des textes avec le genre opposé ont été trouvés dans: {genderInconsistencies.join(', ')}
                              </p>
                              <div className="mt-3 flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleUpdateAllForGender}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                  Corriger automatiquement
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowGenderWarning(false)}
                                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                >
                                  Ignorer
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Âge */}
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">Âge :</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('age')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[60px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Ex: Il s'agit d'une femme de [âge] ans."
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Dominance */}
                    <FormField
                      control={form.control}
                      name="dominance"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">Dominance :</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('dominance')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[60px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Ex: Elle est droitière/Il est droitier"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Emploi */}
                    <FormField
                      control={form.control}
                      name="emploi"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">Emploi :</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('emploi')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Ex: Elle travaillait comme [métier] à l'emploi de [employeur] depuis [date].\n\nElle travaille à temps [complet/partiel] soit [X] heures par semaine.\n\nElle est en arrêt de travail depuis l'accident.\n\nComme activité de loisir elle pratique [activités]."
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleSection>

                {/* 5. Antécédents */}
                <CollapsibleSection title="5. Antécédents" defaultOpen={false} id="section5">
                  <div className="flex items-center justify-end mb-4">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleDictation('antecedentsMedicaux')}
                      className="no-print bg-blue-600 hover:bg-blue-700"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="pl-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="antecedentsMedicaux"
                      render={({ field }) => (
                        <FormItem>
                          <div className="field-group">
                            <FormLabel className="field-label">Médicaux :</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="field-input min-h-[60px]" 
                                placeholder="Ex: Diabète type 2, syndrome tunnel carpien"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="antecedentsChirurgicaux"
                      render={({ field }) => (
                        <FormItem>
                          <div className="field-group">
                            <FormLabel className="field-label">Chirurgicaux :</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="field-input min-h-[60px]" 
                                placeholder="Ex: décompression tunnel carpien bilatéral"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="antecedentsLesion"
                      render={({ field }) => (
                        <FormItem>
                          <div className="field-group">
                            <FormLabel className="field-label">Au site et au pourtour de la lésion :</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="field-input min-h-[60px]" 
                                placeholder="Aucun"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel className="field-label">Accidentels :</FormLabel>
                      <div className="pl-4 space-y-2">
                        <FormField
                          control={form.control}
                          name="antecedentsCnesst"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">CNESST :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="Aucun" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="antecedentsSaaq"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">SAAQ :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="Aucun" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="antecedentsAutres"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">Autres :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="Aucun" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="antecedentsAllergie"
                      render={({ field }) => (
                        <FormItem>
                          <div className="field-group">
                            <FormLabel className="field-label">Allergie :</FormLabel>
                            <FormControl>
                              <Input {...field} className="field-input" placeholder="Pénicilline et sulfonamides" />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="antecedentsTabac"
                        render={({ field }) => (
                          <FormItem>
                            <div className="field-group">
                              <FormLabel className="field-label">Tabac :</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="field-input">
                                    <SelectValue placeholder="négatif" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="négatif">négatif</SelectItem>
                                  <SelectItem value="positif">positif</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="antecedentsCannabis"
                        render={({ field }) => (
                          <FormItem>
                            <div className="field-group">
                              <FormLabel className="field-label">Cannabis :</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="field-input">
                                    <SelectValue placeholder="négatif" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="négatif">négatif</SelectItem>
                                  <SelectItem value="positif">positif</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="antecedentsAlcool"
                        render={({ field }) => (
                          <FormItem>
                            <div className="field-group">
                              <FormLabel className="field-label">Alcool :</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="field-input">
                                    <SelectValue placeholder="négatif" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="négatif">négatif</SelectItem>
                                  <SelectItem value="positif">positif</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* 6. Médication actuelle */}
                <CollapsibleSection title="6. Médication actuelle et mesures thérapeutiques en cours" defaultOpen={false} id="section6">
                  <div className="flex items-center justify-end mb-4">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleDictation('medicationActuelle')}
                      className="no-print bg-blue-600 hover:bg-blue-700"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="pl-4">
                    <FormField
                      control={form.control}
                      name="medicationActuelle"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="w-full min-h-[120px]" 
                              placeholder="Détaillez la médication actuelle et les mesures thérapeutiques en cours"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleSection>

                {/* 7. Historique de faits et évolution (FILLABLE with AI) */}
                <CollapsibleSection title={t.section7} defaultOpen={false} id="section7">
                  <div className="flex items-center justify-end mb-4">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleDictation('historiqueEvolution')}
                      className="no-print bg-blue-600 hover:bg-blue-700"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="pl-4">
                    <FormField
                      control={form.control}
                      name="historiqueEvolution"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <AIFormatSection7 
                              value={field.value || ''}
                              onValueChange={field.onChange}
                              language={language}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleSection>

                {/* 8. Questionnaire subjectif et état actuel (FILLABLE) */}
                <CollapsibleSection title="8. Questionnaire subjectif et état actuel" defaultOpen={false} id="section8">
                  <div className="space-y-4">
                    {/* Single Input for AI Distribution */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-blue-800">
                          {language === 'fr' 
                            ? 'Saisie globale (l\'IA distribuera automatiquement le contenu)' 
                            : 'Global Input (AI will automatically distribute content)'
                          }
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleDictation('section8Input')}
                          className="no-print bg-blue-600 hover:bg-blue-700"
                        >
                          <Mic className="w-4 h-4" />
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name="section8Input"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="space-y-3">
                                <Textarea
                                  {...field}
                                  placeholder={language === 'fr' 
                                    ? "Entrez ici toutes les informations du questionnaire subjectif. L'IA les distribuera automatiquement dans les sections appropriées ci-dessous."
                                    : "Enter all subjective questionnaire information here. AI will automatically distribute it to appropriate sections below."
                                  }
                                  className="min-h-[120px] resize-none"
                                />
                                <AIFormatSection8
                                  value={field.value ?? ''}
                                  language={language}
                                  onValueChange={(formattedText) => {
                                    // Parse the AI-formatted text and distribute to appropriate fields
                                    const sections = parseSection8Content(formattedText);
                                    if (sections.appreciation) form.setValue('appreciationEvolution', sections.appreciation);
                                    if (sections.plaintes) form.setValue('plaintesproblemes', sections.plaintes);
                                    if (sections.impact) form.setValue('impactAvq', sections.impact);
                                  }}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="pl-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="appreciationEvolution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Appréciation subjective de l'évolution :</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="w-full min-h-[100px]" 
                              placeholder="Décrivez l'appréciation subjective de l'évolution"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="plaintesproblemes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Plaintes et problèmes :</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="w-full min-h-[120px]" 
                              placeholder="Décrivez les plaintes et problèmes actuels"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="impactAvq"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Impact sur AVQ/AVD :</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="w-full min-h-[80px]" 
                              placeholder="Décrivez l'impact sur les activités de la vie quotidienne"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleSection>

                {/* 9. Examen Physique (FILLABLE) */}
                <CollapsibleSection title="9. Examen Physique" defaultOpen={false} id="section9">
                  <div className="flex items-center justify-end mb-4">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleDictation('observationGenerale')}
                      className="no-print bg-blue-600 hover:bg-blue-700"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="pl-4 space-y-6">
                    
                    {/* Informations générales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="examenPoids"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Poids :</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="w-full border border-gray-300 rounded-md px-3 py-2" 
                                placeholder="60kg" 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="examenTaille"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Taille :</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="w-full border border-gray-300 rounded-md px-3 py-2" 
                                placeholder="1.60m" 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="examenImc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">IMC :</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="w-full border border-gray-300 rounded-md px-3 py-2" 
                                placeholder="23.4" 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="examenDominance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Dominance :</FormLabel>
                            <FormControl>
                              {selectedGender ? (
                                <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                                  <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 py-2">
                                    <SelectValue placeholder="Sélectionner..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedGender === 'male' ? (
                                      <>
                                        <SelectItem value="droitier">droitier</SelectItem>
                                        <SelectItem value="gaucher">gaucher</SelectItem>
                                        <SelectItem value="ambidextre">ambidextre</SelectItem>
                                      </>
                                    ) : (
                                      <>
                                        <SelectItem value="droitière">droitière</SelectItem>
                                        <SelectItem value="gauchère">gauchère</SelectItem>
                                        <SelectItem value="ambidextre">ambidextre</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 italic bg-gray-50">
                                  Sélectionnez d'abord le genre
                                </div>
                              )}
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Observation générale */}
                    <FormField
                      control={form.control}
                      name="observationGenerale"
                      render={({ field }) => (
                        <FormItem>
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <FormLabel className="block">Observation générale et attitude :</FormLabel>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3 no-print">
                              {!selectedGender && (
                                <p className="col-span-2 text-sm text-gray-500 italic text-center py-2">
                                  Veuillez d'abord sélectionner le genre du patient pour voir les modèles appropriés.
                                </p>
                              )}
                              
                              {selectedGender === 'male' && (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const normalRightText = `Le travailleur s'est présenté à l'heure pour l'évaluation. À l'accueil, il se lève spontanément et l'attitude générale est exempt de positionnement antalgique ou de précaution en regard du membre inférieur droit. On observe aucune boiterie, la vitesse de marche est adéquate, la base de support n'est pas élargie et le travailleur n'utilise pas d'aide technique. Tout au long de l'entrevue et de l'examen, le travailleur présente des gestes fluides sans surprotection.

Le travailleur est en mesure de marcher sur la pointe des pieds, sur les talons et d'exécuter une démarche en tandem sans trop de difficulté.

La collaboration offerte est optimale, pour les fins d'examen Monsieur est vêtu de façon à bien exposer les zones anatomiques à évaluer.`;
                                      field.onChange(normalRightText);
                                    }}
                                    className="text-xs px-3 py-2 h-auto bg-green-50 hover:bg-green-100 text-green-700 border-green-200 whitespace-nowrap"
                                  >
                                    Normal Membre Inf. Droit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const normalLeftText = `Le travailleur s'est présenté à l'heure pour l'évaluation. À l'accueil, il se lève spontanément et l'attitude générale est exempt de positionnement antalgique ou de précaution en regard du membre inférieur gauche. On observe aucune boiterie, la vitesse de marche est adéquate, la base de support n'est pas élargie et le travailleur n'utilise pas d'aide technique. Tout au long de l'entrevue et de l'examen, le travailleur présente des gestes fluides sans surprotection.

Le travailleur est en mesure de marcher sur la pointe des pieds, sur les talons et d'exécuter une démarche en tandem sans trop de difficulté.

La collaboration offerte est optimale, pour les fins d'examen Monsieur est vêtu de façon à bien exposer les zones anatomiques à évaluer.`;
                                      field.onChange(normalLeftText);
                                    }}
                                    className="text-xs px-3 py-2 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 whitespace-nowrap"
                                  >
                                    Normal Membre Inf. Gauche
                                  </Button>
                                </>
                              )}
                              
                              {selectedGender === 'female' && (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const normalRightFemaleText = `La travailleuse s'est présentée à l'heure pour l'évaluation. À l'accueil, elle se lève spontanément et l'attitude générale est exempt de positionnement antalgique ou de précaution en regard du membre inférieur droit. On observe aucune boiterie, la vitesse de marche est adéquate, la base de support n'est pas élargie et la travailleuse n'utilise pas d'aide technique. Tout au long de l'entrevue et de l'examen, la travailleuse présente des gestes fluides sans surprotection.

La travailleuse est en mesure de marcher sur la pointe des pieds, sur les talons et d'exécuter une démarche en tandem sans trop de difficulté.

La collaboration offerte est optimale, pour les fins d'examen Madame est vêtue de façon à bien exposer les zones anatomiques à évaluer.`;
                                      field.onChange(normalRightFemaleText);
                                    }}
                                    className="text-xs px-3 py-2 h-auto bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200 whitespace-nowrap"
                                  >
                                    Normal Membre Inf. Droit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const normalLeftFemaleText = `La travailleuse s'est présentée à l'heure pour l'évaluation. À l'accueil, elle se lève spontanément et l'attitude générale est exempt de positionnement antalgique ou de précaution en regard du membre inférieur gauche. On observe aucune boiterie, la vitesse de marche est adéquate, la base de support n'est pas élargie et la travailleuse n'utilise pas d'aide technique. Tout au long de l'entrevue et de l'examen, la travailleuse présente des gestes fluides sans surprotection.

La travailleuse est en mesure de marcher sur la pointe des pieds, sur les talons et d'exécuter une démarche en tandem sans trop de difficulté.

La collaboration offerte est optimale, pour les fins d'examen Madame est vêtue de façon à bien exposer les zones anatomiques à évaluer.`;
                                      field.onChange(normalLeftFemaleText);
                                    }}
                                    className="text-xs px-3 py-2 h-auto bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 whitespace-nowrap"
                                  >
                                    Normal Membre Inf. Gauche
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="w-full min-h-[100px]" 
                              placeholder="Décrivez l'observation générale et l'attitude du patient"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Rachis Lombaire */}
                    <Card className="border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Rachis Lombaire :</h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            form.setValue('rachisPalpation', 'aucune douleur au niveau des apophyses épineuses et en para lombaire droit et gauche.');
                            form.setValue('rachisInspection', 'Lordose lombaire conservée. Masse musculaire paravertébrale préservée. Aucune cicatrice observée.');
                          }}
                          className="text-xs px-3 py-1 h-auto bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 no-print"
                        >
                          NORMAL
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="rachisPalpation"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">Palpation :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="apophyses épineuses et para spinal sans douleur" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="rachisInspection"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">Inspection :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="lordose lombaire conservée" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Amplitude articulaire table */}
                        <div>
                          <FormLabel className="mb-2 block">Amplitude articulaire :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-300 p-2 text-left text-sm font-medium">Mouvement</th>
                                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">Patient(e)</th>
                                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">Normale</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">Flexion</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisFlexion"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center bg-transparent" />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center text-sm">90°</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">Extension</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisExtension"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center bg-transparent" />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center text-sm">30°</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">Flexion Latérale G.</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisFlexionLateraleG"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center bg-transparent" />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center text-sm">30°</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">Flexion Latérale D.</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisFlexionLateraleD"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center bg-transparent" />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center text-sm">30°</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">Rotation G.</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisRotationG"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center bg-transparent" />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center text-sm">30°</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">Rotation D.</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisRotationD"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center bg-transparent" />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center text-sm">30°</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Manœuvres radiculaires table */}
                        <div>
                          <FormLabel className="mb-2 block">Manœuvres radiculaires :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-300 p-2 text-left text-sm font-medium">Test</th>
                                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">Droit</th>
                                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">S.L.R.</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisSlrDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisSlrGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">Tripode</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisTripodeDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisTripodesGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">Lasègue</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisLasegueDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisLasegueGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 p-2 text-sm">Lasègue inversé (Ely)</td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisLasegueInverseDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-1">
                                    <FormField
                                      control={form.control}
                                      name="rachisLasegueInverseGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Hanches section */}
                    <Card className="border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Hanches :</h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            form.setValue('hanchesPalpation', 'Aucune douleur au niveau des grands trochanters.');
                            form.setValue('hanchesInspection', 'Aucune atrophie musculaire au niveau des fessiers ou des cuisses. Aucune cicatrice observée.');
                          }}
                          className="text-xs px-3 py-1 h-auto bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 no-print"
                        >
                          NORMAL
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="hanchesPalpation"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">Palpation :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="grands trochanters sans douleur" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hanchesInspection"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">Inspection :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="pas d'atrophie fessiers ou cuisse. Aucune cicatrice" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Amplitude articulaire hanches table */}
                        <div>
                          <FormLabel className="mb-2 block">Amplitude articulaire :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left">Mouvement</th>
                                  <th className="border p-2 text-center" colSpan={2}>Droit</th>
                                  <th className="border p-2 text-center" colSpan={2}>Gauche</th>
                                  <th className="border p-2 text-left">Normale</th>
                                </tr>
                                <tr className="bg-gray-50">
                                  <th className="border p-2"></th>
                                  <th className="border p-2 text-center">Actif</th>
                                  <th className="border p-2 text-center">Passif</th>
                                  <th className="border p-2 text-center">Actif</th>
                                  <th className="border p-2 text-center">Passif</th>
                                  <th className="border p-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Flexion</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesFlexionDroitActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesFlexionDroitPassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesFlexionGaucheActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesFlexionGauchePassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">120°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Extension</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesExtensionDroitActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesExtensionDroitPassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesExtensionGaucheActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesExtensionGauchePassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">30°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Rotation interne</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesRotationInterneDroitActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesRotationInterneDroitPassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesRotationInterneGaucheActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesRotationInterneGauchePassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">40°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Rotation externe</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesRotationExterneDroitActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesRotationExterneDroitPassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesRotationExterneGaucheActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesRotationExterneGauchePassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">50°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Abduction</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesAbductionDroitActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesAbductionDroitPassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesAbductionGaucheActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesAbductionGauchePassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">40°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Adduction</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesAdductionDroitActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesAdductionDroitPassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesAdductionGaucheActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="hanchesAdductionGauchePassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">20°</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Genoux section */}
                    <Card className="border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Genoux :</h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            form.setValue('genouxPalpation', 'Aucune douleur à l\'interligne articulaire, au niveau des rotules et au niveau des insertions ligamentaires et tendineuses.');
                            form.setValue('genouxInspection', 'Aucune atrophie musculaire. Aucune déformation ou de cicatrice');
                          }}
                          className="text-xs px-3 py-1 h-auto bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 no-print"
                        >
                          NORMAL
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="genouxPalpation"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">Palpation :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="interligne articulaire, rotules, insertions sans douleur" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="genouxInspection"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">Inspection :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="pas d'atrophie musculaire, déformation ou cicatrice" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Amplitude articulaire genoux table */}
                        <div>
                          <FormLabel className="mb-2 block">Amplitude articulaire :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left">Mouvement</th>
                                  <th className="border p-2 text-center" colSpan={2}>Droit</th>
                                  <th className="border p-2 text-center" colSpan={2}>Gauche</th>
                                  <th className="border p-2 text-left">Normale</th>
                                </tr>
                                <tr className="bg-gray-50">
                                  <th className="border p-2"></th>
                                  <th className="border p-2 text-center">Actif</th>
                                  <th className="border p-2 text-center">Passif</th>
                                  <th className="border p-2 text-center">Actif</th>
                                  <th className="border p-2 text-center">Passif</th>
                                  <th className="border p-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Flexion</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxFlexionDroitActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxFlexionDroitPassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxFlexionGaucheActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxFlexionGauchePassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">135°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Extension</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxExtensionDroitActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxExtensionDroitPassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxExtensionGaucheActif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxExtensionGauchePassif"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">0°</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Manœuvres ligamentaires table */}
                        <div>
                          <FormLabel className="mb-2 block">Manœuvres ligamentaires :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left"></th>
                                  <th className="border p-2 text-center">Droit</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">LCI 0°</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLci0Droit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLci0Gauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">LCI 20°</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLci20Droit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLci20Gauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">LCE 0°</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLce0Droit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLce0Gauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">LCE 20°</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLce20Droit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLce20Gauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Lachman</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLachmanDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxLachmanGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Pivot</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxPivotDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxPivotGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Tiroir antérieur</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxTiroirAnterieurDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxTiroirAnterieurGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Tiroir postérieur</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxTiroirPosterieurDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxTiroirPosterieurGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Sag postérieur</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxSagPosterieurDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxSagPosterieurGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Dial à 30°</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxDial30Droit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxDial30Gauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Dial à 90°</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxDial90Droit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxDial90Gauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Sec"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" },
                                            { value: "Sec", label: "Sec" },
                                            { value: "Retardé", label: "Retardé" },
                                            { value: "Aucun arrêt", label: "Aucun arrêt" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Manœuvres méniscales table */}
                        <div>
                          <FormLabel className="mb-2 block">Manœuvres méniscales :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left"></th>
                                  <th className="border p-2 text-center">Droit</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Apley</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxApleyDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxApleyGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">McMurray</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxMcMurrayDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxMcMurrayGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Thessaly</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxThessalyDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxThessalyGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Manoeuvres rotules table */}
                        <div>
                          <FormLabel className="mb-2 block">Manoeuvres rotules :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left"></th>
                                  <th className="border p-2 text-center">Droite</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Tracking rotule</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxTrackingRotuleDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Anormal", label: "Anormal" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxTrackingRotuleGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Anormal", label: "Anormal" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">J-Sign</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxJSignDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxJSignGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                          options={[
                                            { value: "Négatif", label: "Négatif" },
                                            { value: "Positif", label: "Positif" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Translation</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxTranslationDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normale"
                                          options={[
                                            { value: "Normale", label: "Normale" },
                                            { value: "Anormale", label: "Anormale" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="genouxTranslationGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normale"
                                          options={[
                                            { value: "Normale", label: "Normale" },
                                            { value: "Anormale", label: "Anormale" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Circonférence table */}
                        <div>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left"></th>
                                  <th className="border p-2 text-center">Droit</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Circonférence cuisse (cm)</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxCirconferenceCuisseDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxCirconferenceCuisseGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Circonférence mollet (cm)</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxCirconferenceMolletDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="genouxCirconferenceMolletGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Atrophie musculaire section */}
                    <FormField
                      control={form.control}
                      name="atrophieMusculaire"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Atrophie musculaire :</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="w-full min-h-[80px]" 
                              placeholder="TBD by Dr Centomo"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Pieds / Chevilles section */}
                    <Card className="border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Pieds / Chevilles :</h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            form.setValue('piedsCheillesPalpation', 'Aucune douleur aux malléoles, aucune douleur à l\'interligne articulaire des chevilles, aucune douleur au mi-pied.');
                            form.setValue('piedsChevillesInspection', 'Aucune déformation. Arches plantaires présente et normale. Aucune cicatrice');
                          }}
                          className="text-xs px-3 py-1 h-auto bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 no-print"
                        >
                          NORMAL
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="piedsCheillesPalpation"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">Palpation :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="malléoles, interligne articulaire, mi-pied sans douleur" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="piedsChevillesInspection"
                          render={({ field }) => (
                            <FormItem>
                              <div className="field-group">
                                <FormLabel className="field-label">Inspection :</FormLabel>
                                <FormControl>
                                  <Input {...field} className="field-input" placeholder="pas de déformation, arches plantaires normales, aucune cicatrice" />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Amplitude articulaire pieds/chevilles table */}
                        <div>
                          <FormLabel className="mb-2 block">Amplitude articulaire :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left"></th>
                                  <th className="border p-2 text-center" colSpan={2}>Droit</th>
                                  <th className="border p-2 text-center" colSpan={2}>Gauche</th>
                                  <th className="border p-2 text-left">Normale</th>
                                </tr>
                                <tr className="bg-gray-50">
                                  <th className="border p-2"></th>
                                  <th className="border p-2 text-center">Actif</th>
                                  <th className="border p-2 text-center">Passif</th>
                                  <th className="border p-2 text-center">Actif</th>
                                  <th className="border p-2 text-center">Passif</th>
                                  <th className="border p-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Dorsiflexion cheville</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsDorsiflexionCheville"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">-</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsDorsiflexionCheville"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">-</td>
                                  <td className="border p-2">20°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Plantiflexion cheville</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsPlantifexionCheville"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">-</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsPlantifexionCheville"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">-</td>
                                  <td className="border p-2">40°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Mvts sous-astragaliens</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsMvtsSousAstragaliensActifDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Diminué < 50%", label: "Diminué < 50%" },
                                            { value: "Diminué > 50%", label: "Diminué > 50%" },
                                            { value: "Absent", label: "Absent" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsMvtsSousAstragaliensPassifDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Diminué < 50%", label: "Diminué < 50%" },
                                            { value: "Diminué > 50%", label: "Diminué > 50%" },
                                            { value: "Absent", label: "Absent" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsMvtsSousAstragaliensActifGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Diminué < 50%", label: "Diminué < 50%" },
                                            { value: "Diminué > 50%", label: "Diminué > 50%" },
                                            { value: "Absent", label: "Absent" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsMvtsSousAstragaliensPassifGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Diminué < 50%", label: "Diminué < 50%" },
                                            { value: "Diminué > 50%", label: "Diminué > 50%" },
                                            { value: "Absent", label: "Absent" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">-</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Mvts mid-tarsien</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsMvtsMidTarsienActifDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Diminué < 50%", label: "Diminué < 50%" },
                                            { value: "Diminué > 50%", label: "Diminué > 50%" },
                                            { value: "Absent", label: "Absent" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsMvtsMidTarsienPassifDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Diminué < 50%", label: "Diminué < 50%" },
                                            { value: "Diminué > 50%", label: "Diminué > 50%" },
                                            { value: "Absent", label: "Absent" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsMvtsMidTarsienActifGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Diminué < 50%", label: "Diminué < 50%" },
                                            { value: "Diminué > 50%", label: "Diminué > 50%" },
                                            { value: "Absent", label: "Absent" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsMvtsMidTarsienPassifGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Normal"
                                          options={[
                                            { value: "Normal", label: "Normal" },
                                            { value: "Diminué < 50%", label: "Diminué < 50%" },
                                            { value: "Diminué > 50%", label: "Diminué > 50%" },
                                            { value: "Absent", label: "Absent" },
                                            { value: "Non fait", label: "Non fait" }
                                          ]}
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">-</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Manœuvres ligamentaires pieds/chevilles table */}
                        <div>
                          <FormLabel className="mb-2 block">Manœuvres ligamentaires :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left"></th>
                                  <th className="border p-2 text-center">Droit</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Tiroir 0°</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsTiroir0Droit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsTiroir0Gauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Tiroir 20°</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsTiroir20Droit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsTiroir20Gauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Varus stress</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsVarusStressDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsVarusStressGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Laxité calcanéo-fibulaire</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsLaxiteCalcaneoFibulaireDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsLaxiteCalcaneoFibulaireGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Squeeze test</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsSqueezeTestDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsSqueezeTestGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Manœuvres spécifiques tendons pieds/chevilles table */}
                        <div>
                          <FormLabel className="mb-2 block">Manœuvres spécifiques tendons :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left"></th>
                                  <th className="border p-2 text-center">Droit</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Single heel raise (Tib post)</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsSingleHeelRaiseDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsSingleHeelRaiseGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Thompson (Tendon d'Achille)</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsThompsonDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsThompsonGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Test d'appréhension (Fibulaires)</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsTestApprehensionDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsTestApprehensionGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Neuro-vasculaire section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <FormLabel className="mb-0">Neuro-vasculaire :</FormLabel>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                form.setValue('piedsNeuroVasculaire', 'TBD by Dr Centomo');
                              }}
                              className="text-xs px-3 py-1 h-auto bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 no-print"
                            >
                              NORMAL
                            </Button>
                          </div>
                          <FormField
                            control={form.control}
                            name="piedsNeuroVasculaire"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    className="w-full min-h-[80px]" 
                                    placeholder="Évaluation neuro-vasculaire..."
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Forces neuro table */}
                        <div>
                          <FormLabel className="mb-2 block">Forces :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left">Racine (ASIA)</th>
                                  <th className="border p-2 text-center">Droit</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">L2 (flexion hanche)</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceL2Droit"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceL2Gauche"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">L3 (extension genou)</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceL3Droit"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceL3Gauche"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">L4 (dorsiflexion cheville)</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceL4Droit"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceL4Gauche"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">L5 (extension D1 pied)</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceL5Droit"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceL5Gauche"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">S1 (flexion plantaire cheville)</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceS1Droit"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsForceS1Gauche"
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="w-full border-0 h-8">
                                            <SelectValue placeholder="5/5" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5/5">5/5</SelectItem>
                                            <SelectItem value="4/5">4/5</SelectItem>
                                            <SelectItem value="3/5">3/5</SelectItem>
                                            <SelectItem value="2/5">2/5</SelectItem>
                                            <SelectItem value="1/5">1/5</SelectItem>
                                            <SelectItem value="0/5">0/5</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Sensibilités neuro table */}
                        <div>
                          <FormLabel className="mb-2 block">Sensibilités :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left">Racine</th>
                                  <th className="border p-2 text-center">Droit</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">L2</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteL2Droit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteL2Gauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">L3</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteL3Droit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteL3Gauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">L4</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteL4Droit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteL4Gauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">L5</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteL5Droit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteL5Gauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">S1</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteS1Droit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsSensibiliteS1Gauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Réflexes neuro table */}
                        <div>
                          <FormLabel className="mb-2 block">Réflexes :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left">Réflexes</th>
                                  <th className="border p-2 text-center">Droit</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Rotulien</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsReflexeRotulienDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" placeholder="2+" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsReflexeRotulienGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" placeholder="2+" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Achilléen</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsReflexeAchilleenDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" placeholder="2+" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsReflexeAchilleenGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" placeholder="2+" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Babinski</td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsReflexeBabinskiDroit"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <FormField
                                      control={form.control}
                                      name="piedsReflexeBabinskiGauche"
                                      render={({ field }) => (
                                        <MedicalSelect 
                                          value={field.value} 
                                          onValueChange={field.onChange}
                                          placeholder="Négatif"
                                        />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Pouls neuro table */}
                        <div>
                          <FormLabel className="mb-2 block">Pouls :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left"></th>
                                  <th className="border p-2 text-center">Droit</th>
                                  <th className="border p-2 text-center">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Tibial postérieur</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsPoulsTibialPosterieurDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsPoulsTibialPosterieurGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Pédieux</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsPoulsPedieuxDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="piedsPoulsPedieuxGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1 text-center" />
                                      )}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Additional examination sections */}
                    <FormField
                      control={form.control}
                      name="examensAdditionnels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Examens additionnels :</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="w-full min-h-[120px]" 
                              placeholder="Ajoutez ici d'autres examens physiques ou observations"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleSection>

                {/* 10. Examens paracliniques (STATIC) */}
                <CollapsibleSection title={t.section10} defaultOpen={false} id="section10">
                  <div className="pl-4 space-y-4">
                    <div className="bg-gray-50 p-4 rounded border">
                      <p className="text-sm text-gray-700">
                        {t.paraclinicalExamsText}
                      </p>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* 11. Conclusion (FILLABLE) */}
                <CollapsibleSection title={t.section11} defaultOpen={false} id="section11">
                  <div className="pl-4 space-y-6">
                    {/* AI Generation and Copy Components */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AIGenerateSection11
                        formData={form.getValues()}
                        language={language}
                        onGenerated={(conclusion) => {
                          form.setValue('conclusionResume', conclusion.resume);
                          form.setValue('conclusionDiagnostic', conclusion.diagnostic);
                          form.setValue('conclusionDateConsolidation', conclusion.dateConsolidation);
                          form.setValue('conclusionSoinsTraitements', conclusion.soinsTraitements);
                          form.setValue('conclusionAtteintePermanente', conclusion.atteintePermanente);
                          form.setValue('conclusionLimitationsFonctionnelles', conclusion.limitationsFonctionnelles);
                          form.setValue('conclusionEvaluationLimitations', conclusion.evaluationLimitations);
                        }}
                      />
                      <div className="flex items-end">
                        <CopySection11
                          formData={form.watch()}
                          language={language}
                        />
                      </div>
                    </div>

                    {/* Résumé */}
                    <FormField
                      control={form.control}
                      name="conclusionResume"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">{t.conclusionSummary}</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('conclusionResume')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Résumé du cas et des principales constatations"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Diagnostic */}
                    <FormField
                      control={form.control}
                      name="conclusionDiagnostic"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">{t.conclusionDiagnosis}</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('conclusionDiagnostic')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Diagnostic médical principal et secondaires"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Date de consolidation */}
                    <FormField
                      control={form.control}
                      name="conclusionDateConsolidation"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">{t.conclusionConsolidationDate}</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('conclusionDateConsolidation')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Date de consolidation médicale avec justification"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Nature, nécessité, suffisance, durée des soins */}
                    <FormField
                      control={form.control}
                      name="conclusionSoinsTraitements"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">{t.conclusionCareNecessity}</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('conclusionSoinsTraitements')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Décrivez la nature, nécessité, suffisance et durée des soins"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Existence de l'atteinte permanente */}
                    <FormField
                      control={form.control}
                      name="conclusionAtteintePermanente"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">{t.conclusionPermanentImpairment}</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('conclusionAtteintePermanente')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Évaluez l'existence d'une atteinte permanente"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Existence de limitations fonctionnelles */}
                    <FormField
                      control={form.control}
                      name="conclusionLimitationsFonctionnelles"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">{t.conclusionFunctionalLimitations}</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('conclusionLimitationsFonctionnelles')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Décrivez l'existence de limitations fonctionnelles"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Évaluation des limitations fonctionnelles */}
                    <FormField
                      control={form.control}
                      name="conclusionEvaluationLimitations"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-gray-700">{t.conclusionLimitationsEvaluation}</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDictation('conclusionEvaluationLimitations')}
                                className="no-print bg-blue-600 hover:bg-blue-700"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Évaluez en détail les limitations fonctionnelles"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleSection>
              </div>
            </CollapsibleSection>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-6 no-print">
              <div className="text-sm text-gray-500">
                Dernière sauvegarde: <span>{lastSaved}</span>
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  onClick={() => window.open('', '_blank')} 
                  variant="outline"
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>
                <Button 
                  type="button" 
                  onClick={handleExportPDF}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exporter PDF
                </Button>
                <Button 
                  type="button" 
                  onClick={handleExportWord}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exporter Word
                </Button>
              </div>
            </div>

          </form>
        </Form>
      </div>

      {/* Voice Recognition Modal */}
      {/* Floating Record Button */}
      <FloatingRecordButton 
        language={language}
        onDirectDictation={handleDirectDictation}
      />

      {/* Floating Navigation - Only show when left navigation is disabled */}
      {!useLeftNavigation && (
        <FloatingNavigation 
          language={language}
        />
      )}



      {/* Save Form Dialog */}
      <SaveFormDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        formData={form.getValues()}
        language={language}
      />

      {/* Draft Confirmation Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'fr' ? 'Sauvegarder en brouillon ?' : 'Save to Draft?'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' 
                ? 'Voulez-vous sauvegarder ce formulaire en brouillon pour y revenir plus tard ?'
                : 'Would you like to save this form as a draft to return to it later?'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDraftDialog(false)}
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSaveToDraft}
              className="bg-green-600 hover:bg-green-700"
            >
              {language === 'fr' ? 'Sauvegarder' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Forms Manager Dialog */}
      <Dialog open={showSavedForms} onOpenChange={setShowSavedForms}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {language === 'fr' ? 'Formulaires sauvegardés' : 'Saved Forms'}
            </DialogTitle>
          </DialogHeader>
          <SavedFormsManager
            language={language}
            onLoadForm={handleLoadForm}
            formType="all"
          />
        </DialogContent>
      </Dialog>

      {/* Drafts Manager Dialog */}
      <Dialog open={showDrafts} onOpenChange={setShowDrafts}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {language === 'fr' ? 'Brouillons' : 'Drafts'}
            </DialogTitle>
          </DialogHeader>
          <SavedFormsManager
            language={language}
            onLoadForm={handleLoadForm}
            formType="draft"
          />
        </DialogContent>
      </Dialog>

      {/* Saved Copies Manager Dialog */}
      <Dialog open={showSavedCopies} onOpenChange={setShowSavedCopies}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {language === 'fr' ? 'Copies sauvegardées' : 'Saved Copies'}
            </DialogTitle>
          </DialogHeader>
          <SavedFormsManager
            language={language}
            onLoadForm={handleLoadForm}
            formType="copy"
          />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}