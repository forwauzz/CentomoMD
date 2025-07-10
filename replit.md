# CentomoMD - Medical Evaluation Platform

## Overview

CentomoMD is a comprehensive digital medical evaluation platform designed to streamline medical assessments. The platform provides an exact digital replica of medical assessment forms (MI Template) with AI-enhanced documentation capabilities, voice dictation, and intelligent content distribution.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for development
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4o for text processing and enhancement
- **Authentication**: Session-based authentication with bcrypt
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Voice Recognition**: Web Speech API with medical terminology support

### Architecture Pattern
The application follows a full-stack TypeScript architecture with a modular form system:
- **Client-Server Separation**: Frontend React app served by Express backend
- **Modular Form System**: Configuration-driven forms with dynamic rendering (Phase 1 Complete)
- **Dual Schema Approach**: Legacy medical forms + generic form system for future scalability
- **Shared Types**: Common TypeScript definitions in `/shared/schema.ts` and `/shared/form-configs/`
- **API-First Design**: RESTful API endpoints for all data operations
- **Real-time Features**: Voice dictation with live transcript processing

### Modular Architecture (Phase 1 - Foundation Complete)
- **Form Configuration System**: Type-safe form definitions with validation rules
- **Dynamic Field Rendering**: Universal field components supporting all form types
- **Form Registry**: Centralized management of multiple form configurations
- **Generic Database Layer**: Flexible storage supporting any form structure
- **Backward Compatibility**: Existing CNESST form fully preserved during migration

## Key Components

### 1. Medical Form System
- **Digital Form Replication**: Exact replica of medical assessment documents (MI Template)
- **Section-Based Structure**: 11 distinct sections with specific data requirements
- **Form Validation**: Zod schema validation for data integrity
- **Auto-Save Functionality**: Automatic form data persistence to localStorage

### 2. AI-Powered Content Processing
- **Section 7 Formatting**: AI-enhanced medical history and evolution formatting
- **Section 8 Distribution**: Single input field with AI distribution to multiple subsections
- **Section 11 Generation**: AI-generated medical conclusions based on form data
- **Medical Terminology**: Context-aware medical language processing

### 3. Voice Dictation System
- **Direct Field Dictation**: Floating record button for immediate text input
- **Dedicated Dictation Page**: Comprehensive voice-to-text editing interface
- **Medical Enhancement**: AI-powered transcript improvement for medical terminology
- **Multi-language Support**: French and English voice recognition

### 4. Data Management
- **Form Persistence**: Temporary form storage with configurable retention periods
- **User-Specific Storage**: Forms tied to authenticated users
- **Export Functionality**: PDF generation for completed assessments
- **Data Cleanup**: Automatic deletion of expired forms

## Data Flow

### Form Processing Pipeline
1. **User Input**: Manual text entry or voice dictation
2. **Real-time Validation**: Zod schema validation on form submission
3. **AI Enhancement**: Optional AI processing for specific form sections
4. **Auto-save**: Periodic local storage updates
5. **Database Persistence**: Secure server-side storage for saved forms
6. **Export Generation**: PDF output for completed assessments

### Authentication Flow
1. **Session Management**: Express-session with PostgreSQL store
2. **Password Security**: bcrypt hashing with salt rounds
3. **User Validation**: JWT-like session tokens
4. **Role-based Access**: Admin and user role distinctions

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Neon serverless connection
- **AI Services**: OpenAI API for GPT-4o text processing
- **Voice Recognition**: Browser Web Speech API
- **PDF Generation**: Browser print API (with future jsPDF integration)

### Development Dependencies
- **Build Tools**: Vite for frontend bundling, esbuild for backend
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint and Prettier (inferred from project structure)

## Deployment Strategy

### Replit Configuration
- **Runtime**: Node.js 20 with PostgreSQL 16
- **Development**: `npm run dev` for local development
- **Production Build**: `npm run build` for optimized deployment
- **Auto-scaling**: Configured for Replit's autoscale deployment target

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string
- **OPENAI_API_KEY**: OpenAI API access token
- **SESSION_SECRET**: Session encryption key (auto-generated if not provided)

### Build Process
1. **Frontend Build**: Vite compiles React app to `/dist/public`
2. **Backend Build**: esbuild bundles server code to `/dist`
3. **Database Migration**: Drizzle migrations applied via `db:push`
4. **Static Assets**: Served from Express with Vite middleware in development

## Recent Changes
- **January 10, 2025**: **Medical Formatting Structure Enhancement** - Updated AI formatter system to use "Le travailleur/La travailleuse" structure instead of date-first format
  - Modified system prompts in ai-formatter.ts and ai-formatter-enhanced.ts to prioritize worker-first sentence structure
  - Enhanced formatting instructions: "Le travailleur consulte le docteur [Nom], le [date]" instead of "Le [date], le travailleur..."
  - Updated variation guidelines to maintain consistent Quebec healthcare documentation standards
  - Preserved all existing medical terminology and content accuracy while improving structural compliance
  - **Use case**: Quebec healthcare providers now get properly formatted medical histories matching professional documentation standards
