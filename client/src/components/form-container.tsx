import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FieldRenderer } from '@/components/dynamic-fields/field-renderer';
import { formRegistry } from '@/lib/form-registry';
import type { FormConfig, SectionConfig, FieldConfig } from '@shared/form-configs/form-config.types';
import { Save, FileDown, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormContainerProps {
  formType: string;
  language: 'fr' | 'en';
  onLanguageChange?: (language: 'fr' | 'en') => void;
  initialData?: Record<string, any>;
  onSave?: (data: Record<string, any>) => void;
  onExport?: (data: Record<string, any>) => void;
}

export function FormContainer({
  formType,
  language,
  onLanguageChange,
  initialData = {},
  onSave,
  onExport
}: FormContainerProps) {
  const { toast } = useToast();
  const config = formRegistry.getForm(formType);

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Form Not Found</CardTitle>
            <CardDescription>
              The form type "{formType}" is not registered in the system.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get validation schema from form registry
  const validationSchema = formRegistry.getFormSchema(formType);
  const defaultValues = { ...initialData };

  const form = useForm({
    resolver: validationSchema ? zodResolver(validationSchema) : undefined,
    defaultValues,
  });

  const onSubmit = (data: Record<string, any>) => {
    if (onSave) {
      onSave(data);
      toast({
        title: "Form Saved",
        description: "Your form has been saved successfully.",
      });
    }
  };

  const handleExport = () => {
    const formData = form.getValues();
    if (onExport) {
      onExport(formData);
    } else {
      // Default export behavior
      window.print();
    }
  };

  const renderField = (field: FieldConfig) => {
    return (
      <FieldRenderer
        key={field.id}
        field={field}
        control={form.control}
      />
    );
  };

  const renderSection = (section: SectionConfig) => {
    const title = typeof section.title === 'string' 
      ? section.title 
      : (language === 'fr' ? (section.title as any).fr : (section.title as any).en);
    const description = section.description 
      ? (typeof section.description === 'string' 
          ? section.description 
          : (language === 'fr' ? (section.description as any).fr : (section.description as any).en))
      : undefined;

    return (
      <Card key={section.id} className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-800">
            {title}
          </CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {section.fields?.map(renderField)}
        </CardContent>
      </Card>
    );
  };

  const formTitle = typeof config.title === 'string' 
    ? config.title 
    : (language === 'fr' ? (config.title as any).fr : (config.title as any).en);
  const formDescription = config.description 
    ? (typeof config.description === 'string' 
        ? config.description 
        : (language === 'fr' ? (config.description as any).fr : (config.description as any).en))
    : undefined;

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
              {formDescription && (
                <p className="text-gray-600">{formDescription}</p>
              )}
            </div>
            
            {/* Language Toggle */}
            {onLanguageChange && (
              <div className="flex space-x-2">
                <Button
                  variant={language === 'fr' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onLanguageChange('fr')}
                >
                  Français
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onLanguageChange('en')}
                >
                  English
                </Button>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
        </div>

        {/* Form Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Render all sections */}
            {config.sections.map(renderSection)}

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6">
              <div className="flex space-x-4">
                <Button type="submit" className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Sauvegarder' : 'Save'}</span>
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleExport}
                  className="flex items-center space-x-2"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Exporter PDF' : 'Export PDF'}</span>
                </Button>
              </div>

              {/* Form Stats */}
              <div className="text-sm text-gray-500">
                {language === 'fr' ? 'Type de formulaire' : 'Form Type'}: {config.id}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}