# Verbatim Commands Manager Analysis

## 🎯 **CONCEPT OVERVIEW**

Create a management system for **custom verbatim commands** that allows users to define their own triggers for entering/exiting verbatim mode, similar to how voice commands work but specifically for verbatim text preservation.

## 📋 **CURRENT VOICE COMMANDS STRUCTURE**

### **Voice Command Interface**
```typescript
export interface VoiceCommand {
  trigger: string;        // "insérer examen physique"
  replacement: string;    // "L'examen physique révèle..."
  category?: string;      // "examen"
  created?: string;       // timestamp
}
```

### **Storage & Management**
- **Storage**: `localStorage` with key `voice_commands`
- **Functions**: `loadVoiceCommands()`, `saveVoiceCommands()`, `validateCommandTrigger()`
- **UI**: Dialog-based manager with CRUD operations
- **Features**: Import/export, categories, validation

## 🔧 **PROPOSED VERBATIM COMMANDS STRUCTURE**

### **Verbatim Command Interface**
```typescript
export interface VerbatimCommand {
  trigger: string;        // "rapport radiologique"
  endTrigger?: string;    // "fin rapport" (optional custom end)
  category?: string;      // "radiology", "quotes", "technical"
  description?: string;   // "Radiology report sections"
  created?: string;       // timestamp
  language?: 'fr' | 'en'; // command language
}
```

### **Default Verbatim Commands**
```typescript
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
  
  // Universal Commands (work in both languages)
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
```

## 🏗️ **IMPLEMENTATION ARCHITECTURE**

### **1. Core Utilities (utils/verbatim-commands.ts)**
```typescript
// Storage functions
export function loadVerbatimCommands(): VerbatimCommand[]
export function saveVerbatimCommands(commands: VerbatimCommand[]): void

// Processing functions
export function processVerbatimCommands(transcript: string): {
  processedText: string;
  verbatimTriggers: string[];
  customVerbatimUsed: boolean;
}

// Validation functions
export function validateVerbatimCommand(command: VerbatimCommand): ValidationResult
export function checkTriggerConflicts(trigger: string, commands: VerbatimCommand[]): boolean

// Import/Export
export function exportVerbatimCommands(): string
export function importVerbatimCommands(data: string): VerbatimCommand[]
```

### **2. UI Component (components/verbatim-commands-manager.tsx)**
```typescript
export function VerbatimCommandsManager({ language }: { language: 'fr' | 'en' }) {
  // State management
  const [commands, setCommands] = useState<VerbatimCommand[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newCommand, setNewCommand] = useState<VerbatimCommand>({});
  
  // CRUD operations
  const handleSaveCommand = () => { /* ... */ };
  const handleDeleteCommand = (index: number) => { /* ... */ };
  const handleEditCommand = (index: number) => { /* ... */ };
  
  // UI similar to voice commands manager
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Command list, add/edit forms, import/export */}
    </Dialog>
  );
}
```

### **3. Integration with Medical Context**
```typescript
// Enhanced processVerbatimSections function
export function processVerbatimSections(transcript: string): {
  processedText: string;
  hasVerbatim: boolean;
  verbatimSections: string[];
  verbatimCount: number;
  customTriggersUsed: string[]; // NEW: track custom triggers
} {
  // First process custom verbatim commands
  const customResult = processVerbatimCommands(transcript);
  
  // Then process default verbatim markers
  const defaultResult = processDefaultVerbatim(customResult.processedText);
  
  // Combine results
  return {
    processedText: defaultResult.processedText,
    hasVerbatim: defaultResult.hasVerbatim || customResult.customVerbatimUsed,
    verbatimSections: [...defaultResult.verbatimSections, ...customResult.verbatimSections],
    verbatimCount: defaultResult.verbatimCount + customResult.verbatimCount,
    customTriggersUsed: customResult.verbatimTriggers
  };
}
```

## 🎨 **UI/UX DESIGN**

### **Manager Dialog Interface**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔒 Commandes Verbatim                                  [X] │
├─────────────────────────────────────────────────────────────┤
│ ℹ️  Créez des commandes personnalisées pour le mode verbatim │
│                                                             │
│ [➕ Nouvelle Commande]  [📥 Importer]  [📤 Exporter]        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏥 Radiology                                            │ │
│ │ • "rapport radiologique" → "fin rapport"               │ │
│ │   📝 Sections de rapport radiologique                   │ │
│ │   [✏️ Modifier] [🗑️ Supprimer]                          │ │
│ │                                                         │ │
│ │ 💬 Quotes                                               │ │
│ │ • "citation patient" → "fin citation"                  │ │
│ │   📝 Citations exactes du patient                       │ │
│ │   [✏️ Modifier] [🗑️ Supprimer]                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Ajouter une commande ─────────────────────────────────┐  │
│ │ Déclencheur: [rapport radiologique____________]        │  │
│ │ Fin (optionnel): [fin rapport_________________]        │  │
│ │ Catégorie: [radiology_________________________]        │  │
│ │ Description: [Sections de rapport radiologique_____]   │  │
│ │ Langue: [Français ▼]                                   │  │
│ │                                           [Sauvegarder] │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Dictation Page Integration**
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Dictée Vocale                                           │
│                                                             │
│ [🎤 Commencer] [⏸️ Pause] [🔒 Commandes Verbatim]          │
│                                                             │
│ ┌─ Commandes Verbatim Actives ─────────────────────────────┐ │
│ │ 🏥 "rapport radiologique" → mode verbatim                │ │
│ │ 💬 "citation patient" → mode verbatim                    │ │
│ │ 🔧 "spécifications techniques" → mode verbatim            │ │
│ │ 🧪 "résultats laboratoire" → mode verbatim               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Sections Verbatim Détectées ───────────────────────────┐ │
│ │ 📝 3 sections verbatim captures                         │ │
│ │ #1: [rapport radiologique] "Radiographie thoracique..." │ │
│ │ #2: [citation patient] "Je ressens une douleur..."     │ │
│ │ #3: [spécifications] "Équipement médical modèle..."     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 **PROCESSING WORKFLOW**

