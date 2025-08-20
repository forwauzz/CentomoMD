# CentomoMD - Medical Evaluation Platform

## Overview
CentomoMD is a comprehensive digital medical evaluation platform designed to streamline medical assessments. It provides an exact digital replica of medical assessment forms (MI Template) with AI-enhanced documentation, voice dictation, and intelligent content distribution. The platform aims to improve the efficiency and accuracy of medical evaluations.

## User Preferences
Preferred communication style: Simple, everyday language.

## Critical Security Requirements
**MANDATORY REFERENCE:** All new features must be reviewed against `SECURITY_COMPLIANCE_CHECKLIST.md` before implementation.

**Zero-Retention Security Model:** CentomoMD processes medical data but stores NOTHING permanently. All patient/health data must be:
- Processed in-memory only
- Immediately deleted after processing
- Never written to database or filesystem
- Cleaned from memory with explicit garbage collection

**Security Implementation Strategy:** Every new feature requires security validation using our comprehensive checklist covering authentication, data protection, audit logging, and compliance monitoring.

## Development Workflow
**Git Strategy Reference:** Follow `GIT_DEVELOPMENT_STRATEGY.md` for all development work including feature branches, security-first commits, and compliance validation workflows.

## Logging Infrastructure
**Phase 1 Complete (January 20, 2025):** 
- Zero-retention logging service with medical data sanitization
- Montreal timezone support for local development
- Structured console output with categorized events (AUTH, API, FORM, VOICE, OCR)
- Authentication event tracking (login/logout with performance metrics)
- API request middleware for comprehensive request/response monitoring
- Admin endpoints: `/api/logs/recent` and `/api/logs/health` for system monitoring
- Memory buffer for recent log storage (configurable: 2000 entries in dev, 1000 in production)

## System Architecture

### Technology Stack
- **Frontend**: React 18 (TypeScript, Vite)
- **Backend**: Express.js (TypeScript)
- **Database**: PostgreSQL (Drizzle ORM)
- **AI Integration**: OpenAI GPT-4o
- **Authentication**: Session-based (bcrypt)
- **UI Framework**: Tailwind CSS with shadcn/ui
- **Voice Recognition**: Web Speech API

### Architecture Pattern
The application employs a full-stack TypeScript architecture with a modular form system:
- **Client-Server Separation**: React frontend served by Express backend.
- **Modular Form System**: Configuration-driven forms with dynamic rendering and a form registry.
- **Dual Schema Approach**: Supports both legacy medical forms and a generic form system for scalability.
- **Shared Types**: Common TypeScript definitions for consistency.
- **API-First Design**: RESTful API endpoints.
- **Real-time Features**: Voice dictation with live transcript processing.

### Key Components
1.  **Medical Form System**: Digital replication of MI Template with 11 sections, Zod validation, and auto-save to localStorage.
2.  **AI-Powered Content Processing**: AI enhances formatting (Section 7), distributes content (Section 8), and generates conclusions (Section 11), with medical terminology awareness. Includes a verbatim mode for protecting specific content from AI modification.
3.  **Voice Dictation System**: Supports direct field dictation and a dedicated dictation page. Features AI-powered transcript improvement, multi-language support (French/English), and custom verbatim commands. Utilizes OpenAI Whisper API for transcription.
4.  **Data Management**: Temporary form storage, user-specific persistence, PDF export, and automatic data cleanup.

### Data Flow
-   **Form Processing**: User input (manual/voice), real-time Zod validation, optional AI enhancement, auto-save to local storage, server-side database persistence, and PDF generation.
-   **Authentication**: Session management with Express-session and PostgreSQL store, bcrypt hashing, and role-based access.

### Deployment Strategy
-   **Runtime**: Node.js 20 with PostgreSQL 16 on Replit.
-   **Build Process**: Frontend built with Vite, backend with esbuild. Drizzle migrations applied for database.
-   **Environment**: Requires `DATABASE_URL`, `OPENAI_API_KEY`, and `SESSION_SECRET`.

## External Dependencies

### Core Dependencies
-   **Database**: PostgreSQL (Neon serverless).
-   **AI Services**: OpenAI API (GPT-4o).
-   **Voice Recognition**: Browser Web Speech API and OpenAI Whisper API.
-   **PDF Generation**: Browser print API (future jsPDF integration planned).

### Development Dependencies
-   **Build Tools**: Vite, esbuild.
-   **Type Safety**: TypeScript.
-   **Code Quality**: ESLint, Prettier.