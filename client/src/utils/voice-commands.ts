// Voice Commands Processing for Medical Dictation
// Handles command detection and replacement while preserving text positioning

export interface VoiceCommand {
  trigger: string;
  replacement: string;
  category?: string;
  created?: string;
}

export interface CommandProcessingResult {
  processedText: string;
  commandsUsed: string[];
  originalLength: number;
  finalLength: number;
}

// Template markers to protect inserted text from AI modification
const TEMPLATE_START = '___TEMPLATE_START___';
const TEMPLATE_END = '___TEMPLATE_END___';

// Default voice commands for medical practice
const DEFAULT_COMMANDS: VoiceCommand[] = [
  // English commands
  {
    trigger: "insert physical exam",
    replacement: "Physical examination reveals normal gait and posture. Patient appears comfortable and in no acute distress. Vital signs are stable and within normal limits.",
    category: "examination"
  },
  {
    trigger: "insert normal neuro",
    replacement: "Neurological examination: Alert and oriented x3. Cranial nerves II-XII intact. Motor strength 5/5 throughout. Deep tendon reflexes 2+ and symmetric. No focal neurological deficits noted.",
    category: "examination"
  },
  {
    trigger: "insert follow up",
    replacement: "Patient advised to follow up in 2-4 weeks or sooner if symptoms worsen. Return precautions discussed. Patient verbalized understanding.",
    category: "instructions"
  },
  {
    trigger: "insert normal vitals",
    replacement: "Vital signs: Blood pressure 120/80 mmHg, Heart rate 72 bpm regular, Respiratory rate 16 breaths per minute, Temperature 98.6°F (37°C), Oxygen saturation 98% on room air.",
    category: "vitals"
  },
  // French commands for Quebec medical practice
  {
    trigger: "insérer examen physique",
    replacement: "L'examen physique révèle une démarche et une posture normales. Le patient semble à l'aise et ne présente aucune détresse aiguë. Les signes vitaux sont stables et dans les limites normales.",
    category: "examen"
  },
  {
    trigger: "insérer neuro normal",
    replacement: "Examen neurologique : Alerte et orienté x3. Nerfs crâniens II-XII intacts. Force motrice 5/5 partout. Réflexes tendineux profonds 2+ et symétriques. Aucun déficit neurologique focal noté.",
    category: "examen"
  },
  {
    trigger: "insérer suivi",
    replacement: "Le patient est conseillé de suivre dans 2-4 semaines ou plus tôt si les symptômes s'aggravent. Les précautions de retour ont été discutées. Le patient a verbalisé sa compréhension.",
    category: "instructions"
  },
  {
    trigger: "insérer signes vitaux",
    replacement: "Signes vitaux : Tension artérielle 120/80 mmHg, Fréquence cardiaque 72 bpm régulière, Fréquence respiratoire 16 respirations par minute, Température 37°C, Saturation en oxygène 98% à l'air ambiant.",
    category: "vitaux"
  },
  {
    trigger: "insérer examen genou",
    replacement: "Examen du genou : Inspection révèle absence d'œdème, d'ecchymose ou de déformation. Palpation normale. Amplitude de mouvement complète. Manœuvres ligamentaires négatives. Ménisques intacts.",
    category: "orthopédie"
  },
  {
    trigger: "insérer douleur chronique",
    replacement: "Douleur chronique bien contrôlée avec médication actuelle. Patient rapporte amélioration fonctionnelle. Aucun effet secondaire significatif des médicaments rapporté.",
    category: "douleur"
  }
];

// Load voice commands from localStorage
export function loadVoiceCommands(): VoiceCommand[] {
  try {
    const stored = localStorage.getItem('voice_commands');
    if (stored) {
      const commands = JSON.parse(stored);
      return Array.isArray(commands) ? commands : DEFAULT_COMMANDS;
    }
  } catch (error) {
    console.error('Error loading voice commands:', error);
  }
  return DEFAULT_COMMANDS;
}

// Save voice commands to localStorage
export function saveVoiceCommands(commands: VoiceCommand[]): void {
  try {
    localStorage.setItem('voice_commands', JSON.stringify(commands));
  } catch (error) {
    console.error('Error saving voice commands:', error);
  }
}

