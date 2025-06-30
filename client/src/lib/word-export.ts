import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';

interface FormData {
  [key: string]: any;
}

export async function exportToWord(formData: FormData, filename: string = 'medical-evaluation.docx'): Promise<void> {
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Section A - Worker Information
            new Paragraph({
              children: [
                new TextRun({
                  text: "A. RENSEIGNEMENTS SUR LE TRAVAILLEUR",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Nom : ", bold: true }),
                new TextRun({ text: formData.lastName || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Prénom : ", bold: true }),
                new TextRun({ text: formData.firstName || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "No d'assurance maladie : ", bold: true }),
                new TextRun({ text: formData.healthInsuranceNumber || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Date de naissance : ", bold: true }),
                new TextRun({ text: formData.birthDate || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Adresse : ", bold: true }),
                new TextRun({ text: formData.address || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Téléphone : ", bold: true }),
                new TextRun({ text: formData.phone || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "No de dossier du travailleur : ", bold: true }),
                new TextRun({ text: formData.workerFileNumber || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Date de l'évènement d'origine : ", bold: true }),
                new TextRun({ text: formData.originalEventDate || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Date de la récidive, rechute ou aggravation : ", bold: true }),
                new TextRun({ text: formData.recurrenceDate || "Nil" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Section B - Doctor Information
            new Paragraph({
              children: [
                new TextRun({
                  text: "B. RENSEIGNEMENTS SUR LE MÉDECIN",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Nom : ", bold: true }),
                new TextRun({ text: formData.doctorLastName || "CENTOMO" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Prénom : ", bold: true }),
                new TextRun({ text: formData.doctorFirstName || "Hugo" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "No permis : ", bold: true }),
                new TextRun({ text: formData.doctorLicenseNumber || "1-18154" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Adresse : ", bold: true }),
                new TextRun({ text: formData.doctorAddress || "5777 Boul. Gouin Ouest, Suite 370, Montréal, Qc, H4J 1E3" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Téléphone : ", bold: true }),
                new TextRun({ text: formData.doctorPhone || "514-331-1400" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Courriel : ", bold: true }),
                new TextRun({ text: formData.doctorEmail || "adjointe.orthopedie@gmail.com" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "DATE de l'expertise : ", bold: true }),
                new TextRun({ text: formData.expertiseDate || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Section C - Report
            new Paragraph({
              children: [
                new TextRun({
                  text: "C. RAPPORT",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Section 1 - Evaluation Mandate
            new Paragraph({
              children: [
                new TextRun({
                  text: "1. Mandat de l'évaluation",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Le but de l'évaluation est de répondre aux points suivants de l'article de la LATMP :" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "2) Date de consolidation." }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "3) Nature, nécessité́, suffisance, durée des soins ou traitements administrés ou prescrits." }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "4) a) Existence de l'atteinte permanente à l'intégrité́ physique ou psychique." }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "    b) Pourcentage de l'atteinte permanente à l'intégrité́ physique ou psychique." }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "5) a) Existence de limitations fonctionnelles résultant de la lésion professionnelle." }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "b) Évaluation des limitations fonctionnelles résultant de la lésion professionnelle." }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Section 2 - CNESST Accepted Diagnoses
            new Paragraph({
              children: [
                new TextRun({
                  text: "2. Diagnostics acceptés par la CNESST",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: formData.acceptedDiagnoses || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Section 3 - Interview Modality
            new Paragraph({
              children: [
                new TextRun({
                  text: "3. Modalité de l'entrevue",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: formData.interviewModality || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            // Section 4 - Identification
            new Paragraph({
              children: [
                new TextRun({
                  text: "4. Identification",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: formData.identification || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            // Section 5 - Medical History
            new Paragraph({
              children: [
                new TextRun({
                  text: "5. Antécédents",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: formData.medicalHistory || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            // Section 6 - Current Medication
            new Paragraph({
              children: [
                new TextRun({
                  text: "6. Médication actuelle et mesures thérapeutiques en cours",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: formData.currentMedication || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Section 7 - Historical Facts and Evolution
            new Paragraph({
              children: [
                new TextRun({
                  text: "7. Historique de faits et évolution",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: formData.historicalFacts || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Section 8 - Subjective Questionnaire
            new Paragraph({
              children: [
                new TextRun({
                  text: "8. Questionnaire subjectif et état actuel",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Appréciation subjective de l'évolution : ", bold: true }),
                new TextRun({ text: formData.subjectiveEvolution || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Plaintes et problèmes : ", bold: true }),
                new TextRun({ text: formData.complaintsProblems || "" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Impact sur AVQ/AVD : ", bold: true }),
                new TextRun({ text: formData.impactDaily || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Section 9 - Physical Examination
            new Paragraph({
              children: [
                new TextRun({
                  text: "9. Examen Physique",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Poids : ", bold: true }),
                new TextRun({ text: (formData.weight || "") + "\t\t" }),
                new TextRun({ text: "Taille : ", bold: true }),
                new TextRun({ text: (formData.height || "") + "\t\t" }),
                new TextRun({ text: "Dominance : ", bold: true }),
                new TextRun({ text: (formData.dominance || "") + "\t\t" }),
                new TextRun({ text: "Morphotype : ", bold: true }),
                new TextRun({ text: formData.morphotype || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Observation générale et attitude : ", bold: true }),
                new TextRun({ text: formData.generalObservation || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            // Continue with physical examination sections...
            new Paragraph({
              children: [
                new TextRun({ text: formData.physicalExamination || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            // Section 10 - Paraclinical Examinations
            new Paragraph({
              children: [
                new TextRun({
                  text: "10. Examens paracliniques",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: formData.paraclinicalExams || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Section 11 - Conclusion
            new Paragraph({
              children: [
                new TextRun({
                  text: "11. Conclusion",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Résumé : ", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: formData.summary || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Diagnostic : ", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: formData.diagnostic || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Date de consolidation : ", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: formData.consolidationDate || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Nature, nécessité́, suffisance, durée des soins ou traitements administrés ou prescrits : ", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: formData.treatmentNature || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Existence de l'atteinte permanente à l'intégrité́ physique ou psychique :", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: formData.permanentImpairmentExistence || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Pourcentage de l'atteinte permanente à l'intégrité́ physique ou psychique : ", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: formData.permanentImpairmentPercentage || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Existence de limitations fonctionnelles résultant de la lésion professionnelle : ", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: formData.functionalLimitationsExistence || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "Évaluation des limitations fonctionnelles résultant de la lésion professionnelle :", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: formData.functionalLimitationsEvaluation || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line

            // Section 12 - Permanent Impairment Percentage
            new Paragraph({
              children: [
                new TextRun({
                  text: "12. Pourcentage d'atteinte permanente à l'intégrité physique ou psychique",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            new Paragraph({
              children: [
                new TextRun({ text: "1.\tSÉQUELLES ACTUELLES", bold: true }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Add sequelae table content here if needed
            new Paragraph({
              children: [
                new TextRun({ text: formData.currentSequelae || "" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line

            // Doctor signature
            new Paragraph({
              children: [
                new TextRun({ text: "___________________________________" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Hugo Centomo, MD, PhD, FRCS ©" }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Chirurgien-orthopédiste" }),
              ],
            }),

            new Paragraph({ text: "" }), // Empty line
            new Paragraph({ text: "" }), // Empty line
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw new Error('Erreur lors de l\'exportation du document Word');
  }
}