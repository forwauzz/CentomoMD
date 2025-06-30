import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Save, 
  Archive, 
  FolderOpen, 
  FileText,
  Menu,
  Navigation
} from "lucide-react";

interface NavigationSection {
  id: string;
  titleFr: string;
  titleEn: string;
}

interface LeftNavigationPaneProps {
  language: 'fr' | 'en';
  onSectionNavigate: (sectionId: string) => void;
  onSavedForms: () => void;
  onDrafts: () => void;
  onSavedCopies: () => void;
  onSaveDialog: () => void;
  onSave: () => void;
  onPrint: () => void;
  onExport: () => void;
  onClearForm: () => void;
  savedFormsCount?: number;
  completedFormsCount?: number;
}

const sections: NavigationSection[] = [
  { id: "sectionA", titleFr: "A. Renseignements travailleur", titleEn: "A. Worker Information" },
  { id: "sectionB", titleFr: "B. Renseignements médecin", titleEn: "B. Doctor Information" },
  { id: "sectionC", titleFr: "C. Rapport", titleEn: "C. Report" },
  { id: "section1", titleFr: "1. Mandat évaluation", titleEn: "1. Evaluation Mandate" },
  { id: "section2", titleFr: "2. Diagnostics CNESST", titleEn: "2. CNESST Diagnoses" },
  { id: "section3", titleFr: "3. Modalité entrevue", titleEn: "3. Interview Modality" },
  { id: "section4", titleFr: "4. Identification", titleEn: "4. Identification" },
  { id: "section5", titleFr: "5. Antécédents", titleEn: "5. History" },
  { id: "section6", titleFr: "6. Médication actuelle", titleEn: "6. Current Medication" },
  { id: "section7", titleFr: "7. Historique faits", titleEn: "7. Facts History" },
  { id: "section8", titleFr: "8. Questionnaire subjectif", titleEn: "8. Subjective Questionnaire" },
  { id: "section9", titleFr: "9. Examen physique", titleEn: "9. Physical Examination" },
  { id: "section10", titleFr: "10. Examens paracliniques", titleEn: "10. Paraclinical Exams" },
  { id: "section11", titleFr: "11. Conclusion", titleEn: "11. Conclusion" },
];

const translations = {
  fr: {
    navigation: "Navigation",
    formActions: "Actions formulaire",
    formManagement: "Gestion formulaires",
    save: "Sauvegarder",
    saveAs: "Sauvegarder copie",
    print: "Imprimer",
    export: "Exporter PDF",
    clearForm: "Effacer tout",
    savedDrafts: "Copies sauvées",
    completedForms: "Drafts",
    collapse: "Réduire",
    expand: "Développer"
  },
  en: {
    navigation: "Navigation",
    formActions: "Form Actions",
    formManagement: "Form Management",
    save: "Save",
    saveAs: "Save Copy",
    print: "Print",
    export: "Export PDF",
    clearForm: "Clear All",
    savedDrafts: "Saved Copies",
    completedForms: "Drafts",
    collapse: "Collapse",
    expand: "Expand"
  }
};

export function LeftNavigationPane({
  language,
  onSectionNavigate,
  onSavedForms,
  onDrafts,
  onSavedCopies,
  onSaveDialog,
  onSave,
  onPrint,
  onExport,
  onClearForm,
  savedFormsCount = 0,
  completedFormsCount = 0
}: LeftNavigationPaneProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    formActions: false,
    formManagement: false,
    navigation: true
  });
  const t = translations[language];

  const toggleSection = (section: keyof typeof sectionsCollapsed) => {
    setSectionsCollapsed(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const scrollToSection = (sectionId: string) => {
    onSectionNavigate(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-30 flex flex-col ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      
      {/* Collapse/Expand Toggle */}
      <div className="flex justify-end p-2 border-b border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
          title={isCollapsed ? t.expand : t.collapse}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Form Actions Section */}
        <div className="border-b border-gray-100">
          {!isCollapsed && (
            <button
              onClick={() => toggleSection('formActions')}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-700">{t.formActions}</h3>
              {sectionsCollapsed.formActions ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
          
          {!isCollapsed && !sectionsCollapsed.formActions && (
            <div className="px-3 pb-3 space-y-2">

              <Button
                onClick={onPrint}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                title={t.print}
              >
                <FileText className="h-4 w-4" />
                <span className="ml-2">{t.print}</span>
              </Button>
              
              <Button
                onClick={onExport}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                title={t.export}
              >
                <Archive className="h-4 w-4" />
                <span className="ml-2">{t.export}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Form Management Section */}
        <div className="border-b border-gray-100">
          {!isCollapsed && (
            <button
              onClick={() => toggleSection('formManagement')}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-700">{t.formManagement}</h3>
              {sectionsCollapsed.formManagement ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
          
          {!isCollapsed && !sectionsCollapsed.formManagement && (
            <div className="px-3 pb-3 space-y-2">
              <Button
                onClick={onDrafts}
                size="sm"
                variant="outline"
                className="w-full justify-start"
                title={t.savedDrafts}
              >
                <FolderOpen className="h-4 w-4" />
                <span className="ml-2">{t.savedDrafts}</span>
                {savedFormsCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {savedFormsCount}
                  </Badge>
                )}
              </Button>
              
              <Button
                onClick={onSavedCopies}
                size="sm"
                variant="outline"
                className="w-full justify-start"
                title={t.completedForms}
              >
                <FileText className="h-4 w-4" />
                <span className="ml-2">{t.completedForms}</span>
                {completedFormsCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {completedFormsCount}
                  </Badge>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Section Navigation */}
        <div className="flex-1 overflow-y-auto">
          {!isCollapsed && (
            <>
              <button
                onClick={() => toggleSection('navigation')}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Navigation className="h-4 w-4 mr-2" />
                  {t.navigation}
                </h3>
                {sectionsCollapsed.navigation ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {!sectionsCollapsed.navigation && (
                <div className="px-3 pb-3 space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left p-2 rounded-md hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                    >
                      {language === 'fr' ? section.titleFr : section.titleEn}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          
          {isCollapsed && (
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 p-0 mb-2"
                title={t.navigation}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}