// Dynamic Form Validation System
// Validates forms based on configuration rather than hardcoded schemas

import { z } from 'zod';
import { ValidationRule, FormConfig, FieldConfig, GenericFormData, CrossFieldRule } from './form-config.types';

export class FormValidator {
  private formConfig: FormConfig;
  private dynamicSchema: z.ZodObject<any> | null = null;

  constructor(formConfig: FormConfig) {
    this.formConfig = formConfig;
    this.buildDynamicSchema();
  }

  /**
   * Build Zod schema dynamically from form configuration
   */
  private buildDynamicSchema(): void {
    const schemaFields: Record<string, z.ZodType<any>> = {};

    // Process each section and field
    for (const section of this.formConfig.sections) {
      if (section.fields) {
        for (const field of section.fields) {
          schemaFields[field.id] = this.buildFieldSchema(field);
        }
      }
    }

    this.dynamicSchema = z.object(schemaFields);
  }

  /**
   * Build validation schema for individual field
   */
  private buildFieldSchema(field: FieldConfig): z.ZodType<any> {
    let schema: z.ZodType<any>;

    // Base schema by field type
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'ai-enhanced':
        schema = z.string();
        break;
      case 'number':
        schema = z.number();
        break;
      case 'checkbox':
        schema = z.boolean();
        break;
      case 'date':
        schema = z.date();
        break;
      case 'select':
      case 'medical-select':
        schema = z.string();
        break;
      default:
        schema = z.any();
    }

    // Apply validation rules
    if (field.validation) {
      for (const rule of field.validation) {
        schema = this.applyValidationRule(schema, rule);
      }
    }

    // Make optional if not required
    if (!field.required) {
      schema = schema.optional();
    }

