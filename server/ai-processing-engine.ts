import OpenAI from "openai";
import { AIProcessingConfig, AIProcessingRule } from "@shared/form-configs/ai-processing-types";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProcessingContext {
  formData: Record<string, any>;
  formType: string;
  language?: 'fr' | 'en' | 'auto';
}

export interface ProcessingResult {
  success: boolean;
  processedData?: Record<string, any>;
  error?: string;
}

export class AIProcessingEngine {
  private configs: Map<string, AIProcessingConfig> = new Map();

  // Register a form's AI processing configuration
  registerConfig(config: AIProcessingConfig): void {
    this.configs.set(config.formType, config);
  }

  // Get configuration for a form type
  getConfig(formType: string): AIProcessingConfig | undefined {
    return this.configs.get(formType);
  }

  // Process a specific field using AI
  async processField(
    rule: AIProcessingRule,
    context: ProcessingContext
  ): Promise<ProcessingResult> {
    try {
      const config = this.getConfig(context.formType);
      if (!config) {
        return { success: false, error: `No AI configuration found for form type: ${context.formType}` };
      }

      const language = rule.language || config.globalContext?.language || 'fr';
      const fieldValue = context.formData[rule.fieldId];

      // For generation, input text is optional - we use context instead
      if (rule.processingType !== 'generate' && (!fieldValue || fieldValue.trim() === '')) {
        return { success: false, error: 'No input text provided for processing' };
      }

      // Build context from related fields
      const contextData = this.buildContextData(rule, context.formData);

      switch (rule.processingType) {
        case 'format':
          return await this.formatText(fieldValue, rule, contextData, language);
        
        case 'enhance':
          return await this.enhanceText(fieldValue, rule, contextData, language);
        
        case 'distribute':
          return await this.distributeText(fieldValue, rule, contextData, language);
        
        case 'generate':
          return await this.generateText(rule, contextData, language);
        
        default:
          return { success: false, error: `Unknown processing type: ${rule.processingType}` };
      }
    } catch (error) {
      console.error('AI processing error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Build context data from specified fields
  private buildContextData(rule: AIProcessingRule, formData: Record<string, any>): Record<string, any> {
    const contextData: Record<string, any> = {};
    
    if (rule.contextFields) {
      for (const fieldId of rule.contextFields) {
        if (formData[fieldId]) {
          contextData[fieldId] = formData[fieldId];
        }
      }
    }
    
    return contextData;
  }

  // Format text according to medical standards
  private async formatText(
    text: string,
    rule: AIProcessingRule,
    contextData: Record<string, any>,
    language: string
  ): Promise<ProcessingResult> {
    const systemPrompt = this.buildSystemPrompt('format', language);
    const userPrompt = rule.prompt || this.getDefaultPrompt('format', language);
    
    const contextInfo = Object.keys(contextData).length > 0 
      ? `\n\nContext information:\n${JSON.stringify(contextData, null, 2)}`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrompt}\n\nText to format:\n${text}${contextInfo}` }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      success: true,
      processedData: { [rule.fieldId]: result.formatted_text || text }
    };
  }

  // Enhance dictated text
  private async enhanceText(
    text: string,
    rule: AIProcessingRule,
    contextData: Record<string, any>,
    language: string
  ): Promise<ProcessingResult> {
    const systemPrompt = this.buildSystemPrompt('enhance', language);
    const userPrompt = rule.prompt || this.getDefaultPrompt('enhance', language);
    
    const contextInfo = Object.keys(contextData).length > 0 
      ? `\n\nContext information:\n${JSON.stringify(contextData, null, 2)}`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrompt}\n\nText to enhance:\n${text}${contextInfo}` }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      success: true,
      processedData: { 
        [rule.fieldId]: result.enhanced_text || text,
        confidence: result.confidence || 0.9
      }
    };
  }

