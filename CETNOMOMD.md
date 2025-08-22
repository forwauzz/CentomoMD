# CENTOMOMD.md - Memory & Context Document

> **🎯 CORE MISSION**: Zero-retention AI medical scribe platform for Quebec healthcare market, targeting 65% TGV compliance through innovative browser-based processing and ambient transcription specialized for Section 8 medical evaluations.

> **📋 HOW TO USE THIS DOCUMENT**: 
> - **For AI Agents**: Always reference this file when working on CentomoMD features
> - **For Updates**: Add new discoveries, architecture decisions, and gotchas to relevant sections
> - **For Compliance**: Check TGV compliance section before any patient data processing
> - **For Context**: This is the single source of truth for the entire project

---

## 🏢 **PROJECT OVERVIEW**

### **Product Identity**
- **Name**: CentomoMD V2 - HIPAA-Compliant Medical Documentation Platform
- **Primary User**: Dr. Hugo Centomo (Orthopedic Surgeon, Quebec CNESST evaluations)
- **Current Scope**: Single-user platform for Dr. Centomo (multi-user architecture planned for future fork)
- **Market**: Quebec healthcare professionals conducting workplace injury assessments
- **Unique Value**: First-of-its-kind zero-retention browser-based medical dictation platform

### **Critical Constraint: ZERO PATIENT DATA RETENTION**
```typescript
// FUNDAMENTAL PRINCIPLE: Process in-memory only, immediate deletion
class ZeroRetentionProcessor {
  async processPatientData(data: ArrayBuffer): Promise<Result> {
    try {
      // Process in memory only - NO disk writes
      const result = await this.process(data);
      return result;
    } finally {
      // Explicit cleanup - ALWAYS
      data = null;
      if (global.gc) global.gc();
    }
  }
}
```

---

## 🎯 **BUSINESS OBJECTIVES & SUCCESS METRICS**

### **Primary Objectives**
1. **Efficiency**: 70% reduction in medical documentation time
2. **Compliance**: 100% HIPAA compliance + Quebec Law 25 adherence  
3. **Quality**: AI-enhanced medical formatting and validation
4. **Innovation**: Browser-based processing eliminates server-side PHI exposure

### **Success Metrics (Target)**
- **500+ monthly active healthcare professionals**
- **85% 90-day user retention rate**
- **70% voice dictation feature usage**
- **4.5/5 average user satisfaction**
- **99.9% system uptime**
- **<2 second page loads, <500ms API responses**

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Technology Stack (Flexible Architecture)**
```typescript
// Current Implementation (Subject to Change for Compliance)
Frontend: React 18 + TypeScript + Vite
Backend: Express.js + TypeScript  
Database: PostgreSQL + Drizzle ORM
PLANNED: Supabase Pro (for enhanced compliance)
AI: OpenAI GPT-4o for text processing
Voice: Browser Whisper (@xenova/transformers) + OpenAI Whisper API
UI: Tailwind CSS + shadcn/ui components
Auth: SSO (Google/Microsoft) - DOCTORS ONLY, no patient access
```

> **ARCHITECTURE NOTE**: Technology stack is flexible and will be updated to optimize TGV compliance. Supabase Pro integration planned for enhanced security and compliance features.

### **Voice Processing Architecture**
```typescript
// Three-Mode Transcription System
enum TranscriptionMode {
  SMART_DICTATION = 'smart',     // AI-enhanced, temp: 0.3
  WORD_FOR_WORD = 'verbatim',    // Exact transcription, temp: 0.0  
  TRANSCRIBE = 'ambient'         // Continuous listening, temp: 0.1
}

// Browser-first processing with server fallback
class HybridTranscriptionEngine {
  async processAudio(blob: Blob, mode: TranscriptionMode) {
    try {
      // 1. Try browser Whisper (10MB Whisper-tiny.en model)
      return await this.browserWhisper.transcribe(blob, this.getConfig(mode));
    } catch (error) {
      // 2. Fallback to server processing
      return await this.serverWhisper.transcribe(blob, mode);
    }
  }
}
```

