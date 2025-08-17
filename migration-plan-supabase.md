# CentomoMD Database Migration Plan: PostgreSQL to Supabase

## Overview
This document outlines the comprehensive migration strategy for moving the CentomoMD platform from the current PostgreSQL database to Supabase, ensuring HIPAA compliance and minimal downtime.

## Current State Analysis

### Current Database Schema (Drizzle ORM)
- **medical_forms**: Primary medical evaluation data (240+ fields)
- **users**: Authentication and user management
- **sessions**: Session-based authentication storage
- **saved_forms**: Temporary form storage with auto-expiration
- **generic_forms**: Generic form system for future scalability
- **recent_patients**: Patient tracking for quick access

### Supabase Schema (Discovered)
- **users**: User management with RLS policies
- **form_sessions**: Session management
- **voice_sessions**: Voice dictation sessions
- **admin_actions**: Administrative audit trail
- **ai_training_metrics**: AI performance tracking

## Migration Strategy

### Phase 1: Infrastructure Setup & HIPAA Compliance

#### 1.1 Supabase Configuration
- **Enable Row Level Security (RLS)** on all tables
- **Configure Business Associate Agreement (BAA)** with Supabase
- **Set up database encryption** at rest and in transit
- **Configure audit logging** for all database operations
- **Implement data retention policies** (365 days default)

#### 1.2 Environment Variables Migration
```bash
# Current
DATABASE_URL=postgresql://...

# New Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
```

#### 1.3 Dependencies Update
```json
{
  "add": [
    "@supabase/supabase-js",
    "@supabase/auth-helpers-nextjs"
  ],
  "update": [
    "drizzle-orm" // Ensure Supabase compatibility
  ]
}
```

### Phase 2: Schema Migration

#### 2.1 Core Medical Forms Table
**Target**: Migrate medical_forms → medical_assessments

```sql
-- Supabase schema creation
CREATE TABLE medical_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Section 1: Mandat de l'évaluation
  mandat_diagnostic BOOLEAN DEFAULT FALSE,
  mandat_consolidation BOOLEAN DEFAULT FALSE,
  mandat_soins BOOLEAN DEFAULT FALSE,
  mandat_atteinte BOOLEAN DEFAULT FALSE,
  mandat_atteinte_pourcentage BOOLEAN DEFAULT FALSE,
  mandat_limitations BOOLEAN DEFAULT FALSE,
  mandat_limitations_evaluation BOOLEAN DEFAULT FALSE,
  
  -- Section 2-11: All medical form fields
  diagnostics_cnesst TEXT,
  modalite_entrevue TEXT,
  patient_name TEXT,
  age TEXT,
  -- ... (all 240+ fields mapped)
  
  -- HIPAA Compliance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id),
  
  -- Audit trail
  version_number INTEGER DEFAULT 1,
  change_log JSONB DEFAULT '[]'::JSONB,
  
  -- Data retention
  retention_policy TEXT DEFAULT 'standard',
  expires_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE medical_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own assessments"
  ON medical_assessments FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can access all assessments"
  ON medical_assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

#### 2.2 Enhanced User Management
**Target**: Extend existing users table

```sql
-- Add medical-specific user fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hipaa_training_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_hipaa_acknowledgment TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
```

#### 2.3 Voice Sessions Enhancement
**Target**: Utilize existing voice_sessions table

```sql
-- Add medical context to voice sessions
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS medical_terminology_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'fr';
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS transcript_quality_score NUMERIC(3,2);
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS ai_corrections_applied JSONB;
```

#### 2.4 Form Sessions for Auto-Save
**Target**: Enhance existing form_sessions table

```sql
-- Extend form sessions for medical forms
ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS section_progress JSONB;
ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS validation_errors JSONB;
ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS ai_processing_status JSONB;
ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS last_section_visited TEXT;
```

### Phase 3: HIPAA Compliance Implementation

#### 3.1 Audit Trail System
```sql
-- Create comprehensive audit trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
  user_id UUID REFERENCES auth.users(id),
  user_ip INET,
  user_agent TEXT,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admin only audit access"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

