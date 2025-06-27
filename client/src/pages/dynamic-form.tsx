import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { FormConfig } from '@shared/form-configs/form-config.types';
import { formRegistry } from '@/lib/form-registry';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Globe } from 'lucide-react';

interface DynamicFormPageProps {
  params: {
    formType: string;
  };
}

export default function DynamicFormPage({ params }: DynamicFormPageProps) {
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { formType } = params;

  // Get form configuration
  const formConfig = formRegistry.getFormConfig(formType);

  if (!formConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Form Not Found</CardTitle>
            <CardDescription>
              The form type "{formType}" is not registered in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/forms')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const formTitle = typeof formConfig.title === 'string' 
    ? formConfig.title 
    : (language === 'fr' ? formConfig.title.fr : formConfig.title.en);

  const formDescription = formConfig.description 
    ? (typeof formConfig.description === 'string' 
        ? formConfig.description 
        : (language === 'fr' ? formConfig.description.fr : formConfig.description.en))
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={() => setLocation('/forms')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'fr' ? 'Retour' : 'Back'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={toggleLanguage}
              className="flex items-center space-x-2"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'fr' ? 'EN' : 'FR'}</span>
            </Button>
          </div>

          {/* Form Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              {formTitle}
            </h1>
            {formDescription && (
              <p className="text-gray-600">
                {formDescription}
              </p>
            )}
          </div>

          {/* Dynamic Form Content */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                {language === 'fr' 
                  ? 'Configuration de formulaire dynamique pour:' 
                  : 'Dynamic form configuration for:'
                }
              </p>
              <p className="font-mono text-blue-600 mb-6">
                {formConfig.id}
              </p>
              <p className="text-sm text-gray-500">
                {language === 'fr' 
                  ? 'Cette page sera développée avec le rendu dynamique des champs de formulaire.'
                  : 'This page will be developed with dynamic form field rendering.'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}