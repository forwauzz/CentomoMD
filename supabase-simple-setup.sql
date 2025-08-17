-- ========================================
-- SIMPLE SUPABASE SETUP FOR CENTOMOMD
-- Uses existing schema structure
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. USERS TABLE (matching existing schema)
-- ========================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ========================================
-- 2. MEDICAL FORMS TABLE (matching existing schema)
-- ========================================

CREATE TABLE IF NOT EXISTS medical_forms (
  id SERIAL PRIMARY KEY,
  
  -- Copy the exact structure from current database
  antecedents_medicaux TEXT,
  antecedents_chirurgicaux TEXT,
  antecedents_lesion TEXT,
  antecedents_cnesst TEXT,
  antecedents_saaq TEXT,
  antecedents_autres TEXT,
  antecedents_allergie TEXT,
  antecedents_tabac TEXT,
  antecedents_cannabis TEXT,
  antecedents_alcool TEXT,
  medication_actuelle TEXT,
  historique_evolution TEXT,
  appreciation_evolution TEXT,
  plaintes_problemes TEXT,
  impact_avq TEXT,
  examen_poids TEXT,
  examen_taille TEXT,
  examen_dominance TEXT,
  observation_generale TEXT,
  
  -- Add basic metadata fields that might be missing
  user_id TEXT,
  patient_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_medical_forms_user_id ON medical_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_forms_patient_name ON medical_forms(patient_name);
CREATE INDEX IF NOT EXISTS idx_medical_forms_status ON medical_forms(status);
CREATE INDEX IF NOT EXISTS idx_medical_forms_created_at ON medical_forms(created_at);

-- ========================================
-- 3. SAVED FORMS TABLE (matching existing schema)
-- ========================================

CREATE TABLE IF NOT EXISTS saved_forms (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  form_name TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  patient_name TEXT,
  form_type TEXT DEFAULT 'medical_evaluation',
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_saved_forms_user_id ON saved_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_forms_form_name ON saved_forms(form_name);
CREATE INDEX IF NOT EXISTS idx_saved_forms_patient_name ON saved_forms(patient_name);

-- ========================================
-- 4. GENERIC FORMS TABLE (matching existing schema)
-- ========================================

CREATE TABLE IF NOT EXISTS generic_forms (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  form_type TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  patient_name TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_generic_forms_user_id ON generic_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_generic_forms_form_type ON generic_forms(form_type);
CREATE INDEX IF NOT EXISTS idx_generic_forms_patient_name ON generic_forms(patient_name);

-- ========================================
-- 5. RECENT PATIENTS TABLE (matching existing schema)
-- ========================================

CREATE TABLE IF NOT EXISTS recent_patients (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  patient_name TEXT NOT NULL,
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_recent_patients_user_id ON recent_patients(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_patients_last_accessed ON recent_patients(last_accessed);

-- ========================================
-- 6. BASIC ROW LEVEL SECURITY
-- ========================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE generic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_patients ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Medical forms policies
CREATE POLICY "Users can view own medical forms" ON medical_forms
  FOR ALL USING (auth.uid()::text = user_id);

-- Saved forms policies  
CREATE POLICY "Users can manage own saved forms" ON saved_forms
  FOR ALL USING (auth.uid()::text = user_id);

-- Generic forms policies
CREATE POLICY "Users can manage own generic forms" ON generic_forms
  FOR ALL USING (auth.uid()::text = user_id);

-- Recent patients policies
CREATE POLICY "Users can manage own recent patients" ON recent_patients
  FOR ALL USING (auth.uid()::text = user_id);

-- ========================================
-- 7. BASIC AUDIT LOGGING
-- ========================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id TEXT,
  action TEXT NOT NULL,
  user_id TEXT,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Enable RLS for audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admin only audit access" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- ========================================
-- 8. TRIGGER FUNCTIONS FOR TIMESTAMPS
-- ========================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_forms_updated_at
  BEFORE UPDATE ON medical_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_forms_updated_at
  BEFORE UPDATE ON saved_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generic_forms_updated_at
  BEFORE UPDATE ON generic_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SETUP COMPLETE
-- ========================================

-- Verify tables exist
SELECT 
  'Tables created successfully' as status,
  count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'medical_forms', 'saved_forms', 'generic_forms', 'recent_patients', 'audit_logs');