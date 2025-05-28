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
        <title>Cent.MD - Rapport Médical</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.4;
                color: #000;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .section {
                margin-bottom: 20px;
                border: 1px solid #000;
                page-break-inside: avoid;
            }
            .section-header {
                background-color: #f0f0f0;
                padding: 10px;
                font-weight: bold;
                border-bottom: 1px solid #000;
            }
            .section-content {
                padding: 15px;
            }
            .field-group {
                margin-bottom: 10px;
                display: flex;
                align-items: flex-start;
            }
            .field-label {
                min-width: 150px;
                font-weight: bold;
                margin-right: 10px;
            }
            .field-value {
                flex: 1;
                border-bottom: 1px solid #ccc;
                min-height: 20px;
                padding-bottom: 2px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            th, td {
                border: 1px solid #000;
                padding: 5px;
                text-align: left;
            }
            th {
                background-color: #f0f0f0;
                font-weight: bold;
            }
            @media print {
                body { margin: 0; }
                .section { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Cent.MD</h1>
            <h2>Rapport d'Évaluation Médicale</h2>
        </div>
        
        <!-- Generate sections dynamically based on formData -->
        ${generateFormSections(formData)}
        
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
    </body>
    </html>
  `;
}

function generateFormSections(formData: any): string {
  // This would generate the actual form sections based on the data
  // For now, return a placeholder
  return `
    <div class="section">
        <div class="section-header">C. RAPPORT</div>
        <div class="section-content">
            <p>Les données du formulaire seraient formatées ici...</p>
        </div>
    </div>
  `;
}