### **Real-Time Processing (Current Implementation)**
- **3-second audio chunking** for immediate feedback (TARGET: Optimal user experience)
- **VAD-based speech detection** to skip silence-only chunks
- **Concurrent processing limit**: 2 simultaneous audio chunks
- **Visual indicators**: "[Local]" vs "[Server]" vs "[Section 8 Local]"

---

## 📋 **MEDICAL FORM STRUCTURE (14 Sections Total)**

### **Form Template System**
- **Base**: CNESST medical assessment form (combination of 4 templates)
- **Structure**: Sections A, B, then 1-12 (14 total sections)
- **Variable Section**: Section 9 (modular examination system with 31 specialized tables)
- **Critical Section**: **Section 8** (Primary dictation target - 80% of usage)

### **Section 8: Specialized Engine (PRIORITY FEATURE)**
```typescript
// Dr. Centomo's Section 8 Patterns (From 15-20 completed forms)
interface Section8Structure {
  appreciationSubjective: string; // Patient's perception of improvement
  plainteProblemes: string;       // Symptoms and complaints  
  impactAVQ: string;             // Impact on daily activities (AVQ/AVD)
}

// Key Vocabulary (Quebec French Medical Terms)
const SECTION8_VOCABULARY = [
  "appréciation subjective", "évolution", "amélioration", 
  "plateau thérapeutique", "reprendre son travail",
  "sensations de brûlure", "éléments déclencheurs",
  "tolérance à l'effort", "endurance musculaire",
  "raideurs matinales", "changements barométriques"
];

// Common Phrases
const SECTION8_PHRASES = [
  "La travailleuse rapporte",
  "Elle ne peut rapporter", 
  "Elle rapporte avoir",
  "Elle ne rapporte pas"
];
```

### **Existing Section 8 Infrastructure**
✅ **Already Implemented**:
- `enhanceSection8Dictation()` - Voice-specific enhancement
- `formatSection8Text()` - General text formatting  
- `distributeSection8Text()` - Content distribution
- `/api/format-section8` - Dedicated endpoint
- `AIFormatSection8` React component

---

## 🔐 **TGV COMPLIANCE STRATEGY (NEW DISCOVERY)**

### **Current TGV Status: 30% → Target: 65% (REALISTIC)**
```markdown
| Category | Current % | Target % | Zero Retention Advantage | Priority |
|----------|-----------|----------|------------------------|----------|
| Privacy (PRPS) | 15% → 45% | 75% | +30% (No data storage) | 🟡 MEDIUM |
| Security | 25% → 40% | 65% | +15% (Reduced attack surface) | 🔴 HIGH |
| Technology | 80% | 90% | +0% (Already strong) | 🟡 MEDIUM |
| Interoperability | 15% → 25% | 70% | +10% (Simplified exchange) | 🟠 HIGH |
| Performance | 60% | 85% | +0% (Already documented) | 🟢 LOW |
| General | 70% | 100% | +0% (Language requirements) | 🟢 LOW |
```

### **Zero Retention Compliance Advantages**
- ✅ **Data Retention Policies**: Automatically compliant (P09.01-P09.04)
- ✅ **Data Minimization**: Inherently minimal processing (P11.01-P11.04)
- ✅ **Data Security**: Reduced risk surface (S06.01-S06.03 partially)
- ✅ **Right to Deletion**: Automatic compliance (P08.01-P08.03)

### **TGV Compliance Gate (MANDATORY)**
```typescript
// Pre-development compliance check
interface ComplianceGate {
  processesPatientData: boolean;    // Must be immediately deleted
  storesDataTemporarily: boolean;   // Must have automatic cleanup
  integratesExternalServices: boolean; // No patient data can leave system
  changesDataWorkflow: boolean;     // Ensure zero retention maintained
}

// RED FLAGS - IMMEDIATE STOP
const TGV_VIOLATIONS = [
  "Feature stores ANY patient health data permanently",
  "Feature creates database tables for health/medical information",
  "Feature integrates external services receiving patient data",
  "Feature exports health information",
  "Feature changes zero-retention processing model"
];
```