// Process voice commands in transcript while preserving position
export function processVoiceCommands(transcript: string): CommandProcessingResult {
  if (!transcript || transcript.trim().length === 0) {
    return {
      processedText: transcript,
      commandsUsed: [],
      originalLength: 0,
      finalLength: 0
    };
  }

  const commands = loadVoiceCommands();
  const commandsUsed: string[] = [];
  let processedText = transcript;
  const originalLength = transcript.length;

  // Process commands in order of longest trigger first to avoid partial matches
  const sortedCommands = commands.sort((a, b) => b.trigger.length - a.trigger.length);

  for (const command of sortedCommands) {
    const triggerPattern = new RegExp(
      `\\b${escapeRegExp(command.trigger)}\\b`,
      'gi'
    );

    if (triggerPattern.test(processedText)) {
      // Mark the replacement text to protect it from AI modification
      const protectedReplacement = `${TEMPLATE_START}${command.replacement}${TEMPLATE_END}`;
      
      processedText = processedText.replace(triggerPattern, protectedReplacement);
      commandsUsed.push(command.trigger);
    }
  }

  return {
    processedText,
    commandsUsed,
    originalLength,
    finalLength: processedText.length
  };
}

// Remove template markers after all processing is complete
export function unmarkTemplates(text: string): string {
  return text
    .replace(new RegExp(TEMPLATE_START, 'g'), '')
    .replace(new RegExp(TEMPLATE_END, 'g'), '');
}

// Check if text contains protected template regions
export function hasProtectedRegions(text: string): boolean {
  return text.includes(TEMPLATE_START) && text.includes(TEMPLATE_END);
}

// Extract protected and unprotected regions for selective processing
export function separateProtectedRegions(text: string): {
  regions: Array<{ text: string; isProtected: boolean; }>;
} {
  const regions: Array<{ text: string; isProtected: boolean; }> = [];
  
  if (!hasProtectedRegions(text)) {
    return { regions: [{ text, isProtected: false }] };
  }

  const parts = text.split(TEMPLATE_START);
  
  // First part is always unprotected
  if (parts[0]) {
    regions.push({ text: parts[0], isProtected: false });
  }

  // Process template regions
  for (let i = 1; i < parts.length; i++) {
    const templateParts = parts[i].split(TEMPLATE_END);
    
    if (templateParts.length >= 2) {
      // Protected template content
      regions.push({ text: templateParts[0], isProtected: true });
      
      // Unprotected content after template
      if (templateParts[1]) {
        regions.push({ text: templateParts[1], isProtected: false });
      }
    } else {
      // Malformed template, treat as unprotected
      regions.push({ text: parts[i], isProtected: false });
    }
  }

  return { regions };
}

// Validate command trigger to prevent conflicts
export function validateCommandTrigger(trigger: string, existingCommands: VoiceCommand[]): {
  isValid: boolean;
  error?: string;
} {
  if (!trigger || trigger.trim().length < 3) {
    return { isValid: false, error: "Command trigger must be at least 3 characters long" };
  }

  const trimmedTrigger = trigger.trim().toLowerCase();
  
  // Check for conflicts with existing commands
  const conflict = existingCommands.find(cmd => 
    cmd.trigger.toLowerCase() === trimmedTrigger
  );
  
  if (conflict) {
    return { isValid: false, error: "This command trigger already exists" };
  }

  // Check for reserved words that might interfere
  const reservedWords = ['insert', 'add', 'include', 'template'];
  if (reservedWords.some(word => trimmedTrigger.includes(word))) {
    // Allow if it's a proper command format
    if (!trimmedTrigger.startsWith('insert ')) {
      return { isValid: false, error: "Command should start with 'insert' followed by a descriptive name" };
    }
  }

  return { isValid: true };
}

// Escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Export/Import functionality for backup
export function exportVoiceCommands(): string {
  const commands = loadVoiceCommands();
  return JSON.stringify(commands, null, 2);
}

export function importVoiceCommands(jsonData: string): { success: boolean; error?: string; count?: number } {
  try {
    const imported = JSON.parse(jsonData);
    if (!Array.isArray(imported)) {
      return { success: false, error: "Invalid format: expected array of commands" };
    }

    // Validate each command
    for (const cmd of imported) {
      if (!cmd.trigger || !cmd.replacement) {
        return { success: false, error: "Invalid command format: missing trigger or replacement" };
      }
    }

    saveVoiceCommands(imported);
    return { success: true, count: imported.length };
  } catch (error) {
    return { success: false, error: "Invalid JSON format" };
  }
}