#### 3.2 Data Encryption & Security
```sql
-- Create function for PHI encryption
CREATE OR REPLACE FUNCTION encrypt_phi(data TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use Supabase's built-in encryption
  RETURN encode(encrypt(data::bytea, 'encryption_key', 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for PHI decryption
CREATE OR REPLACE FUNCTION decrypt_phi(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), 'encryption_key', 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3.3 Data Retention Policies
```sql
-- Automated data cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Archive expired medical assessments
  UPDATE medical_assessments 
  SET is_archived = true 
  WHERE expires_at < NOW() 
  AND is_archived = false;
  
  -- Delete old form sessions
  DELETE FROM form_sessions 
  WHERE expires_at < NOW();
  
  -- Delete old voice sessions
  DELETE FROM voice_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension)
SELECT cron.schedule('cleanup-expired-data', '0 2 * * *', 'SELECT cleanup_expired_data();');
```

### Phase 4: Application Code Migration

#### 4.1 Database Connection Update
```typescript
// server/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

#### 4.2 Drizzle Schema Update
```typescript
// shared/supabase-schema.ts
import { pgTable, text, uuid, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const medicalAssessments = pgTable("medical_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  
  // All medical form fields mapped to new schema
  mandatDiagnostic: boolean("mandat_diagnostic").default(false),
  // ... rest of fields
  
  // HIPAA compliance fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by"),
  lastModifiedBy: uuid("last_modified_by"),
  versionNumber: integer("version_number").default(1),
  changeLog: jsonb("change_log"),
  retentionPolicy: text("retention_policy").default("standard"),
  expiresAt: timestamp("expires_at"),
  isArchived: boolean("is_archived").default(false),
});
```

#### 4.3 API Routes Migration
```typescript
// server/routes/medical-forms.ts
import { supabase } from '../supabase-client';

export async function createMedicalForm(formData: any, userId: string) {
  // Add audit trail
  const auditData = {
    table_name: 'medical_assessments',
    action: 'INSERT',
    user_id: userId,
    new_values: formData,
    timestamp: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('medical_assessments')
    .insert({
      ...formData,
      user_id: userId,
      created_by: userId,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    })
    .select()
    .single();
    
  // Log audit trail
  await supabase.from('audit_logs').insert(auditData);
  
  return { data, error };
}
```

### Phase 5: Data Migration Process

#### 5.1 Migration Script
```typescript
// scripts/migrate-to-supabase.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { supabase } from '../server/supabase-client';

export async function migrateData() {
  const oldDb = drizzle(new Client({ connectionString: process.env.OLD_DATABASE_URL }));
  
  // 1. Migrate users
  const users = await oldDb.select().from(oldUsers);
  for (const user of users) {
    await supabase.auth.admin.createUser({
      email: user.email,
      password: 'temporary-password', // Force password reset
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        migrated: true
      }
    });
  }
  
  // 2. Migrate medical forms
  const forms = await oldDb.select().from(oldMedicalForms);
  for (const form of forms) {
    await supabase.from('medical_assessments').insert({
      ...form,
      id: crypto.randomUUID(),
      user_id: form.userId, // Map to new user ID
      created_by: form.userId,
      version_number: 1,
      retention_policy: 'standard',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
  }
  
  // 3. Migrate saved forms to form_sessions
  const savedForms = await oldDb.select().from(oldSavedForms);
  for (const saved of savedForms) {
    await supabase.from('form_sessions').insert({
      id: crypto.randomUUID(),
      user_id: saved.userId,
      session_token: crypto.randomUUID(),
      form_type: saved.formType,
      form_data: saved.formData,
      expires_at: saved.expiresAt
    });
  }
}
```

#### 5.2 Data Validation
```typescript
export async function validateMigration() {
  // Count records
  const oldCounts = await getOldDatabaseCounts();
  const newCounts = await getSupabaseCounts();
  
  // Verify data integrity
  const sampleVerification = await verifySampleRecords();
  
  return {
    recordCounts: {
      old: oldCounts,
      new: newCounts,
      match: JSON.stringify(oldCounts) === JSON.stringify(newCounts)
    },
    dataIntegrity: sampleVerification
  };
}
```