    return schema;
  }

  /**
   * Apply individual validation rule to schema
   */
  private applyValidationRule(schema: z.ZodType<any>, rule: ValidationRule): z.ZodType<any> {
    switch (rule.type) {
      case 'required':
        // Required is handled at field level
        return schema;
      
      case 'minLength':
        if (schema instanceof z.ZodString) {
          return schema.min(rule.value, rule.message);
        }
        return schema;
      
      case 'maxLength':
        if (schema instanceof z.ZodString) {
          return schema.max(rule.value, rule.message);
        }
        return schema;
      
      case 'pattern':
        if (schema instanceof z.ZodString) {
          return schema.regex(new RegExp(rule.value), rule.message);
        }
        return schema;
      
      case 'custom':
        return schema.refine(
          (value) => this.evaluateCustomValidation(rule.value, value),
          rule.message
        );
      
      default:
        return schema;
    }
  }

  /**
   * Evaluate custom validation logic
   */
  private evaluateCustomValidation(expression: string, value: any): boolean {
    try {
      // Create a safe evaluation context
      const context = { value };
      const func = new Function('context', `with(context) { return ${expression}; }`);
      return func(context);
    } catch (error) {
      console.error('Custom validation error:', error);
      return false;
    }
  }

  /**
   * Validate form data against configuration
   */
  public validate(data: Record<string, any>): {
    success: boolean;
    errors: Record<string, string[]>;
    warnings: Record<string, string[]>;
  } {
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};

    // Schema validation
    if (this.dynamicSchema) {
      try {
        this.dynamicSchema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          for (const issue of error.issues) {
            const field = issue.path.join('.');
            if (!errors[field]) {
              errors[field] = [];
            }
            errors[field].push(issue.message);
          }
        }
      }
    }

    // Cross-field validation
    if (this.formConfig.validation?.crossFieldValidation) {
      for (const rule of this.formConfig.validation.crossFieldValidation) {
        const isValid = this.evaluateCrossFieldRule(rule, data);
        if (!isValid) {
          for (const fieldId of rule.fields) {
            if (!errors[fieldId]) {
              errors[fieldId] = [];
            }
            errors[fieldId].push(rule.message);
          }
        }
      }
    }

    // Field dependency validation
    this.validateFieldDependencies(data, errors, warnings);

    return {
      success: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  /**
   * Evaluate cross-field validation rules
   */
  private evaluateCrossFieldRule(rule: CrossFieldRule, data: Record<string, any>): boolean {
    try {
      const context = { ...data };
      const func = new Function('context', `with(context) { return ${rule.condition}; }`);
      return func(context);
    } catch (error) {
      console.error('Cross-field validation error:', error);
      return false;
    }
  }

  /**
   * Validate field dependencies
   */
  private validateFieldDependencies(
    data: Record<string, any>,
    errors: Record<string, string[]>,
    warnings: Record<string, string[]>
  ): void {
    for (const section of this.formConfig.sections) {
      if (section.fields) {
        for (const field of section.fields) {
          if (field.dependsOn) {
            const hasValue = data[field.id] !== undefined && data[field.id] !== null && data[field.id] !== '';
            const dependenciesMet = field.dependsOn.every(depId => {
              const depValue = data[depId];
              return depValue !== undefined && depValue !== null && depValue !== '';
            });

            if (hasValue && !dependenciesMet) {
              if (!warnings[field.id]) {
                warnings[field.id] = [];
              }
              warnings[field.id].push(
                `This field depends on: ${field.dependsOn.join(', ')}`
              );
            }
          }
        }
      }
    }
  }

  /**
   * Validate specific field
   */
  public validateField(fieldId: string, value: any, formData: Record<string, any> = {}): {
    success: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Find field configuration
    const field = this.findField(fieldId);
    if (!field) {
      return { success: false, errors: ['Field not found'], warnings: [] };
    }

    // Build and validate with field schema
    const fieldSchema = this.buildFieldSchema(field);
    try {
      fieldSchema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map(issue => issue.message));
      }
    }

    // Check dependencies
    if (field.dependsOn) {
      const dependenciesMet = field.dependsOn.every(depId => {
        const depValue = formData[depId];
        return depValue !== undefined && depValue !== null && depValue !== '';
      });

      if (value && !dependenciesMet) {
        warnings.push(`This field depends on: ${field.dependsOn.join(', ')}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Find field configuration by ID
   */
  private findField(fieldId: string): FieldConfig | null {
    for (const section of this.formConfig.sections) {
      if (section.fields) {
        const field = section.fields.find(f => f.id === fieldId);
        if (field) return field;
      }
    }
    return null;
  }

  /**
   * Get validation schema for external use (e.g., react-hook-form)
   */
  public getZodSchema(): z.ZodObject<any> | null {
    return this.dynamicSchema;
  }

  /**
   * Get form configuration
   */
  public getFormConfig(): FormConfig {
    return this.formConfig;
  }

  /**
   * Check if form is valid based on current data
   */
  public isFormValid(data: Record<string, any>): boolean {
    const validation = this.validate(data);
    return validation.success;
  }

  /**
   * Get required fields for form completion
   */
  public getRequiredFields(): string[] {
    const requiredFields: string[] = [];
    
    for (const section of this.formConfig.sections) {
      if (section.fields) {
        for (const field of section.fields) {
          if (field.required) {
            requiredFields.push(field.id);
          }
        }
      }
    }
    
    return requiredFields;
  }

  /**
   * Get completion percentage
   */
  public getCompletionPercentage(data: Record<string, any>): number {
    const requiredFields = this.getRequiredFields();
    if (requiredFields.length === 0) return 100;

    const completedRequired = requiredFields.filter(fieldId => {
      const value = data[fieldId];
      return value !== undefined && value !== null && value !== '';
    }).length;

    return Math.round((completedRequired / requiredFields.length) * 100);
  }
}

// Factory function for creating validators
export function createFormValidator(formConfig: FormConfig): FormValidator {
  return new FormValidator(formConfig);
}

// Utility functions for common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  postalCode: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
  ramq: /^\d{4} \d{4} \d{4}$/,
  nas: /^\d{3} \d{3} \d{3}$/,
};

// Common validation rules
export const CommonValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value: min,
    message: message || `Must be at least ${min} characters`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value: max,
    message: message || `Must be no more than ${max} characters`
  }),
  
  email: (message = 'Invalid email format'): ValidationRule => ({
    type: 'pattern',
    value: ValidationPatterns.email.source,
    message
  }),
  
  phone: (message = 'Invalid phone number format'): ValidationRule => ({
    type: 'pattern',
    value: ValidationPatterns.phone.source,
    message
  })
};