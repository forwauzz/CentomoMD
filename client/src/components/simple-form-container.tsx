// Simple Form Container - Phase 4.1
// Working form container with proper TypeScript support

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  // For now, route to existing medical form for CNESST
  if (formType === 'cnesst-medical' || formType === 'cnesst-medical-evaluation') {
    return (
      <MedicalForm 
        language={language} 
        onLanguageChange={onLanguageChange || (() => {})}
      />
    );
  }

  // For other form types, show placeholder
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Type: {formType}</CardTitle>
          <CardDescription>
            This form type is configured but not yet implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Language: {language}</p>
          <p>Available form types will be rendered here in future phases.</p>
        </CardContent>
      </Card>
    </div>
  );
}