  // Distribute text to multiple target fields
  private async distributeText(
    text: string,
    rule: AIProcessingRule,
    contextData: Record<string, any>,
    language: string
  ): Promise<ProcessingResult> {
    if (!rule.targetFields || rule.targetFields.length === 0) {
      return { success: false, error: 'No target fields specified for distribution' };
    }

    const systemPrompt = this.buildSystemPrompt('distribute', language);
    const userPrompt = rule.prompt || this.getDefaultPrompt('distribute', language);
    
    const contextInfo = Object.keys(contextData).length > 0 
      ? `\n\nContext information:\n${JSON.stringify(contextData, null, 2)}`
      : '';

    const targetFieldsInfo = `\n\nTarget fields:\n${rule.targetFields.join(', ')}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrompt}\n\nText to distribute:\n${text}${contextInfo}${targetFieldsInfo}` }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      success: true,
      processedData: result.distributed_content || {}
    };
  }

  // Generate text based on context
  private async generateText(
    rule: AIProcessingRule,
    contextData: Record<string, any>,
    language: string
  ): Promise<ProcessingResult> {
    const systemPrompt = this.buildSystemPrompt('generate', language);
    const userPrompt = rule.prompt || this.getDefaultPrompt('generate', language);
    
    const contextInfo = Object.keys(contextData).length > 0 
      ? `\n\nContext information:\n${JSON.stringify(contextData, null, 2)}`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrompt}${contextInfo}` }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      success: true,
      processedData: { [rule.fieldId]: result.generated_text || '' }
    };
  }

  // Build system prompt based on processing type and language
  private buildSystemPrompt(processingType: string, language: string): string {
    const basePrompt = language === 'en' 
      ? "You are a medical documentation assistant specialized in professional medical reports."
      : "Vous êtes un assistant de documentation médicale spécialisé dans les rapports médicaux professionnels.";

    const typeSpecific = {
      format: language === 'en' 
        ? " Format medical text according to professional standards, ensuring proper terminology and structure."
        : " Formatez le texte médical selon les normes professionnelles, en assurant une terminologie et une structure appropriées.",
      enhance: language === 'en'
        ? " Enhance dictated medical text by correcting terminology and improving readability while preserving original meaning."
        : " Améliorez le texte médical dicté en corrigeant la terminologie et en améliorant la lisibilité tout en préservant le sens original.",
      distribute: language === 'en'
        ? " Analyze medical text and distribute relevant content into appropriate categories/fields."
        : " Analysez le texte médical et distribuez le contenu pertinent dans les catégories/champs appropriés.",
      generate: language === 'en'
        ? " Generate comprehensive medical conclusions based on provided examination data and patient information."
        : " Générez des conclusions médicales complètes basées sur les données d'examen et les informations du patient fournies."
    };

    const outputFormat = language === 'en'
      ? " Always respond in JSON format with the requested structure."
      : " Répondez toujours au format JSON avec la structure demandée.";

    return basePrompt + typeSpecific[processingType as keyof typeof typeSpecific] + outputFormat;
  }

  // Get default prompts for different processing types
  private getDefaultPrompt(processingType: string, language: string): string {
    const prompts = {
      format: {
        en: "Please format this medical text according to professional standards. Respond with JSON: {\"formatted_text\": \"...\"}",
        fr: "Veuillez formater ce texte médical selon les normes professionnelles. Répondez avec JSON: {\"formatted_text\": \"...\"}"
      },
      enhance: {
        en: "Please enhance this dictated medical text by correcting terminology and improving readability. Respond with JSON: {\"enhanced_text\": \"...\", \"confidence\": 0.9}",
        fr: "Veuillez améliorer ce texte médical dicté en corrigeant la terminologie et en améliorant la lisibilité. Répondez avec JSON: {\"enhanced_text\": \"...\", \"confidence\": 0.9}"
      },
      distribute: {
        en: "Please analyze this medical text and distribute the content into the specified target fields. Respond with JSON object mapping field names to their content.",
        fr: "Veuillez analyser ce texte médical et distribuer le contenu dans les champs cibles spécifiés. Répondez avec un objet JSON mappant les noms de champs à leur contenu."
      },
      generate: {
        en: "Please generate a comprehensive medical conclusion based on the provided context. Respond with JSON: {\"generated_text\": \"...\"}",
        fr: "Veuillez générer une conclusion médicale complète basée sur le contexte fourni. Répondez avec JSON: {\"generated_text\": \"...\"}"
      }
    };

    return prompts[processingType as keyof typeof prompts][language as keyof typeof prompts.format];
  }
}

// Export singleton instance
export const aiProcessingEngine = new AIProcessingEngine();