---

## 🎙️ **VOICE FEATURES IMPLEMENTATION STATUS**

### **✅ COMPLETED FEATURES**
1. **Browser Whisper Integration**
   - Local Whisper-tiny.en model (10MB auto-download)
   - Progress tracking and loading indicators
   - Hybrid browser-first, server-fallback processing

2. **3-Second Ambient Chunking** 
   - Real-time feedback (users see results every 3 seconds)
   - VAD-based speech detection
   - Visual countdown guidance for users

3. **Section 8 Specialized Processing**
   - Context detection (`isSection8Context()`)
   - Medical terminology corrections
   - Integration with existing AI formatter

4. **Real Case Analysis Complete**
   - 4 complete case examples analyzed (Raw Whisper → AI → Dr. Centomo Final)
   - Section 7 patterns identified and documented
   - Quebec medical terminology corrections mapped
   - Patient quote preservation rules established

### **✅ COMPLETED FEATURES (August 22, 2025)**
5. **Section 8 Ambient Integration (COMPLETE)**
   - ✅ Context detection based on form location and active fields
   - ✅ Specialized Quebec medical terminology corrections
   - ✅ Dr. Centomo's voice patterns recognition
   - ✅ Real-time Section 8 enhancement with "[Section 8 Local]" indicators
   - ✅ Integration with existing Section 8 infrastructure

### **🔄 IN PROGRESS**  
1. **Section 7 Processing Engine (NEXT PRIORITY)**
   - Real case analysis implementation
   - Quebec medical terminology corrections
   - Patient quote preservation functionality  
   - Chronological medical event structuring

### **📋 PLANNED FEATURES** 
1. **Word-for-Word Enhancement**
   - Temperature: 0.0 for maximum precision
   - Spoken punctuation handling
   - French command set for Quebec users

2. **Template Application System**
   - Quebec medical standards research
   - AI-powered section extraction
   - Auto-template detection

3. **Export System**
   - Pixel-perfect Word/PDF generation
   - Quebec medical form layouts
   - Professional document standards

---

## 🇫🇷 **QUEBEC-SPECIFIC REQUIREMENTS**

### **Language Requirements (TGV General Category)**
- ✅ **French Interface**: All UI elements in French
- ✅ **French Documentation**: Help text and policies in French  
- ✅ **Error Messages**: All errors in French
- ✅ **Default Language**: French for Quebec users (locale detection)

### **Quebec Healthcare Integration**
- 🔄 **RAMQ Integration**: Compatible with Quebec health card (future)
- 🔄 **Quebec EMR Systems**: Compatible with Omnimed, etc.
- 🔄 **Professional Orders**: CMQ, OPQ requirements

### **Quebec French Medical Terminology**
```typescript
// Section 8-specific corrections for Quebec French
const QUEBEC_MEDICAL_CORRECTIONS = {
  'appreciation subjective': 'appréciation subjective',
  'amelioration': 'amélioration', 
  'plateau therapeutique': 'plateau thérapeutique',
  'tolerance a l effort': 'tolérance à l\'effort',
  'activite de la vie quotidienne': 'activités de la vie quotidienne'
};
```

---

## ✨ **SECTION 8 OPTIMIZATION IMPLEMENTATION (August 22, 2025)**

### **Context Detection System**
```typescript
// Multi-level Section 8 context detection
detectSection8Context(): boolean {
  const indicators = [
    currentSection === 'section8',
    currentPath.includes('section8'),
    lastActiveField?.includes('appreciationEvolution'),
    lastActiveField?.includes('plaintesproblemes'),
    lastActiveField?.includes('impactAvq'),
    document.querySelector('#section8')?.getBoundingClientRect().top < 100
  ];
  return indicators.some(indicator => indicator);
}
```

