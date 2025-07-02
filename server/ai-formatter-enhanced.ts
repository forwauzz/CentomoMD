import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ENHANCED_SECTION_7_SAMPLE = `7. Historique de faits et évolution

La fiche de réclamation du travailleur décrit l'événement suivant survenu le 22 octobre 2022.

« Chez les clients avec mon collègue au moment de descendre du camion avec le comptoir de quartz d'environ 350 lbs, le comptoir a basculer vers la gauche, j'ai senti un coup étirer mon bras vers l'arrière, j'ai senti un grand étirement avec une grosse douleur. »

Le travailleur consulte le docteur Nicolas Bussières, le 23 octobre 2020. Il diagnostique une élongation musculaire thorax gauche, pectoraux et tendinite épaule gauche traumatique. Il prescrit un arrêt de travail, de la physiothérapie et des anti-inflammatoires.

Le travailleur rencontre le docteur Marc Boudreau, le 5 novembre 2020. Il diagnostique une tendinite versus déchirure musculaire au niveau des trapèzes, grand dorsal et grand pectoral gauche. Il prescrit de la physiothérapie, un arrêt de travail et des anti-inflammatoires.

Le travailleur obtient des résonances magnétiques du rachis cervical, de l'épaule gauche et du trapèze et du grand pectoral gauche, le 29 décembre 2020. Elles sont interprétées par le docteur Lionel Buré, radiologiste. Ce dernier constate :

« IRM cervicale
…
Conclusion :
Changement dégénératif multi-étagés tel que décrit ci-haut avec une sténose foraminale sévère à gauche qui pourrait irriter la racine de C7 à corréler avec la clinique. »

Le travailleur rencontre le docteur Andréanne Marmen, chirurgienne orthopédiste, le 9 juin 2021. Elle diagnostique une déchirure partielle du supra-épineux, une bursite sous-acromio-deltoïdienne de l'épaule gauche ainsi qu'une symptomatologie cervicale prédominante. Elle maintient les traitements en physiothérapie et ergothérapie. Elle ne suggère pas de chirurgie et ne compte pas revoir le travailleur.

Le travailleur obtient une 3e infiltration sous-acromio-deltoïdienne de l'épaule gauche, le 2 septembre 2021. Elle est réalisée par le docteur Thierry Sabourin, radiologiste. Procédure bien tolérée sans complication immédiate.

Le travailleur rencontre le docteur Jimmy Hai Triêu Nguyen, chirurgien orthopédiste surspécialisé en membre supérieur, le 29 novembre 2021. Il note de multiples sources de douleurs, une plexopathie brachiale gauche probable, une cervicobrachialgie gauche sur sténose sévère C7 gauche, une tendinopathie du supra-épineux gauche et une tendinite du long chef du biceps. Il ne suggère pas de chirurgie à l'épaule gauche.

Le travailleur revoit le docteur Brodeur, le 21 janvier 2024. Elle suggère fortement une réorientation de carrière. Elle maintient les traitements en physiothérapie, acupuncture, psychologie ainsi que l'arrêt de travail.

Le docteur Brodeur produit un formulaire sur l'évolution des lésions, le 12 mars 2024. Elle juge que la lésion est toujours active qu'il y a une infiltration prévue en fin mars 2024 à la clinique de la douleur. Si cette infiltration est non efficace, elle suggère de consolider le travailleur avec séquelles. Elle note : « cas complexes qui devrait être évaluée au BEM. »`;

