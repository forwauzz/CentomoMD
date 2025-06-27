// Dynamic Field Renderer - Phase 1.4
// Renders form fields based on configuration

import React from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MedicalSelect } from '@/components/ui/medical-select';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import type { FieldConfig } from '@shared/form-configs/form-config.types';

interface FieldRendererProps<TFieldValues extends FieldValues = FieldValues> {
  field: FieldConfig;
  control: Control<TFieldValues>;
  onVoiceRecord?: (fieldId: string) => void;
  className?: string;
  disabled?: boolean;
  language?: 'fr' | 'en';
}

// Utility function to get localized text
function getLocalizedText(text: string | { fr: string; en: string }, language: 'fr' | 'en' = 'fr'): string {
  if (typeof text === 'string') {
    return text;
  }
  return text[language] || text.fr;
}

export function FieldRenderer<TFieldValues extends FieldValues = FieldValues>({
  field,
  control,
  onVoiceRecord,
  className = '',
  disabled = false,
  language = 'fr',
}: FieldRendererProps<TFieldValues>) {
  const renderFieldInput = (onChange: (value: any) => void, value: any) => {
    switch (field.type) {
      case 'text':
        return (
          <div className="relative">
            <Input
              placeholder={getLocalizedText(field.placeholder || '', language)}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="pr-10"
            />
            {onVoiceRecord && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => onVoiceRecord(field.id)}
                disabled={disabled}
              >
                <Mic className="h-3 w-3" />
              </Button>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="relative">
            <Textarea
              placeholder={getLocalizedText(field.placeholder || '', language)}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="min-h-[80px] pr-10"
            />
            {onVoiceRecord && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-2 top-2 h-6 w-6 p-0"
                onClick={() => onVoiceRecord(field.id)}
                disabled={disabled}
              >
                <Mic className="h-3 w-3" />
              </Button>
            )}
          </div>
        );

      case 'ai-enhanced':
        return (
          <div className="relative">
            <Textarea
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="min-h-[120px] pr-10"
            />
            <div className="absolute right-2 top-2 flex flex-col gap-1">
              {onVoiceRecord && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => onVoiceRecord(field.id)}
                  disabled={disabled}
                  title="Voice dictation"
                >
                  <Mic className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value || false}
              onCheckedChange={onChange}
              disabled={disabled}
              id={field.id}
            />
            <label 
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {getLocalizedText(field.label, language)}
            </label>
          </div>
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {getLocalizedText(option.label, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'medical-select':
        return (
          <MedicalSelect
            value={value || ''}
            onValueChange={onChange}
            placeholder={field.placeholder}
            disabled={disabled}
            options={field.options || []}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            disabled={disabled}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );

      default:
        return (
          <Input
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );
    }
  };

  // For checkbox fields, don't render the FormLabel since it's handled in the checkbox component
  if (field.type === 'checkbox') {
    return (
      <FormField
        control={control}
        name={field.id as FieldPath<TFieldValues>}
        render={({ field: formField }) => (
          <FormItem className={className}>
            <FormControl>
              {renderFieldInput(formField.onChange, formField.value)}
            </FormControl>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={control}
      name={field.id as FieldPath<TFieldValues>}
      render={({ field: formField }) => (
        <FormItem className={className}>
          <FormLabel>
            {getLocalizedText(field.label, language)}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {renderFieldInput(formField.onChange, formField.value)}
          </FormControl>
          {field.description && (
            <p className="text-sm text-muted-foreground">{getLocalizedText(field.description, language)}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Specialized field renderers for specific use cases
export function TextFieldRenderer<TFieldValues extends FieldValues = FieldValues>(
  props: FieldRendererProps<TFieldValues>
) {
  return <FieldRenderer {...props} />;
}

export function CheckboxFieldRenderer<TFieldValues extends FieldValues = FieldValues>(
  props: FieldRendererProps<TFieldValues>
) {
  return <FieldRenderer {...props} />;
}

export function SelectFieldRenderer<TFieldValues extends FieldValues = FieldValues>(
  props: FieldRendererProps<TFieldValues>
) {
  return <FieldRenderer {...props} />;
}

// Field renderer with grid support
export function GridFieldRenderer<TFieldValues extends FieldValues = FieldValues>({
  field,
  control,
  onVoiceRecord,
  disabled = false,
}: FieldRendererProps<TFieldValues>) {
  const gridClass = field.grid ? 
    `col-span-${field.grid.cols || 1} row-span-${field.grid.rows || 1}` : 
    '';

  return (
    <FieldRenderer
      field={field}
      control={control}
      onVoiceRecord={onVoiceRecord}
      disabled={disabled}
      className={gridClass}
    />
  );
}

// Utility function to determine if field supports voice input
export function supportsVoiceInput(fieldType: string): boolean {
  return ['text', 'textarea', 'ai-enhanced'].includes(fieldType);
}

// Utility function to get field component by type
export function getFieldComponent(fieldType: string) {
  switch (fieldType) {
    case 'text':
    case 'textarea':
    case 'ai-enhanced':
      return TextFieldRenderer;
    case 'checkbox':
      return CheckboxFieldRenderer;
    case 'select':
    case 'medical-select':
      return SelectFieldRenderer;
    default:
      return FieldRenderer;
  }
}