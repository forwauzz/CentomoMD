import { pgTable, text, uuid, boolean, timestamp, jsonb, integer, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========== SUPABASE SCHEMA DEFINITIONS ==========
// Enhanced schema for Supabase migration with HIPAA compliance

// Users table - Enhanced from existing Supabase users
export const supabaseUsers = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  
  // Profile information
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"), // "admin", "user", "viewer"
  
  // Medical-specific fields
  licenseNumber: text("license_number"),
  specialty: text("specialty"),
  organization: text("organization"),
  
  // HIPAA compliance fields
  hipaaTrainingDate: timestamp("hipaa_training_date"),
  lastHipaaAcknowledgment: timestamp("last_hipaa_acknowledgment"),
  status: text("status").default("active"), // "active", "inactive", "suspended"
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by"),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_role").on(table.role),
  index("idx_users_status").on(table.status),
]);

// Medical Assessments - Main form data with HIPAA compliance
export const medicalAssessments = pgTable("medical_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  
  // Section 1: Mandat de l'évaluation (checkboxes)
  mandatDiagnostic: boolean("mandat_diagnostic").default(false),
  mandatConsolidation: boolean("mandat_consolidation").default(false),
  mandatSoins: boolean("mandat_soins").default(false),
  mandatAtteinte: boolean("mandat_atteinte").default(false),
  mandatAtteintePourcentage: boolean("mandat_atteinte_pourcentage").default(false),
  mandatLimitations: boolean("mandat_limitations").default(false),
  mandatLimitationsEvaluation: boolean("mandat_limitations_evaluation").default(false),

  // Section 2: Diagnostics acceptés par la CNESST
  diagnosticsCnesst: text("diagnostics_cnesst"),

  // Section 3: Modalité de l'entrevue
  modaliteEntrevue: text("modalite_entrevue"),

  // Section 4: Identification
  patientName: text("patient_name"),
  age: text("age"),
  dateEvaluation: text("date_evaluation"),
  patientGender: text("patient_gender"),
  dominance: text("dominance"),
  emploi: text("emploi"),

  // Section 5: Antécédents
  antecedentsMedicaux: text("antecedents_medicaux"),
  antecedentsChirurgicaux: text("antecedents_chirurgicaux"),
  antecedentsLesion: text("antecedents_lesion"),
  antecedentsCnesst: text("antecedents_cnesst"),
  antecedentsSaaq: text("antecedents_saaq"),
  antecedentsAutres: text("antecedents_autres"),
  antecedentsAllergie: text("antecedents_allergie"),
  antecedentsTabac: text("antecedents_tabac"),
  antecedentsCannabis: text("antecedents_cannabis"),
  antecedentsAlcool: text("antecedents_alcool"),

  // Section 6: Médication actuelle
  medicationActuelle: text("medication_actuelle"),

  // Section 7: Historique de faits et évolution
  historiqueEvolution: text("historique_evolution"),

  // Section 8: Questionnaire subjectif et état actuel
  section8Input: text("section8_input"),
  appreciationEvolution: text("appreciation_evolution"),
  plaintesproblemes: text("plaintes_problemes"),
  impactAvq: text("impact_avq"),

  // Section 9: Examen Physique (all physical examination fields)
  examenPoids: text("examen_poids"),
  examenTaille: text("examen_taille"),
  examenDominance: text("examen_dominance"),
  observationGenerale: text("observation_generale"),
  
  // Rachis
  rachisPalpation: text("rachis_palpation"),
  rachisInspection: text("rachis_inspection"),
  rachisFlexion: text("rachis_flexion"),
  rachisExtension: text("rachis_extension"),
  rachisFlexionLateraleG: text("rachis_flexion_laterale_g"),
  rachisFlexionLateraleD: text("rachis_flexion_laterale_d"),
  rachisRotationG: text("rachis_rotation_g"),
  rachisRotationD: text("rachis_rotation_d"),
  rachisSlrDroit: text("rachis_slr_droit"),
  rachisSlrGauche: text("rachis_slr_gauche"),
  rachisTripodeDroit: text("rachis_tripode_droit"),
  rachisTripodesGauche: text("rachis_tripode_gauche"),
  rachisLasegueDroit: text("rachis_lasegue_droit"),
  rachisLasegueGauche: text("rachis_lasegue_gauche"),
  rachisLasegueInverseDroit: text("rachis_lasegue_inverse_droit"),
  rachisLasegueInverseGauche: text("rachis_lasegue_inverse_gauche"),

  // Hanches
  hanchesPalpation: text("hanches_palpation"),
  hanchesInspection: text("hanches_inspection"),
  hanchesFlexionDroitActif: text("hanches_flexion_droit_actif"),
  hanchesFlexionDroitPassif: text("hanches_flexion_droit_passif"),
  hanchesFlexionGaucheActif: text("hanches_flexion_gauche_actif"),
  hanchesFlexionGauchePassif: text("hanches_flexion_gauche_passif"),
  hanchesExtensionDroitActif: text("hanches_extension_droit_actif"),
  hanchesExtensionDroitPassif: text("hanches_extension_droit_passif"),
  hanchesExtensionGaucheActif: text("hanches_extension_gauche_actif"),
  hanchesExtensionGauchePassif: text("hanches_extension_gauche_passif"),
  hanchesRotationInterneDroitActif: text("hanches_rotation_interne_droit_actif"),
  hanchesRotationInterneDroitPassif: text("hanches_rotation_interne_droit_passif"),
  hanchesRotationInterneGaucheActif: text("hanches_rotation_interne_gauche_actif"),
  hanchesRotationInterneGauchePassif: text("hanches_rotation_interne_gauche_passif"),
  hanchesRotationExterneDroitActif: text("hanches_rotation_externe_droit_actif"),
  hanchesRotationExterneDroitPassif: text("hanches_rotation_externe_droit_passif"),
  hanchesRotationExterneGaucheActif: text("hanches_rotation_externe_gauche_actif"),
  hanchesRotationExterneGauchePassif: text("hanches_rotation_externe_gauche_passif"),
  hanchesAbductionDroitActif: text("hanches_abduction_droit_actif"),
  hanchesAbductionDroitPassif: text("hanches_abduction_droit_passif"),
  hanchesAbductionGaucheActif: text("hanches_abduction_gauche_actif"),
  hanchesAbductionGauchePassif: text("hanches_abduction_gauche_passif"),
  hanchesAdductionDroitActif: text("hanches_adduction_droit_actif"),
  hanchesAdductionDroitPassif: text("hanches_adduction_droit_passif"),
  hanchesAdductionGaucheActif: text("hanches_adduction_gauche_actif"),
  hanchesAdductionGauchePassif: text("hanches_adduction_gauche_passif"),

  // Genoux
  genouxPalpation: text("genoux_palpation"),
  genouxInspection: text("genoux_inspection"),
  genouxFlexionDroitActif: text("genoux_flexion_droit_actif"),
  genouxFlexionDroitPassif: text("genoux_flexion_droit_passif"),
  genouxFlexionGaucheActif: text("genoux_flexion_gauche_actif"),
  genouxFlexionGauchePassif: text("genoux_flexion_gauche_passif"),
  genouxExtensionDroitActif: text("genoux_extension_droit_actif"),
  genouxExtensionDroitPassif: text("genoux_extension_droit_passif"),
  genouxExtensionGaucheActif: text("genoux_extension_gauche_actif"),
  genouxExtensionGauchePassif: text("genoux_extension_gauche_passif"),

  // Manœuvres ligamentaires genoux
  genouxLci0Droit: text("genoux_lci_0_droit"),
  genouxLci0Gauche: text("genoux_lci_0_gauche"),
  genouxLci20Droit: text("genoux_lci_20_droit"),
  genouxLci20Gauche: text("genoux_lci_20_gauche"),
  genouxLce0Droit: text("genoux_lce_0_droit"),
  genouxLce0Gauche: text("genoux_lce_0_gauche"),
  genouxLce20Droit: text("genoux_lce_20_droit"),
  genouxLce20Gauche: text("genoux_lce_20_gauche"),
  genouxLachmanDroit: text("genoux_lachman_droit"),
  genouxLachmanGauche: text("genoux_lachman_gauche"),
  genouxPivotDroit: text("genoux_pivot_droit"),
  genouxPivotGauche: text("genoux_pivot_gauche"),
  genouxTiroirAnterieurDroit: text("genoux_tiroir_anterieur_droit"),
  genouxTiroirAnterieurGauche: text("genoux_tiroir_anterieur_gauche"),
  genouxTiroirPosterieurDroit: text("genoux_tiroir_posterieur_droit"),
  genouxTiroirPosterieurGauche: text("genoux_tiroir_posterieur_gauche"),
  genouxSagPosterieurDroit: text("genoux_sag_posterieur_droit"),
  genouxSagPosterieurGauche: text("genoux_sag_posterieur_gauche"),
  genouxDial30Droit: text("genoux_dial_30_droit"),
  genouxDial30Gauche: text("genoux_dial_30_gauche"),
  genouxDial90Droit: text("genoux_dial_90_droit"),
  genouxDial90Gauche: text("genoux_dial_90_gauche"),

  // Manœuvres méniscales genoux
  genouxApleyDroit: text("genoux_apley_droit"),
  genouxApleyGauche: text("genoux_apley_gauche"),
  genouxMcMurrayDroit: text("genoux_mcmurray_droit"),
  genouxMcMurrayGauche: text("genoux_mcmurray_gauche"),
  genouxThessalyDroit: text("genoux_thessaly_droit"),
  genouxThessalyGauche: text("genoux_thessaly_gauche"),

  // Manoeuvres rotules
  genouxTrackingRotuleDroit: text("genoux_tracking_rotule_droit"),
  genouxTrackingRotuleGauche: text("genoux_tracking_rotule_gauche"),
  genouxJSignDroit: text("genoux_j_sign_droit"),
  genouxJSignGauche: text("genoux_j_sign_gauche"),
  genouxTranslationDroit: text("genoux_translation_droit"),
  genouxTranslationGauche: text("genoux_translation_gauche"),

  // Circonférence genoux
  genouxCirconferenceCuisseDroit: text("genoux_circonference_cuisse_droit"),
  genouxCirconferenceCuisseGauche: text("genoux_circonference_cuisse_gauche"),
  genouxCirconferenceMolletDroit: text("genoux_circonference_mollet_droit"),
  genouxCirconferenceMolletGauche: text("genoux_circonference_mollet_gauche"),

  atrophieMusculaire: text("atrophie_musculaire"),

  // Pieds / Chevilles
  piedsCheillesPalpation: text("pieds_chevilles_palpation"),
  piedsChevillesInspection: text("pieds_chevilles_inspection"),

  // Amplitude articulaire pieds/chevilles
  piedsDorsiflexionCheville: text("pieds_dorsiflexion_cheville"),
  piedsPlantifexionCheville: text("pieds_plantiflexion_cheville"),
  piedsMvtsSousAstragaliensActifDroit: text("pieds_mvts_sous_astragaliens_actif_droit"),
  piedsMvtsSousAstragaliensPassifDroit: text("pieds_mvts_sous_astragaliens_passif_droit"),
  piedsMvtsSousAstragaliensActifGauche: text("pieds_mvts_sous_astragaliens_actif_gauche"),
  piedsMvtsSousAstragaliensPassifGauche: text("pieds_mvts_sous_astragaliens_passif_gauche"),
  piedsMvtsMidTarsienActifDroit: text("pieds_mvts_mid_tarsien_actif_droit"),
  piedsMvtsMidTarsienPassifDroit: text("pieds_mvts_mid_tarsien_passif_droit"),
  piedsMvtsMidTarsienActifGauche: text("pieds_mvts_mid_tarsien_actif_gauche"),
  piedsMvtsMidTarsienPassifGauche: text("pieds_mvts_mid_tarsien_passif_gauche"),

  // Manœuvres ligamentaires pieds/chevilles
  piedsTiroir0Droit: text("pieds_tiroir_0_droit"),
  piedsTiroir0Gauche: text("pieds_tiroir_0_gauche"),
  piedsTiroir20Droit: text("pieds_tiroir_20_droit"),
  piedsTiroir20Gauche: text("pieds_tiroir_20_gauche"),
  piedsVarusStressDroit: text("pieds_varus_stress_droit"),
  piedsVarusStressGauche: text("pieds_varus_stress_gauche"),
  piedsLaxiteCalcaneoFibulaireDroit: text("pieds_laxite_calcaneo_fibulaire_droit"),
  piedsLaxiteCalcaneoFibulaireGauche: text("pieds_laxite_calcaneo_fibulaire_gauche"),
  piedsSqueezeTestDroit: text("pieds_squeeze_test_droit"),
  piedsSqueezeTestGauche: text("pieds_squeeze_test_gauche"),

  // Manœuvres spécifiques tendons pieds/chevilles
  piedsSingleHeelRaiseDroit: text("pieds_single_heel_raise_droit"),
  piedsSingleHeelRaiseGauche: text("pieds_single_heel_raise_gauche"),
  piedsThompsonDroit: text("pieds_thompson_droit"),
  piedsThompsonGauche: text("pieds_thompson_gauche"),
  piedsTestApprehensionDroit: text("pieds_test_apprehension_droit"),
  piedsTestApprehensionGauche: text("pieds_test_apprehension_gauche"),

  // Neuro-vasculaire pieds/chevilles
  piedsNeuroVasculaire: text("pieds_neuro_vasculaire"),

  // Forces neuro pieds/chevilles
  piedsForceL2Droit: text("pieds_force_l2_droit"),
  piedsForceL2Gauche: text("pieds_force_l2_gauche"),
  piedsForceL3Droit: text("pieds_force_l3_droit"),
  piedsForceL3Gauche: text("pieds_force_l3_gauche"),
  piedsForceL4Droit: text("pieds_force_l4_droit"),
  piedsForceL4Gauche: text("pieds_force_l4_gauche"),
  piedsForceL5Droit: text("pieds_force_l5_droit"),
  piedsForceL5Gauche: text("pieds_force_l5_gauche"),
  piedsForceS1Droit: text("pieds_force_s1_droit"),
  piedsForceS1Gauche: text("pieds_force_s1_gauche"),

  // Sensibilités neuro pieds/chevilles
  piedsSensibiliteL2Droit: text("pieds_sensibilite_l2_droit"),
  piedsSensibiliteL2Gauche: text("pieds_sensibilite_l2_gauche"),
  piedsSensibiliteL3Droit: text("pieds_sensibilite_l3_droit"),
  piedsSensibiliteL3Gauche: text("pieds_sensibilite_l3_gauche"),
  piedsSensibiliteL4Droit: text("pieds_sensibilite_l4_droit"),
  piedsSensibiliteL4Gauche: text("pieds_sensibilite_l4_gauche"),
  piedsSensibiliteL5Droit: text("pieds_sensibilite_l5_droit"),
  piedsSensibiliteL5Gauche: text("pieds_sensibilite_l5_gauche"),
  piedsSensibiliteS1Droit: text("pieds_sensibilite_s1_droit"),
  piedsSensibiliteS1Gauche: text("pieds_sensibilite_s1_gauche"),

  // Réflexes neuro pieds/chevilles
  piedsReflexeRotulienDroit: text("pieds_reflexe_rotulien_droit"),
  piedsReflexeRotulienGauche: text("pieds_reflexe_rotulien_gauche"),
  piedsReflexeAchilleenDroit: text("pieds_reflexe_achilleen_droit"),
  piedsReflexeAchilleenGauche: text("pieds_reflexe_achilleen_gauche"),
  piedsReflexeBabinskiDroit: text("pieds_reflexe_babinski_droit"),
  piedsReflexeBabinskiGauche: text("pieds_reflexe_babinski_gauche"),

  // Pouls neuro pieds/chevilles
  piedsPoulsTibialPosterieurDroit: text("pieds_pouls_tibial_posterieur_droit"),
  piedsPoulsTibialPosterieurGauche: text("pieds_pouls_tibial_posterieur_gauche"),
  piedsPoulsPedieuxDroit: text("pieds_pouls_pedieux_droit"),
  piedsPoulsPedieuxGauche: text("pieds_pouls_pedieux_gauche"),

  examensAdditionnels: text("examens_additionnels"),

  // HIPAA Compliance & Audit Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by"),
  lastModifiedBy: uuid("last_modified_by"),
  
  // Version control for audit trail
  versionNumber: integer("version_number").default(1),
  changeLog: jsonb("change_log").default([]),
  
  // Data retention
  retentionPolicy: text("retention_policy").default("standard"), // standard, extended, minimal
  expiresAt: timestamp("expires_at"),
  isArchived: boolean("is_archived").default(false),
  
  // Form completion tracking
  status: text("status").default("draft"), // draft, completed, archived
  completionPercentage: integer("completion_percentage").default(0),
  
  // AI processing tracking
  aiProcessingHistory: jsonb("ai_processing_history").default([]),
  
  // Validation state
  validationErrors: jsonb("validation_errors"),
  validationWarnings: jsonb("validation_warnings"),
}, (table) => [
  index("idx_medical_assessments_user_id").on(table.userId),
  index("idx_medical_assessments_status").on(table.status),
  index("idx_medical_assessments_created_at").on(table.createdAt),
  index("idx_medical_assessments_expires_at").on(table.expiresAt),
]);

