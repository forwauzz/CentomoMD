-- ========================================
-- SUPABASE SCHEMA SETUP FOR CENTOMOMD
-- HIPAA-Compliant Medical Evaluation Platform
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. ENHANCED USERS TABLE
-- ========================================

-- Add medical-specific fields to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hipaa_training_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_hipaa_acknowledgment TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ========================================
-- 2. MEDICAL ASSESSMENTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS medical_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  
  -- Section 1: Mandat de l'évaluation
  mandat_diagnostic BOOLEAN DEFAULT FALSE,
  mandat_consolidation BOOLEAN DEFAULT FALSE,
  mandat_soins BOOLEAN DEFAULT FALSE,
  mandat_atteinte BOOLEAN DEFAULT FALSE,
  mandat_atteinte_pourcentage BOOLEAN DEFAULT FALSE,
  mandat_limitations BOOLEAN DEFAULT FALSE,
  mandat_limitations_evaluation BOOLEAN DEFAULT FALSE,

  -- Section 2: Diagnostics acceptés par la CNESST
  diagnostics_cnesst TEXT,

  -- Section 3: Modalité de l'entrevue
  modalite_entrevue TEXT,

  -- Section 4: Identification
  patient_name TEXT,
  age TEXT,
  date_evaluation TEXT,
  patient_gender TEXT,
  dominance TEXT,
  emploi TEXT,

  -- Section 5: Antécédents
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

  -- Section 6: Médication actuelle
  medication_actuelle TEXT,

  -- Section 7: Historique de faits et évolution
  historique_evolution TEXT,

  -- Section 8: Questionnaire subjectif et état actuel
  section8_input TEXT,
  appreciation_evolution TEXT,
  plaintes_problemes TEXT,
  impact_avq TEXT,

  -- Section 9: Examen Physique - General
  examen_poids TEXT,
  examen_taille TEXT,
  examen_dominance TEXT,
  observation_generale TEXT,
  
  -- Rachis
  rachis_palpation TEXT,
  rachis_inspection TEXT,
  rachis_flexion TEXT,
  rachis_extension TEXT,
  rachis_flexion_laterale_g TEXT,
  rachis_flexion_laterale_d TEXT,
  rachis_rotation_g TEXT,
  rachis_rotation_d TEXT,
  rachis_slr_droit TEXT,
  rachis_slr_gauche TEXT,
  rachis_tripode_droit TEXT,
  rachis_tripode_gauche TEXT,
  rachis_lasegue_droit TEXT,
  rachis_lasegue_gauche TEXT,
  rachis_lasegue_inverse_droit TEXT,
  rachis_lasegue_inverse_gauche TEXT,

  -- Hanches
  hanches_palpation TEXT,
  hanches_inspection TEXT,
  hanches_flexion_droit_actif TEXT,
  hanches_flexion_droit_passif TEXT,
  hanches_flexion_gauche_actif TEXT,
  hanches_flexion_gauche_passif TEXT,
  hanches_extension_droit_actif TEXT,
  hanches_extension_droit_passif TEXT,
  hanches_extension_gauche_actif TEXT,
  hanches_extension_gauche_passif TEXT,
  hanches_rotation_interne_droit_actif TEXT,
  hanches_rotation_interne_droit_passif TEXT,
  hanches_rotation_interne_gauche_actif TEXT,
  hanches_rotation_interne_gauche_passif TEXT,
  hanches_rotation_externe_droit_actif TEXT,
  hanches_rotation_externe_droit_passif TEXT,
  hanches_rotation_externe_gauche_actif TEXT,
  hanches_rotation_externe_gauche_passif TEXT,
  hanches_abduction_droit_actif TEXT,
  hanches_abduction_droit_passif TEXT,
  hanches_abduction_gauche_actif TEXT,
  hanches_abduction_gauche_passif TEXT,
  hanches_adduction_droit_actif TEXT,
  hanches_adduction_droit_passif TEXT,
  hanches_adduction_gauche_actif TEXT,
  hanches_adduction_gauche_passif TEXT,

  -- Genoux
  genoux_palpation TEXT,
  genoux_inspection TEXT,
  genoux_flexion_droit_actif TEXT,
  genoux_flexion_droit_passif TEXT,
  genoux_flexion_gauche_actif TEXT,
  genoux_flexion_gauche_passif TEXT,
  genoux_extension_droit_actif TEXT,
  genoux_extension_droit_passif TEXT,
  genoux_extension_gauche_actif TEXT,
  genoux_extension_gauche_passif TEXT,

  -- Manœuvres ligamentaires genoux
  genoux_lci_0_droit TEXT,
  genoux_lci_0_gauche TEXT,
  genoux_lci_20_droit TEXT,
  genoux_lci_20_gauche TEXT,
  genoux_lce_0_droit TEXT,
  genoux_lce_0_gauche TEXT,
  genoux_lce_20_droit TEXT,
  genoux_lce_20_gauche TEXT,
  genoux_lachman_droit TEXT,
  genoux_lachman_gauche TEXT,
  genoux_pivot_droit TEXT,
  genoux_pivot_gauche TEXT,
  genoux_tiroir_anterieur_droit TEXT,
  genoux_tiroir_anterieur_gauche TEXT,
  genoux_tiroir_posterieur_droit TEXT,
  genoux_tiroir_posterieur_gauche TEXT,
  genoux_sag_posterieur_droit TEXT,
  genoux_sag_posterieur_gauche TEXT,
  genoux_dial_30_droit TEXT,
  genoux_dial_30_gauche TEXT,
  genoux_dial_90_droit TEXT,
  genoux_dial_90_gauche TEXT,

  -- Manœuvres méniscales genoux
  genoux_apley_droit TEXT,
  genoux_apley_gauche TEXT,
  genoux_mcmurray_droit TEXT,
  genoux_mcmurray_gauche TEXT,
  genoux_thessaly_droit TEXT,
  genoux_thessaly_gauche TEXT,

  -- Manoeuvres rotules
  genoux_tracking_rotule_droit TEXT,
  genoux_tracking_rotule_gauche TEXT,
  genoux_j_sign_droit TEXT,
  genoux_j_sign_gauche TEXT,
  genoux_translation_droit TEXT,
  genoux_translation_gauche TEXT,

  -- Circonférence genoux
  genoux_circonference_cuisse_droit TEXT,
  genoux_circonference_cuisse_gauche TEXT,
  genoux_circonference_mollet_droit TEXT,
  genoux_circonference_mollet_gauche TEXT,

  atrophie_musculaire TEXT,

  -- Pieds / Chevilles
  pieds_chevilles_palpation TEXT,
  pieds_chevilles_inspection TEXT,

  -- Amplitude articulaire pieds/chevilles
  pieds_dorsiflexion_cheville TEXT,
  pieds_plantiflexion_cheville TEXT,
  pieds_mvts_sous_astragaliens_actif_droit TEXT,
  pieds_mvts_sous_astragaliens_passif_droit TEXT,
  pieds_mvts_sous_astragaliens_actif_gauche TEXT,
  pieds_mvts_sous_astragaliens_passif_gauche TEXT,
  pieds_mvts_mid_tarsien_actif_droit TEXT,
  pieds_mvts_mid_tarsien_passif_droit TEXT,
  pieds_mvts_mid_tarsien_actif_gauche TEXT,
  pieds_mvts_mid_tarsien_passif_gauche TEXT,

  -- Manœuvres ligamentaires pieds/chevilles
  pieds_tiroir_0_droit TEXT,
  pieds_tiroir_0_gauche TEXT,
  pieds_tiroir_20_droit TEXT,
  pieds_tiroir_20_gauche TEXT,
  pieds_varus_stress_droit TEXT,
  pieds_varus_stress_gauche TEXT,
  pieds_laxite_calcaneo_fibulaire_droit TEXT,
  pieds_laxite_calcaneo_fibulaire_gauche TEXT,
  pieds_squeeze_test_droit TEXT,
  pieds_squeeze_test_gauche TEXT,

  -- Manœuvres spécifiques tendons pieds/chevilles
  pieds_single_heel_raise_droit TEXT,
  pieds_single_heel_raise_gauche TEXT,
  pieds_thompson_droit TEXT,
  pieds_thompson_gauche TEXT,
  pieds_test_apprehension_droit TEXT,
  pieds_test_apprehension_gauche TEXT,

  -- Neuro-vasculaire pieds/chevilles
  pieds_neuro_vasculaire TEXT,

  -- Forces neuro pieds/chevilles
  pieds_force_l2_droit TEXT,
  pieds_force_l2_gauche TEXT,
  pieds_force_l3_droit TEXT,
  pieds_force_l3_gauche TEXT,
  pieds_force_l4_droit TEXT,
  pieds_force_l4_gauche TEXT,
  pieds_force_l5_droit TEXT,
  pieds_force_l5_gauche TEXT,
  pieds_force_s1_droit TEXT,
  pieds_force_s1_gauche TEXT,

  -- Sensibilités neuro pieds/chevilles
  pieds_sensibilite_l2_droit TEXT,
  pieds_sensibilite_l2_gauche TEXT,
  pieds_sensibilite_l3_droit TEXT,
  pieds_sensibilite_l3_gauche TEXT,
  pieds_sensibilite_l4_droit TEXT,
  pieds_sensibilite_l4_gauche TEXT,
  pieds_sensibilite_l5_droit TEXT,
  pieds_sensibilite_l5_gauche TEXT,
  pieds_sensibilite_s1_droit TEXT,
  pieds_sensibilite_s1_gauche TEXT,

  -- Réflexes neuro pieds/chevilles
  pieds_reflexe_rotulien_droit TEXT,
  pieds_reflexe_rotulien_gauche TEXT,
  pieds_reflexe_achilleen_droit TEXT,
  pieds_reflexe_achilleen_gauche TEXT,
  pieds_reflexe_babinski_droit TEXT,
  pieds_reflexe_babinski_gauche TEXT,

  -- Pouls neuro pieds/chevilles
  pieds_pouls_tibial_posterieur_droit TEXT,
  pieds_pouls_tibial_posterieur_gauche TEXT,
  pieds_pouls_pedieux_droit TEXT,
  pieds_pouls_pedieux_gauche TEXT,

  examens_additionnels TEXT,

  -- HIPAA Compliance & Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  last_modified_by UUID,
  
  -- Version control for audit trail
  version_number INTEGER DEFAULT 1,
  change_log JSONB DEFAULT '[]'::JSONB,
  
  -- Data retention
  retention_policy TEXT DEFAULT 'standard',
  expires_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Form completion tracking
  status TEXT DEFAULT 'draft',
  completion_percentage INTEGER DEFAULT 0,
  
  -- AI processing tracking
  ai_processing_history JSONB DEFAULT '[]'::JSONB,
  
  -- Validation state
  validation_errors JSONB,
  validation_warnings JSONB
);

