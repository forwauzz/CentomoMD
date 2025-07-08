// Verbatim Commands Processing for Medical Dictation
// Handles custom verbatim triggers while preserving text positioning

export interface VerbatimCommand {
  trigger: string;
  endTrigger?: string;
  category?: string;
  description?: string;
  created?: string;
  language?: 'fr' | 'en';
}

export interface VerbatimCommandProcessingResult {
  processedText: string;
  verbatimTriggers: string[];
  customVerbatimUsed: boolean;
  verbatimSections: string[];
  verbatimCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Default verbatim commands for medical practice
const DEFAULT_VERBATIM_COMMANDS: VerbatimCommand[] = [
  // French Medical Commands
  {
    trigger: "rapport radiologique",
    endTrigger: "fin rapport",
    category: "radiology",
    description: "Sections de rapport radiologique",
    language: "fr"
  },
  {
    trigger: "citation patient",
    endTrigger: "fin citation",
    category: "quotes",
    description: "Citations exactes du patient",
    language: "fr"
  },
  {
    trigger: "spécifications techniques",
    endTrigger: "fin spécifications",
    category: "technical",
    description: "Données techniques médicales",
    language: "fr"
  },
  {
    trigger: "résultats laboratoire",
    endTrigger: "fin résultats",
    category: "lab",
    description: "Résultats de laboratoire exacts",
    language: "fr"
  },
  {
    trigger: "diagnostic médical",
    endTrigger: "fin diagnostic",
    category: "diagnosis",
    description: "Diagnostic médical complet",
    language: "fr"
  },
  {
    trigger: "prescription exacte",
    endTrigger: "fin prescription",
    category: "prescription",
    description: "Prescription médicale exacte",
    language: "fr"
  },
  
  // English Medical Commands
  {
    trigger: "radiology report",
    endTrigger: "end report",
    category: "radiology",
    description: "Radiology report sections",
    language: "en"
  },
  {
    trigger: "patient quote",
    endTrigger: "end quote",
    category: "quotes",
    description: "Exact patient quotations",
    language: "en"
  },
  {
    trigger: "technical specifications",
    endTrigger: "end specifications",
    category: "technical",
    description: "Medical technical data",
    language: "en"
  },
  {
    trigger: "lab results",
    endTrigger: "end results",
    category: "lab",
    description: "Exact laboratory results",
    language: "en"
  },
  {
    trigger: "medical diagnosis",
    endTrigger: "end diagnosis",
    category: "diagnosis",
    description: "Complete medical diagnosis",
    language: "en"
  },
  {
    trigger: "exact prescription",
    endTrigger: "end prescription",
    category: "prescription",
    description: "Exact medical prescription",
    language: "en"
  },
  
  // Universal Commands
  {
    trigger: "verbatim médical",
    endTrigger: "fin verbatim",
    category: "medical",
    description: "Contenu médical exact",
    language: "fr"
  },
  {
    trigger: "medical verbatim",
    endTrigger: "end verbatim",
    category: "medical",
    description: "Exact medical content",
    language: "en"
  }
];

// Load verbatim commands from localStorage
export function loadVerbatimCommands(): VerbatimCommand[] {
  try {
    const stored = localStorage.getItem('verbatim_commands');
    if (stored) {
      const commands = JSON.parse(stored);
      return Array.isArray(commands) ? commands : DEFAULT_VERBATIM_COMMANDS;
    }
  } catch (error) {
    console.error('Error loading verbatim commands:', error);
  }
  return DEFAULT_VERBATIM_COMMANDS;
}

// Save verbatim commands to localStorage
export function saveVerbatimCommands(commands: VerbatimCommand[]): void {
  try {
    localStorage.setItem('verbatim_commands', JSON.stringify(commands));
  } catch (error) {
    console.error('Error saving verbatim commands:', error);
  }
}

// Validate verbatim command
export function validateVerbatimCommand(command: VerbatimCommand, existingCommands: VerbatimCommand[] = []): ValidationResult {
  if (!command.trigger || command.trigger.trim().length === 0) {
    return { isValid: false, error: "Trigger phrase is required" };
  }

  if (command.trigger.length < 3) {
    return { isValid: false, error: "Trigger phrase must be at least 3 characters long" };
  }

  // Check for conflicts with existing commands
  const conflictingCommand = existingCommands.find(existing => 
    existing.trigger.toLowerCase() === command.trigger.toLowerCase()
  );
  
  if (conflictingCommand) {
    return { isValid: false, error: "Trigger phrase already exists" };
  }

  // Check for conflicts with default verbatim markers
  const reservedTriggers = [
    "ouvrir parenthèse", "fermer parenthèse", "open parenthesis", "close parenthesis",
    "commencer verbatim", "terminer verbatim", "start verbatim", "end verbatim"
  ];
  
  if (reservedTriggers.includes(command.trigger.toLowerCase())) {
    return { isValid: false, error: "Trigger conflicts with reserved verbatim commands" };
  }

  return { isValid: true };
}

// Check for trigger conflicts
export function checkTriggerConflicts(trigger: string, commands: VerbatimCommand[]): boolean {
  return commands.some(cmd => cmd.trigger.toLowerCase() === trigger.toLowerCase());
}

// Process custom verbatim commands in transcript
export function processVerbatimCommands(transcript: string, language: 'fr' | 'en' = 'fr'): VerbatimCommandProcessingResult {
  if (!transcript || transcript.trim().length === 0) {
    return {
      processedText: transcript,
      verbatimTriggers: [],
      customVerbatimUsed: false,
      verbatimSections: [],
      verbatimCount: 0
    };
  }

  const commands = loadVerbatimCommands();
  const verbatimTriggers: string[] = [];
  const verbatimSections: string[] = [];
  let processedText = transcript;
  let customVerbatimUsed = false;

  // Filter commands by language (if specified) or use all
  const relevantCommands = commands.filter(cmd => 
    !cmd.language || cmd.language === language
  );

  // Sort by trigger length (longest first) to avoid partial matches
  const sortedCommands = relevantCommands.sort((a, b) => b.trigger.length - a.trigger.length);

  for (const command of sortedCommands) {
    const startTrigger = command.trigger.toLowerCase();
    const endTrigger = command.endTrigger?.toLowerCase() || "fin " + startTrigger;
    
    // Create regex pattern for start and end triggers
    const startPattern = new RegExp(`\\b${escapeRegExp(startTrigger)}\\b`, 'gi');
    const endPattern = new RegExp(`\\b${escapeRegExp(endTrigger)}\\b`, 'gi');
    
    // Find all matches
    const startMatches = Array.from(processedText.matchAll(startPattern));
    const endMatches = Array.from(processedText.matchAll(endPattern));
    
    // Process matching pairs
    for (let i = 0; i < Math.min(startMatches.length, endMatches.length); i++) {
      const startMatch = startMatches[i];
      const endMatch = endMatches[i];
      
      if (startMatch.index !== undefined && endMatch.index !== undefined && 
          startMatch.index < endMatch.index) {
        
        // Extract content between triggers
        const contentStart = startMatch.index + startMatch[0].length;
        const contentEnd = endMatch.index;
        const content = processedText.substring(contentStart, contentEnd).trim();
        
        if (content.length > 0) {
          verbatimSections.push(content);
          verbatimTriggers.push(command.trigger);
          customVerbatimUsed = true;
          
          // Replace the entire section with verbatim markers
          const fullMatch = processedText.substring(startMatch.index, endMatch.index + endMatch[0].length);
          processedText = processedText.replace(fullMatch, 
            ` ___VERBATIM_START___ ${content} ___VERBATIM_END___ `
          );
          
          console.log(`🔒 Custom verbatim detected: "${command.trigger}" → "${content.substring(0, 50)}..."`);
        }
      }
    }
  }

  return {
    processedText,
    verbatimTriggers,
    customVerbatimUsed,
    verbatimSections,
    verbatimCount: verbatimSections.length
  };
}

// Export verbatim commands
export function exportVerbatimCommands(commands: VerbatimCommand[]): string {
  const exportData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    commands: commands.map(cmd => ({
      ...cmd,
      created: cmd.created || new Date().toISOString()
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
}

// Import verbatim commands
export function importVerbatimCommands(data: string): VerbatimCommand[] {
  try {
    const parsed = JSON.parse(data);
    
    // Validate import structure
    if (!parsed.commands || !Array.isArray(parsed.commands)) {
      throw new Error("Invalid import format: missing commands array");
    }
    
    // Validate each command
    const validCommands: VerbatimCommand[] = [];
    for (const cmd of parsed.commands) {
      if (cmd.trigger && typeof cmd.trigger === 'string') {
        validCommands.push({
          trigger: cmd.trigger,
          endTrigger: cmd.endTrigger,
          category: cmd.category,
          description: cmd.description,
          created: cmd.created || new Date().toISOString(),
          language: cmd.language
        });
      }
    }
    
    return validCommands;
  } catch (error) {
    console.error('Error importing verbatim commands:', error);
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get commands by category
export function getCommandsByCategory(commands: VerbatimCommand[]): Record<string, VerbatimCommand[]> {
  const categories: Record<string, VerbatimCommand[]> = {};
  
  commands.forEach(cmd => {
    const category = cmd.category || 'other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(cmd);
  });
  
  return categories;
}

// Get category display names
export function getCategoryDisplayName(category: string, language: 'fr' | 'en' = 'fr'): string {
  const categoryNames = {
    radiology: language === 'fr' ? 'Radiologie' : 'Radiology',
    quotes: language === 'fr' ? 'Citations' : 'Quotes',
    technical: language === 'fr' ? 'Technique' : 'Technical',
    lab: language === 'fr' ? 'Laboratoire' : 'Laboratory',
    diagnosis: language === 'fr' ? 'Diagnostic' : 'Diagnosis',
    prescription: language === 'fr' ? 'Prescription' : 'Prescription',
    medical: language === 'fr' ? 'Médical' : 'Medical',
    other: language === 'fr' ? 'Autre' : 'Other'
  };
  
  return categoryNames[category as keyof typeof categoryNames] || category;
}