### **Custom Verbatim Command Processing**
```
User Speech → Whisper API → Custom Verbatim Detection → Standard Verbatim Processing
     ↓                           ↓                           ↓
"rapport radiologique"    →    ___VERBATIM_START___    →    Extract & Protect
"contenu médical exact"   →    "contenu médical exact"  →    ___VERBATIM_PROTECTED_N___
"fin rapport"             →    ___VERBATIM_END___       →    Mark for Restoration
```

### **Integration with Existing System**
```typescript
// In medical-context.ts
export function processTranscriptWithCommands(transcript: string, language: 'fr' | 'en') {
  // Step 1: Process custom verbatim commands first
  const customVerbatim = processCustomVerbatimCommands(transcript, language);
  
  // Step 2: Process standard verbatim markers
  const standardVerbatim = processVerbatimSections(customVerbatim.processedText);
  
  // Step 3: Continue with voice commands and AI enhancement
  const voiceCommands = processVoiceCommands(standardVerbatim.processedText);
  
  // Step 4: Apply AI enhancement to unprotected regions
  const enhanced = enhanceMedicalTranscript(voiceCommands.processedText, language);
  
  // Step 5: Restore all verbatim sections
  const finalText = restoreAllVerbatimSections(enhanced, {
    customSections: customVerbatim.verbatimSections,
    standardSections: standardVerbatim.verbatimSections
  });
  
  return {
    finalText,
    commandsUsed: [...customVerbatim.triggersUsed, ...voiceCommands.commandsUsed],
    verbatimSections: [...customVerbatim.verbatimSections, ...standardVerbatim.verbatimSections],
    hasVerbatim: customVerbatim.hasVerbatim || standardVerbatim.hasVerbatim
  };
}
```

## 🎯 **USE CASES**

### **Quebec Medical Practice Examples**

1. **Radiology Reports**
   - Trigger: "rapport radiologique"
   - Content: "Radiographie thoracique révèle opacités bilatérales..."
   - End: "fin rapport"
   - Result: Exact radiology language preserved

2. **Patient Quotations**
   - Trigger: "citation patient"
   - Content: "Je ressens une douleur lancinante qui irradie..."
   - End: "fin citation"
   - Result: Patient's exact words preserved

3. **Technical Specifications**
   - Trigger: "spécifications techniques"
   - Content: "Équipement médical modèle XYZ-2024, calibré à 15.5 kHz..."
   - End: "fin spécifications"
   - Result: Technical details preserved exactly

4. **Laboratory Results**
   - Trigger: "résultats laboratoire"
   - Content: "Hémoglobine: 14.2 g/dL, Leucocytes: 7,800/μL..."
   - End: "fin résultats"
   - Result: Exact lab values preserved

## 📊 **BENEFITS**

### **User Experience**
- **Contextual Triggers**: More intuitive than generic "open parenthesis"
- **Category Organization**: Organized by medical specialty/content type
- **Bilingual Support**: French and English commands
- **Custom Configuration**: Users can add their own triggers

### **Medical Accuracy**
- **Specialized Triggers**: Context-specific verbatim modes
- **Reduced Errors**: Clear start/end for different content types
- **Professional Standards**: Meets Quebec medical documentation requirements
- **Flexibility**: Adaptable to different medical specialties

### **Technical Advantages**
- **Backward Compatibility**: Works with existing verbatim system
- **Scalability**: Easy to add new command types
- **Import/Export**: Share configurations between users
- **Validation**: Prevents trigger conflicts

## 🚀 **IMPLEMENTATION PLAN**

### **Phase 1: Core Infrastructure**
1. Create `verbatim-commands.ts` utility file
2. Implement storage and validation functions
3. Add custom verbatim processing to medical-context.ts

### **Phase 2: UI Components**
1. Build `VerbatimCommandsManager` component
2. Add manager button to dictation page
3. Implement CRUD operations

### **Phase 3: Integration**
1. Integrate with existing verbatim processing
2. Add visual indicators for custom triggers
3. Update test system

### **Phase 4: Enhancement**
1. Add import/export functionality
2. Implement categories and filtering
3. Add usage analytics and suggestions

This system would provide Quebec healthcare providers with powerful, customizable verbatim commands while maintaining the simplicity and reliability of the existing voice commands system.