### **Quebec Medical Terminology Corrections**
```typescript
// Dr. Centomo's common voice recognition fixes
const QUEBEC_CORRECTIONS = {
  'appreciation subjective': 'appréciation subjective',
  'amelioration': 'amélioration',
  'plateau therapeutique': 'plateau thérapeutique',
  'tolerance a l effort': 'tolérance à l\'effort',
  'la travailleuse rapport': 'La travailleuse rapporte'
};
```

### **Voice Pattern Recognition**
- Automatic sentence capitalization
- Quebec French medical phrase corrections
- Dr. Centomo's specific dictation patterns
- Real-time processing with visual indicators

### **Integration Benefits**
- ✅ **Immediate feedback**: Section 8 content gets enhanced in real-time
- ✅ **Local processing**: No patient data sent to server for basic corrections
- ✅ **Visual indicators**: Clear "[Section 8 Local]" tags for transparency
- ✅ **Zero retention**: All processing maintains compliance standards

## 🚨 **CRITICAL GOTCHAS & ARCHITECTURE DECISIONS**

### **Audio Processing Performance**
```typescript
// GOTCHA: Stack overflow in audioToFloat32Array - FIXED
// Solution: Enhanced error handling for browser processing
try {
  const audioArray = await this.audioToFloat32Array(audioBlob);
  const result = await this.pipeline(audioArray);
} catch (error) {
  console.error('Browser Whisper failed:', error);
  // Graceful fallback to server processing
}
```

### **User Workflow Problem - SOLVED**
- **Issue**: Users stopped recording before 30-second chunks generated
- **Solution**: Changed to 3-second chunking with visual countdown
- **Result**: Users now see immediate feedback, preventing premature stops

### **MediaRecorder Chunking Strategy**
```typescript
// ARCHITECTURAL DECISION: Use MediaRecorder.start(timeslice) 
// Instead of manual intervals for better browser compatibility
this.mediaRecorder.start(3000); // 3-second automatic chunks

// NOT: setInterval manual chunking (previous approach)
```

### **Zero Retention Memory Management**
```typescript
// GOTCHA: Ensure proper cleanup after processing
private async processChunk(audioBlob: Blob): Promise<void> {
  let transcriptionResult: any;
  try {
    transcriptionResult = await this.transcribe(audioBlob);
    this.updateUI(transcriptionResult);
  } finally {
    // CRITICAL: Explicit cleanup
    audioBlob = null;
    transcriptionResult = null;
    if (global.gc) global.gc();
  }
}
```

## 🔄 **PLANNED ARCHITECTURE MIGRATIONS**

### **Supabase Pro Integration (Priority: High)**
```typescript
// MIGRATION PLAN: Current → Supabase Pro for Enhanced Compliance
interface SupabaseMigration {
  current: {
    database: "PostgreSQL + Drizzle ORM",
    auth: "Custom Express auth",
    storage: "Local file processing"
  },
  target: {
    database: "Supabase PostgreSQL (HIPAA-compliant)",
    auth: "Supabase Auth with SSO",
    storage: "Supabase Storage (encrypted)",
    realtime: "Supabase Realtime for audio chunks",
    functions: "Supabase Edge Functions for compliance"
  },
  benefits: {
    compliance: "SOC 2 Type II certified infrastructure",
    security: "Built-in row-level security (RLS)",
    audit: "Comprehensive audit logging",
    scalability: "Auto-scaling for multi-user fork"
  }
}
```

### **Migration Strategy**
1. **Phase 1**: Migrate authentication to Supabase Auth + SSO
2. **Phase 2**: Migrate database with zero downtime
3. **Phase 3**: Implement Supabase Storage for temporary audio processing
4. **Phase 4**: Edge Functions for compliance validation
5. **Phase 5**: Realtime for multi-user capabilities (future fork)