-- Indexes for medical_assessments
CREATE INDEX IF NOT EXISTS idx_medical_assessments_user_id ON medical_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_assessments_status ON medical_assessments(status);
CREATE INDEX IF NOT EXISTS idx_medical_assessments_created_at ON medical_assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_medical_assessments_expires_at ON medical_assessments(expires_at);

-- Enable RLS
ALTER TABLE medical_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_assessments
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

-- ========================================
-- 3. ENHANCED FORM SESSIONS
-- ========================================

-- Add enhanced fields to existing form_sessions table
ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS section_progress JSONB;
ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS validation_errors JSONB;
ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS ai_processing_status JSONB;
ALTER TABLE form_sessions ADD COLUMN IF NOT EXISTS last_section_visited TEXT;

-- ========================================
-- 4. ENHANCED VOICE SESSIONS
-- ========================================

-- Add enhanced fields to existing voice_sessions table
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS medical_terminology_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'fr';
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS transcript_quality_score NUMERIC(3,2);
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS ai_corrections_applied JSONB;

-- ========================================
-- 5. AUDIT LOGS TABLE (HIPAA Compliance)
-- ========================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id TEXT,
  action TEXT NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
  user_id UUID,
  user_ip INET,
  user_agent TEXT,
  old_values JSONB,
  new_values JSONB,
  session_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

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

