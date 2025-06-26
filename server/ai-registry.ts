import { aiProcessingEngine } from './ai-processing-engine';
import { cnsstAIConfig } from '@shared/form-configs/cnesst-ai-config';

// Initialize AI processing configurations
export function initializeAIConfigurations(): void {
  // Register CNESST form AI configuration
  aiProcessingEngine.registerConfig(cnsstAIConfig);
  
  console.log('AI processing configurations initialized');
}

// Export the engine for use in routes
export { aiProcessingEngine };