## 📊 **DEVELOPMENT PHASES & PRIORITIES**

### **Phase 1: Section 7 Processing Implementation (Current - Week 1)**
```typescript
// IMMEDIATE TASKS (Based on Real Case Analysis)
1. Implement Section 7 AI formatting engine ⏳
2. Add Quebec medical terminology corrections 🔄
3. Build patient quote preservation system ⏳
4. Add chronological medical event structuring ⏳
5. Test against 4 real case examples ⏳

// Files to modify:
- server/ai-formatter.ts (add enhanceSection7Dictation function)
- client/src/utils/browser-whisper.ts (Quebec corrections)
- client/src/pages/unified-dictation-page.tsx (Section 7 context detection)
```

### **Phase 2: Section 8 Ambient Optimization (COMPLETED ✅)**
```typescript
// COMPLETED TASKS (August 22, 2025)
1. Fix 3-second chunking user experience ✅
2. Integrate Section 8 specialized processing ✅
3. Add Section 8 context detection ✅
4. Implement Quebec medical term corrections ✅
5. Browser Whisper Section 8 enhancement ✅
6. Voice pattern recognition for Dr. Centomo's style ✅

// NEW CAPABILITIES:
- detectSection8Context() - Multi-level context detection
- enhanceSection8Transcript() - Quebec medical corrections  
- applyQuebecMedicalCorrections() - Voice recognition fixes
- applySection8VoicePatterns() - Dr. Centomo's patterns
- Real-time "[Section 8 Local]" processing indicators
```

### **Phase 2: Word-for-Word Enhancement (Weeks 2-3)**
- Temperature: 0.0 for verbatim transcription
- Spoken punctuation handling
- Real-time display with Web Speech API hybrid

### **Phase 3: Template System (Weeks 4-5)**  
- Quebec medical standards research
- AI-powered content extraction
- Template matching and application

### **Phase 4: Export System (Weeks 6-7)**
- Professional document generation
- Quebec medical form layouts  
- Word/PDF pixel-perfect output

---

## 🔍 **TESTING & VALIDATION STRATEGIES**

### **TGV Compliance Testing**
```typescript
// Automated compliance validation
describe('Zero Retention Compliance', () => {
  it('should not store patient data permanently', async () => {
    await processPatientAudio(testAudio);
    const dbRecords = await checkDatabaseForHealthData();
    expect(dbRecords).toHaveLength(0);
  });

  it('should cleanup memory after processing', async () => {
    const initialMemory = process.memoryUsage();
    await processLargeAudioFile(largeAudio);
    global.gc();
    const finalMemory = process.memoryUsage();
    expect(finalMemory.heapUsed).toBeLessThan(initialMemory.heapUsed * 1.1);
  });
});
```

### **Section 8 Accuracy Testing**
```typescript
// Validate Dr. Centomo's terminology
const testCases = [
  {
    input: "la travailleuse rapport une amelioration",
    expected: "La travailleuse rapporte une amélioration"
  },
  {
    input: "plateau therapeutique",  
    expected: "plateau thérapeutique"
  }
];
```

---

## 📈 **PERFORMANCE OPTIMIZATION STRATEGIES**

### **Audio Processing Optimization**
- **WebWorker**: Use for audio processing to avoid UI blocking
- **Memory Management**: Explicit cleanup after each chunk
- **Concurrent Limits**: Max 2 simultaneous audio chunks
- **VAD**: Skip silence-only chunks to reduce processing

### **Browser Compatibility**
```typescript
// GOTCHA: MediaRecorder support varies
const isMediaRecorderSupported = () => {
  return typeof MediaRecorder !== 'undefined' && 
         MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
};

// Fallback for unsupported browsers
if (!isMediaRecorderSupported()) {
  // Use server-only processing
}
```

---

## 🎯 **CUSTOM SLASH COMMANDS & HOOKS FOR AI AGENTS**