### Phase 6: Testing & Validation

#### 6.1 HIPAA Compliance Testing
- **Access Control**: Verify RLS policies prevent unauthorized access
- **Audit Trail**: Confirm all operations are logged
- **Data Encryption**: Test PHI encryption/decryption
- **Data Retention**: Validate automatic cleanup processes
- **User Authentication**: Test secure authentication flows

#### 6.2 Performance Testing
- **Load Testing**: Simulate concurrent medical form submissions
- **Query Performance**: Optimize complex medical data queries
- **Voice Processing**: Test real-time voice transcription
- **AI Integration**: Validate OpenAI API integration

#### 6.3 Functional Testing
- **Medical Form Workflows**: Complete end-to-end form submissions
- **Voice Dictation**: Test multilingual voice processing
- **Auto-save**: Validate form session management
- **PDF Generation**: Test medical report exports

### Phase 7: Deployment Strategy

#### 7.1 Migration Timeline
1. **Week 1**: Infrastructure setup and schema creation
2. **Week 2**: Application code migration and testing
3. **Week 3**: Data migration and validation
4. **Week 4**: User acceptance testing and training
5. **Week 5**: Production deployment

#### 7.2 Rollback Plan
- **Database Snapshots**: Create point-in-time backups
- **Application Rollback**: Maintain current system during transition
- **DNS Switching**: Quick traffic redirection capability
- **Data Sync**: Bidirectional sync during transition period

### Phase 8: HIPAA Compliance Certification

#### 8.1 Required Documentation
- **Risk Assessment**: Complete HIPAA risk analysis
- **Business Associate Agreement**: Signed agreement with Supabase
- **Security Policies**: Updated data handling procedures
- **Employee Training**: HIPAA training completion records
- **Incident Response Plan**: Data breach response procedures

#### 8.2 Compliance Monitoring
- **Regular Audits**: Monthly access log reviews
- **Vulnerability Scanning**: Automated security assessments
- **Penetration Testing**: Annual security testing
- **Compliance Reporting**: Quarterly compliance reports

## Risk Assessment

### High Risk
- **Data Loss**: Implement comprehensive backup strategy
- **Downtime**: Plan for zero-downtime migration
- **Compliance Violation**: Extensive HIPAA testing

### Medium Risk
- **Performance Degradation**: Load testing and optimization
- **User Training**: Comprehensive training program
- **Integration Issues**: Thorough API testing

### Low Risk
- **Minor UI Changes**: User interface adjustments
- **Configuration Updates**: Environment variable changes

## Success Criteria

1. **Zero Data Loss**: 100% data migration verification
2. **HIPAA Compliance**: All requirements met and documented
3. **Performance**: <2 second response times maintained
4. **User Adoption**: 95% user satisfaction rate
5. **Security**: Zero security incidents during migration

## Next Steps

1. **Obtain Supabase BAA**: Execute Business Associate Agreement
2. **Environment Setup**: Configure Supabase project with HIPAA settings
3. **Schema Implementation**: Create all required tables and policies
4. **Code Migration**: Update application to use Supabase
5. **Testing Phase**: Comprehensive testing of all functionality
6. **Data Migration**: Execute migration with validation
7. **Go-Live**: Production deployment with monitoring

## Cost Considerations

### Supabase Pricing
- **Pro Plan**: $25/month per project
- **Database Add-ons**: Additional compute as needed
- **Storage**: $0.125/GB per month
- **Bandwidth**: $0.09/GB

### Migration Costs
- **Development Time**: ~120 hours estimated
- **Testing Resources**: Load testing tools and environments
- **Training**: User training and documentation updates
- **Compliance**: HIPAA assessment and certification

This migration plan ensures a secure, compliant, and efficient transition to Supabase while maintaining the high standards required for medical data handling in Quebec's CNESST system.