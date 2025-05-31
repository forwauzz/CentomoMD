# CentomoMD - Medical Evaluation Platform Code Audit

## Project Overview

CentomoMD is a digital medical evaluation platform designed to streamline CNESST medical assessments through AI-enhanced documentation and intelligent form generation. The platform replicates the exact layout of French medical evaluation documents with advanced voice-to-text capabilities and AI-powered content distribution.

## Technology Stack

- **Frontend**: TypeScript React with Vite
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4o for text formatting and content distribution
- **Authentication**: Custom session-based authentication
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Voice Recognition**: Web Speech API with medical terminology enhancement

## Key Features

### 1. Medical Form Replication
- Exact digital replica of CNESST medical assessment documents
- Sections 1-4: Static display content
- Sections 5-11: Combination of static and editable fields
- Bilingual support (French/English)

### 2. Advanced Voice Dictation
- Direct dictation into text fields via floating record button
- Dedicated dictation page for comprehensive text editing
- AI-powered voice transcript enhancement
- Medical terminology recognition and correction

### 3. AI-Powered Content Distribution
- Section 7: AI formatting for medical history and evolution
- Section 8: Single input field with AI distribution to three subsections
- Section 11: AI-generated conclusions based on form data
- Context-aware content parsing and organization

### 4. Data Management
- Form auto-save functionality
- User-specific form storage with configurable retention
- Export to PDF functionality
- Secure user authentication with role-based access

## Architecture Overview

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/           # Utility functions and configurations
├── server/                 # Express.js backend
│   ├── ai-formatter.ts     # OpenAI integration for text formatting
│   ├── auth.ts            # Authentication utilities
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API route definitions
│   └── storage.ts         # Data access layer
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema definitions
```

## Database Schema

### Core Tables
- `users`: User management with role-based access
- `medical_forms`: Main medical evaluation forms
- `saved_forms`: User-saved forms with retention management
- `sessions`: Session management for authentication

### Key Fields in Medical Forms
- Patient identification and demographics
- Medical history (various categories)
- Current medication and treatments
- Subjective questionnaire responses
- Physical examination results
- Conclusions and assessments

## AI Integration Points

### 1. Section 7 Enhancement (`historiqueEvolution`)
- Formats medical history according to Quebec standards
- Structures chronological evolution of patient condition
- Enhances dictated content with proper medical terminology

### 2. Section 8 Distribution (`section8Input`)
- Single global input field for comprehensive patient information
- AI parsing and distribution to three subsections:
  - Subjective appreciation of evolution
  - Complaints and problems
  - Impact on daily activities

### 3. Section 11 Generation
- Automatically generates medical conclusions
- Creates diagnostic summaries
- Determines consolidation dates and treatment recommendations
- Assesses permanent impairments and functional limitations

## Security Features

- Session-based authentication with secure cookies
- Role-based access control (user/admin)
- Password hashing with bcrypt
- Database connection security
- Form data retention policies

## Development Guidelines

### Code Organization
- Modular component architecture
- Separation of concerns between frontend/backend
- Type safety with TypeScript throughout
- Consistent error handling and logging

### AI Integration Standards
- OpenAI GPT-4o model usage
- JSON response format for structured data
- Error fallbacks to preserve original content
- Temperature settings optimized for medical accuracy

### Database Operations
- Drizzle ORM for type-safe database operations
- Automated migrations via `npm run db:push`
- Proper indexing for performance
- Data validation at schema level

## File Structure Details

### Frontend Components
- `medical-form.tsx`: Main form with all sections
- `dictation-page.tsx`: Dedicated voice input interface
- `ai-format-section7.tsx`: AI formatting for section 7
- `ai-format-section8.tsx`: AI formatting for section 8
- `floating-record-button.tsx`: Voice input controls
- Various UI components for form elements

### Backend Services
- `ai-formatter.ts`: OpenAI integration and text processing
- `storage.ts`: Data access layer with comprehensive CRUD operations
- `auth.ts`: Authentication and authorization utilities
- `routes.ts`: API endpoints for all application features

### Shared Resources
- `schema.ts`: Complete database schema with types
- Type definitions for all data structures
- Validation schemas using Zod

## Configuration Requirements

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API access
- `SESSION_SECRET`: Session encryption key
- Various database connection parameters

### Build Process
- Vite for frontend bundling
- TypeScript compilation
- Tailwind CSS processing
- Development server with hot reload

## Usage Patterns

### Form Workflow
1. User authentication and access control
2. Form creation or loading from saved state
3. Section-by-section completion with voice/text input
4. AI-powered content enhancement and distribution
5. Final review and PDF export
6. Optional saving with retention policies

### Voice Dictation Workflow
1. Section selection from dropdown
2. Voice recording with real-time transcript
3. AI enhancement of dictated content
4. Content distribution to appropriate form fields
5. Manual editing capabilities for fine-tuning

## Performance Considerations

- Lazy loading of form sections
- Debounced auto-save functionality
- Optimized database queries with proper indexing
- Efficient AI API usage with error handling
- Client-side caching for improved responsiveness

## Deployment Architecture

- Single-server deployment with integrated frontend/backend
- PostgreSQL database with connection pooling
- Static asset serving via Express
- Production build optimization
- Health check endpoints for monitoring

## Future Enhancement Opportunities

- Multi-language expansion beyond French/English
- Advanced analytics and reporting features
- Integration with external medical systems
- Enhanced AI models for specialized medical domains
- Mobile application development
- Real-time collaboration features

## Code Quality Standards

- Comprehensive TypeScript typing
- Consistent error handling patterns
- Modular component design
- Clear separation of business logic
- Extensive validation at all data entry points
- Proper logging for debugging and monitoring

This platform represents a sophisticated integration of modern web technologies with AI capabilities, specifically designed for medical documentation workflows in the Quebec healthcare system.