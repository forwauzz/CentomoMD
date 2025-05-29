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

La travailleuse rencontre le docteur Adama-Rabi Youla, le 9 février 2021. Elle maintient le diagnostic de déchirure du mollet droit. Elle maintient les traitements en physiothérapie et ergothérapie. Elle juge la condition clinique stable. Elle prescrit une assignation temporaire à partir du 10 mars 2021.

EXEMPLE ADDITIONNEL:

La fiche de réclamation du travailleur décrit l'événement suivant survenu le 5 mars 2021 :

« Lors de la vérification du statut de mon véhicule j'ai monté sur le marché pieds et fait une rotation du genou. »

Le travailleur rencontre le docteur Martine Dupuis, le 5 mars 2021. Elle diagnostique une entorse du genou droit. Elle prescrit de la physiothérapie. Elle suggère un arrêt de travail.

Une radiographie du genou droit sera réalisée le 5 mars 2021. Cette dernière démontre :

« Pas de fracture grossière identifiée. Pincement sclérose et ostéophytose volumineuse en fémorotibial interne et externe ainsi que fémoropatellaire. Score à KL 4. »

Le travailleur revoit le docteur Lavoie-Lennon, le 17 janvier 2022. Elle maintient le diagnostic d'entorse genou droit, synovite genou droit et gonarthrose droite. Elle consolide le patient avec atteinte permanente à l'intégrité physique et limitations fonctionnelles.

EXEMPLE ADDITIONNEL 2 - CAS COMPLEXE:

La fiche de réclamation du travailleur décrit l'événement suivant survenu le 3 mars 2021 :

« Je nettoyais les tuiles au plafond. Quand je suis descendu de l'échelle, j'ai mis le pied dans un trou qui était dans le sol. Ma cheville droit a fait une torsion et je suis tombé. Au moment de la chute j'ai tenté de retenir avec ma main et je me suis fait mal au 3e doigt de la main droite. »

Le travailleur rencontre le docteur Mélinka Blais-Rétamal, le 4 mars 2021. Elle diagnostique une entorse à la cheville droite et une entorse du 3e doigt de la main droite. Elle prescrit des radiographies, suggère d'éviter la mise en charge, prescrit un arrêt de travail et de l'analgésie.

Le travailleur obtient des radiographies du pied et de la cheville droits, le 4 mars 2021. Elles sont interprétées par le docteur Anna Barbara Sinsky, radiologiste. Cette dernière constate :

« Pied et cheville droits
Il n'y a pas d'épanchement intra-articulaire à la cheville. Œdème des tissus mous autour de la malléole externe. La mortaise est bien préservée. Il n'y a pas d'anomalie démontrée au niveau du pied. »

Le travailleur revoit le docteur Ménard, le 7 mars 2023. Il diagnostique une entorse de la cheville droite et une atteinte tendineuse au niveau des muscles péroniers. Il juge la condition clinique stable.

Le travailleur revoit le docteur Ménard, le 27 février 2024. Il maintient le diagnostic d'entorse de cheville droite et atteinte tendineuse des muscles péroniers de la cheville droite. Il note une aggravation avec une fracture de la jambe gauche à la suite d'un déséquilibre.`;

export async function formatSection7Text(rawText: string, language: 'fr' | 'en' = 'fr'): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

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