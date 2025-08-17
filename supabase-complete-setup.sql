-- ========================================
-- COMPLETE SUPABASE SETUP FOR CENTOMOMD
-- Matches existing PostgreSQL database structure exactly
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. USERS TABLE (exact match)
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

-- ========================================
-- 2. MEDICAL FORMS TABLE (complete structure)
-- ========================================

CREATE TABLE IF NOT EXISTS medical_forms (
  id SERIAL PRIMARY KEY,
  
  -- Medical history fields
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
  
  -- Physical examination fields
  examen_poids TEXT,
  examen_taille TEXT,
  examen_dominance TEXT,
  observation_generale TEXT,
  
  -- Spine examination
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
  
  -- Hip examination
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
  
  -- Knee examination
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
  genoux_apley_droit TEXT,
  genoux_apley_gauche TEXT,
  genoux_mcmurray_droit TEXT,
  genoux_mcmurray_gauche TEXT,
  genoux_thessaly_droit TEXT,
  genoux_thessaly_gauche TEXT,
  genoux_tracking_rotule_droit TEXT,
  genoux_tracking_rotule_gauche TEXT,
  genoux_j_sign_droit TEXT,
  genoux_j_sign_gauche TEXT,
  genoux_translation_droit TEXT,
  genoux_translation_gauche TEXT,
  genoux_circonference_cuisse_droit TEXT,
  genoux_circonference_cuisse_gauche TEXT,
  genoux_circonference_mollet_droit TEXT,
  genoux_circonference_mollet_gauche TEXT,
  
  -- Feet and ankle examination
  pieds_chevilles_palpation TEXT,
  pieds_chevilles_inspection TEXT,
  pieds_dorsiflexion_cheville TEXT,
  pieds_plantiflexion_cheville TEXT,
  pieds_mvts_sous_astragaliens_droit TEXT,
  pieds_mvts_sous_astragaliens_gauche TEXT,
  pieds_mvts_mid_tarsien_droit TEXT,
  pieds_mvts_mid_tarsien_gauche TEXT,
  pieds_mvts_sous_astragaliens_actif_droit TEXT,
  pieds_mvts_sous_astragaliens_passif_droit TEXT,
  pieds_mvts_sous_astragaliens_actif_gauche TEXT,
  pieds_mvts_sous_astragaliens_passif_gauche TEXT,
  pieds_mvts_mid_tarsien_actif_droit TEXT,
  pieds_mvts_mid_tarsien_passif_droit TEXT,
  pieds_mvts_mid_tarsien_actif_gauche TEXT,
  pieds_mvts_mid_tarsien_passif_gauche TEXT,
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
  pieds_single_heel_raise_droit TEXT,
  pieds_single_heel_raise_gauche TEXT,
  pieds_thompson_droit TEXT,
  pieds_thompson_gauche TEXT,
  pieds_test_apprehension_droit TEXT,
  pieds_test_apprehension_gauche TEXT,
  
  -- Neurological and vascular examination
  pieds_neuro_vasculaire TEXT,
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
  pieds_reflexe_rotulien_droit TEXT,
  pieds_reflexe_rotulien_gauche TEXT,
  pieds_reflexe_achilleen_droit TEXT,
  pieds_reflexe_achilleen_gauche TEXT,
  pieds_reflexe_babinski_droit TEXT,
  pieds_reflexe_babinski_gauche TEXT,
  pieds_pouls_tibial_posterieur_droit TEXT,
  pieds_pouls_tibial_posterieur_gauche TEXT,
  pieds_pouls_pedieux_droit TEXT,
  pieds_pouls_pedieux_gauche TEXT,
  
  -- Additional fields
  atrophie_musculaire TEXT,
  examens_additionnels TEXT,
  
  -- Form metadata fields
  mandat_diagnostic BOOLEAN,
  mandat_consolidation BOOLEAN,
  mandat_soins BOOLEAN,
  mandat_atteinte BOOLEAN,
  mandat_limitations BOOLEAN,
  diagnostics_cnesst TEXT,
  modalite_entrevue TEXT,
  identification TEXT,
  age TEXT,
  dominance TEXT,
  emploi TEXT,
  section8_input TEXT,
  patient_name TEXT,
  date_evaluation TEXT,
  patient_gender TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. SAVED FORMS TABLE
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

-- ========================================
-- 4. GENERIC FORMS TABLE
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

-- ========================================
-- 5. RECENT PATIENTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS recent_patients (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  patient_name TEXT NOT NULL,
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Medical forms indexes
CREATE INDEX IF NOT EXISTS idx_medical_forms_patient_name ON medical_forms(patient_name);
CREATE INDEX IF NOT EXISTS idx_medical_forms_created_at ON medical_forms(created_at);

-- Saved forms indexes
CREATE INDEX IF NOT EXISTS idx_saved_forms_user_id ON saved_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_forms_patient_name ON saved_forms(patient_name);

-- Generic forms indexes
CREATE INDEX IF NOT EXISTS idx_generic_forms_user_id ON generic_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_generic_forms_form_type ON generic_forms(form_type);

-- Recent patients indexes
CREATE INDEX IF NOT EXISTS idx_recent_patients_user_id ON recent_patients(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_patients_last_accessed ON recent_patients(last_accessed);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE generic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_patients ENABLE ROW LEVEL SECURITY;

-- Basic policies (users can only see their own data)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Medical forms policies (no user_id reference in current schema)
CREATE POLICY "Medical forms access" ON medical_forms
  FOR ALL USING (true); -- Adjust based on your authentication needs

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
-- SETUP COMPLETE
-- ========================================

SELECT 
  'Schema setup complete' as status,
  count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'medical_forms', 'saved_forms', 'generic_forms', 'recent_patients');