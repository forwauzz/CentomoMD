import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SECTION_7_SAMPLE = `7. Historique de faits et évolution

La travailleuse et une chauffeuse de taxi adapté. Ses tâches consistent à conduire un taxi de transport adapté, elle accompagne les gens en fauteuil roulant et donc doit monter et descendre des rampes d'accès avec les patients en fauteuil et parfois elle doit transporter des marchandises médicales d'un hôpital à l'autre. Parfois elle doit conduire jusqu'à Montréal.

La fiche de réclamation de la travailleuse décrit l'événement suivant survenu le 12 août 2020 :

« Je montais une pente à l'hôpital de Valleyfield en poussant un chariot avec des glacières dessus et à la fin de la pentente j'ai senti grosse douleur au niveau du mollet droit avec sensation de brûlure… Quand fut le temps de reposer mon pied par terre, j'en étais incapable j'ai tout de suite communiqué avec mon employeur pour lui expliquer ce qui venait de se passer… comme j'étais déjà dans un hôpital, il m'a dit d'aller tout de suite consulter… »

La travailleuse consulte la même journée à l'urgence l'hôpital Barrie Memorial. Elle rencontre le docteur Abdelaziz Balha qui diagnostique une déchirure du mollet droit. Il prescrit des anti-inflammatoires, des relaxants musculaires et un arrêt de travail de 7 jours.

La travailleuse consulte à nouveau à l'urgence de l'hôpital de Barrie Memorial pour une douleur augmentée à son mollet droit, le 19 août 2020. Elle rencontre le docteur Herma Bessaoud qui prescrit un doppler veineux du membre inférieur droit. Celui-ci est réalisé et interprété par le docteur Arnold Radu, radiologiste. Le doppler démontre aucune thrombophlébite au niveau du membre inférieur droit. L'arrêt de travail est prolongé.

La travailleuse revoit le docteur Balha, le 24 août 2020. Il maintient le diagnostic de déchirure du mollet droit. Il prolonge l'arrêt de travail.

La travailleuse revoit le docteur Balha, le 31 août 2020. Il maintient le diagnostic de déchirure du mollet droit. Il prescrit un arrêt de travail de deux semaines et ne compte pas revoir la patiente.

La travailleuse rencontre le docteur Daniel Leblanc, le 3 novembre 2020. Il maintient le diagnostic de déchirure du mollet droit. Il prescrit de la physiothérapie et de l'ergothérapie. Il maintient l'arrêt de travail.

La travailleuse rencontre le docteur Adama-Rabi Youla, le 9 février 2021. Elle maintient le diagnostic de déchirure du mollet droit. Elle maintient les traitements en physiothérapie et ergothérapie. Elle juge la condition clinique stable. Elle prescrit une assignation temporaire à partir du 10 mars 2021.`;

export async function formatSection7Text(rawText: string, language: 'fr' | 'en' = 'fr'): Promise<string> {
  try {
    const systemPrompt = language === 'fr' 
      ? `Tu es un assistant médical expert qui formate les textes de rapports médicaux selon les standards professionnels québécois. 

INSTRUCTIONS:
- Formate le texte brut fourni selon le style de la Section 7 "Historique de faits et évolution"
- Utilise le format chronologique avec dates précises
- Structure le texte en paragraphes logiques
- Utilise le vocabulaire médical approprié
- Maintiens la troisième personne (le/la travailleur/travailleuse)
- Inclus les détails des consultations médicales, diagnostics, traitements
- Organise par dates et rendez-vous médicaux
- Respecte les conventions d'écriture médicale québécoise

EXEMPLE DE FORMAT:
${SECTION_7_SAMPLE}

Réponds uniquement avec le texte formaté, sans explications.`
      : `You are a medical expert assistant that formats medical report texts according to professional Quebec standards.

INSTRUCTIONS:
- Format the provided raw text according to Section 7 "Historical Facts and Evolution" style
- Use chronological format with precise dates
- Structure text in logical paragraphs
- Use appropriate medical vocabulary
- Maintain third person (the worker)
- Include details of medical consultations, diagnoses, treatments
- Organize by dates and medical appointments
- Respect Quebec medical writing conventions

FORMAT EXAMPLE:
${SECTION_7_SAMPLE}

Respond only with the formatted text, no explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Formate ce texte médical brut:\n\n${rawText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || rawText;
  } catch (error) {
    console.error('Error formatting Section 7 text:', error);
    // Return original text if formatting fails
    return rawText;
  }
}

export async function enhanceSection7Dictation(transcript: string, language: 'fr' | 'en' = 'fr'): Promise<{
  formatted: string;
  suggestions?: string[];
}> {
  try {
    const systemPrompt = language === 'fr'
      ? `Tu es un assistant médical qui aide à améliorer la dictée pour les rapports médicaux.

INSTRUCTIONS:
- Améliore et formate le texte dicté pour la Section 7 "Historique de faits et évolution"
- Corrige les erreurs de dictée vocale
- Structure chronologiquement
- Ajoute la ponctuation appropriée
- Utilise le vocabulaire médical correct
- Garde le contenu factuel intact
- Formate selon les standards médicaux québécois

Réponds en JSON avec:
{
  "formatted": "texte formaté",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`
      : `You are a medical assistant that helps improve dictation for medical reports.

INSTRUCTIONS:
- Improve and format dictated text for Section 7 "Historical Facts and Evolution"
- Correct voice dictation errors
- Structure chronologically
- Add appropriate punctuation
- Use correct medical vocabulary
- Keep factual content intact
- Format according to Quebec medical standards

Respond in JSON with:
{
  "formatted": "formatted text",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: transcript
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      formatted: result.formatted || transcript,
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.error('Error enhancing Section 7 dictation:', error);
    return {
      formatted: transcript,
      suggestions: []
    };
  }
}