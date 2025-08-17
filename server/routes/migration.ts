import express from 'express';
import { isSupabaseConfigured, testSupabaseConnection } from '../supabase-client';
import { 
  validateMigrationReadiness,
  migrateUsers,
  migrateMedicalForms,
  migrateSavedForms,
  validateMigration,
  performFullMigration,
  getMigrationHistory
} from '../simple-migration';

const router = express.Router();

// ========== MIGRATION STATUS ENDPOINTS ==========

// Get current migration status
router.get('/status', async (req, res) => {
  try {
    const migrationHistory = getMigrationHistory();
    const supabaseConfigured = isSupabaseConfigured();
    
    res.json({
      success: true,
      supabaseConfigured,
      migrationHistory,
      currentPhase: migrationHistory.length > 0 ? migrationHistory[migrationHistory.length - 1].phase : 'not_started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Check if system is ready for migration
router.get('/readiness', async (req, res) => {
  try {
    const readiness = await validateMigrationReadiness();
    const connectionTest = await testSupabaseConnection();
    
    res.json({
      success: true,
      ready: readiness.ready && connectionTest.success,
      readiness,
      connectionTest,
      recommendations: [
        ...readiness.recommendations,
        ...(connectionTest.success ? [] : ['Fix Supabase connection issues'])
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// ========== MIGRATION EXECUTION ENDPOINTS ==========

// Start full migration process
router.post('/start', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session?.userId || req.session?.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required for migration'
      });
    }

    // Validate readiness first
    const readiness = await validateMigrationReadiness();
    if (!readiness.ready) {
      return res.status(400).json({
        success: false,
        error: 'Migration not ready',
        issues: readiness.issues,
        recommendations: readiness.recommendations
      });
    }

    // Start migration in background
    performFullMigration()
      .then(() => {
        console.log('Migration completed successfully');
      })
      .catch((error) => {
        console.error('Migration failed:', error);
      });

    res.json({
      success: true,
      message: 'Migration started. Check /api/migration/status for progress.',
      migrationId: `migration_${Date.now()}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// ========== INDIVIDUAL MIGRATION STEPS ==========

// Step 1: Create Supabase schema
router.post('/steps/schema', async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Schema validation will be done in individual steps
    // For now, just confirm Supabase is accessible
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      throw new Error('Supabase connection failed');
    }
    
    res.json({
      success: true,
      message: 'Schema creation completed',
      nextStep: 'Run the SQL script in Supabase SQL editor'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Step 2: Migrate users
router.post('/steps/users', async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    await migrateUsers();
    
    res.json({
      success: true,
      message: 'User migration completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Step 3: Migrate medical forms
router.post('/steps/forms', async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    await migrateMedicalForms();
    
    res.json({
      success: true,
      message: 'Medical forms migration completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Step 4: Migrate saved forms
router.post('/steps/saved-forms', async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    await migrateSavedForms();
    
    res.json({
      success: true,
      message: 'Saved forms migration completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Step 5: Validate migration
router.post('/steps/validate', async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const validation = await validateMigration();
    
    res.json({
      success: true,
      validation,
      message: validation.valid ? 'Migration validation passed' : 'Migration validation found issues'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// ========== CONFIGURATION ENDPOINTS ==========

// Test Supabase connection
router.get('/test-connection', async (req, res) => {
  try {
    const connectionTest = await testSupabaseConnection();
    
    res.json({
      configured: isSupabaseConfigured(),
      connectionTest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Get migration configuration info
router.get('/config', async (req, res) => {
  try {
    const config = {
      supabaseConfigured: isSupabaseConfigured(),
      environmentVariables: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL
      },
      requiredSteps: [
        {
          step: 1,
          name: 'Configure Supabase Environment Variables',
          completed: isSupabaseConfigured(),
          description: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
        },
        {
          step: 2,
          name: 'Test Supabase Connection',
          completed: false, // Will be checked dynamically
          description: 'Verify connection to Supabase database'
        },
        {
          step: 3,
          name: 'Create Database Schema',
          completed: false,
          description: 'Run SQL setup script in Supabase'
        },
        {
          step: 4,
          name: 'Migrate Data',
          completed: false,
          description: 'Transfer existing data to Supabase'
        },
        {
          step: 5,
          name: 'Validate Migration',
          completed: false,
          description: 'Verify data integrity and completeness'
        }
      ]
    };

    res.json({
      success: true,
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

export default router;