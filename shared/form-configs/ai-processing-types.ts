import { z } from 'zod';

// Validation schema first
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

// Inferred types
export type AIProcessingRule = z.infer<typeof aiProcessingRuleSchema>;
export type AIProcessingConfig = z.infer<typeof aiProcessingConfigSchema>;