// Form Registry System - Phase 1.3
// Manages form configurations and provides a centralized registry

import type { FormConfig, FormRegistryEntry, GenericFormData } from '@shared/form-configs/form-config.types';
import { createFormValidator, type FormValidator } from '@shared/form-configs/form-validator';

export class FormRegistry {
  private forms = new Map<string, FormRegistryEntry>();
  private validators = new Map<string, FormValidator>();

  /**
   * Register a new form configuration
   */
  register(config: FormConfig, entry?: Partial<FormRegistryEntry>): void {
    // Check if form already exists to prevent duplicate registration
    if (this.forms.has(config.id)) {
      console.warn(`Form ${config.id} already registered, updating...`);
    }

    const registryEntry: FormRegistryEntry = {
      config,
      component: entry?.component,
      customValidators: entry?.customValidators || {},
      customFieldTypes: entry?.customFieldTypes || {},
      hooks: entry?.hooks || {},
    };

    this.forms.set(config.id, registryEntry);

    // Create and cache validator
    this.validators.set(config.id, createFormValidator(config));

    console.log(`Registered form: ${config.id} (v${config.version})`);
  }

  /**
   * Get form configuration by ID
   */
  getForm(formId: string): FormConfig | null {
    const entry = this.forms.get(formId);
    return entry ? entry.config : null;
  }

  /**
   * Get full registry entry by ID
   */
  getFormEntry(formId: string): FormRegistryEntry | null {
    return this.forms.get(formId) || null;
  }

  /**
   * Get form validator by ID
   */
  getValidator(formId: string): FormValidator | null {
    return this.validators.get(formId) || null;
  }

  /**
   * List all registered forms
   */
  listForms(): FormConfig[] {
    return Array.from(this.forms.values()).map(entry => entry.config);
  }

  /**
   * List forms by category
   */
  listFormsByCategory(category: string): FormConfig[] {
    return this.listForms().filter(config => 
      config.metadata?.category === category
    );
  }

  /**
   * List forms by tag
   */
  listFormsByTag(tag: string): FormConfig[] {
    return this.listForms().filter(config => 
      config.metadata?.tags?.includes(tag)
    );
  }

  /**
   * Check if form exists
   */
  hasForm(formId: string): boolean {
    return this.forms.has(formId);
  }

  /**
   * Unregister a form
   */
  unregister(formId: string): boolean {
    const deleted = this.forms.delete(formId);
    this.validators.delete(formId);
    return deleted;
  }

  /**
   * Get form by ID with version check
   */
  getFormWithVersion(formId: string, version?: string): FormConfig | null {
    const config = this.getForm(formId);
    if (!config) return null;

    if (version && config.version !== version) {
      console.warn(`Form ${formId} version mismatch. Expected: ${version}, Found: ${config.version}`);
    }

    return config;
  }

  /**
   * Validate form data against registered form
   */
  validateForm(formId: string, data: Record<string, any>): {
    success: boolean;
    errors: Record<string, string[]>;
    warnings: Record<string, string[]>;
  } {
    const validator = this.getValidator(formId);
    if (!validator) {
      return {
        success: false,
        errors: { _form: ['Form not found'] },
        warnings: {}
      };
    }

    return validator.validate(data);
  }

  /**
   * Get form completion percentage
   */
  getCompletionPercentage(formId: string, data: Record<string, any>): number {
    const validator = this.getValidator(formId);
    if (!validator) return 0;

    return validator.getCompletionPercentage(data);
  }

  /**
   * Execute form hooks
   */
  async executeHook(
    formId: string, 
    hookName: keyof FormRegistryEntry['hooks'], 
    ...args: any[]
  ): Promise<any> {
    const entry = this.getFormEntry(formId);
    const hook = entry?.hooks?.[hookName];

    if (hook && typeof hook === 'function') {
      try {
        return await (hook as any)(...args);
      } catch (error) {
        console.error(`Error executing ${hookName} hook for form ${formId}:`, error);
        throw error;
      }
    }

    return args[0]; // Return first argument by default (usually the data)
  }

