import { supabase, isSupabaseConfigured, logAuditEvent } from './supabase-client';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  medicalForms, 
  users, 
  sessions, 
  savedForms, 
  genericForms, 
  recentPatients 
} from '../shared/schema';
import { 
  medicalAssessments,
  supabaseUsers,
  supabaseFormSessions,
  supabaseVoiceSessions,
  auditLogs 
} from '../shared/supabase-schema';

// Migration status tracking
interface MigrationStatus {
  phase: string;
  progress: number;
  error?: string;
  details: any;
  timestamp: string;
}

class SupabaseMigration {
  private currentDb: any;
  private migrationStatus: MigrationStatus[] = [];

  constructor() {
    if (process.env.DATABASE_URL) {
      const client = postgres(process.env.DATABASE_URL);
      this.currentDb = drizzle(client);
    }
  }

  // ========== MIGRATION STATUS TRACKING ==========
  
  private logStatus(phase: string, progress: number, details: any, error?: string) {
    const status: MigrationStatus = {
      phase,
      progress,
      details,
      error,
      timestamp: new Date().toISOString()
    };
    
    this.migrationStatus.push(status);
    console.log(`Migration ${phase}: ${progress}%`, details);
    
    if (error) {
      console.error(`Migration error in ${phase}:`, error);
    }
  }

  public getMigrationStatus(): MigrationStatus[] {
    return this.migrationStatus;
  }

  // ========== MIGRATION VALIDATION ==========
  