// Enhanced Form Sessions - Existing table enhanced
export const supabaseFormSessions = pgTable("form_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  sessionToken: text("session_token").unique().notNull(),
  formType: text("form_type").notNull(),
  formData: jsonb("form_data").notNull(),
  
  // Enhanced fields for medical context
  sectionProgress: jsonb("section_progress"), // Track which sections are completed
  validationErrors: jsonb("validation_errors"),
  aiProcessingStatus: jsonb("ai_processing_status"),
  lastSectionVisited: text("last_section_visited"),
  
  // Standard fields
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_form_sessions_user_id").on(table.userId),
  index("idx_form_sessions_expires_at").on(table.expiresAt),
  index("idx_form_sessions_session_token").on(table.sessionToken),
]);

// Enhanced Voice Sessions - Existing table enhanced
export const supabaseVoiceSessions = pgTable("voice_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  formId: uuid("form_id"), // Reference to medical assessment
  
  // Voice session data
  transcript: text("transcript"),
  audioData: text("audio_data"), // Base64 encoded audio
  language: text("language").default("fr"),
  status: text("status").default("processing"), // processing, completed, failed
  
  // Enhanced medical context
  medicalTerminologyEnabled: boolean("medical_terminology_enabled").default(true),
  languagePreference: text("language_preference").default("fr"),
  transcriptQualityScore: numeric("transcript_quality_score", { precision: 3, scale: 2 }),
  aiCorrectionsApplied: jsonb("ai_corrections_applied"),
  
  // Processing metrics
  processingTimeMs: integer("processing_time_ms"),
  confidence: numeric("confidence", { precision: 3, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_voice_sessions_user_id").on(table.userId),
  index("idx_voice_sessions_form_id").on(table.formId),
  index("idx_voice_sessions_status").on(table.status),
]);

// HIPAA Audit Logs - New table for compliance
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableName: text("table_name").notNull(),
  recordId: text("record_id"),
  action: text("action").notNull(), // SELECT, INSERT, UPDATE, DELETE
  userId: uuid("user_id"),
  userIp: text("user_ip"),
  userAgent: text("user_agent"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  sessionId: text("session_id"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_audit_logs_table_name").on(table.tableName),
  index("idx_audit_logs_user_id").on(table.userId),
  index("idx_audit_logs_timestamp").on(table.timestamp),
  index("idx_audit_logs_action").on(table.action),
]);

// Enhanced Admin Actions - Existing table
export const supabaseAdminActions = pgTable("admin_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUserId: uuid("admin_user_id"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_admin_actions_admin_user_id").on(table.adminUserId),
  index("idx_admin_actions_timestamp").on(table.timestamp),
]);

