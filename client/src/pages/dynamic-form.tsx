import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { FormContainer } from '@/components/form-container';
import { formRegistry } from '@/lib/form-registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FormInput } from 'lucide-react';

interface DynamicFormPageProps {
  formType?: string;
  language?: 'fr' | 'en';
  onLanguageChange?: (language: 'fr' | 'en') => void;
}

export default function DynamicFormPage({ 
  formType: initialFormType, 
  language = 'fr',
  onLanguageChange 
}: DynamicFormPageProps) {
  const [location, setLocation] = useLocation();
  const [selectedFormType, setSelectedFormType] = useState<string>(initialFormType || 'cnesst-medical');
  const [formLanguage, setFormLanguage] = useState<'fr' | 'en'>(language);

  // Get available form types
  const availableFormTypes = formRegistry.listForms().map(f => f.id);

  // Handle language change
  const handleLanguageChange = (newLanguage: 'fr' | 'en') => {
    setFormLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  // Handle form type change
  const handleFormTypeChange = (formType: string) => {
    setSelectedFormType(formType);
    // Update URL to reflect the selected form type
    setLocation(`/forms/${formType}`);
  };

  // Handle form save
  const handleFormSave = async (formData: Record<string, any>) => {
    try {
      // Save form data to backend
      const response = await fetch('/api/generic-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: selectedFormType,
          title: `${selectedFormType} - ${new Date().toLocaleDateString()}`,
          formData,
          retentionDays: 30
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save form');
      }

      const savedForm = await response.json();
      console.log('Form saved successfully:', savedForm);
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  // Handle form export
  const handleFormExport = (formData: Record<string, any>) => {
    // For now, use browser print
    // In the future, this could generate a proper PDF
    window.print();
  };

  // Show form selector if no form type is selected or if form type is invalid
  const config = formRegistry.getForm(selectedFormType);
  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FormInput className="w-6 h-6" />
                <span>{formLanguage === 'fr' ? 'Sélectionner un formulaire' : 'Select a Form'}</span>
              </CardTitle>
              <CardDescription>
                {formLanguage === 'fr' 
                  ? 'Choisissez le type de formulaire que vous souhaitez utiliser.'
                  : 'Choose the type of form you want to use.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {formLanguage === 'fr' ? 'Type de formulaire' : 'Form Type'}
                </label>
                <Select value={selectedFormType} onValueChange={handleFormTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      formLanguage === 'fr' ? 'Sélectionnez un formulaire' : 'Select a form'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFormTypes.map((type) => {
                      const typeConfig = formRegistry.getForm(type);
                      const title = typeConfig 
                        ? (formLanguage === 'fr' ? typeConfig.title.fr : typeConfig.title.en)
                        : type;
                      return (
                        <SelectItem key={type} value={type}>
                          {title}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{formLanguage === 'fr' ? 'Retour' : 'Back'}</span>
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant={formLanguage === 'fr' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLanguageChange('fr')}
                  >
                    Français
                  </Button>
                  <Button
                    variant={formLanguage === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLanguageChange('en')}
                  >
                    English
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <FormContainer
      formType={selectedFormType}
      language={formLanguage}
      onLanguageChange={handleLanguageChange}
      onSave={handleFormSave}
      onExport={handleFormExport}
    />
  );
}