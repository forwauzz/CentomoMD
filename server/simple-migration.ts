import { supabase } from './supabase-client';
import { db } from './db';
import { users, medicalForms, savedForms, genericForms, recentPatients } from '../shared/schema';

interface MigrationStep {
  phase: string;
  progress: number;
  error?: string;
  details: any;
  timestamp: string;
}

let migrationHistory: MigrationStep[] = [];

function logMigrationStep(phase: string, progress: number, details: any) {
  const step: MigrationStep = {
    phase,
    progress,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (details.error) {
    step.error = details.error;
  }
  
  migrationHistory.push(step);
  console.log(`Migration ${phase}: ${progress}%`, details);
}

export async function validateMigrationReadiness() {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check Supabase connection
  if (!supabase) {
    issues.push('Supabase not configured');
    recommendations.push('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  // Test database connection
  try {
    const result = await supabase?.from('users').select('count').limit(1);
    if (result?.error) {
      issues.push('Cannot connect to Supabase database');
      recommendations.push('Run the supabase-complete-setup.sql script in your Supabase dashboard');
    }
  } catch (error) {
    issues.push('Database connection failed');
    recommendations.push('Check your database URL and credentials');
  }

  // Check current database
  try {
    await db.select().from(users).limit(1);
  } catch (error) {
    issues.push('Cannot access current PostgreSQL database');
    recommendations.push('Check your DATABASE_URL connection');
  }

  return {
    ready: issues.length === 0,
    issues,
    recommendations
  };
}

export async function migrateUsers() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  logMigrationStep('user_migration', 0, { step: 'starting' });

  try {
    // Get current users
    const currentUsers = await db.select().from(users);
    logMigrationStep('user_migration', 25, { currentUsers: currentUsers.length });

    let migratedCount = 0;
    
    for (const user of currentUsers) {
      try {
        // Insert user directly into Supabase users table
        // Generate UUID for Supabase compatibility
        const { error } = await supabase
          .from('users')
          .upsert({
            // Convert existing TEXT id to UUID format or generate new one
            id: user.id, // Keep existing id for now, will handle UUID conversion later
            email: user.email,
            username: user.username,
            password_hash: user.passwordHash,
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            role: user.role,
            created_at: user.createdAt,
            updated_at: user.updatedAt
          });

        if (error) {
          console.warn(`Failed to migrate user ${user.email}:`, error);
        } else {
          migratedCount++;
        }
      } catch (error) {
        console.warn(`Error migrating user ${user.email}:`, error);
      }
    }

    logMigrationStep('user_migration', 100, { 
      migrated: migratedCount, 
      total: currentUsers.length 
    });

  } catch (error) {
    logMigrationStep('user_migration', 0, { error: String(error) });
    throw error;
  }
}

export async function migrateMedicalForms() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  logMigrationStep('forms_migration', 0, { step: 'starting' });

  try {
    // Get current medical forms
    const currentForms = await db.select().from(medicalForms);
    logMigrationStep('forms_migration', 25, { currentForms: currentForms.length });

    let migratedCount = 0;
    
    for (const form of currentForms) {
      try {
        // Map all form fields to match the complete database structure
        const supabaseForm = {
          // Map fields that exist in the form object
          antecedents_medicaux: (form as any).antecedentsMedicaux,
          antecedents_chirurgicaux: (form as any).antecedentsChirurgicaux,
          antecedents_lesion: (form as any).antecedentsLesion,
          antecedents_cnesst: (form as any).antecedentsCnesst,
          antecedents_saaq: (form as any).antecedentsSaaq,
          antecedents_autres: (form as any).antecedentsAutres,
          antecedents_allergie: (form as any).antecedentsAllergie,
          antecedents_tabac: (form as any).antecedentsTabac,
          antecedents_cannabis: (form as any).antecedentsCannabis,
          antecedents_alcool: (form as any).antecedentsAlcool,
          medication_actuelle: (form as any).medicationActuelle,
          historique_evolution: (form as any).historiqueEvolution,
          appreciation_evolution: (form as any).appreciationEvolution,
          plaintes_problemes: (form as any).plaintesproblemes,
          impact_avq: (form as any).impactAvq,
          examen_poids: (form as any).examenPoids,
          examen_taille: (form as any).examenTaille,
          examen_dominance: (form as any).examenDominance,
          observation_generale: (form as any).observationGenerale,
          patient_name: (form as any).patientName,
          age: (form as any).age,
          date_evaluation: (form as any).dateEvaluation,
          patient_gender: (form as any).patientGender,
          created_at: (form as any).createdAt,
          updated_at: (form as any).updatedAt
        };

        const { error } = await supabase
          .from('medical_forms')
          .upsert(supabaseForm);

        if (error) {
          console.warn(`Failed to migrate form ${form.id}:`, error);
        } else {
          migratedCount++;
        }
      } catch (error) {
        console.warn(`Error migrating form ${form.id}:`, error);
      }
    }

    logMigrationStep('forms_migration', 100, { 
      migrated: migratedCount, 
      total: currentForms.length 
    });

  } catch (error) {
    logMigrationStep('forms_migration', 0, { error: String(error) });
    throw error;
  }
}

export async function migrateSavedForms() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  logMigrationStep('saved_forms_migration', 0, { step: 'starting' });

  try {
    // Get current saved forms
    const currentSavedForms = await db.select().from(savedForms);
    logMigrationStep('saved_forms_migration', 25, { currentSavedForms: currentSavedForms.length });

    let migratedCount = 0;
    
    for (const savedForm of currentSavedForms) {
      try {
        const { error } = await supabase
          .from('saved_forms')
          .upsert({
            id: savedForm.id,
            user_id: savedForm.userId,
            form_name: (savedForm as any).title || `Form ${savedForm.id}`,
            form_data: savedForm.formData,
            patient_name: (savedForm as any).patientName || 'Unknown',
            form_type: savedForm.formType,
            is_template: (savedForm as any).isTemplate || false,
            created_at: savedForm.createdAt,
            updated_at: savedForm.updatedAt
          });

        if (error) {
          console.warn(`Failed to migrate saved form ${savedForm.id}:`, error);
        } else {
          migratedCount++;
        }
      } catch (error) {
        console.warn(`Error migrating saved form ${savedForm.id}:`, error);
      }
    }

    logMigrationStep('saved_forms_migration', 100, { 
      migrated: migratedCount, 
      total: currentSavedForms.length 
    });

  } catch (error) {
    logMigrationStep('saved_forms_migration', 0, { error: String(error) });
    throw error;
  }
}

