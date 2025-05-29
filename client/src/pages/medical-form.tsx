import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/collapsible-section";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DictationModal } from "@/components/dictation-modal";
import { FloatingRecordButton } from "@/components/floating-record-button";
import { AIFormatSection7 } from "@/components/ai-format-section7";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useAutoSave } from "@/hooks/use-auto-save";
import { exportToPDF } from "@/lib/pdf-export";
import { Mic, Save, Printer, Trash2, Eye, FileText, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
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
  appreciationEvolution: z.string().optional(),
  plaintesproblemes: z.string().optional(),
  impactAvq: z.string().optional(),
  
  // Section 9: Examen Physique
  examenPoids: z.string().optional(),
  examenTaille: z.string().optional(),
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
  examensAdditionnels: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Language translations
const translations = {
  fr: {
    title: "Cent.MD",
    subtitle: "Rapport d'Évaluation Médicale",
    save: "Sauvegarder",
    print: "Imprimer",
    clear: "Effacer",
    language: "Langue",
    notSaved: "Non sauvegardé",
    saved: "Sauvegardé",
    formCleared: "Formulaire effacé",
    allDataDeleted: "Toutes les données ont été supprimées.",
    confirmClear: "Êtes-vous sûr de vouloir effacer toutes les données du formulaire?",
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
    additionalExams: "Examens additionnels :"
  },
  en: {
    title: "Cent.MD",
    subtitle: "Medical Evaluation Report",
    save: "Save",
    print: "Print",
    clear: "Clear",
    language: "Language",
    notSaved: "Not saved",
    saved: "Saved",
    formCleared: "Form cleared",
    allDataDeleted: "All data has been deleted.",
    confirmClear: "Are you sure you want to clear all form data?",
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
    additionalExams: "Additional Examinations:"
  }
};

interface MedicalFormProps {
  language: 'fr' | 'en';
  onLanguageChange: (language: 'fr' | 'en') => void;
}

export default function MedicalForm({ language, onLanguageChange }: MedicalFormProps) {
  const [currentDictationField, setCurrentDictationField] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string>("Non sauvegardé");
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
  
  const t = translations[language];

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
      historiqueEvolution: "La travailleuse et une chauffeuse de taxi adapté. Ses tâches consistent à conduire un taxi de transport adapté, elle accompagne les gens en fauteuil roulant et donc doit monter et descendre des rampes d'accès avec les patients en fauteuil et parfois elle doit transporter des marchandises médicales d'un hôpital à l'autre. Parfois elle doit conduire jusqu'à Montréal.\n\nLa fiche de réclamation de la travailleuse décrit l'événement suivant survenu le 12 août 2020 :\n\n« Je montais une pente à l'hôpital de Valleyfield en poussant un chariot avec des glacières dessus et à la fin de la pentente j'ai senti grosse douleur au niveau du mollet droit avec sensation de brûlure… Quand fut le temps de reposer mon pied par terre, j'en étais incapable j'ai tout de suite communiqué avec mon employeur pour lui expliquer ce qui venait de se passer… comme j'étais déjà dans un hôpital, il m'a dit d'aller tout de suite consulter…",
      appreciationEvolution: "La travailleuse rapporte une nette amélioration depuis son accident. Elle rapporte que dans les derniers mois, elle a observé peu d'amélioration au niveau de sa condition et juge d'elle-même qu'elle a atteint un plateau thérapeutique en physiothérapie et ergothérapie...",
      plaintesproblemes: "Elle se plaint principalement de sensations de brûlure intermittente au niveau de son mollet droite et au niveau antérieur de sa jambe droite. Elle ne peut rapporter d'éléments déclencheurs de ses douleurs et elles surviennent subitement...",
      impactAvq: "cf feuille en annexe.",
      examenPoids: "60kg",
      examenTaille: "1.60m",
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
      rachisSlrDroit: "Neg",
      rachisSlrGauche: "Neg",
      rachisTripodeDroit: "Neg",
      rachisTripodesGauche: "Neg",
      rachisLasegueDroit: "Neg",
      rachisLasegueGauche: "Neg",
      rachisLasegueInverseDroit: "Neg",
      rachisLasegueInverseGauche: "Neg",
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
    },
  });

  const { saveData, loadData, clearData, debouncedSave } = useAutoSave({
    key: 'centMD_formData',
    onSave: () => setLastSaved(new Date().toLocaleString('fr-FR')),
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

  const handleDictation = (fieldName: string) => {
    if (!isSupported) {
      toast({
        title: "Erreur",
        description: "La reconnaissance vocale n'est pas supportée par votre navigateur.",
        variant: "destructive",
      });
      return;
    }

    setCurrentDictationField(fieldName);
    resetTranscript();
    startListening((transcript) => {
      const currentValue = form.getValues(fieldName as keyof FormData) || '';
      form.setValue(fieldName as keyof FormData, currentValue + ' ' + transcript);
    });
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

  const handleSave = () => {
    const data = form.getValues();
    saveData(data);
    toast({
      title: t.saved,
      description: language === 'fr' ? "Le formulaire a été sauvegardé avec succès." : "The form has been saved successfully.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const data = form.getValues();
    exportToPDF(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">{t.title}</h1>
              <p className="text-sm text-gray-600">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={(value: 'fr' | 'en') => onLanguageChange(value)}>
                <SelectTrigger className="w-32">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {t.save}
              </Button>
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" />
                {t.print}
              </Button>
              <Button onClick={handleClearForm} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                {t.clear}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Form {...form}>
          <form className="space-y-6">
            
            {/* Section A: Renseignements sur le travailleur (Static) */}
            <CollapsibleSection title={t.sectionA}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <CollapsibleSection title="B. RENSEIGNEMENTS SUR LE MÉDECIN">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="field-group">
                    <label className="field-label">Nom :</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">CENTOMO</div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Prénom :</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">Hugo</div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">No permis :</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">1-18154</div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Téléphone :</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">514-331-1400</div>
                  </div>
                  <div className="field-group col-span-2">
                    <label className="field-label">Adresse :</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">5777 Boul. Gouin Ouest, Suite 370, Montréal, Qc, H4J 1E3</div>
                  </div>
                  <div className="field-group col-span-2">
                    <label className="field-label">Courriel :</label>
                    <div className="field-input border-b border-gray-300 pb-1 min-h-[24px]">adjointe.orthopedie@gmail.com</div>
                  </div>
                </div>
            </CollapsibleSection>

            {/* Section C: Rapport */}
            <CollapsibleSection title="C. RAPPORT">
              <div className="space-y-8">

                {/* 1. Mandat de l'évaluation (Static) */}
                <div>
                  <h3 className="text-md font-semibold mb-4">1. Mandat de l'évaluation</h3>
                  <div className="pl-4 space-y-3 text-sm">
                    <p>Le but de l'évaluation est de répondre aux points suivants de l'article de la LATMP :</p>
                    <div className="space-y-2 pl-4">
                      <p>1) Diagnostic.</p>
                      <p>2) Date de consolidation.</p>
                      <p>3) Nature, nécessité́, suffisance, durée des soins ou traitements administrés ou prescrits.</p>
                      <p>4) a) Existence de l'atteinte permanente à l'intégrité́ physique ou psychique.</p>
                      <p className="pl-4">b) Pourcentage de l'atteinte permanente à l'intégrité́ physique ou psychique.</p>
                      <p>5) a) Existence de limitations fonctionnelles résultant de la lésion professionnelle.</p>
                      <p className="pl-4">b) Évaluation des limitations fonctionnelles résultant de la lésion professionnelle.</p>
                    </div>
                  </div>
                </div>

                {/* 2. Diagnostics acceptés par la CNESST (Static) */}
                <div>
                  <h3 className="text-md font-semibold mb-4">2. Diagnostics acceptés par la CNESST</h3>
                  <div className="pl-4">
                    <p>Déchirure mollet droit.</p>
                  </div>
                </div>

                {/* 3. Modalité de l'entrevue (Static) */}
                <div>
                  <h3 className="text-md font-semibold mb-4">3. Modalité de l'entrevue</h3>
                  <div className="pl-4 space-y-4 text-sm">
                    <p>L'évaluation suivante s'est tenue dans les locaux de la clinique du Complexe Médical Nord-de-Île (CMNDI). Nous avons clairement expliqué à notre mandat d'évaluateur indépendant désigné par la CNESST dans le cadre de l'application de l'article 204 de la LATMP. Nous lui avons précisé que nous n'agirons pas en tant que médecins traitants. Notre rapport d'évaluation sera d'abord envoyé́ à la CNESST.</p>
                    <p>Nous avons procédé́ au questionnaire subjectif ainsi qu'à un examen physique détaillé́ en relation avec les lésions à évaluer, nous nous sommes assurés à la fin de l'entrevue d'avoir couvert l'ensemble de la problématique.</p>
                    <p>Nous avons revu le dossier CNESST de même que le dossier médical. Nous avons pu consulter l'ensemble des rapports et des bilans radiologiques réalisés dans le cadre de l'évaluation de la lésion.</p>
                    <p>L'entrevue s'est effectuée cordialement, la patiente participait pleinement à son entrevue. L'entrevue s'est déroulée entre.</p>
                    <p>À la fin de l'entrevue, nous avons demandé́ à si elle avait d'autres commentaires ou informations à nous divulguer. Cette dernière nous a répondu par la négative.</p>
                  </div>
                </div>

                {/* 4. Identification (Static) */}
                <div>
                  <h3 className="text-md font-semibold mb-4">4. Identification</h3>
                  <div className="pl-4 space-y-2 text-sm">
                    <p><strong>Âge :</strong> Il s'agit d'une femme de 49 ans.</p>
                    <p><strong>Dominance :</strong> Elle est droitière</p>
                    <p><strong>Emploi :</strong> Elle travaillait comme chauffeuse de taxi / transport adapté à l'emploi de Taxi Ormstown inc. depuis janvier 2016.</p>
                    <p>Elle travaille à temps complet soit 40 heures par semaine.</p>
                    <p>Elle est en arrêt de travail depuis l'accident</p>
                    <p>Comme activité de loisir elle pratique le baseball.</p>
                  </div>
                </div>

                {/* 5. Antécédents (FILLABLE) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold">5. Antécédents</h3>
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
                </div>

                {/* 6. Médication actuelle (FILLABLE) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold">6. Médication actuelle et mesures thérapeutiques en cours</h3>
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
                </div>

                {/* 7. Historique de faits et évolution (FILLABLE with AI) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold">{t.section7}</h3>
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
                </div>

                {/* 8. Questionnaire subjectif et état actuel (FILLABLE) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold">8. Questionnaire subjectif et état actuel</h3>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleDictation('appreciationEvolution')}
                      className="no-print bg-blue-600 hover:bg-blue-700"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
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
                </div>

                {/* 9. Examen Physique (FILLABLE) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold">9. Examen Physique</h3>
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
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="examenPoids"
                        render={({ field }) => (
                          <FormItem>
                            <div className="field-group">
                              <FormLabel className="field-label">Poids :</FormLabel>
                              <FormControl>
                                <Input {...field} className="field-input" placeholder="60kg" />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="examenTaille"
                        render={({ field }) => (
                          <FormItem>
                            <div className="field-group">
                              <FormLabel className="field-label">Taille :</FormLabel>
                              <FormControl>
                                <Input {...field} className="field-input" placeholder="1.60m" />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="examenDominance"
                        render={({ field }) => (
                          <FormItem>
                            <div className="field-group">
                              <FormLabel className="field-label">Dominance :</FormLabel>
                              <FormControl>
                                <Input {...field} className="field-input" placeholder="Droitière" />
                              </FormControl>
                            </div>
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
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel className="block">Observation générale et attitude :</FormLabel>
                            <div className="flex gap-2 no-print">
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
                                className="text-xs px-2 py-1 h-auto bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                              >
                                Normal Right Lower Limb Male
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
                                className="text-xs px-2 py-1 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              >
                                Normal Left Lower Limb Male
                              </Button>
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
                                className="text-xs px-2 py-1 h-auto bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200"
                              >
                                Normal Right Lower Limb Female
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
                                className="text-xs px-2 py-1 h-auto bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                              >
                                Normal Left Lower Limb Female
                              </Button>
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
                      <h4 className="font-semibold mb-3">Rachis Lombaire :</h4>
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
                            <table className="w-full border-collapse border">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left">Mouvement</th>
                                  <th className="border p-2 text-left">Patient(e)</th>
                                  <th className="border p-2 text-left">Normale</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">Flexion</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisFlexion"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">90°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Extension</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisExtension"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">30°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Flexion Latérale G.</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisFlexionLateraleG"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">30°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Flexion Latérale D.</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisFlexionLateraleD"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">30°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Rotation G.</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisRotationG"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">30°</td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Rotation D.</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisRotationD"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">30°</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Manœuvres radiculaires table */}
                        <div>
                          <FormLabel className="mb-2 block">Manœuvres radiculaires :</FormLabel>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border p-2 text-left">Test</th>
                                  <th className="border p-2 text-left">Droit</th>
                                  <th className="border p-2 text-left">Gauche</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">S.L.R.</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisSlrDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisSlrGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Tripode</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisTripodeDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisTripodesGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Lasègue</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisLasegueDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisLasegueGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border p-2">Lasègue inversé (Ely)</td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisLasegueInverseDroit"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
                                      )}
                                    />
                                  </td>
                                  <td className="border p-2">
                                    <FormField
                                      control={form.control}
                                      name="rachisLasegueInverseGauche"
                                      render={({ field }) => (
                                        <Input {...field} className="w-full border-0 p-1" />
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
                      <h4 className="font-semibold mb-3">Hanches :</h4>
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
                </div>
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

      <DictationModal
        open={!!currentDictationField}
        onClose={() => setCurrentDictationField(null)}
        isListening={isListening}
        onStartDictation={() => {}} // Already handled in handleDictation
        onStopDictation={handleStopDictation}
        error={error}
        language={language}
      />
    </div>
  );
}
