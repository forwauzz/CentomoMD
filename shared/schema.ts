import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const medicalForms = pgTable("medical_forms", {
  id: serial("id").primaryKey(),
  
  // Section 1: Mandat de l'évaluation (checkboxes)
  mandatDiagnostic: boolean("mandat_diagnostic").default(false),
  mandatConsolidation: boolean("mandat_consolidation").default(false),
  mandatSoins: boolean("mandat_soins").default(false),
  mandatAtteinte: boolean("mandat_atteinte").default(false),
  mandatLimitations: boolean("mandat_limitations").default(false),
  
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
  appreciationEvolution: text("appreciation_evolution"),
  plaintesproblemes: text("plaintes_problemes"),
  impactAvq: text("impact_avq"),
  
  // Section 9: Examen Physique
  examenPoids: text("examen_poids"),
  examenTaille: text("examen_taille"),
  examenDominance: text("examen_dominance"),
  observationGenerale: text("observation_generale"),
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
  piedsMvtsSousAstragaliensDroit: text("pieds_mvts_sous_astragaliens_droit"),
  piedsMvtsSousAstragaliensGauche: text("pieds_mvts_sous_astragaliens_gauche"),
  piedsMvtsMidTarsienDroit: text("pieds_mvts_mid_tarsien_droit"),
  piedsMvtsMidTarsienGauche: text("pieds_mvts_mid_tarsien_gauche"),
  
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
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicalFormSchema = createInsertSchema(medicalForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMedicalForm = z.infer<typeof insertMedicalFormSchema>;
export type MedicalForm = typeof medicalForms.$inferSelect;

// Authentication tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("user"), // "admin" or "user"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Saved forms table for temporary storage
export const savedForms = pgTable("saved_forms", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  formData: jsonb("form_data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSavedFormSchema = createInsertSchema(savedForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSavedForm = z.infer<typeof insertSavedFormSchema>;
export type SavedForm = typeof savedForms.$inferSelect;