  /**
   * Get form sections for navigation
   */
  getFormSections(formId: string): Array<{
    id: string;
    title: string;
    type: string;
  }> {
    const config = this.getForm(formId);
    if (!config) return [];

    return config.sections.map(section => ({
      id: section.id,
      title: section.title,
      type: section.type,
    }));
  }

  /**
   * Get form fields by section
   */
  getFormFields(formId: string, sectionId: string): Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
  }> {
    const config = this.getForm(formId);
    if (!config) return [];

    const section = config.sections.find(s => s.id === sectionId);
    if (!section || !section.fields) return [];

    return section.fields.map(field => ({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required || false,
    }));
  }

  /**
   * Search forms by title or description
   */
  searchForms(query: string): FormConfig[] {
    const searchTerm = query.toLowerCase();

    return this.listForms().filter(config => 
      config.title.toLowerCase().includes(searchTerm) ||
      config.description?.toLowerCase().includes(searchTerm) ||
      config.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get form statistics
   */
  getRegistryStats(): {
    totalForms: number;
    formsByCategory: Record<string, number>;
    formsByVersion: Record<string, number>;
  } {
    const forms = this.listForms();
    const stats = {
      totalForms: forms.length,
      formsByCategory: {} as Record<string, number>,
      formsByVersion: {} as Record<string, number>,
    };

    forms.forEach(config => {
      // Count by category
      const category = config.metadata?.category || 'uncategorized';
      stats.formsByCategory[category] = (stats.formsByCategory[category] || 0) + 1;

      // Count by version
      stats.formsByVersion[config.version] = (stats.formsByVersion[config.version] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear all registered forms (for testing/reset)
   */
  clear(): void {
    this.forms.clear();
    this.validators.clear();
  }

  /**
   * Export registry configuration (for backup/migration)
   */
  exportRegistry(): Record<string, FormConfig> {
    const exported: Record<string, FormConfig> = {};

    this.forms.forEach((entry, formId) => {
      exported[formId] = entry.config;
    });

    return exported;
  }

  /**
   * Import registry configuration (for backup/migration)
   */
  importRegistry(configurations: Record<string, FormConfig>): void {
    Object.values(configurations).forEach(config => {
      this.register(config);
    });
  }

  /**
   * Get form schema for external use (e.g., react-hook-form)
   */
  getFormSchema(formId: string) {
    const validator = this.getValidator(formId);
    return validator?.getZodSchema() || null;
  }
}

// Global form registry instance
export const formRegistry = new FormRegistry();

// Utility functions for common registry operations
export const FormRegistryUtils = {
  /**
   * Register multiple forms at once
   */
  registerForms(configs: FormConfig[]): void {
    configs.forEach(config => formRegistry.register(config));
  },

  /**
   * Get form title for display
   */
  getFormTitle(formId: string, language: 'fr' | 'en' = 'fr'): string {
    const config = formRegistry.getForm(formId);
    if (!config?.title) return 'Unknown Form';

    if (typeof config.title === 'string') {
      return config.title;
    }

    return config.title[language] || config.title.fr;
  },

  /**
   * Check if form requires authentication
   */
  requiresAuth(formId: string): boolean {
    const config = formRegistry.getForm(formId);
    return config?.settings?.requireAuthentication || false;
  },

  /**
   * Get form supported languages
   */
  getSupportedLanguages(formId: string): string[] {
    const config = formRegistry.getForm(formId);
    return config?.settings?.languages || ['fr'];
  },

  /**
   * Get form auto-save settings
   */
  getAutoSaveSettings(formId: string): {
    enabled: boolean;
    interval: number;
  } {
    const config = formRegistry.getForm(formId);
    return {
      enabled: config?.settings?.autoSave || false,
      interval: config?.settings?.autoSaveInterval || 30000, // 30 seconds default
    };
  },

  /**
   * Get form export formats
   */
  getExportFormats(formId: string): ('pdf' | 'json' | 'csv')[] {
    const config = formRegistry.getForm(formId);
    return config?.settings?.exportFormats || ['pdf'];
  },
};