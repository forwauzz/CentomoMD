import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const medicalForms = pgTable("medical_forms", {
  id: serial("id").primaryKey(),
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
