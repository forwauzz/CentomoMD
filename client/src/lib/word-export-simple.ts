interface FormData {
  [key: string]: any;
}

export async function exportToWord(formData: FormData, filename: string = 'medical-evaluation.docx'): Promise<void> {
  try {
    // Create a simple HTML content that can be opened by Word
    const htmlContent = generateWordHTML(formData);
    
    // Create HTML that Word can open as a document
    const fullHtmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Évaluation Médicale</title>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
        h1 { font-size: 14pt; font-weight: bold; margin-top: 20pt; margin-bottom: 10pt; }
        h2 { font-size: 13pt; font-weight: bold; margin-top: 15pt; margin-bottom: 8pt; }
        p { margin-bottom: 6pt; }
        strong { font-weight: bold; }
        .signature { margin-top: 50pt; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
    
    const blob = new Blob([fullHtmlContent], { 
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.docx', '.doc');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error exporting to Word:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Erreur lors de l'exportation du document Word: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function generateWordHTML(formData: FormData): string {
  return `
    <h1>A. RENSEIGNEMENTS SUR LE TRAVAILLEUR</h1>
    <br><br>
    
    <p><strong>Nom :</strong> ${formData.lastName || ''}</p>
    <p><strong>Prénom :</strong> ${formData.firstName || ''}</p>
    <p><strong>No d'assurance maladie :</strong> ${formData.healthInsuranceNumber || ''}</p>
    <p><strong>Date de naissance :</strong> ${formData.birthDate || ''}</p>
    <p><strong>Adresse :</strong> ${formData.address || ''}</p>
    <p><strong>Téléphone :</strong> ${formData.phone || ''}</p>
    <p><strong>No de dossier du travailleur :</strong> ${formData.workerFileNumber || ''}</p>
    <p><strong>Date de l'évènement d'origine :</strong> ${formData.originalEventDate || ''}</p>
    <p><strong>Date de la récidive, rechute ou aggravation :</strong> ${formData.recurrenceDate || 'Nil'}</p>
    
    <br><br><br>
    
    <h1>B. RENSEIGNEMENTS SUR LE MÉDECIN</h1>
    <br><br>
    
    <p><strong>Nom :</strong> ${formData.doctorLastName || 'CENTOMO'}</p>
    <p><strong>Prénom :</strong> ${formData.doctorFirstName || 'Hugo'}</p>
    <p><strong>No permis :</strong> ${formData.doctorLicenseNumber || '1-18154'}</p>
    <p><strong>Adresse :</strong> ${formData.doctorAddress || '5777 Boul. Gouin Ouest, Suite 370, Montréal, Qc, H4J 1E3'}</p>
    <p><strong>Téléphone :</strong> ${formData.doctorPhone || '514-331-1400'}</p>
    <p><strong>Courriel :</strong> ${formData.doctorEmail || 'adjointe.orthopedie@gmail.com'}</p>
    
    <br>
    <p><strong>DATE de l'expertise :</strong> ${formData.expertiseDate || ''}</p>
    
    <br><br>
    
    <h1>C. RAPPORT</h1>
    <br><br>
    
    <h2>1. Mandat de l'évaluation</h2>
    <br><br>
    
    <p>Le but de l'évaluation est de répondre aux points suivants de l'article de la LATMP :</p>
    <p>2) Date de consolidation.</p>
    <br><br>
    <p>3) Nature, nécessité́, suffisance, durée des soins ou traitements administrés ou prescrits.</p>
    <br><br>
    <p>4) a) Existence de l'atteinte permanente à l'intégrité́ physique ou psychique.</p>
    <p>    b) Pourcentage de l'atteinte permanente à l'intégrité́ physique ou psychique.</p>
    <br><br>
    <p>5) a) Existence de limitations fonctionnelles résultant de la lésion professionnelle.</p>
    <p>b) Évaluation des limitations fonctionnelles résultant de la lésion professionnelle.</p>
    
    <br><br>
    
    <h2>2. Diagnostics acceptés par la CNESST</h2>
    <p>${formData.acceptedDiagnoses || ''}</p>
    
    <br><br><br>
    
    <h2>3. Modalité de l'entrevue</h2>
    <p>${formData.interviewModality || ''}</p>
    
    <br>
    
    <h2>4. Identification</h2>
    <p>${formData.identification || ''}</p>
    
    <br>
    
    <h2>5. Antécédents</h2>
    <p>${formData.medicalHistory || ''}</p>
    
    <br>
    
    <h2>6. Médication actuelle et mesures thérapeutiques en cours</h2>
    <p>${formData.currentMedication || ''}</p>
    
    <br><br>
    
    <h2>7. Historique de faits et évolution</h2>
    <p>${formData.historicalFacts || ''}</p>
    
    <br><br><br>
    
    <h2>8. Questionnaire subjectif et état actuel</h2>
    <p><strong>Appréciation subjective de l'évolution :</strong> ${formData.subjectiveEvolution || ''}</p>
    <p><strong>Plaintes et problèmes :</strong> ${formData.complaintsProblems || ''}</p>
    <p><strong>Impact sur AVQ/AVD :</strong> ${formData.impactDaily || ''}</p>
    
    <br><br>
    
    <h2>9. Examen Physique</h2>
    <p><strong>Poids :</strong> ${formData.weight || ''} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Taille :</strong> ${formData.height || ''} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Dominance :</strong> ${formData.dominance || ''} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Morphotype :</strong> ${formData.morphotype || ''}</p>
    
    <br><br>
    <p><strong>Observation générale et attitude :</strong> ${formData.generalObservation || ''}</p>
    <br>
    <p>${formData.physicalExamination || ''}</p>
    
    <br>
    
    <h2>10. Examens paracliniques</h2>
    <p>${formData.paraclinicalExams || ''}</p>
    
    <br><br><br>
    
    <h2>11. Conclusion</h2>
    <br><br>
    
    <p><strong>Résumé :</strong></p>
    <p>${formData.summary || ''}</p>
    
    <br>
    
    <p><strong>Diagnostic :</strong></p>
    <p>${formData.diagnostic || ''}</p>
    
    <br>
    
    <p><strong>Date de consolidation :</strong></p>
    <p>${formData.consolidationDate || ''}</p>
    
    <br>
    
    <p><strong>Nature, nécessité́, suffisance, durée des soins ou traitements administrés ou prescrits :</strong></p>
    <p>${formData.treatmentNature || ''}</p>
    
    <br>
    
    <p><strong>Existence de l'atteinte permanente à l'intégrité́ physique ou psychique :</strong></p>
    <p>${formData.permanentImpairmentExistence || ''}</p>
    
    <br>
    
    <p><strong>Pourcentage de l'atteinte permanente à l'intégrité́ physique ou psychique :</strong></p>
    <p>${formData.permanentImpairmentPercentage || ''}</p>
    
    <br>
    
    <p><strong>Existence de limitations fonctionnelles résultant de la lésion professionnelle :</strong></p>
    <p>${formData.functionalLimitationsExistence || ''}</p>
    
    <br>
    
    <p><strong>Évaluation des limitations fonctionnelles résultant de la lésion professionnelle :</strong></p>
    <p>${formData.functionalLimitationsEvaluation || ''}</p>
    
    <br>
    
    <h2>12. Pourcentage d'atteinte permanente à l'intégrité physique ou psychique</h2>
    <br><br>
    
    <p><strong>1. SÉQUELLES ACTUELLES</strong></p>
    <br><br>
    <p>${formData.currentSequelae || ''}</p>
    
    <br><br><br><br><br><br><br>
    
    <p>___________________________________</p>
    <p>Hugo Centomo, MD, PhD, FRCS ©</p>
    <p>Chirurgien-orthopédiste</p>
    
    <br><br>
  `;
}