export async function enhancedFormatSection7Text(rawText: string, language: 'fr' | 'en' = 'fr'): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const systemPrompt = language === 'fr' 
      ? `Tu es un assistant médical expert qui formate les textes de rapports médicaux selon les standards professionnels québécois pour les lésions professionnelles CNESST.

INSTRUCTIONS SPÉCIALISÉES:
- Formate le texte brut fourni selon le style de la Section 7 "Historique de faits et évolution"
- Utilise EXCLUSIVEMENT "Le travailleur" ou "La travailleuse" (jamais "Le patient")
- Format chronologique strict avec dates précises (format: "le [jour] [mois] [année]")
- Préserve TOUTE la terminologie médicale spécialisée
- Maintiens les citations exactes entre guillemets « ... »
- Structure en paragraphes par consultation/procédure

ÉLÉMENTS CRITIQUES À PRÉSERVER:
- Descriptions d'événements entre guillemets exactes
- Noms complets des médecins avec titre "docteur"
- Spécialités complètes (chirurgien orthopédiste, physiatre, radiologiste, etc.)
- Diagnostics médicaux précis avec terminologie exacte
- Résultats d'examens avec conclusions complètes
- Évolution clinique (améliorée, stable, détériorée)
- Tous les traitements et procédures
- Infiltrations et examens d'imagerie

TERMINOLOGIE SPÉCIALISÉE QUÉBÉCOISE:
- Lésions: tendinite, élongation musculaire, déchirure partielle, entorse cervicale, plexopathie brachiale
- Anatomie: supra-épineux, trapèze, grand pectoral, rachis cervical, plexus brachial, C5-C7
- Examens: IRM, échographie, radiographie, arthro-IRM, EMG, doppler veineux
- Traitements: physiothérapie, ergothérapie, acupuncture, infiltration cortisonée
- Évolution: condition améliorée/stable/détériorée, plateau thérapeutique, consolidation avec séquelles

EXEMPLE DE FORMAT AUTHENTIQUE:
${ENHANCED_SECTION_7_SAMPLE}

Réponds uniquement avec le texte formaté selon ces standards stricts, sans explications.`
      : `You are a medical expert assistant that formats medical report texts according to professional Quebec standards for occupational injuries.

INSTRUCTIONS:
- Format the provided raw text according to Section 7 "Historical Facts and Evolution" style
- Use "The worker" exclusively (never "The patient")
- Use chronological format with precise dates
- Preserve ALL specialized medical terminology
- Maintain exact quotes in quotation marks
- Structure in paragraphs by consultation/procedure

CRITICAL ELEMENTS TO PRESERVE:
- Exact event descriptions in quotes
- Full doctor names with "doctor" title
- Complete specialties (orthopedic surgeon, physiatrist, radiologist, etc.)
- Precise medical diagnoses with exact terminology
- Complete examination results with conclusions
- Clinical evolution (improved, stable, deteriorated)
- All treatments and procedures
- Infiltrations and imaging examinations

QUEBEC SPECIALIZED TERMINOLOGY:
- Injuries: tendinitis, muscle elongation, partial tear, cervical sprain, brachial plexopathy
- Anatomy: supraspinatus, trapezius, pectoralis major, cervical spine, brachial plexus, C5-C7
- Examinations: MRI, ultrasound, radiography, arthro-MRI, EMG, venous doppler
- Treatments: physiotherapy, occupational therapy, acupuncture, corticosteroid infiltration
- Evolution: improved/stable/deteriorated condition, therapeutic plateau, consolidation with sequelae

AUTHENTIC FORMAT EXAMPLE:
${ENHANCED_SECTION_7_SAMPLE}

Respond only with the formatted text according to these strict standards, no explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: language === 'fr' 
            ? `Formate ce texte médical brut selon les standards québécois CNESST:\n\n${rawText}`
            : `Format this raw medical text according to Quebec CNESST standards:\n\n${rawText}`
        }
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    return response.choices[0].message.content || rawText;
  } catch (error) {
    console.error('Error formatting Section 7 text with enhanced processor:', error);
    // Return original text if formatting fails
    return rawText;
  }
}

export async function enhancedEnhanceSection7Dictation(transcript: string, language: 'fr' | 'en' = 'fr'): Promise<{
  formatted: string;
  suggestions?: string[];
}> {
  try {
    const systemPrompt = language === 'fr'
      ? `Tu es un assistant médical qui aide à améliorer la dictée pour les rapports médicaux québécois CNESST.

INSTRUCTIONS:
- Améliore et formate le texte dicté pour la Section 7 "Historique de faits et évolution"
- Corrige les erreurs de dictée vocale courantes
- Utilise la terminologie médicale québécoise appropriée
- Maintiens le format chronologique avec dates
- Préserve le contenu médical essentiel
- Utilise "Le travailleur" ou "La travailleuse"

CORRECTIONS COMMUNES DE DICTÉE:
- "IRM" au lieu de "i.r.m." ou "imagerie"
- "Doctor" → "docteur"
- Noms propres de médecins
- Dates au format québécois
- Terminologie anatomique précise

EXEMPLE DE FORMAT:
${ENHANCED_SECTION_7_SAMPLE}

Retourne le texte amélioré et formaté.`
      : `You are a medical assistant that helps improve dictation for Quebec CNESST medical reports.

INSTRUCTIONS:
- Improve and format dictated text for Section 7 "Historical Facts and Evolution"
- Correct common voice dictation errors
- Use appropriate Quebec medical terminology
- Maintain chronological format with dates
- Preserve essential medical content
- Use "The worker"

COMMON DICTATION CORRECTIONS:
- "MRI" instead of "m.r.i." or "imaging"
- "Doctor" formatting
- Proper medical names
- Quebec date format
- Precise anatomical terminology

FORMAT EXAMPLE:
${ENHANCED_SECTION_7_SAMPLE}

Return the improved and formatted text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: language === 'fr'
            ? `Améliore cette dictée médicale:\n\n${transcript}`
            : `Improve this medical dictation:\n\n${transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const enhancedText = response.choices[0].message.content || transcript;
    
    return {
      formatted: enhancedText,
      suggestions: [] // Could be enhanced with additional AI analysis
    };
  } catch (error) {
    console.error('Error enhancing Section 7 dictation:', error);
    return {
      formatted: transcript,
      suggestions: ['Unable to enhance dictation due to processing error']
    };
  }
}