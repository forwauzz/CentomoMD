import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X, ChevronDown } from "lucide-react";

interface NavigationSection {
  id: string;
  titleFr: string;
  titleEn: string;
}

interface FloatingNavigationProps {
  language: 'fr' | 'en';
}

const sections: NavigationSection[] = [
  { id: "section1", titleFr: "1. Événement", titleEn: "1. Event" },
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

export function FloatingNavigation({ language }: FloatingNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNavigation = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-40 no-print">
      {/* Toggle Button */}
      <Button
        onClick={toggleNavigation}
        className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 ${
          isOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        size="sm"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </Button>

      {/* Navigation Panel */}
      {isOpen && (
        <Card className="absolute right-14 top-0 w-72 max-h-96 overflow-y-auto shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">
                {language === 'fr' ? 'Navigation' : 'Navigation'}
              </h3>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
            
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="p-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors"
                >
                  {language === 'fr' ? section.titleFr : section.titleEn}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}