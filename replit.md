# CentomoMD - Medical Evaluation Platform

## Overview

CentomoMD is a comprehensive digital medical evaluation platform designed to streamline CNESST (Quebec Workers' Compensation Board) medical assessments. The platform provides an exact digital replica of CNESST medical assessment forms with AI-enhanced documentation capabilities, voice dictation, and intelligent content distribution.

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
- **Digital Form Replication**: Exact replica of CNESST medical assessment documents
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
- **Previous Updates**: Enhanced dictation workflow integration and language persistence
- **Previous Updates**: Implemented TypeScript declarations for Web Speech API

## Changelog

- June 26, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.