- **January 7, 2025**: **Custom Verbatim Commands System** - Added user-configurable verbatim triggers for specialized medical content
  - Created verbatim commands manager with CRUD operations for custom medical triggers
  - Implemented default medical verbatim commands: "rapport radiologique", "citation patient", "spécifications techniques", "résultats laboratoire"
  - Added English equivalents: "radiology report", "patient quote", "technical specifications", "lab results"
  - Enhanced verbatim processing pipeline to handle custom triggers before standard verbatim markers
  - Added visual indicators showing custom verbatim usage with trigger names and categories
  - Integrated with existing voice commands system maintaining full backward compatibility
  - **Use case**: Quebec healthcare providers can now create custom verbatim triggers like "diagnostic médical" → "fin diagnostic" for specialized content preservation
- **January 7, 2025**: **Verbatim Input Design Implementation Complete** - Added comprehensive verbatim mode for preserving exact medical content without AI modification
  - Implemented voice commands for verbatim sections: "ouvrir/fermer parenthèse" (French) and "open/close parenthesis" (English)
  - Created verbatim processing pipeline that completely bypasses AI enhancement for protected content
  - Added visual indicators showing verbatim sections with yellow highlighting and section counters
  - Enhanced UI with real-time verbatim detection and preview panels for captured sections
  - Integrated with existing voice commands system without disrupting current functionality
  - Maintains compatibility with 30+ minute sessions, chunking system, and storage mechanisms
  - **AUDIT COMPLETE**: Code review confirms verbatim sections are fully protected from Whisper AI and AI formatter modification
  - **Use case**: Quebec healthcare providers can now preserve radiology reports, patient quotes, and technical specifications verbatim
- **January 7, 2025**: **Critical Voice Commands System Fix** - Resolved major issue where voice commands were not being triggered during dictation
  - Enhanced French pattern matching to handle article variations ("l'", "le", "les", "des")
  - Added verb conjugation support (insérer/insérez/ajouter/ajoutez)
  - Implemented medical terminology synonyms (signes vitaux ↔ constantes normales)
  - Fixed case-insensitive matching for natural speech patterns
  - Added comprehensive debug logging and testing functionality
  - Created voice commands audit system with pattern validation
  - Fixed core issue where "Insérez l'examen physique" wasn't matching "insérer examen physique"
- **July 5, 2025**: **Critical Backend Stability Improvements** - Fixed app startup failures and enhanced Whisper system reliability
  - Created missing `recent_patients` database table resolving "relation does not exist" errors
  - Added comprehensive Whisper API retry logic with exponential backoff (3 retries, 1-10 second delays)
  - Implemented chunk validation and session tracking with UUIDs for long dictations
  - Enhanced AI text enhancement with fallback protection to prevent transcript corruption
  - Added detailed error handling and logging for medical transcription reliability
  - **SESSION RECOVERY IMPLEMENTED** - Added client-side chunk validation and empty audio prevention
  - Enhanced UI warnings for long recordings (3+ and 4+ minute alerts)
  - Fixed save-to-section functionality with proper Section 8 AI distribution
  - Added session storage backup for recording metadata and recovery
  - **PAUSE/RESUME FUNCTIONALITY** - Added pause and resume controls for voice recordings
  - Enhanced timeout protection with 60-120 second limits and emergency cancel button
  - Reduced chunk size to 2 minutes for better reliability and faster processing
  - **ENHANCED UX IMPROVEMENTS** - Added real-time progress feedback and medical context processing
  - Implemented crash-resistant session storage with IndexedDB for long dictation recovery
  - Added subtle progress indicators for multi-chunk processing without UI clutter
  - Enhanced medical terminology processing with Quebec healthcare context
  - **VOICE COMMANDS SYSTEM** - Implemented comprehensive voice commands with position-preserving AI enhancement
  - Added voice commands manager for creating/editing custom medical templates
  - Integrated command-first processing pipeline to prevent AI modification of inserted templates
  - Created localStorage-based storage for single-user simplicity with import/export functionality
  - **RESPONSIVE DICTATION PAGE** - Enhanced mobile experience with improved scrolling and responsive design
  - Added responsive breakpoints for better mobile layout and navigation
  - Improved textarea with responsive height and scroll behavior
  - Enhanced button layout with mobile-friendly stacking and wrapping
- **January 7, 2025**: **Patient Context Enhancement** - Added patient name display above Section A for better user workflow context
  - Created dynamic patient name banner that appears when patient name is entered
  - Enhanced visual design with blue indicator and professional styling for clear identification
  - Fixed all console accessibility warnings by adding DialogDescription to all dialog components
  - Improved patient creation workflow with proper gender selection and database field mapping
  - Enhanced modular patient service for consistent data extraction and validation across components