### **Required AI Agent Commands**
```bash
# MANDATORY: Reference this document
/memory-check         # Always check CENTOMOMD.md before starting work
/compliance-gate      # Run TGV compliance validation before patient data features
/section8-context     # Reference Section 8 specialized processing requirements
/zero-retention       # Validate zero patient data retention principles
/quebec-french        # Check Quebec French medical terminology requirements

# DEVELOPMENT COMMANDS
/architecture-review  # Review current tech stack and planned changes
/supabase-migration   # Plan/execute migration to Supabase Pro for compliance
/audio-chunk-test     # Test 3-second chunking workflow
/centomo-patterns     # Reference Dr. Centomo's specific medical writing patterns
```

### **AI Agent Instructions**
```typescript
// WHEN WORKING ON CENTOMOMD FEATURES:
interface AIAgentProtocol {
  step1: "ALWAYS reference CENTOMOMD.md first";
  step2: "Check TGV compliance requirements for the feature";
  step3: "Verify zero retention principles are maintained";
  step4: "If audio processing: ensure 3-second chunking";
  step5: "If Section 8 related: use specialized processing";
  step6: "If new architecture: update CENTOMOMD.md";
  step7: "Test Quebec French medical terminology";
  step8: "Update this memory document with any new discoveries";
}
```

### **Custom Hooks for Development**
```typescript
// Pre-commit validation
hooks: {
  "pre-commit": [
    "npm run compliance-check",
    "npm run test:zero-retention", 
    "npm run validate:quebec-french",
    "npm run test:section8-processing"
  ],
  "pre-deploy": [
    "npm run audit:security",
    "npm run test:tgv-compliance",
    "npm run validate:supabase-migration"
  ],
  "post-feature": [
    "npm run update:memory-doc",
    "npm run validate:centomo-patterns"
  ]
}
```

---

## ⚠️ **KNOWN ISSUES & RISKS**

### **Technical Risks**
1. **Browser Audio API Limitations**: Not all browsers support MediaRecorder
2. **Memory Management**: Large audio files could cause memory issues
3. **Network Dependency**: Server fallback requires stable internet

### **Compliance Risks**  
1. **Data Retention Violations**: Any feature storing patient data permanently
2. **Third-party Integration**: External services receiving patient data
3. **Audit Trail Gaps**: Missing compliance logging

### **Business Risks**
1. **User Adoption**: Complex workflow may deter users
2. **Competition**: TGV-certified competitors entering market
3. **Regulatory Changes**: Quebec healthcare technology regulations

---

## 📞 **ESCALATION & CONTACTS**

### **When to Escalate**
- TGV compliance red flags
- Zero retention violations  
- Quebec regulatory questions
- Security vulnerabilities
- Performance degradation >500ms

### **Contact Strategy**
1. **Technical Issues**: Fractional CTO
2. **Compliance Questions**: Legal Counsel  
3. **TGV Specific**: Compliance Consultant
4. **Quebec Regulations**: Healthcare Legal Expert

---

## 📋 **CHECKLIST FOR NEW FEATURES**

### **Pre-Development (MANDATORY)**
- [ ] Complete TGV compliance gate assessment
- [ ] Verify zero retention principles maintained
- [ ] Check Quebec language requirements
- [ ] Plan Section 8 integration if applicable
- [ ] Document memory cleanup strategy

### **During Development**
- [ ] Implement explicit memory cleanup
- [ ] Add audit logging (no patient data)
- [ ] Test browser compatibility  
- [ ] Validate Quebec French terminology
- [ ] Test 3-second chunking if audio-related

### **Pre-Deployment**
- [ ] Run TGV compliance validation
- [ ] Test zero retention cleanup
- [ ] Verify French language support
- [ ] Performance test <500ms response time
- [ ] Security audit for patient data handling

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Next Review**: Monthly (First Monday)  
**Compliance Status**: 42% → Target 65%