// AI Training Metrics - Existing table
export const supabaseAiTrainingMetrics = pgTable("ai_training_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  modelVersion: text("model_version"),
  trainingType: text("training_type"), // voice, text, medical_terminology
  accuracy: numeric("accuracy", { precision: 5, scale: 4 }),
  trainingData: jsonb("training_data"),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_training_metrics_model_version").on(table.modelVersion),
  index("idx_ai_training_metrics_training_type").on(table.trainingType),
]);

// ========== SCHEMA EXPORTS ==========

export const insertMedicalAssessmentSchema = createInsertSchema(medicalAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  versionNumber: true,
  changeLog: true,
});

export const insertSupabaseUserSchema = createInsertSchema(supabaseUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormSessionSchema = createInsertSchema(supabaseFormSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoiceSessionSchema = createInsertSchema(supabaseVoiceSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

// Type definitions
export type InsertMedicalAssessment = z.infer<typeof insertMedicalAssessmentSchema>;
export type MedicalAssessment = typeof medicalAssessments.$inferSelect;

export type InsertSupabaseUser = z.infer<typeof insertSupabaseUserSchema>;
export type SupabaseUser = typeof supabaseUsers.$inferSelect;

export type InsertFormSession = z.infer<typeof insertFormSessionSchema>;
export type FormSession = typeof supabaseFormSessions.$inferSelect;

export type InsertVoiceSession = z.infer<typeof insertVoiceSessionSchema>;
export type VoiceSession = typeof supabaseVoiceSessions.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;