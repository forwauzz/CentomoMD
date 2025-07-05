# CentomoMD - Complete System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [User Workflows](#user-workflows)
5. [AI Processing Capabilities](#ai-processing-capabilities)
6. [Voice Dictation System](#voice-dictation-system)
7. [Form Management](#form-management)
8. [Authentication & Security](#authentication--security)
9. [Current Status](#current-status)
10. [Known Issues](#known-issues)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## System Overview

**CentomoMD** is a comprehensive digital medical evaluation platform designed specifically for Quebec medical assessments following CNESST (Commission des normes, de l'équité, de la santé et de la sécurité du travail) standards. The platform digitizes the MI Template medical assessment form with AI-enhanced documentation capabilities.

### Key Purpose
- Streamline medical evaluation processes for Quebec healthcare professionals
- Provide AI-powered medical text formatting according to Quebec standards
- Enable voice dictation with medical terminology recognition
- Generate professional medical reports compliant with CNESST requirements

---

## Core Features

### ✅ **Working Features**

#### 1. **Digital Medical Forms**
- **MI Template Form**: Complete digital replica of medical assessment documents
- **11 Structured Sections**: From patient identification to medical conclusions
- **Real-time Validation**: Zod schema validation for data integrity
- **Auto-save**: Automatic form data persistence to prevent data loss
- **Responsive Design**: Works on desktop, tablet, and mobile devices

#### 2. **AI-Powered Text Processing**
- **Section 7 Formatting**: "Historique de faits et évolution" professional formatting
- **Section 8 Distribution**: Single input automatically distributed to multiple subsections
- **Section 11 Generation**: AI-generated medical conclusions based on form data
- **Medical Terminology Correction**: Automatic correction of common medical terms
- **Quebec Standards Compliance**: Follows CNESST medical report requirements

#### 3. **Voice Dictation System**
- **Floating Record Button**: Available on every form field
- **Dedicated Dictation Page**: Comprehensive voice-to-text editing interface
- **Medical Enhancement**: AI-powered transcript improvement
- **Bilingual Support**: French (fr-CA) and English (en-US) recognition
- **Real-time Transcript**: Live display of speech recognition results
- **Voice Error Correction**: Automatic fixing of common dictation errors

#### 4. **Form Management**
- **Save Draft**: Temporary storage with configurable retention periods
- **Save Copy**: Permanent form copies for reference
- **User-Specific Storage**: Forms tied to authenticated user accounts
- **Form History**: Access to previously saved forms
- **Export Functionality**: Browser-based print/PDF generation

#### 5. **User Authentication**
- **Secure Login System**: Username/password authentication
- **Session Management**: Express-session with PostgreSQL storage
- **Role-based Access**: Admin and user role distinctions
- **Password Security**: bcrypt hashing with salt rounds

### 🔧 **Technical Infrastructure**

#### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **Wouter** for client-side routing
- **React Query** for server state management
- **React Hook Form** for form state management

#### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **OpenAI API** integration for AI processing
- **Session-based authentication**
- **RESTful API design**

#### Database Schema
- **medical_forms**: Legacy form storage
- **generic_forms**: Modular form system (Phase 1 Complete)
- **saved_forms**: User form persistence
- **users**: User authentication and management
- **sessions**: Session storage

---

## User Workflows

### 1. **Login & Authentication**
```
User Access → Login Page → Username/Password → Dashboard
```
- Secure session creation
- Role-based access control
- Automatic session management

### 2. **Form Creation Workflow**
```
Dashboard → New Form → Fill Sections → AI Enhancement → Save → Export
```
- Progressive form completion
- Section-by-section navigation
- Real-time validation
- Auto-save functionality

### 3. **Voice Dictation Workflow**
```
Form Field → Record Button → Speech Recognition → AI Enhancement → Save to Section
```
- **FIXED**: Production-ready with multi-layer persistence
- Floating record button on every field
- Real-time transcript display
- Medical terminology correction
- Seamless integration with form fields

### 4. **AI Processing Workflow**
```
Raw Text → "Format with AI" Button → OpenAI Processing → Formatted Result
```
- Medical text standardization
- Quebec terminology compliance
- Professional report formatting
- Voice recognition error correction

---

## AI Processing Capabilities

### **Section 7: Historique de faits et évolution**
- **Chronological Organization**: Dates formatted as "le [jour] [mois] [année]"
- **Professional Terminology**: "travailleur/travailleuse" instead of "patient"
- **Medical Context**: Proper medical report structure
- **Quote Preservation**: Maintains exact citations in French format « ... »

### **Section 8: Examination Distribution**
- **Smart Distribution**: Single input distributed to multiple examination fields
- **Contextual Processing**: AI understands medical examination context
- **Structured Output**: Organized by examination categories

### **Section 11: Medical Conclusions**
- **Comprehensive Analysis**: Based on complete form data
- **Professional Format**: Following Quebec medical standards
- **Evidence-based**: Uses information from all form sections

### **Voice Recognition Enhancement**
- **Common Corrections**: "docter" → "docteur", "patient" → "travailleur"
- **Medical Terms**: "supra épineu" → "supra-épineux"
- **Treatment Terms**: "infiltration cortisone" → "infiltration cortisonée"
- **Examination Terms**: "I.R.M" → "IRM", "E.M.G" → "EMG"

---

## Voice Dictation System

### **Features**
- **Real-time Recognition**: Live transcript display
- **Medical Terminology**: Specialized vocabulary recognition
- **Error Correction**: Automatic fixing of common dictation mistakes
- **Bilingual Support**: French and English recognition
- **Production-Ready**: Multi-layer persistence system

### **Recent Fixes Applied**
- **✅ Text Persistence**: Fixed production issue where text would disappear
- **✅ Multi-layer Storage**: SessionStorage + localStorage backup
- **✅ Fallback Recovery**: Backup data recovery with timestamp validation
- **✅ Race Condition**: Eliminated production race conditions

### **Usage**
1. Click floating record button on any form field
2. Speak clearly in French or English
3. View real-time transcript
4. AI enhances medical terminology
5. Save to form field with one click

---

## Form Management

### **Save Options**
- **Save Draft**: Temporary storage (7 days default)
- **Save Copy**: Permanent reference copy
- **Auto-save**: Automatic localStorage backup every 30 seconds

### **Form History**
- User-specific form storage
- Title-based organization
- Retention period management
- Automatic cleanup of expired forms

### **Export Options**
- **Print/PDF**: Browser-based export
- **Professional Format**: Quebec medical report standards
- **Complete Form**: All sections included

---

## Authentication & Security

### **User Management**
- **Secure Password Storage**: bcrypt hashing
- **Session Management**: PostgreSQL session store
- **Role-based Access**: Admin and user permissions
- **Automatic Logout**: Session timeout protection

### **Data Security**
- **Encrypted Sessions**: Secure session data
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Proper cross-origin settings

---

## Current Status

### **✅ Fully Working**
- Medical form digital replica (MI Template)
- AI-powered text formatting for all sections
- Voice dictation with medical enhancement
- User authentication and session management
- Form saving and retrieval
- Export functionality
- Production-ready deployment

### **✅ Recently Fixed**
- Voice dictation text persistence in production
- Copy button page refresh issue
- Production race conditions
- Multi-browser compatibility
- Session storage reliability

### **🔄 Phase 1 Complete - Modular Architecture**
- Dynamic form configuration system
- Generic database schema
- Form registry management
- Universal field rendering
- AI processing abstraction

---

## Known Issues

### **⚠️ Minor Issues**
1. **Browserslist Warning**: Outdated browser data (cosmetic, doesn't affect functionality)
2. **Development Warnings**: Some TypeScript strict mode warnings (non-breaking)

### **📋 Enhancement Opportunities**
1. **Offline Mode**: Add offline form editing capabilities
2. **Advanced Export**: Multiple export formats (Word, structured data)
3. **Form Templates**: Pre-filled form templates for common cases
4. **Advanced AI**: More sophisticated medical analysis
5. **Multi-language**: Extended language support beyond French/English

---

## Troubleshooting Guide

### **Voice Dictation Issues**
- **Problem**: No sound recognition
- **Solution**: Check browser microphone permissions
- **Problem**: Poor recognition quality
- **Solution**: Speak clearly, reduce background noise

### **AI Processing Issues**
- **Problem**: "Format with AI" not working
- **Solution**: Check OpenAI API key configuration
- **Problem**: Poor formatting results
- **Solution**: Ensure input text has sufficient medical context

### **Form Saving Issues**
- **Problem**: Form not saving
- **Solution**: Check login status, refresh page
- **Problem**: Data lost on refresh
- **Solution**: Auto-save to localStorage should restore data

### **Login Issues**
- **Problem**: Cannot login
- **Solution**: Check credentials, contact administrator
- **Problem**: Session expired
- **Solution**: Login again, session will restore

---

## API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### **Forms**
- `GET /api/saved-forms` - List user forms
- `POST /api/saved-forms` - Save new form
- `GET /api/saved-forms/:id` - Get specific form
- `DELETE /api/saved-forms/:id` - Delete form

### **AI Processing**
- `POST /api/format-section7` - Format Section 7 text
- `POST /api/format-section8` - Format Section 8 text
- `POST /api/generate-section11` - Generate Section 11
- `POST /api/ai/enhance-section7-dictation` - Enhance voice dictation

---

## Environment Variables

### **Required**
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API access token

### **Optional**
- `SESSION_SECRET` - Session encryption key (auto-generated if missing)
- `NODE_ENV` - Environment mode (development/production)

---

## Deployment

### **Current Setup**
- **Platform**: Replit with autoscale deployment
- **Database**: PostgreSQL 16 with Neon serverless
- **Build**: Vite for frontend, esbuild for backend
- **Port**: 5000 (configurable)

### **Deployment Command**
```bash
npm run build  # Build for production
npm run dev    # Development server
npm run db:push # Database migration
```

---

## Support & Maintenance

### **Regular Maintenance**
- Database cleanup (expired forms)
- Session management
- Security updates
- Performance monitoring

### **Monitoring**
- Application logs
- Database performance
- API response times
- User activity tracking

---

*Document Generated: January 2025*
*Version: 1.0*
*Platform: CentomoMD Medical Evaluation System*