-- ========================================
-- 6. DATA RETENTION & CLEANUP FUNCTIONS
-- ========================================

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
  
  -- Delete old voice sessions (30 days retention)
  DELETE FROM voice_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Archive old audit logs (7 years retention for HIPAA)
  DELETE FROM audit_logs 
  WHERE timestamp < NOW() - INTERVAL '7 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. TRIGGER FUNCTIONS FOR AUDIT TRAIL
-- ========================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log changes to audit_logs
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      user_id,
      old_values
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id::TEXT,
      TG_OP,
      auth.uid(),
      row_to_json(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      user_id,
      old_values,
      new_values
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id::TEXT,
      TG_OP,
      auth.uid(),
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      user_id,
      new_values
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id::TEXT,
      TG_OP,
      auth.uid(),
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. APPLY TRIGGERS
-- ========================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_assessments_updated_at ON medical_assessments;
CREATE TRIGGER update_medical_assessments_updated_at
  BEFORE UPDATE ON medical_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_sessions_updated_at ON form_sessions;
CREATE TRIGGER update_form_sessions_updated_at
  BEFORE UPDATE ON form_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_sessions_updated_at ON voice_sessions;
CREATE TRIGGER update_voice_sessions_updated_at
  BEFORE UPDATE ON voice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Audit logging triggers
DROP TRIGGER IF EXISTS audit_medical_assessments ON medical_assessments;
CREATE TRIGGER audit_medical_assessments
  AFTER INSERT OR UPDATE OR DELETE ON medical_assessments
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- ========================================
-- 9. INITIAL DATA & PERMISSIONS
-- ========================================

-- Create initial admin user (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@centomomd.com') THEN
    INSERT INTO users (
      id,
      email,
      role,
      status,
      first_name,
      last_name,
      hipaa_training_date,
      last_hipaa_acknowledgment
    ) VALUES (
      uuid_generate_v4(),
      'admin@centomomd.com',
      'admin',
      'active',
      'System',
      'Administrator',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- ========================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE medical_assessments IS 'Main table for storing medical assessment forms with full HIPAA compliance and audit trail';
COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit trail for all database operations';
COMMENT ON COLUMN medical_assessments.retention_policy IS 'Data retention policy: standard (1 year), extended (7 years), minimal (30 days)';
COMMENT ON COLUMN medical_assessments.change_log IS 'JSON array tracking all changes made to the assessment';
COMMENT ON COLUMN medical_assessments.ai_processing_history IS 'JSON array tracking all AI processing operations performed';

-- ========================================
-- SETUP COMPLETE
-- ========================================

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'CentomoMD Supabase schema setup completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your application';
  RAISE NOTICE '2. Test the migration scripts';
  RAISE NOTICE '3. Run data migration when ready';
  RAISE NOTICE '4. Ensure Business Associate Agreement (BAA) is in place with Supabase';
END $$;