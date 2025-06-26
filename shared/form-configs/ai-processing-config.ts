import { z } from 'zod';

// AI Processing Configuration Types
interface AIProcessingRuleBase {
  fieldId: string;
  processingType: 'format' | 'enhance' | 'distribute' | 'generate';
  targetFields?: string[]; // For distribution
  contextFields?: string[]; // Fields needed for context
  language?: 'fr' | 'en' | 'auto';
  prompt?: string; // Custom processing prompt
  dependencies?: string[]; // Other fields this processing depends on
}

interface AIProcessingConfigBase {
  formType: string;
  rules: AIProcessingRuleBase[];
  globalContext?: {
    medicalTerminology?: boolean;
    documentType?: string;
    language?: 'fr' | 'en' | 'auto';
  };
}

// Validation schema
export const aiProcessingRuleSchema = z.object({
  fieldId: z.string(),
  processingType: z.enum(['format', 'enhance', 'distribute', 'generate']),
  targetFields: z.array(z.string()).optional(),
  contextFields: z.array(z.string()).optional(),
  language: z.enum(['fr', 'en', 'auto']).optional(),
  prompt: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

export const aiProcessingConfigSchema = z.object({
  formType: z.string(),
  rules: z.array(aiProcessingRuleSchema),
  globalContext: z.object({
    medicalTerminology: z.boolean().optional(),
    documentType: z.string().optional(),
    language: z.enum(['fr', 'en', 'auto']).optional(),
  }).optional(),
});

export type AIProcessingRule = z.infer<typeof aiProcessingRuleSchema>;
export type AIProcessingConfig = z.infer<typeof aiProcessingConfigSchema>;