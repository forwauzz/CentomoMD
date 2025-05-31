import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X, ChevronDown, Move } from "lucide-react";

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

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function FloatingNavigation({ language }: FloatingNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>('top-right');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  const toggleNavigation = () => {
    setIsOpen(!isOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      // Close navigation after scrolling
      setIsOpen(false);
    }
  };

  const getPositionClasses = (pos: Position) => {
    switch (pos) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getPanelPosition = (pos: Position) => {
    switch (pos) {
      case 'top-left':
        return 'left-14 top-0';
      case 'top-right':
        return 'right-14 top-0';
      case 'bottom-left':
        return 'left-14 bottom-0';
      case 'bottom-right':
        return 'right-14 bottom-0';
      default:
        return 'right-14 top-0';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && buttonRef.current) {
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      // Determine which corner is closest
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      const isLeft = x < windowWidth / 2;
      const isTop = y < windowHeight / 2;
      
      let newPosition: Position;
      if (isTop && isLeft) {
        newPosition = 'top-left';
      } else if (isTop && !isLeft) {
        newPosition = 'top-right';
      } else if (!isTop && isLeft) {
        newPosition = 'bottom-left';
      } else {
        newPosition = 'bottom-right';
      }
      
      setPosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div 
      ref={buttonRef}
      className={`fixed z-40 no-print transition-all duration-300 ${getPositionClasses(position)} ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onMouseDown={handleMouseDown}
    >
      {/* Toggle Button */}
      <Button
        onClick={toggleNavigation}
        className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 ${
          isOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
        } ${isDragging ? 'scale-110' : ''}`}
        size="sm"
      >
        {isDragging ? (
          <Move className="w-5 h-5 text-white" />
        ) : isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </Button>

      {/* Navigation Panel */}
      {isOpen && !isDragging && (
        <Card className={`absolute w-72 max-h-96 overflow-y-auto shadow-xl ${getPanelPosition(position)}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">
                {language === 'fr' ? 'Navigation' : 'Navigation'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {language === 'fr' ? 'Glissez pour déplacer' : 'Drag to move'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
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