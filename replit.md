# CentomoMD - Medical Evaluation Platform

## Overview
CentomoMD is a comprehensive digital medical evaluation platform designed to streamline medical assessments. It provides an exact digital replica of medical assessment forms (MI Template) enhanced with AI capabilities for documentation, voice dictation, and intelligent content distribution. The platform aims to improve efficiency and accuracy in medical evaluations, offering a modern solution for healthcare professionals.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS with shadcn/ui.
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **AI Integration**: OpenAI GPT-4o.
- **Authentication**: Session-based authentication using bcrypt.
- **Voice Recognition**: Web Speech API with medical terminology support.

### Architecture Pattern
The application employs a full-stack TypeScript architecture with a modular, API-first design. Key architectural decisions include:
- **Client-Server Separation**: Standard frontend/backend separation.
- **Modular Form System**: Configuration-driven forms with dynamic rendering, supporting both legacy medical forms and a generic form system for future scalability.
- **Dual Schema Approach**: Accommodates existing medical forms and a flexible generic form structure.
- **Shared Types**: Centralized TypeScript definitions for consistency.
- **Real-time Features**: Voice dictation with live transcript processing.

### Key Components
1.  **Medical Form System**: Digital replication of MI Templates, structured into 11 sections with Zod validation and auto-save functionality.
2.  **AI-Powered Content Processing**: AI enhances specific sections like medical history (Section 7), distributes input to subsections (Section 8), and generates conclusions (Section 11), with a focus on medical terminology. Includes verbatim mode to preserve exact content without AI modification.
3.  **Voice Dictation System**: Supports direct field dictation and a comprehensive dictation page. Features AI-powered transcript improvement for medical terminology and multi-language support (French and English). Includes custom verbatim commands.
4.  **Data Management**: Temporary and user-specific form persistence, PDF export functionality, and automatic data cleanup.

### Data Flow & Authentication
-   **Form Processing**: User input (manual/voice) undergoes real-time Zod validation, optional AI enhancement, auto-saving to local storage, and secure server-side persistence.
-   **Authentication**: Session management with Express-session and PostgreSQL store, bcrypt for password security, and role-based access.

### UI/UX Decisions
-   Navigation section is collapsed by default for reduced clutter.
-   Save buttons are prominently located at the top of the form for accessibility.
-   Enhanced physical examination interface in Section 9 with comprehensive dropdowns and standardized ratings.
-   Patient name display provides context.
-   Responsive design for mobile experiences, especially on the dictation page.
-   Visual indicators for verbatim sections (yellow highlighting).
-   Consistent multilingual interface.

## External Dependencies

### Core Dependencies
-   **Database**: PostgreSQL (with Neon serverless connection).
-   **AI Services**: OpenAI API (for GPT-4o).
-   **Voice Recognition**: Browser Web Speech API and OpenAI Whisper API.
-   **PDF Generation**: Browser print API (future integration with jsPDF).

### Development Dependencies
-   **Build Tools**: Vite (frontend), esbuild (backend).
-   **Type Safety**: TypeScript.
-   **Code Quality**: ESLint and Prettier.