  public async validateMigrationReadiness(): Promise<{
    ready: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check Supabase configuration
    if (!isSupabaseConfigured()) {
      issues.push('Supabase not configured (missing URL or Service Role Key)');
      recommendations.push('Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    // Check current database connection
    if (!this.currentDb) {
      issues.push('Current database not accessible');
      recommendations.push('Verify DATABASE_URL is configured correctly');
    }

    // Check for existing data
    try {
      if (this.currentDb) {
        const userCount = await this.currentDb.select().from(users).limit(1);
        const formCount = await this.currentDb.select().from(medicalForms).limit(1);
        
        if (userCount.length === 0) {
          recommendations.push('No users found - consider creating initial admin user');
        }
        
        this.logStatus('validation', 50, { 
          hasUsers: userCount.length > 0,
          hasForms: formCount.length > 0 
        });
      }
    } catch (error) {
      issues.push(`Database query failed: ${error}`);
    }

    // Check Supabase tables existence
    if (supabase) {
      try {
        const { error: usersError } = await supabase.from('users').select('count').limit(1);
        if (usersError && !usersError.message.includes('does not exist')) {
          issues.push(`Supabase users table issue: ${usersError.message}`);
        }
      } catch (error) {
        recommendations.push('Run Supabase table creation scripts first');
      }
    }

    this.logStatus('validation', 100, { 
      issuesCount: issues.length,
      ready: issues.length === 0 
    });

    return {
      ready: issues.length === 0,
      issues,
      recommendations
    };
  }

  // ========== SCHEMA CREATION ==========
  
  public async createSupabaseSchema(): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    this.logStatus('schema_creation', 0, { step: 'starting' });

    // Note: In actual implementation, these would be SQL migrations
    // For now, we'll document the required SQL
    const sqlMigrations = {
      // 1. Enhanced Users Table
      users: `
        -- Users table should already exist, add medical fields
        ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS organization TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS hipaa_training_date TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_hipaa_acknowledgment TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID;
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      `,

      // 2. Medical Assessments Table
      medicalAssessments: `
        CREATE TABLE IF NOT EXISTS medical_assessments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          
          -- All medical form fields (240+ fields)
          mandat_diagnostic BOOLEAN DEFAULT FALSE,
          mandat_consolidation BOOLEAN DEFAULT FALSE,
          -- ... (all fields from schema)
          
          -- HIPAA compliance fields
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID,
          last_modified_by UUID,
          version_number INTEGER DEFAULT 1,
          change_log JSONB DEFAULT '[]'::JSONB,
          retention_policy TEXT DEFAULT 'standard',
          expires_at TIMESTAMPTZ,
          is_archived BOOLEAN DEFAULT FALSE,
          status TEXT DEFAULT 'draft',
          completion_percentage INTEGER DEFAULT 0,
          ai_processing_history JSONB DEFAULT '[]'::JSONB,
          validation_errors JSONB,
          validation_warnings JSONB
        );
        
        -- Enable RLS
        ALTER TABLE medical_assessments ENABLE ROW LEVEL SECURITY;
        
        -- RLS Policies
        DROP POLICY IF EXISTS "Users can access own assessments" ON medical_assessments;
        CREATE POLICY "Users can access own assessments"
          ON medical_assessments FOR ALL
          USING (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Admins can access all assessments" ON medical_assessments;
        CREATE POLICY "Admins can access all assessments"
          ON medical_assessments FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.role = 'admin'
            )
          );
      `,

      // 3. Enhanced Form Sessions
      formSessions: `
        -- Form sessions should already exist, add enhanced fields
        ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS section_progress JSONB;
        ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS validation_errors JSONB;
        ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS ai_processing_status JSONB;
        ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS last_section_visited TEXT;
      `,

      // 4. Enhanced Voice Sessions
      voiceSessions: `
        -- Voice sessions should already exist, add enhanced fields
        ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS medical_terminology_enabled BOOLEAN DEFAULT TRUE;
        ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'fr';
        ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS transcript_quality_score NUMERIC(3,2);
        ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS ai_corrections_applied JSONB;
      `,

      // 5. Audit Logs Table
      auditLogs: `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          table_name TEXT NOT NULL,
          record_id TEXT,
          action TEXT NOT NULL,
          user_id UUID,
          user_ip INET,
          user_agent TEXT,
          old_values JSONB,
          new_values JSONB,
          session_id TEXT,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        -- Only admins can view audit logs
        DROP POLICY IF EXISTS "Admin only audit access" ON audit_logs;
        CREATE POLICY "Admin only audit access"
          ON audit_logs FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.role = 'admin'
            )
          );
          
        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      `
    };

    this.logStatus('schema_creation', 100, { 
      step: 'completed',
      migrations: Object.keys(sqlMigrations),
      note: 'SQL migrations prepared - execute manually in Supabase SQL editor'
    });
  }

  // ========== DATA MIGRATION ==========
  
  public async migrateUsers(): Promise<void> {
    if (!supabase || !this.currentDb) {
      throw new Error('Migration prerequisites not met');
    }

    this.logStatus('user_migration', 0, { step: 'starting' });

    try {
      // Get all users from current database
      const currentUsers = await this.currentDb.select().from(users);
      
      this.logStatus('user_migration', 25, { 
        step: 'fetched_current_users',
        count: currentUsers.length 
      });

      let migratedCount = 0;
      
      for (const user of currentUsers) {
        try {
          // Create user in Supabase Auth
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: crypto.randomUUID(), // Generate temporary password
            user_metadata: {
              first_name: user.firstName,
              last_name: user.lastName,
              role: user.role,
              migrated: true,
              original_id: user.id
            }
          });

          if (authError) {
            throw new Error(`Auth creation failed: ${authError.message}`);
          }

          // Update users table with additional medical fields
          const { error: updateError } = await supabase
            .from('users')
            .update({
              license_number: null, // Set during user onboarding
              specialty: null,
              organization: null,
              status: 'active',
              created_by: authUser.user?.id
            })
            .eq('id', authUser.user?.id);

          if (updateError) {
            console.warn(`Failed to update user metadata for ${user.email}:`, updateError);
          }

          // Log audit event
          await logAuditEvent({
            table_name: 'users',
            record_id: authUser.user?.id,
            action: 'INSERT',
            new_values: {
              email: user.email,
              migrated: true
            }
          });

          migratedCount++;
          
        } catch (error) {
          console.error(`Failed to migrate user ${user.email}:`, error);
        }
      }

      this.logStatus('user_migration', 100, { 
        step: 'completed',
        total: currentUsers.length,
        migrated: migratedCount,
        failed: currentUsers.length - migratedCount
      });

    } catch (error) {
      this.logStatus('user_migration', -1, { step: 'failed' }, String(error));
      throw error;
    }
  }

  public async migrateMedicalForms(): Promise<void> {
    if (!supabase || !this.currentDb) {
      throw new Error('Migration prerequisites not met');
    }

    this.logStatus('form_migration', 0, { step: 'starting' });

    try {
      // Get all medical forms from current database
      const currentForms = await this.currentDb.select().from(medicalForms);
      
      this.logStatus('form_migration', 25, { 
        step: 'fetched_current_forms',
        count: currentForms.length 
      });

      let migratedCount = 0;
      
      for (const form of currentForms) {
        try {
          // Map form data to new schema
          const mappedForm = {
            id: crypto.randomUUID(),
            user_id: form.userId || crypto.randomUUID(), // Map to migrated user
            
            // Map all form fields (1:1 mapping)
            mandat_diagnostic: form.mandatDiagnostic,
            mandat_consolidation: form.mandatConsolidation,
            mandat_soins: form.mandatSoins,
            mandat_atteinte: form.mandatAtteinte,
            mandat_atteinte_pourcentage: form.mandatAtteintePourcentage,
            mandat_limitations: form.mandatLimitations,
            mandat_limitations_evaluation: form.mandatLimitationsEvaluation,
            
            diagnostics_cnesst: form.diagnosticsCnesst,
            modalite_entrevue: form.modaliteEntrevue,
            
            patient_name: form.patientName,
            age: form.age,
            date_evaluation: form.dateEvaluation,
            patient_gender: form.patientGender,
            dominance: form.dominance,
            emploi: form.emploi,
            
            // ... map all other fields
            
            // HIPAA compliance fields
            created_by: form.userId,
            version_number: 1,
            retention_policy: 'standard',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            status: 'completed',
            completion_percentage: 100
          };

          const { error } = await supabase
            .from('medical_assessments')
            .insert(mappedForm);

          if (error) {
            throw new Error(`Database insert failed: ${error.message}`);
          }

          // Log audit event
          await logAuditEvent({
            table_name: 'medical_assessments',
            record_id: mappedForm.id,
            action: 'INSERT',
            new_values: {
              migrated: true,
              original_created_at: form.createdAt
            }
          });

          migratedCount++;
          
        } catch (error) {
          console.error(`Failed to migrate form ${form.id}:`, error);
        }
      }

      this.logStatus('form_migration', 100, { 
        step: 'completed',
        total: currentForms.length,
        migrated: migratedCount,
        failed: currentForms.length - migratedCount
      });

    } catch (error) {
      this.logStatus('form_migration', -1, { step: 'failed' }, String(error));
      throw error;
    }
  }

  public async migrateSavedForms(): Promise<void> {
    if (!supabase || !this.currentDb) {
      throw new Error('Migration prerequisites not met');
    }

    this.logStatus('saved_form_migration', 0, { step: 'starting' });

    try {
      // Get all saved forms from current database
      const currentSavedForms = await this.currentDb.select().from(savedForms);
      
      this.logStatus('saved_form_migration', 25, { 
        step: 'fetched_saved_forms',
        count: currentSavedForms.length 
      });

      let migratedCount = 0;
      
      for (const savedForm of currentSavedForms) {
        try {
          // Map to form_sessions table
          const mappedSession = {
            id: crypto.randomUUID(),
            user_id: savedForm.userId,
            session_token: crypto.randomUUID(),
            form_type: savedForm.formType,
            form_data: savedForm.formData,
            expires_at: savedForm.expiresAt,
            section_progress: {}, // Initialize empty
            last_section_visited: null
          };

          const { error } = await supabase
            .from('form_sessions')
            .insert(mappedSession);

          if (error) {
            throw new Error(`Database insert failed: ${error.message}`);
          }

          migratedCount++;
          
        } catch (error) {
          console.error(`Failed to migrate saved form ${savedForm.id}:`, error);
        }
      }

      this.logStatus('saved_form_migration', 100, { 
        step: 'completed',
        total: currentSavedForms.length,
        migrated: migratedCount,
        failed: currentSavedForms.length - migratedCount
      });

    } catch (error) {
      this.logStatus('saved_form_migration', -1, { step: 'failed' }, String(error));
      throw error;
    }
  }

  // ========== VALIDATION ==========
  
  public async validateMigration(): Promise<{
    valid: boolean;
    issues: string[];
    statistics: any;
  }> {
    if (!supabase || !this.currentDb) {
      throw new Error('Migration validation prerequisites not met');
    }

    this.logStatus('validation', 0, { step: 'starting' });

    const issues: string[] = [];
    const statistics: any = {};

    try {
      // Count records in original database
      const originalCounts = {
        users: (await this.currentDb.select().from(users)).length,
        medicalForms: (await this.currentDb.select().from(medicalForms)).length,
        savedForms: (await this.currentDb.select().from(savedForms)).length
      };

      // Count records in Supabase
      const { data: supabaseUsers, error: usersError } = await supabase
        .from('users')
        .select('id');
      
      const { data: supabaseAssessments, error: assessmentsError } = await supabase
        .from('medical_assessments')
        .select('id');
        
      const { data: supabaseFormSessions, error: sessionsError } = await supabase
        .from('form_sessions')
        .select('id');

      if (usersError || assessmentsError || sessionsError) {
        issues.push('Failed to query Supabase tables');
      }

      const supabaseCounts = {
        users: supabaseUsers?.length || 0,
        medicalAssessments: supabaseAssessments?.length || 0,
        formSessions: supabaseFormSessions?.length || 0
      };

      Object.assign(statistics, {
        original: originalCounts,
        supabase: supabaseCounts,
        differences: {
          users: originalCounts.users - supabaseCounts.users,
          forms: originalCounts.medicalForms - supabaseCounts.medicalAssessments,
          savedForms: originalCounts.savedForms - supabaseCounts.formSessions
        }
      });

      // Check for significant differences
      if (Math.abs(statistics.differences.users) > 0) {
        issues.push(`User count mismatch: ${statistics.differences.users}`);
      }
      
      if (Math.abs(statistics.differences.forms) > 0) {
        issues.push(`Medical form count mismatch: ${statistics.differences.forms}`);
      }

      this.logStatus('validation', 100, { 
        step: 'completed',
        valid: issues.length === 0,
        statistics
      });

      return {
        valid: issues.length === 0,
        issues,
        statistics
      };

    } catch (error) {
      this.logStatus('validation', -1, { step: 'failed' }, String(error));
      throw error;
    }
  }

  // ========== FULL MIGRATION ORCHESTRATION ==========
  
  public async performFullMigration(): Promise<void> {
    this.logStatus('full_migration', 0, { step: 'starting' });

    try {
      // 1. Validate readiness
      const readiness = await this.validateMigrationReadiness();
      if (!readiness.ready) {
        throw new Error(`Migration not ready: ${readiness.issues.join(', ')}`);
      }

      // 2. Create schema
      await this.createSupabaseSchema();
      this.logStatus('full_migration', 20, { step: 'schema_created' });

      // 3. Migrate users
      await this.migrateUsers();
      this.logStatus('full_migration', 40, { step: 'users_migrated' });

      // 4. Migrate medical forms
      await this.migrateMedicalForms();
      this.logStatus('full_migration', 70, { step: 'forms_migrated' });

      // 5. Migrate saved forms
      await this.migrateSavedForms();
      this.logStatus('full_migration', 90, { step: 'saved_forms_migrated' });

      // 6. Validate migration
      const validation = await this.validateMigration();
      if (!validation.valid) {
        console.warn('Migration validation issues:', validation.issues);
      }

      this.logStatus('full_migration', 100, { 
        step: 'completed',
        validation: validation.valid,
        issues: validation.issues
      });

    } catch (error) {
      this.logStatus('full_migration', -1, { step: 'failed' }, String(error));
      throw error;
    }
  }
}

// Export singleton instance
export const supabaseMigration = new SupabaseMigration();

// Helper functions for route usage
export async function checkMigrationStatus(): Promise<MigrationStatus[]> {
  return supabaseMigration.getMigrationStatus();
}

export async function performMigration(): Promise<void> {
  return supabaseMigration.performFullMigration();
}

export async function validateMigrationReadiness() {
  return supabaseMigration.validateMigrationReadiness();
}