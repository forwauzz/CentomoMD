# CentomoMD - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Frontend Components](#frontend-components)
8. [Voice & AI Features](#voice--ai-features)
9. [Authentication System](#authentication-system)
10. [Development Setup](#development-setup)
11. [Deployment](#deployment)
12. [Key Features Implementation](#key-features-implementation)

## Project Overview

CentomoMD is a comprehensive digital medical evaluation platform designed specifically for CNESST (Commission des normes, de l'équité, de la santé et de la sécurité du travail) medical assessments. The platform digitally replicates the MI Template form system with advanced voice dictation, AI-powered text processing, and OCR capabilities.

### Core Objectives
- **Digital Form Replication**: Exact digital replica of medical assessment forms
- **Voice Integration**: Multi-modal voice dictation with AI enhancement
- **Medical Text Processing**: Context-aware AI for medical terminology
- **Bilingual Support**: Full French/English interface and processing
- **Data Integrity**: Secure, HIPAA-compliant medical data handling

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server  │    │   PostgreSQL    │
│   (TypeScript)  │◄──►│   (TypeScript)   │◄──►│    Database     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Voice/OCR APIs │    │   OpenAI GPT-4o  │    │  Session Store  │
│ (Web Speech API)│    │   (AI Processing)│    │  (PostgreSQL)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Design Patterns
- **Modular Component Architecture**: Reusable form sections and input controls
- **Configuration-Driven Forms**: Dynamic form rendering based on JSON configurations
- **Dual Schema Approach**: Legacy medical forms + generic form system
- **API-First Design**: RESTful endpoints with TypeScript interfaces
- **Real-time Processing**: Live voice transcription and AI enhancement

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS** + **shadcn/ui** for styling
- **Wouter** for client-side routing
- **TanStack Query** for data fetching and caching
- **React Hook Form** + **Zod** for form management and validation
- **Framer Motion** for animations
- **Tesseract.js** for OCR processing

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database management
- **PostgreSQL** for data persistence
- **bcryptjs** for password hashing
- **Express Session** for authentication
- **OpenAI API** for AI text processing
- **Web Speech API** for voice recognition

### Development Tools
- **ESBuild** for server bundling
- **TypeScript** for type safety
- **Drizzle Kit** for database migrations
- **Autoprefixer** + **PostCSS** for CSS processing

## Project Structure

```
CentomoMD/
├── client/                     # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Base shadcn/ui components
│   │   │   ├── ai-format-section7.tsx     # Section 7 AI formatting
│   │   │   ├── floating-record-button.tsx # Global voice control
│   │   │   ├── medical-form.tsx           # Main form component
│   │   │   ├── ocr-image-processor.tsx    # OCR functionality
│   │   │   ├── section-input-controls.tsx # Modular section controls
│   │   │   ├── standalone-dictation-popup.tsx # Voice popup
│   │   │   └── voice-command-processor.tsx    # Voice commands
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility libraries
│   │   ├── pages/             # Application pages
│   │   │   ├── dashboard.tsx  # Main dashboard
│   │   │   ├── medical-form.tsx        # Form editor
│   │   │   ├── dictation-page-whisper.tsx  # Voice transcription
│   │   │   └── login-page.tsx # Authentication
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Helper functions
├── server/                     # Express backend application
│   ├── ai-formatter-enhanced.ts     # AI text processing
│   ├── ai-processing-engine.ts      # AI workflow engine
│   ├── ai-registry.ts               # AI configuration registry
│   ├── auth.ts                      # Authentication middleware
│   ├── db.ts                        # Database connection
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # API route definitions
│   ├── storage.ts                   # Data persistence layer
│   ├── types.ts                     # Server type definitions
│   └── whisper-service.ts           # Voice transcription service
├── shared/                     # Shared TypeScript definitions
│   ├── form-configs/          # Form configuration system
│   │   ├── ai-processing-types.ts   # AI processing configurations
│   │   ├── cnesst-ai-config.ts     # CNESST-specific AI rules
│   │   ├── cnesst-form-config.ts   # CNESST form structure
│   │   ├── form-config.types.ts    # Form type definitions
│   │   └── form-validator.ts       # Validation schemas
│   ├── patient-service.ts     # Patient data service
│   └── schema.ts              # Database schema definitions
├── package.json               # Dependencies and scripts
├── drizzle.config.ts         # Database configuration
├── vite.config.ts            # Frontend build configuration
├── tailwind.config.ts        # Styling configuration
└── tsconfig.json             # TypeScript configuration
```

## Database Schema

### Core Tables

#### Users Table
```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Forms Table
```typescript
export const forms = pgTable('forms', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  formData: jsonb('form_data').notNull(),
  formType: text('form_type').notNull().default('cnesst'),
  status: text('status').notNull().default('draft'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Session Store
```typescript
export const sessions = pgTable('session', {
  sid: varchar('sid').primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire').notNull(),
});
```

### Relationships
- Users can have multiple Forms (one-to-many)
- Sessions are linked to Users via session data
- Forms include versioning for draft management

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
```typescript
Request: {
  username: string;
  password: string;
}
Response: {
  message: string;
  user: UserProfile;
}
```

#### POST /api/auth/logout
```typescript
Response: {
  message: string;
}
```

#### GET /api/auth/me
```typescript
Response: {
  user: UserProfile;
}
```

### Form Management Endpoints

#### GET /api/saved-forms
```typescript
Response: SavedForm[]
```

#### POST /api/saved-forms
```typescript
Request: {
  title: string;
  formData: CNESSTFormData;
  formType: string;
}
Response: {
  id: number;
  message: string;
}
```

#### PUT /api/saved-forms/:id
```typescript
Request: {
  title: string;
  formData: CNESSTFormData;
}
Response: {
  message: string;
}
```

#### DELETE /api/saved-forms/:id
```typescript
Response: {
  message: string;
}
```

### AI Processing Endpoints

#### POST /api/ai/format-section7
```typescript
Request: {
  text: string;
  language: 'fr' | 'en';
}
Response: {
  formattedText: string;
  suggestions: string[];
}
```

#### POST /api/ai/distribute-content
```typescript
Request: {
  sourceText: string;
  language: 'fr' | 'en';
}
Response: {
  distributions: {
    plaintesproblemes: string;
    appreciationEvolution: string;
    impactAvq: string;
  };
}
```

#### POST /api/ai/generate-conclusion
```typescript
Request: {
  formData: Partial<CNESSTFormData>;
  language: 'fr' | 'en';
}
Response: {
  resume: string;
  diagnostic: string;
}
```

### Voice Processing Endpoints

#### POST /api/transcribe-audio
```typescript
Request: FormData {
  audio: File;
  language: 'fr' | 'en';
}
Response: {
  transcript: string;
}
```

#### POST /api/enhance-transcript
```typescript
Request: {
  transcript: string;
  language: 'fr' | 'en';
  context?: string;
}
Response: {
  enhancedText: string;
  improvements: string[];
}
```

## Frontend Components

### Core Components

#### Medical Form (`client/src/pages/medical-form.tsx`)
Main form interface with 11 sections matching the CNESST MI Template:
- Patient information
- Medical history
- Current symptoms
- Physical examination
- Diagnostic tests
- Current medications
- Section 7: Historical facts and evolution (with AI formatting)
- Section 8: Content distribution (AI-powered)
- Treatment recommendations
- Work capacity assessment
- Conclusions and diagnosis

#### Section Input Controls (`client/src/components/section-input-controls.tsx`)
Modular component providing:
- **Purple "Mode Dictée"**: Word-for-word dictation popup
- **Blue "Transcrire"**: AI transcription via Whisper
- **Gray "Upload File"**: OCR text extraction from images
- Bilingual support and section-specific configuration

#### Floating Record Button (`client/src/components/floating-record-button.tsx`)
Global voice control with dropdown menu:
- Smart field detection
- Two dictation workflows
- Persistent language settings
- Return navigation management

#### OCR Image Processor (`client/src/components/ocr-image-processor.tsx`)
Document text extraction:
- Tesseract.js integration
- Raw text extraction (no NLP corrections)
- Language-specific quotation wrapping
- Side-by-side image/text preview
- Manual correction capability

### Voice Components

#### Standalone Dictation Popup (`client/src/components/standalone-dictation-popup.tsx`)
Quick word-for-word dictation:
- Real-time speech recognition
- Verbatim text capture
- Language switching
- Direct form field insertion

#### Dictation Page Whisper (`client/src/pages/dictation-page-whisper.tsx`)
Full AI transcription workflow:
- File upload or live recording
- OpenAI Whisper integration
- AI text enhancement
- Medical terminology optimization
- Verbatim protection commands

### AI Components

#### AI Format Section 7 (`client/src/components/ai-format-section7.tsx`)
Medical history AI processing:
- GPT-4o text formatting
- Medical terminology enhancement
- Suggestion generation
- Undo/redo functionality

## Voice & AI Features

### Voice Recognition System

#### Web Speech API Integration
- Real-time speech-to-text conversion
- Language detection (French/English)
- Browser compatibility checks
- Fallback error handling

#### OpenAI Whisper Integration
- High-accuracy transcription
- Medical terminology optimization
- Batch audio processing
- File format support (MP3, WAV, M4A)

### AI Processing Engine

#### Medical Text Enhancement
```typescript
interface AIProcessingConfig {
  model: 'gpt-4o';
  temperature: 0.1;
  maxTokens: 2000;
  medicalContext: boolean;
  language: 'fr' | 'en';
  preserveVerbatim: boolean;
}
```

#### Verbatim Protection System
Custom commands to protect specific content from AI modification:
- `VERBATIM_START` / `VERBATIM_END`
- `EXACT_QUOTE` markers
- Content preservation algorithms
- User-configurable command words

### OCR Implementation

#### Tesseract.js Configuration
```javascript
const worker = await createWorker(language, 1, {
  logger: (m) => setProgress(m.progress * 100)
});

const { data: { text } } = await worker.recognize(image);
```

#### Text Processing Pipeline
1. Image quality validation
2. OCR text extraction
3. Minimal cleanup (whitespace only)
4. Language-specific quotation wrapping
5. Preview confirmation
6. Form field insertion

## Authentication System

### Session-Based Authentication
- Express-session with PostgreSQL store
- bcryptjs password hashing
- Role-based access control
- Automatic session cleanup

### Security Features
- CSRF protection via session tokens
- Password strength validation
- Rate limiting on auth endpoints
- Secure cookie configuration

### User Management
```typescript
interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'doctor' | 'user';
  createdAt: Date;
}
```

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- OpenAI API key

### Installation Steps

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd CentomoMD
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Create .env file
   DATABASE_URL="postgresql://user:password@localhost:5432/centomomd"
   OPENAI_API_KEY="sk-..."
   SESSION_SECRET="your-session-secret"
   NODE_ENV="development"
   ```

3. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push
   
   # Verify database connection
   npm run check
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Development Workflow

#### Database Changes
```bash
# Modify schema in shared/schema.ts
# Push changes to database
npm run db:push

# For production, use proper migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

#### Adding New Form Sections
1. Update `shared/form-configs/cnesst-form-config.ts`
2. Add validation in `shared/form-configs/form-validator.ts`
3. Create section component in `client/src/components/`
4. Register in form configuration system

#### AI Configuration Updates
1. Modify `shared/form-configs/cnesst-ai-config.ts`
2. Update processing rules in `server/ai-processing-engine.ts`
3. Test with various medical text samples

## Deployment

### Production Build
```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### Environment Variables (Production)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SESSION_SECRET=secure-random-string
PORT=5000
```

### Deployment Checklist
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] OpenAI API quota verified
- [ ] SSL certificates installed
- [ ] Backup procedures established
- [ ] Monitoring configured

### Replit Deployment
The application is configured for Replit deployment:
- Uses Replit's PostgreSQL service
- Automatic environment variable management
- Built-in HTTPS and domain routing
- Continuous deployment from main branch

## Key Features Implementation

### 1. Modular Form System

#### Configuration-Driven Architecture
```typescript
interface FormSectionConfig {
  id: string;
  title: Record<'fr' | 'en', string>;
  fields: FormFieldConfig[];
  validation: ZodSchema;
  aiProcessing?: AIProcessingRule;
}
```

#### Dynamic Field Rendering
Forms are rendered dynamically based on JSON configurations, allowing for:
- Easy form structure modifications
- Language-specific field labels
- Custom validation rules
- AI processing per section

### 2. Advanced Voice Integration

#### Multi-Modal Dictation System
- **Ambient Mode**: Direct field dictation with real-time insertion
- **Standalone Popup**: Quick word-for-word capture
- **Full Transcription**: AI-enhanced medical text processing

#### Verbatim Protection
```typescript
function processVoiceCommands(transcript: string): ProcessedText {
  const verbatimSections = extractVerbatimSections(transcript);
  const processableSections = extractProcessableSections(transcript);
  
  return {
    verbatimText: verbatimSections,
    enhancedText: aiEnhance(processableSections),
    combined: combinePreservingVerbatim(verbatimSections, processableSections)
  };
}
```

### 3. Medical AI Processing

#### Context-Aware Text Enhancement
```typescript
const medicalAIConfig = {
  preserveTerminology: true,
  enhanceClarity: true,
  structureImprovement: true,
  medicalAbbreviations: 'expand',
  language: 'fr' | 'en'
};
```

#### Intelligent Content Distribution
AI automatically distributes content from Section 7 to appropriate subsections:
- Complaints and problems
- Evolution assessment  
- Daily activity impact

### 4. OCR Document Processing

#### Raw Text Extraction Pipeline
1. **Image Upload**: Support for various formats
2. **Quality Validation**: Resolution and clarity checks
3. **OCR Processing**: Tesseract.js with minimal post-processing
4. **Preview & Confirm**: Side-by-side verification
5. **Quotation Wrapping**: Language-specific formatting
6. **Field Insertion**: Direct integration with form fields

### 5. Bilingual Support

#### Complete French/English Implementation
- Interface translations for all components
- Medical terminology in both languages
- AI processing language awareness
- Voice recognition language switching
- OCR language-specific optimization

### 6. Data Persistence & Security

#### Form Management
- Auto-save to localStorage (temporary)
- Server-side persistence with versioning
- Draft management and recovery
- Export capabilities (PDF planned)

#### Security Measures
- Session-based authentication
- Password hashing with bcryptjs
- CSRF protection
- Input validation with Zod schemas
- Medical data encryption at rest

### 7. Real-Time Processing

#### Live Voice Transcription
- Real-time speech recognition feedback
- Progress indicators for AI processing
- Non-blocking UI during operations
- Error recovery and retry mechanisms

#### Responsive User Experience
- Optimistic UI updates
- Loading states for all operations
- Error boundaries for fault tolerance
- Mobile-responsive design

## Future Enhancements

### Planned Features
1. **Enhanced OCR**: Multi-page document processing
2. **Advanced AI**: Section-specific AI models
3. **Export System**: PDF generation with templates
4. **Collaboration**: Multi-user form editing
5. **Analytics**: Usage metrics and performance monitoring
6. **Mobile App**: Native iOS/Android applications

### Technical Improvements
1. **Performance**: Code splitting and lazy loading
2. **Testing**: Comprehensive test suite
3. **Documentation**: Interactive API documentation
4. **Monitoring**: Error tracking and performance metrics
5. **Backup**: Automated data backup systems

---

This documentation provides a comprehensive overview of the CentomoMD platform architecture, implementation details, and development guidelines. For specific implementation questions or feature requests, refer to the relevant source code sections or contact the development team.