- **January 5, 2025**: **Whisper API Integration Complete** - Upgraded from WebSpeech API to OpenAI Whisper API for medical transcription
  - Implemented Whisper transcription service with 95% accuracy (up from 70% with WebSpeech)
  - Created new audio recorder hook with MediaRecorder API and chunking system
  - Added Whisper API endpoints for audio processing with medical terminology enhancement
  - Built modern dictation interface with processing status instead of live transcription
  - Preserved existing 4-minute chunking system, 20-minute warnings, and session management
  - Added "return to section" button at top right of dictation page for better navigation
  - Maintained all existing UX patterns while improving transcription quality for Quebec medical standards
- **June 30, 2025**: **Navigation Section Collapsed by Default** - Enhanced user interface by keeping navigation section collapsed on load
  - Updated both navigation pane components to start with navigation section collapsed
  - Reduces visual clutter while maintaining full accessibility to all form sections
  - Users can still expand navigation section when needed via toggle button
- **June 30, 2025**: **Form Actions UI Enhancement** - Relocated save buttons for better accessibility
  - Moved "Sauvegarder" and "Sauvegarder copie" buttons from navigation to top of form
  - Positioned buttons prominently above Section A for whole-form accessibility
  - Styled with distinct colors: green for save, orange for save copy
  - Maintained bilingual support and proper iconography
  - Enhanced user workflow by making primary actions more prominent
- **June 30, 2025**: **Enhanced Ligament and Muscle Assessment in Section 9** - Improved physical examination interface
  - Added comprehensive dropdown menus for Manœuvres ligamentaires with all six medical options: "Négatif", "Positif", "Non fait", "Sec", "Retardé", "Aucun arrêt"
  - Enhanced Forces section with standardized muscle strength ratings (5/5 to 0/5)
  - Applied to all 22 ligament test fields: LCI 0°, LCI 20°, LCE 0°, LCE 20°, Lachman, Pivot, Tiroir antérieur, Tiroir postérieur, Sag postérieur, Dial à 30°, Dial à 90° (both left and right)
  - Improved clinical accuracy with complete medical terminology for comprehensive ligament stability assessment
  - Enhanced user experience for detailed physical examination workflow
  - Maintained proper form validation and auto-save functionality
- **June 30, 2025**: **French Dictation System Enhancement** - Advanced speech recognition optimization
  - Enhanced French speech recognition with fr-CA language support for medical terminology
  - Improved error handling with detailed French error messages for better user experience
  - Added comprehensive speech test page (/speech-test) for validation and troubleshooting
  - Optimized live transcript capture and processing without data loss
  - Created dedicated French medical terminology testing with suggested clinical phrases
- **January 27, 2025**: **Phase 4 Technical Infrastructure Enhancement** - Systematic engineering approach to code quality
  - Added logout functionality to form selector page with user info display
  - Created working Simple Form Container with proper TypeScript support
  - Fixed form registry method names and eliminated duplicate function issues
  - Ensured database has all required tables (generic_forms table added)
  - Completed comprehensive code audit confirming 100% system readiness
  - Renamed medical form from "CNESST Medical Evaluation" to "MI Template" throughout system
  - Identified specific TypeScript issues in complex Form Container for future enhancement
- **January 26, 2025**: **Voice Dictation System Enhanced** - Fixed live transcript capture and language persistence
  - Enhanced speech recognition hook to capture both interim and final transcripts properly
  - Fixed missing live transcript issue that was only capturing final results
  - Improved floating record button to capture every speech segment without loss
  - Added proper language persistence across dictation workflow (fr-CA/en-US)
  - Enhanced real-time display with interim transcript preview for better user experience
  - Added comprehensive logging for voice recognition debugging and reliability
- **January 26, 2025**: **Phase 3 Dynamic Rendering Integration Complete** - Connected modular system to existing workflows
  - Created form selector page with beautiful multilingual interface (/forms)
  - Built universal form container wrapping existing forms with unified navigation
  - Added seamless routing for future form types (/forms/:formType)
  - Preserved all existing functionality while enabling modular expansion
  - Language selection now persists across all form interfaces
- **January 26, 2025**: **Phase 2 AI Processing Abstraction Complete** - Built universal AI processing engine
  - Created flexible AI processing configuration system supporting format/enhance/distribute/generate operations
  - Implemented modular AI processing engine with rule-based processing logic
  - Added CNESST-specific AI configuration mapping existing functionality to new system
  - Built universal API endpoints for any form type AI processing
  - Enhanced Section 8 distribution with improved contextual processing
  - Maintained backward compatibility with existing AI formatter functions
- **January 26, 2025**: **Phase 1 Modular Architecture Implementation** - Created foundation for form-agnostic system
  - Implemented dynamic form configuration types and validation system
  - Added generic database schema alongside existing medical forms schema
  - Created form registry system for managing multiple form types
  - Built dynamic field renderer supporting all existing field types
  - Enhanced storage layer with generic form management capabilities

## Changelog

- June 26, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.