export async function exportToPDF(formData: any) {
  // For now, we'll use the browser's print functionality
  // In a production environment, you could integrate jsPDF or similar library
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour exporter en PDF');
    return;
  }

  const htmlContent = generatePrintableHTML(formData);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Focus on the new window and trigger print
  printWindow.focus();
  
  // Small delay to ensure content is loaded
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

function generatePrintableHTML(formData: any): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport d'Évaluation Médicale</title>
        <style>
            body {
                font-family: Times, "Times New Roman", serif;
                margin: 25mm 20mm;
                line-height: 1.2;
                color: #000;
                font-size: 12pt;
            }
            .section-title {
                font-weight: bold;
                font-size: 14pt;
                margin: 20px 0 15px 0;
                text-align: left;
                text-decoration: underline;
            }
            .field-row {
                margin-bottom: 8px;
                display: flex;
                align-items: baseline;
            }
            .field-label {
                font-weight: bold;
                margin-right: 5px;
                white-space: nowrap;
            }
            .field-value {
                border-bottom: 1px solid #000;
                min-height: 16px;
                flex: 1;
                padding-bottom: 1px;
                margin-right: 15px;
            }
            .numbered-list {
                margin: 10px 0;
                padding-left: 0;
            }
            .numbered-list li {
                margin-bottom: 8px;
                list-style: none;
            }
            .indent {
                margin-left: 20px;
            }
            .table-container {
                margin: 15px 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11pt;
            }
            th, td {
                border: 1px solid #000;
                padding: 4px 6px;
                text-align: left;
                vertical-align: top;
            }
            th {
                font-weight: bold;
                text-align: center;
            }
            .text-content {
                margin: 10px 0;
                text-align: justify;
                line-height: 1.3;
            }
            .page-break {
                page-break-before: always;
            }
            @media print {
                body { margin: 15mm 10mm; }
                .page-break { page-break-before: always; }
            }
        </style>
    </head>
    <body>
        ${generateFormSections(formData)}
    </body>
    </html>
  `;
}

function generateFormSections(formData: any): string {
  return `
    <div class="section-title">A. RENSEIGNEMENTS SUR LE TRAVAILLEUR</div>
    
    <div class="field-row">
      <span class="field-label">Nom :</span>
      <span class="field-value">${formData.workerLastName || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Prénom :</span>
      <span class="field-value">${formData.workerFirstName || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">No d'assurance maladie :</span>
      <span class="field-value">${formData.healthInsuranceNo || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Date de naissance :</span>
      <span class="field-value">${formData.birthDate || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Adresse :</span>
      <span class="field-value">${formData.workerAddress || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Téléphone :</span>
      <span class="field-value">${formData.workerPhone || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">No de dossier du travailleur :</span>
      <span class="field-value">${formData.workerFileNo || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Date de l'évènement d'origine :</span>
      <span class="field-value">${formData.originalEventDate || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Date de la récidive, rechute ou aggravation :</span>
      <span class="field-value">${formData.relapseDate || 'Nil'}</span>
    </div>

    <div class="section-title">B. RENSEIGNEMENTS SUR LE MÉDECIN</div>
    
    <div class="field-row">
      <span class="field-label">Nom :</span>
      <span class="field-value">CENTOMO</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Prénom :</span>
      <span class="field-value">Hugo</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">No permis :</span>
      <span class="field-value">1-18154</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Adresse :</span>
      <span class="field-value">5777 Boul. Gouin Ouest, Suite 370, Montréal, Qc, H4J 1E3</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Téléphone :</span>
      <span class="field-value">514-331-1400</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Courriel :</span>
      <span class="field-value">adjointe.orthopedie@gmail.com</span>
    </div>

    <div class="section-title">C. RAPPORT</div>
    
    <div style="font-weight: bold; margin: 15px 0 10px 0;">1. Mandat de l'évaluation</div>
    
    <div class="text-content">
      Le but de l'évaluation est de répondre aux points suivants de l'article de la LATMP :
    </div>
    
    <ol class="numbered-list">
      <li>1) Diagnostic</li>
      <li>2) Date de consolidation.</li>
      <li>3) Nature, nécessité, suffisance, durée des soins ou traitements administrés ou prescrits.</li>
      <li>4) a) Existence de l'atteinte permanente à l'intégrité physique ou psychique.<br>
          <span class="indent">b) Pourcentage de l'atteinte permanente à l'intégrité physique ou psychique.</span></li>
      <li>5) a) Existence de limitations fonctionnelles résultant de la lésion professionnelle.<br>
          <span class="indent">b) Évaluation des limitations fonctionnelles résultant de la lésion professionnelle.</span></li>
    </ol>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">2. Diagnostics acceptés par la CNESST</div>
    
    <div class="text-content">
      ${formData.acceptedDiagnosis || ''}
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">3. Modalité de l'entrevue</div>
    
    <div class="text-content">
      ${formData.interviewModality || ''}
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">4. Identification</div>
    
    <div class="text-content">
      ${formData.identification || ''}
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">5. Antécédents</div>
    
    <div class="field-row">
      <span class="field-label">Médicaux :</span>
      <span class="field-value">${formData.antecedentsMedicaux || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Chirurgicaux :</span>
      <span class="field-value">${formData.antecedentsChirurgicaux || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Au site et au pourtour de la lésion :</span>
      <span class="field-value">${formData.antecedentsLesion || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">CNESST :</span>
      <span class="field-value">${formData.antecedentsCnesst || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">SAAQ :</span>
      <span class="field-value">${formData.antecedentsSaaq || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Autres :</span>
      <span class="field-value">${formData.antecedentsAutres || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Allergie :</span>
      <span class="field-value">${formData.antecedentsAllergie || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Tabac :</span>
      <span class="field-value">${formData.antecedentsTabac || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Cannabis :</span>
      <span class="field-value">${formData.antecedentsCannabis || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Alcool :</span>
      <span class="field-value">${formData.antecedentsAlcool || ''}</span>
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">6. Médication actuelle et mesures thérapeutiques en cours</div>
    
    <div class="text-content">
      ${formData.medicationActuelle || ''}
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">7. Historique de faits et évolution</div>
    
    <div class="text-content">
      ${formData.historiqueEvolution || ''}
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">8. Questionnaire subjectif et état actuel</div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Appréciation subjective de l'évolution :</div>
    <div class="text-content">
      ${formData.appreciationEvolution || ''}
    </div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Plaintes et problèmes :</div>
    <div class="text-content">
      ${formData.plaintesproblemes || ''}
    </div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Impact sur AVQ/AVD :</div>
    <div class="text-content">
      ${formData.impactAvq || ''}
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">9. Examen Physique</div>
    
    <div class="field-row">
      <span class="field-label">Poids :</span>
      <span class="field-value">${formData.examenPoids || ''}</span>
      <span class="field-label" style="margin-left: 40px;">Taille :</span>
      <span class="field-value">${formData.examenTaille || ''}</span>
      <span class="field-label" style="margin-left: 40px;">Dominance :</span>
      <span class="field-value">${formData.examenDominance || ''}</span>
    </div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Observation générale et attitude :</div>
    <div class="text-content">
      ${formData.observationGenerale || ''}
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">Rachis Lombaire :</div>
    
    <div class="field-row">
      <span class="field-label">Palpation :</span>
      <span class="field-value">${formData.rachisPalpation || ''}</span>
    </div>
    
    <div class="field-row">
      <span class="field-label">Inspection :</span>
      <span class="field-value">${formData.rachisInspection || ''}</span>
    </div>

    <div class="table-container">
      <table>
        <tr>
          <th>Patient(e)</th>
          <th>Normale</th>
        </tr>
        <tr>
          <td>Flexion</td>
          <td>90°</td>
        </tr>
        <tr>
          <td>Extension</td>
          <td>30°</td>
        </tr>
        <tr>
          <td>Flexion Latérale G.</td>
          <td>30°</td>
        </tr>
        <tr>
          <td>Flexion Latérale D.</td>
          <td>30°</td>
        </tr>
        <tr>
          <td>Rotation G.</td>
          <td>30°</td>
        </tr>
        <tr>
          <td>Rotation D.</td>
          <td>30°</td>
        </tr>
      </table>
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">Manœuvres radiculaires :</div>
    
    <div class="table-container">
      <table>
        <tr>
          <th></th>
          <th>Droit</th>
          <th>Gauche</th>
        </tr>
        <tr>
          <td>S.L.R.</td>
          <td>Neg</td>
          <td>Neg</td>
        </tr>
        <tr>
          <td>Tripode</td>
          <td>Neg</td>
          <td>Neg</td>
        </tr>
        <tr>
          <td>Lasègue</td>
          <td>Neg</td>
          <td>Neg</td>
        </tr>
        <tr>
          <td>Lasègue inversé (Ely)</td>
          <td>Neg</td>
          <td>Neg</td>
        </tr>
      </table>
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">Examens additionnels :</div>
    <div class="text-content">
      ${formData.examensAdditionnels || ''}
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">10. Examens paracliniques</div>
    <div class="text-content">
      Vous référez au point 7, Historique des faits et évolution.
    </div>

    <div style="font-weight: bold; margin: 15px 0 10px 0;">11. Conclusion</div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Résumé :</div>
    <div class="text-content">
      ${formData.conclusionResume || ''}
    </div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Diagnostic :</div>
    <div class="text-content">
      ${formData.conclusionDiagnostic || ''}
    </div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Date de consolidation :</div>
    <div class="text-content">
      ${formData.conclusionDateConsolidation || ''}
    </div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Nature, nécessité́, suffisance, durée des soins ou traitements administrés ou prescrits :</div>
    <div class="text-content">
      ${formData.conclusionSoinsTraitements || ''}
    </div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Existence de l'atteinte permanente à l'intégrité́ physique ou psychique :</div>
    <div class="text-content">
      ${formData.conclusionAtteintePermanente || ''}
    </div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Existence de limitations fonctionnelles résultant de la lésion professionnelle :</div>
    <div class="text-content">
      ${formData.conclusionLimitationsFonctionnelles || ''}
    </div>
    
    <div style="font-weight: bold; margin: 10px 0 5px 0;">Évaluation des limitations fonctionnelles résultant de la lésion professionnelle :</div>
    <div class="text-content">
      ${formData.conclusionEvaluationLimitations || ''}
    </div>
  `;
}