export async function validateMigration() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  logMigrationStep('validation', 0, { step: 'starting' });

  try {
    // Get counts from both databases
    const [currentUsers, currentForms, currentSavedForms] = await Promise.all([
      db.select().from(users),
      db.select().from(medicalForms),
      db.select().from(savedForms)
    ]);

    const [supabaseUsers, supabaseForms, supabaseSavedForms] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('medical_forms').select('*'),
      supabase.from('saved_forms').select('*')
    ]);

    const validation = {
      users: {
        original: currentUsers.length,
        migrated: supabaseUsers.data?.length || 0,
        match: currentUsers.length === (supabaseUsers.data?.length || 0)
      },
      medicalForms: {
        original: currentForms.length,
        migrated: supabaseForms.data?.length || 0,
        match: currentForms.length === (supabaseForms.data?.length || 0)
      },
      savedForms: {
        original: currentSavedForms.length,
        migrated: supabaseSavedForms.data?.length || 0,
        match: currentSavedForms.length === (supabaseSavedForms.data?.length || 0)
      }
    };

    const allMatch = validation.users.match && validation.medicalForms.match && validation.savedForms.match;

    logMigrationStep('validation', 100, { 
      validation,
      valid: allMatch,
      issues: allMatch ? [] : ['Data count mismatch detected']
    });

    return {
      valid: allMatch,
      validation,
      issues: allMatch ? [] : ['Data count mismatch detected']
    };

  } catch (error) {
    logMigrationStep('validation', 0, { error: String(error) });
    throw error;
  }
}

export function getMigrationHistory() {
  return migrationHistory;
}

export async function performFullMigration() {
  try {
    logMigrationStep('full_migration', 0, { step: 'starting' });

    // Step 1: Migrate Users
    await migrateUsers();
    
    // Step 2: Migrate Medical Forms
    await migrateMedicalForms();
    
    // Step 3: Migrate Saved Forms
    await migrateSavedForms();
    
    // Step 4: Validate Migration
    const validation = await validateMigration();
    
    logMigrationStep('full_migration', 100, { 
      step: 'completed',
      validation: validation.valid,
      summary: 'Full migration completed successfully'
    });

    return { success: true, validation };

  } catch (error) {
    logMigrationStep('full_migration', 0, { 
      step: 'failed',
      error: String(error) 
    });
    throw error;
  }
}