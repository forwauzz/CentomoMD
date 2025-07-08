// Patient data extraction and management service
// Modular approach to handle patient creation workflow

export interface PatientData {
  patientName: string;
  age?: string;
  dateEvaluation?: string;
  patientGender?: 'male' | 'female';
  diagnosis?: string;
  visitType: 'new' | 'follow-up' | 'draft';
  formType: string;
}

export interface RecentPatientPayload {
  patientName: string;
  visitType: 'new' | 'follow-up' | 'draft';
  formType: string;
  formData?: Record<string, any>;
  savedFormId?: number;
  patientAge?: string;
  patientGender?: string;
  diagnosis?: string;
}

/**
 * Extract patient data from form data with validation
 */
export function extractPatientData(formData: any, formType: 'draft' | 'copy' = 'draft'): PatientData | null {
  // Validate required fields
  const patientName = formData.patientName?.trim();
  if (!patientName || patientName.length === 0) {
    console.warn('Patient name is required for patient data extraction');
    return null;
  }

  return {
    patientName,
    age: formData.age?.trim() || undefined,
    dateEvaluation: formData.dateEvaluation || new Date().toLocaleDateString('fr-CA'),
    patientGender: formData.patientGender as 'male' | 'female' || undefined,
    diagnosis: formData.diagnosticsCnesst?.trim() || undefined,
    visitType: formType === 'draft' ? 'draft' : 'new',
    formType: 'cnesst-medical'
  };
}

/**
 * Create a recent patient payload for API submission
 */
export function createRecentPatientPayload(
  patientData: PatientData,
  savedFormId: number,
  formData?: any
): RecentPatientPayload {
  return {
    patientName: patientData.patientName,
    visitType: patientData.visitType,
    formType: patientData.formType,
    formData: {
      age: patientData.age,
      gender: patientData.patientGender,
      dateEvaluation: patientData.dateEvaluation,
      patientName: patientData.patientName
    },
    savedFormId,
    patientAge: patientData.age,
    patientGender: patientData.patientGender,
    diagnosis: patientData.diagnosis
  };
}

/**
 * Validate patient data before submission
 */
export function validatePatientData(patientData: PatientData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!patientData.patientName?.trim()) {
    errors.push('Patient name is required');
  }

  if (patientData.patientName && patientData.patientName.length < 2) {
    errors.push('Patient name must be at least 2 characters');
  }

  if (patientData.patientGender && !['male', 'female'].includes(patientData.patientGender)) {
    errors.push('Invalid gender value');
  }

  // Validate visit type consistency
  if (!['new', 'follow-up', 'draft'].includes(patientData.visitType)) {
    errors.push('Invalid visit type');
  }

  // Validate form type
  if (!patientData.formType || patientData.formType.trim().length === 0) {
    errors.push('Form type is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Clean up previous patient session data
 */
export function cleanupPreviousPatientSession(): void {
  // Clear any lingering patient-specific session data
  sessionStorage.removeItem('currentPatientId');
  sessionStorage.removeItem('currentPatientName');
  sessionStorage.removeItem('patientFormDirty');
  
  // Clear auto-save data that might be patient-specific
  localStorage.removeItem('centMD_formData');
  localStorage.removeItem('medical-form-autosave');
  
  console.log('Previous patient session data cleaned up');
}

/**
 * Generate a default patient title for forms
 */
export function generatePatientTitle(patientData: PatientData, language: 'fr' | 'en' = 'fr'): string {
  const baseTitle = patientData.visitType === 'draft' 
    ? (language === 'fr' ? 'Brouillon' : 'Draft')
    : (language === 'fr' ? 'Évaluation' : 'Evaluation');

  const date = patientData.dateEvaluation || new Date().toLocaleDateString('fr-CA');
  
  return `${baseTitle} - ${patientData.patientName} (${date})`;
}

/**
 * Extract age number from age text field
 */
export function extractAgeFromText(ageText: string): string | undefined {
  if (!ageText) return undefined;
  
  // Look for numbers in the age text
  const ageMatch = ageText.match(/(\d+)\s*ans?/i) || ageText.match(/(\d+)/);
  return ageMatch ? ageMatch[1] : ageText.trim();
}