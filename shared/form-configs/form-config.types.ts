// Form Configuration Type Definitions
// Foundation types for the modular form system

export type FieldType = 
  | 'text'
  | 'textarea' 
  | 'checkbox'
  | 'select'
  | 'medical-select'
  | 'number'
  | 'date'
  | 'ai-enhanced';

export type SectionType = 
  | 'static'           // Read-only content
  | 'form'             // Standard form fields
  | 'checkbox-group'   // Multiple checkboxes
  | 'medical-exam'     // Medical examination fields
  | 'ai-enhanced';     // AI-powered sections

export interface FieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  validation?: ValidationRule[];
  aiProcessing?: AIFieldConfig;
  defaultValue?: any;
  dependsOn?: string[];  // Field dependencies
  grid?: {
    cols?: number;      // Grid column span
    rows?: number;      // Grid row span
  };
}

export interface SectionConfig {
  id: string;
  title: string;
  type: SectionType;
  description?: string;
  defaultOpen?: boolean;
  fields?: FieldConfig[];
  staticContent?: string;
  aiProcessing?: AISectionConfig;
  layout?: {
    columns?: number;
    gap?: string;
  };
  dependsOn?: string[];  // Section dependencies
}

export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  version: string;
  sections: SectionConfig[];
  metadata?: {
    author?: string;
    created?: string;
    updated?: string;
    category?: string;
    tags?: string[];
  };
  settings?: FormSettings;
  validation?: FormValidation;
}

export interface FormSettings {
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
  allowDrafts?: boolean;
  requireAuthentication?: boolean;
  retentionDays?: number;
  exportFormats?: ('pdf' | 'json' | 'csv')[];
  languages?: string[];
  defaultLanguage?: string;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  condition?: string; // JavaScript expression for conditional validation
}

export interface FormValidation {
  rules?: ValidationRule[];
  crossFieldValidation?: CrossFieldRule[];
}

export interface CrossFieldRule {
  id: string;
  fields: string[];
  condition: string; // JavaScript expression
  message: string;
}

// AI Processing Configuration
export interface AIFieldConfig {
  type: 'format' | 'enhance' | 'translate' | 'distribute';
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  dependencies?: string[]; // Other fields this processing depends on
}

export interface AISectionConfig {
  type: 'generate' | 'format' | 'distribute' | 'enhance';
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  inputFields?: string[];
  outputFields?: string[];
  dependencies?: string[];
}

export interface AIProcessingRule {
  id: string;
  formId: string;
  sectionId?: string;
  fieldId?: string;
  type: 'format' | 'enhance' | 'generate' | 'distribute';
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  validation?: ValidationRule[];
  dependencies?: string[];
  languages?: string[];
}

// Form Data Types
export interface GenericFormData {
  formId: string;
  formVersion: string;
  data: Record<string, any>;
  metadata?: {
    userId?: string;
    sessionId?: string;
    startedAt?: Date;
    completedAt?: Date;
    lastModified?: Date;
    language?: string;
    device?: string;
    userAgent?: string;
  };
  validation?: {
    isValid: boolean;
    errors: Record<string, string[]>;
    warnings: Record<string, string[]>;
  };
  aiProcessing?: {
    processedFields: Record<string, any>;
    processingHistory: AIProcessingHistory[];
  };
}

export interface AIProcessingHistory {
  fieldId: string;
  processedAt: Date;
  inputText: string;
  outputText: string;
  processingType: string;
  model: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Form Registry Types
export interface FormRegistryEntry {
  config: FormConfig;
  component?: React.ComponentType<any>;
  customValidators?: Record<string, (value: any, formData: any) => boolean>;
  customFieldTypes?: Record<string, React.ComponentType<any>>;
  hooks?: {
    beforeSave?: (data: GenericFormData) => Promise<GenericFormData>;
    afterSave?: (data: GenericFormData) => Promise<void>;
    beforeLoad?: (id: string) => Promise<void>;
    afterLoad?: (data: GenericFormData) => Promise<GenericFormData>;
  };
}

// Export utility types
export type FormFieldValue = string | number | boolean | Date | null | undefined;
export type FormSectionData = Record<string, FormFieldValue>;
export type FormDataMap = Record<string, FormSectionData>;

// Form State Management
export interface FormState {
  formId: string;
  data: GenericFormData;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  currentSection?: string;
  completedSections: string[];
  validationState: Record<string, boolean>;
}

export interface FormAction {
  type: 'SET_FIELD' | 'SET_SECTION' | 'VALIDATE' | 'SAVE' | 'LOAD' | 'RESET' | 'SET_ERROR' | 'CLEAR_ERROR';
  payload?: any;
}

// Navigation Types
export interface NavigationItem {
  id: string;
  title: string;
  completed?: boolean;
  hasErrors?: boolean;
  hasWarnings?: boolean;
  isActive?: boolean;
}