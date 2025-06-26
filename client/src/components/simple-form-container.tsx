import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, FileDown, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import MedicalForm from '@/pages/medical-form';

interface SimpleFormContainerProps {
  formType: string;
  language: 'fr' | 'en';
  onLanguageChange?: (language: 'fr' | 'en') => void;
}

export function SimpleFormContainer({
  formType,
  language,
  onLanguageChange
}: SimpleFormContainerProps) {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Form type mappings
  const formConfigs = {
    'cnesst-medical': {
      title: {
        fr: 'Évaluation médicale CNESST',
        en: 'CNESST Medical Evaluation'
      },
      description: {
        fr: 'Formulaire d\'évaluation médicale pour la Commission des normes, de l\'équité, de la santé et de la sécurité du travail',
        en: 'Medical evaluation form for the Commission for Standards, Equity, Health and Safety at Work'
      },
      component: MedicalForm
    }
  } as const;

  const config = formConfigs[formType as keyof typeof formConfigs];

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Form Not Found</CardTitle>
            <CardDescription>
              The form type "{formType}" is not available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/forms')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Form Selection</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formTitle = language === 'fr' ? config.title.fr : config.title.en;
  const formDescription = language === 'fr' ? config.description.fr : config.description.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Form Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                {formTitle}
              </h1>
              <p className="text-gray-600">{formDescription}</p>
            </div>
            
            {/* Navigation */}
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/forms')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'fr' ? 'Retour' : 'Back'}</span>
              </Button>
              
              {/* Language Toggle */}
              {onLanguageChange && (
                <>
                  <Button
                    variant={language === 'fr' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onLanguageChange('fr')}
                  >
                    FR
                  </Button>
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onLanguageChange('en')}
                  >
                    EN
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <Separator className="my-4" />
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Render the specific form component */}
          <config.component 
            language={language} 
            onLanguageChange={onLanguageChange || (() => {})}
          />
        </div>
      </div>
    </div>
  );
}