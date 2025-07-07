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
    console.log(`🔍 Testing command: "${command.trigger}" against transcript`);

    // Enhanced pattern matching for French voice commands
    const matched = matchVoiceCommand(command.trigger, processedText);
    
    if (matched.isMatch) {
      console.log(`✅ Command matched: "${command.trigger}" (pattern: "${matched.pattern}")`);
      
      // Use the matched pattern for replacement
      const triggerPattern = new RegExp(
        escapeRegExp(matched.pattern),
        'gi'
      );
      
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

// Enhanced voice command matching with French language support
function matchVoiceCommand(trigger: string, text: string): { isMatch: boolean; pattern?: string } {
  const lowerText = text.toLowerCase();
  const lowerTrigger = trigger.toLowerCase();
  
  // Direct match first
  if (lowerText.includes(lowerTrigger)) {
    return { isMatch: true, pattern: findExactMatch(trigger, text) };
  }
  
  // Handle French article variations and verb conjugations
  const variations = generateFrenchVariations(lowerTrigger);
  
  for (const variation of variations) {
    if (lowerText.includes(variation)) {
      const exactMatch = findExactMatch(variation, text);
      if (exactMatch) {
        return { isMatch: true, pattern: exactMatch };
      }
    }
  }
  
  return { isMatch: false };
}

// Generate French language variations for voice commands
function generateFrenchVariations(trigger: string): string[] {
  const variations: string[] = [trigger];
  
  // Handle verb conjugations: insérer <-> insérez
  if (trigger.includes('insérer')) {
    variations.push(trigger.replace('insérer', 'insérez'));
    variations.push(trigger.replace('insérer', 'ajouter'));
    variations.push(trigger.replace('insérer', 'ajoutez'));
  }
  
  // Handle article variations: no article <-> l' <-> le <-> les
  const articleVariations = [
    { from: ' examen', to: " l'examen" },
    { from: ' examen', to: ' un examen' },
    { from: ' suivi', to: ' le suivi' },
    { from: ' suivi', to: ' un suivi' },
    { from: ' signes vitaux', to: ' les signes vitaux' },
    { from: ' signes vitaux', to: ' des signes vitaux' },
    { from: ' constantes normales', to: ' les constantes normales' },
    { from: ' constantes normales', to: ' des constantes normales' }
  ];
  
  for (const variation of [...variations]) {
    for (const article of articleVariations) {
      if (variation.includes(article.from)) {
        variations.push(variation.replace(article.from, article.to));
      }
    }
  }
  
  // Handle medical terminology synonyms
  const synonyms = [
    { from: 'signes vitaux', to: 'constantes normales' },
    { from: 'constantes normales', to: 'signes vitaux' },
    { from: 'constantes', to: 'signes vitaux' },
    { from: 'vitales', to: 'signes vitaux' }
  ];
  
  for (const variation of [...variations]) {
    for (const synonym of synonyms) {
      if (variation.includes(synonym.from)) {
        variations.push(variation.replace(synonym.from, synonym.to));
      }
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

// Find exact match in text preserving case
function findExactMatch(pattern: string, text: string): string | null {
  const lowerPattern = pattern.toLowerCase();
  const lowerText = text.toLowerCase();
  
  const index = lowerText.indexOf(lowerPattern);
  if (index !== -1) {
    return text.substring(index, index + pattern.length);
  }
  
  return null;
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

// Test voice commands system - for debugging and validation
export function testVoiceCommands(testTranscript: string): {
  results: Array<{
    command: string;
    matched: boolean;
    pattern?: string;
    variations: string[];
  }>;
  summary: {
    totalCommands: number;
    matchedCommands: number;
    successRate: number;
  };
} {
  const commands = loadVoiceCommands();
  const results = [];
  let matchedCount = 0;
  
  console.log(`🧪 Testing voice commands against: "${testTranscript}"`);
  
  for (const command of commands) {
    const variations = generateFrenchVariations(command.trigger.toLowerCase());
    const matched = matchVoiceCommand(command.trigger, testTranscript);
    
    if (matched.isMatch) {
      matchedCount++;
    }
    
    results.push({
      command: command.trigger,
      matched: matched.isMatch,
      pattern: matched.pattern,
      variations: variations
    });
    
    console.log(`${matched.isMatch ? '✅' : '❌'} "${command.trigger}" - Variations: ${variations.length}`);
  }
  
  const summary = {
    totalCommands: commands.length,
    matchedCommands: matchedCount,
    successRate: Math.round((matchedCount / commands.length) * 100)
  };
  
  console.log(`📊 Test Summary: ${matchedCount}/${commands.length} commands matched (${summary.successRate}%)`);
  
  return { results, summary };
}