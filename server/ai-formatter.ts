import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===== NEW: VOICE RECOGNITION ERROR CORRECTION =====
// This fixes common voice recognition errors BEFORE sending to ChatGPT
function fixVoiceRecognitionErrors(text: string): string {
  const corrections: { [key: string]: string } = {
    // Medical professionals (most critical for Quebec standards)
    docter: "docteur",
    docktor: "docteur",
    docteure: "docteur",
    "dr ": "docteur ",
    "dr.": "docteur",

    // Patient terminology (CRITICAL for Quebec CNESST compliance)
    "le patient": "le travailleur",
    "la patient": "la travailleuse",
    "la patiente": "la travailleuse",
    "du patient": "du travailleur",
    "de la patiente": "de la travailleuse",
    "au patient": "au travailleur",
    "à la patiente": "à la travailleuse",

    // Medical terminology corrections
    "supra épineu": "supra-épineux",
    "supra épineux": "supra-épineux",
    "supra-épineu": "supra-épineux",
    écographie: "échographie",
    "écho-graphie": "échographie",
    échograpie: "échographie",

    // Treatment terminology
    "infiltration cortisone": "infiltration cortisonée",
    "infiltration de cortisone": "infiltration cortisonée",
    "infiltration cortizone": "infiltration cortisonée",
    "physio-thérapie": "physiothérapie",
    "physio thérapie": "physiothérapie",
    "ergo-thérapie": "ergothérapie",
    "ergo thérapie": "ergothérapie",
    "accu-puncture": "acupuncture",
    "acu-puncture": "acupuncture",

    // Anatomy corrections
    plexopathy: "plexopathie",
    "plexopathy brachial": "plexopathie brachiale",
    "plexo-pathie": "plexopathie",
    "rachis cervicals": "rachis cervical",
    trapèze: "trapèze",
    "grand pectoral": "grand pectoral",

    // Examination terminology
    "I.R.M": "IRM",
    "I R M": "IRM",
    irm: "IRM",
    "E.M.G": "EMG",
    "E M G": "EMG",
    emg: "EMG",
    "arthro IRM": "arthro-IRM",
    "doppler veineux": "doppler veineux",
    "dopler veineux": "doppler veineux",

    // Medical conditions
    tendinite: "tendinite",
    "élongation musculaire": "élongation musculaire",
    "déchirure partielle": "déchirure partielle",
    "entorse cervicale": "entorse cervicale",

    // Evolution terms (important for medical accuracy)
    améliorer: "améliorée",
    amélioré: "améliorée",
    stable: "stable",
    détériorer: "détériorée",
    détérioré: "détériorée",
    "plateau thérapeutiques": "plateau thérapeutique",
    "consolidation avec séquelle": "consolidation avec séquelles",

    // Date corrections (common voice recognition issues)
    "le premier": "le 1er",
    "le deux": "le 2",
    "le trois": "le 3",
    "le quatre": "le 4",
    "le cinq": "le 5",
    "le six": "le 6",
    "le sept": "le 7",
    "le huit": "le 8",
    "le neuf": "le 9",
    "le dix": "le 10",
  };

  let corrected = text;
  Object.entries(corrections).forEach(([error, correction]) => {
    // Use word boundaries to avoid partial replacements
    const regex = new RegExp(`\\b${error}\\b`, "gi");
    corrected = corrected.replace(regex, correction);
  });

  return corrected;
}

// ===== NEW: ENHANCED VOICE PROCESSING WITH LOGGING =====
// This function processes voice input and shows what was fixed
export function enhanceVoiceInput(transcript: string): {
  original: string;
  enhanced: string;
  corrections: string[];
} {
  const original = transcript;
  const enhanced = fixVoiceRecognitionErrors(transcript);

  const corrections: string[] = [];
  if (enhanced !== original) {
    // Log what changed for debugging/validation
    if (enhanced.includes("docteur") && original.includes("docter")) {
      corrections.push('Fixed "docteur" spelling');
    }
    if (enhanced.includes("travailleur") && original.includes("patient")) {
      corrections.push("Applied Quebec worker terminology");
    }
    if (
      enhanced.includes("supra-épineux") &&
      original.includes("supra épineu")
    ) {
      corrections.push("Corrected medical terminology");
    }
    if (
      enhanced.includes("infiltration cortisonée") &&
      original.includes("infiltration cortisone")
    ) {
      corrections.push("Fixed treatment terminology");
    }
    if (corrections.length === 0) {
      corrections.push("Applied medical terminology corrections");
    }
  }

  return { original, enhanced, corrections };
}

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

Le travailleur revoit le docteur Ménard, le 27 février 2024. Il maintient le diagnostic d'entorse de cheville droite et atteinte tendineuse des muscles péroniers de la cheville droite. Il note une aggravation avec une fracture de la jambe gauche à la suite d'un déséquilibre.

EXEMPLE ADDITIONNEL 3 - CAS GENOU COMPLEXE:

Le travailleur est ouvrier d'entrepôt et travaille au débarcadère. Ses tâches consistent à faire la réception des produits, décharger les camions, manœuvrer le chariot élévateur et le chariot électrique, placer les produits dans le réfrigérateur ou congélateur.

La fiche de réclamation du travailleur décrit l'événement suivant survenu le 9 novembre 2022 :

« Je venais juste de finir une tâche qui consistait à débarquer un container. En rentrant les palettes de lait, je ramène le chariot à palettes, je fais un pas et le second je trébuche et c'est mon genou qui fait très mal, après c'est l'hôpital. »

Le travailleur consulte le docteur Ashwin Sairam, le 16 novembre 2022. Il diagnostique une entorse du genou droit et prescrit une résonance magnétique afin d'exclure une déchirure méniscale et une déchirure du ligament collatéral interne du genou droit.

Le travailleur obtient une résonance magnétique du genou droit, le 22 avril 2023. Elle est interprétée par le docteur Yves Benabu, radiologiste. Ce dernier constate :

« Compartiment interne :
Aspect macéré, dégénéré du ménisque interne où on note une déchirure et un aspect macéré complexe de la corne postérieure avec une déchirure en anse de seau avec un fragment du ménisque venant s'interposer au sein de l'échancrure intercondylienne, mesurant jusqu'à 25 x 4 mm. »

Le travailleur revoit le docteur Sairam, le 18 mai 2023. Il maintient le diagnostic d'entorse du genou droit et ajoute les diagnostics de déchirure du ménisque interne et du ligament croisé antérieur suivant les résultats de la résonance magnétique.

Le travailleur revoit le docteur Sairam, le 19 juin 2024. Il juge la condition clinique améliorée. Il augmente les jours de travail à tâches régulières à 5 jours par semaine. Il note : « besoin d'expertise 204 ».

EXEMPLE ADDITIONNEL 4 - CAS ÉPAULE COMPLEXE AVEC ÉVOLUTION LONGUE:

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

// ===== ENHANCED: Section 7 with voice correction preprocessing =====
export async function formatSection7Text(
  rawText: string,
  language: "fr" | "en" = "fr",
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    // ✨ NEW: Pre-process text to fix voice recognition errors
    const voiceEnhanced = fixVoiceRecognitionErrors(rawText);

    const systemPrompt =
      language === "fr"
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

VARIATION OBLIGATOIRE - ÉVITE LA RÉPÉTITION MÉCANIQUE:
- VARIE les verbes de consultation: "consulte", "rencontre", "revoit", "obtient un rendez-vous avec", "se présente chez"
- ALTERNE les structures de phrases pour créer un flow naturel
- UTILISE différentes introductions temporelles: "Le [date]", "En date du [date]", "Lors de la consultation du [date]"
- ÉVITE absolument de répéter la même formulation dans un même document
- ADAPTE le vocabulaire selon le contexte (première consultation = "consulte", suivi = "revoit")

GESTION DES DONNÉES MANQUANTES:
- Si un nom de médecin est incomplet ou manquant, utilise "médecin traitant", "professionnel de la santé" ou "médecin de famille"
- Si des détails sont flous, concentre-toi sur les éléments clairs et vérifiables
- N'invente JAMAIS d'information qui n'est pas explicitement dans le texte source
- Pour les noms partiels, utilise le fragment disponible avec le titre approprié

TERMINOLOGIE SPÉCIALISÉE QUÉBÉCOISE:
- Lésions: tendinite, élongation musculaire, déchirure partielle, entorse cervicale, plexopathie brachiale
- Anatomie: supra-épineux, trapèze, grand pectoral, rachis cervical, plexus brachial, C5-C7
- Examens: IRM, échographie, radiographie, arthro-IRM, EMG, doppler veineux
- Traitements: physiothérapie, ergothérapie, acupuncture, infiltration cortisonée
- Évolution: condition améliorée/stable/détériorée, plateau thérapeutique, consolidation avec séquelles

EXEMPLES DE FORMAT AUTHENTIQUE:
${SECTION_7_SAMPLE}

Réponds uniquement avec le texte formaté selon ces standards stricts, sans explications.`
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
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Formate ce texte médical brut:\n\n${voiceEnhanced}`, // ✨ Now using voice-enhanced text
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || rawText;
  } catch (error) {
    console.error("Error formatting Section 7 text:", error);
    // Return original text if formatting fails
    return rawText;
  }
}

// ===== ENHANCED: Section 7 dictation with voice preprocessing =====
export async function enhanceSection7Dictation(
  transcript: string,
  language: "fr" | "en" = "fr",
): Promise<{
  formatted: string;
  suggestions?: string[];
  voiceCorrections?: string[];
}> {
  try {
    // ✨ NEW: First, fix voice recognition errors and log what was fixed
    const voiceResult = enhanceVoiceInput(transcript);

    const systemPrompt =
      language === "fr"
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
          content: systemPrompt,
        },
        {
          role: "user",
          content: voiceResult.enhanced, // ✨ Using voice-enhanced text
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      formatted: result.formatted || transcript,
      suggestions: result.suggestions || [],
      voiceCorrections: voiceResult.corrections, // ✨ NEW: Return what voice corrections were made
    };
  } catch (error) {
    console.error("Error enhancing Section 7 dictation:", error);
    return {
      formatted: transcript,
      suggestions: [],
      voiceCorrections: [],
    };
  }
}

const SECTION_8_SAMPLE = `8. Questionnaire subjectif et état actuel

Appréciation subjective de l'évolution : La travailleuse rapporte une nette amélioration depuis son accident. Elle rapporte que dans les derniers mois, elle a observé peu d'amélioration au niveau de sa condition et juge d'elle-même qu'elle a atteint un plateau thérapeutique en physiothérapie et ergothérapie. Elle a des doutes quant à sa capacité de reprendre son travail comme chauffeur de taxi adapté étant donné la marchepied «step» qu'elle doit toujours utiliser pour monter et descendre de son véhicule. Elle doute aussi d'être en mesure de pousser ou tirer les patients en chaise roulante. Elle juge son amélioration à environ 75 à 80% de son état de base.

Plaintes et problèmes : Elle se plaint principalement de sensations de brûlure intermittente au niveau de son mollet droite et au niveau antérieur de sa jambe droite. Elle ne peut rapporter d'éléments déclencheurs de ses douleurs et elles surviennent subitement. Elle rapporte des douleurs au niveau de la cheville droite surtout en fin d'amplitude articulaire. Elle rapporte avoir moins de douleurs et avoir une meilleure tolérance à l'effort lorsqu'il fait des échauffements avant de faire ses activités comme prescrit et démontré en physiothérapie.

Elle rapporte une diminution de la force ainsi que de l'endurance musculaire au membre inférieur droite. Elle commence à exprimer de la fatigue lorsqu'elle a une position debout prolongée ou lorsqu'elle marche sur une durée d'environ 1h00 à 1h30.

Elle ne rapporte pas de douleur nocturne mais éprouve des raideurs matinales au niveau de sa cheville droite. Elle rapporte avoir des douleurs à sa cheville droite lors des changements barométriques. Elle ne rapporte aucun symptôme spécifique au niveau de son genou droit.

Impact sur AVQ/AVD : cf feuille en annexe.`;

// ===== ENHANCED: Section 8 with voice correction preprocessing =====
export async function formatSection8Text(
  rawText: string,
  language: "fr" | "en" = "fr",
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    // ✨ NEW: Pre-process text to fix voice recognition errors
    const voiceEnhanced = fixVoiceRecognitionErrors(rawText);

    const systemPrompt =
      language === "fr"
        ? `Tu es un assistant médical expert qui formate les textes de rapports médicaux selon les standards professionnels québécois.

INSTRUCTIONS:
- Formate le texte brut fourni selon le style de la Section 8 "Questionnaire subjectif et état actuel"
- Structure le texte en trois sous-sections distinctes :
  1. "Appréciation subjective de l'évolution :" (perception du patient, plateau thérapeutique, pourcentage d'amélioration, capacités fonctionnelles)
  2. "Plaintes et problèmes :" (symptômes spécifiques, douleurs, localisations, facteurs déclencheurs, limitations)
  3. "Impact sur AVQ/AVD :" (impact sur les activités de la vie quotidienne et domestique)
- Utilise le vocabulaire médical approprié
- Maintiens la troisième personne (le/la travailleur/travailleuse)
- Organise les informations de manière logique
- Respecte les conventions d'écriture médicale québécoise

EXEMPLE DE FORMAT:
${SECTION_8_SAMPLE}

Réponds uniquement avec le texte formaté, sans explications.`
        : `You are a medical expert assistant that formats medical report texts according to professional Quebec standards.

INSTRUCTIONS:
- Format the provided raw text according to Section 8 "Subjective questionnaire and current state" style
- Structure text in three distinct subsections:
  1. "Subjective appreciation of evolution:" (patient perception, therapeutic plateau, improvement percentage, functional capabilities)
  2. "Complaints and problems:" (specific symptoms, pain, locations, triggers, limitations)
  3. "Impact on ADL:" (impact on activities of daily living)
- Use appropriate medical vocabulary
- Maintain third person (the worker)
- Organize information logically
- Respect Quebec medical writing conventions

FORMAT EXAMPLE:
${SECTION_8_SAMPLE}

Respond only with the formatted text, no explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Formate ce texte médical brut:\n\n${voiceEnhanced}`, // ✨ Now using voice-enhanced text
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || rawText;
  } catch (error) {
    console.error("Error formatting Section 8 text:", error);
    // Return original text if formatting fails
    return rawText;
  }
}

// ===== ENHANCED: Section 8 dictation with voice preprocessing =====
export async function enhanceSection8Dictation(
  transcript: string,
  language: "fr" | "en" = "fr",
): Promise<{
  formatted: string;
  suggestions?: string[];
  voiceCorrections?: string[];
}> {
  try {
    // ✨ NEW: First, fix voice recognition errors and log what was fixed
    const voiceResult = enhanceVoiceInput(transcript);

    const systemPrompt =
      language === "fr"
        ? `Tu es un assistant médical qui aide à améliorer la dictée pour les rapports médicaux.

INSTRUCTIONS:
- Améliore et formate le texte dicté pour la Section 8 "Questionnaire subjectif et état actuel"
- Corrige les erreurs de dictée vocale
- Structure en trois sous-sections : Appréciation subjective, Plaintes et problèmes, Impact sur AVQ/AVD
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
- Improve and format dictated text for Section 8 "Subjective questionnaire and current state"
- Correct voice dictation errors
- Structure in three subsections: Subjective appreciation, Complaints and problems, Impact on ADL
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
          content: systemPrompt,
        },
        {
          role: "user",
          content: voiceResult.enhanced, // ✨ Using voice-enhanced text
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      formatted: result.formatted || transcript,
      suggestions: result.suggestions || [],
      voiceCorrections: voiceResult.corrections, // ✨ NEW: Return what voice corrections were made
    };
  } catch (error) {
    console.error("Error enhancing Section 8 dictation:", error);
    return {
      formatted: transcript,
      suggestions: [],
      voiceCorrections: [],
    };
  }
}

// ===== ENHANCED: Section 11 (keeping original functionality) =====
export async function generateSection11Conclusion(
  formData: any,
  language: "fr" | "en" = "fr",
): Promise<{
  resume: string;
  diagnostic: string;
  dateConsolidation: string;
  soinsTraitements: string;
  atteintePermanente: string;
  limitationsFonctionnelles: string;
  evaluationLimitations: string;
}> {
  try {
    const medicalHistory = formData.antecedentsMedicaux || "";
    const surgicalHistory = formData.antecedentsChirurgicaux || "";
    const medication = formData.medicationActuelle || "";
    const historyEvolution = formData.historiqueEvolution || "";
    const subjectiveAssessment = formData.appreciationEvolution || "";
    const complaintsProblems = formData.plaintesproblemes || "";
    const impactADL = formData.impactAvq || "";
    const physicalExam = formData.observationGenerale || "";

    const prompt =
      language === "fr"
        ? `Tu es Dr. Centomo, expert en évaluations médicales CNESST. Génère une conclusion complète basée sur les données médicales suivantes:

ANTÉCÉDENTS MÉDICAUX: ${medicalHistory}
ANTÉCÉDENTS CHIRURGICAUX: ${surgicalHistory}
MÉDICATION ACTUELLE: ${medication}
HISTORIQUE DES FAITS ET ÉVOLUTION: ${historyEvolution}
APPRÉCIATION SUBJECTIVE: ${subjectiveAssessment}
PLAINTES ET PROBLÈMES: ${complaintsProblems}
IMPACT SUR AVQ/AVD: ${impactADL}
EXAMEN PHYSIQUE: ${physicalExam}

Utilise l'exemple suivant comme référence pour le style et la structure:

EXEMPLES DE FORMATION:

EXEMPLE RÉSUMÉ 1:
"Il s'agit d'une femme de 49 ans, sans antécédent connu au membre inférieur droit avant l'événement d'origine du 12 août 2020. Elle s'est infligé une déchirure du mollet droit, cette lésion a fait l'objet de traitement par un protocole de réadaptation en physiothérapie et ergothérapie avec atteinte de plateau thérapeutique en août 2021..."

EXEMPLE RÉSUMÉ 2:
"Il s'agit d'un homme de 58 ans sans antécédents connus au membre inférieur droit avant l'événement d'origine du 9 novembre 2022. Il s'est infligé une entorse du genou droit, une déchirure du ménisque interne et une déchirure du ligament croisé antérieur du genou droit. Ces lésions sont objectivées par résonance magnétique. Le travailleur bénéficiera de traitements en physiothérapie, ergothérapie et acupuncture. Évolution favorable, il reprendra le travail. Sur le plan subjectif, le travailleur se plaint d'une douleur en interne de son genou droit qui est exacerbée par les tâches de monter et descendre dans les échelles, les escaliers, s'accroupir ou se mettre à genoux. Il note la nécessité de porter une orthèse au travail sinon il ressent de l'instabilité au niveau de son genou droit."

EXEMPLE DIAGNOSTIC:
"Entorse au genou droit, déchirure ménisque interne et ligament croisé antérieur du genou droit."

EXEMPLE DATE CONSOLIDATION:
"Le médecin qui a charge le travailleur a rencontré ce dernier le 19 juin 2024, il ne s'est pas prononcé sur ce point a maintenu le travailleur à ses tâches régulières à horaire régulier et demande un avis de la CNESST.

Considérant le diagnostic retenu par la CNESST et faisant l'objet de la présente demande, soit une entorse au genou droit, une déchirure du ménisque interne et une déchirure du ligament croisé antérieur du genou droit;

Considérant que le travailleur a été traité de façon appropriée et adéquate, incluant une un protocole de réadaptation en physiothérapie, ergothérapie et acupuncture et qu'il a atteint un plateau thérapeutique;

Considérant que le travailleur ne rapporte pas de symptôme de blocage au genou droit et note une bonne stabilité de son genou droit avec le port de l'orthèse ;

Considérant l'examen objectif du membre inférieur droit d'aujourd'hui, mettant en évidence une ankylose résiduelle au genou droit sans signe d'instabilité au niveau du ligament croisé antérieur droit et sans signe d'appel aux manœuvres méniscales;

À mon avis, il y a une atteinte du plateau thérapeutique et stabilisation de la condition pour le diagnostic retenu. 

Pour toutes ses raisons évoquées, je consolide donc la lésion en date du 9 septembre 2024."

EXEMPLE SOINS/TRAITEMENTS:
"Le médecin qui a charge le travailleur a rencontré ce dernier le 19 juin 2024, il ne s'est pas prononcé sur ce point a maintenu le travailleur à ses tâches régulières à horaire régulier et demande un avis de la CNESST. 

Considérant le diagnostic retenu par la CNESST et faisant l'objet de la présente demande, soit une entorse au genou droit, une déchirure du ménisque interne et une déchirure du ligament croisé antérieur du genou droit;

Considérant que le travailleur a été traité de façon appropriée et adéquate, incluant une un protocole de réadaptation en physiothérapie, ergothérapie et acupuncture et qu'il a atteint un plateau thérapeutique;

Considérant que le travailleur ne rapporte pas de symptôme de blocage au genou droit et note une bonne stabilité de son genou droit avec le port de l'orthèse ;

Considérant l'examen objectif du membre inférieur droit d'aujourd'hui, mettant en évidence une ankylose résiduelle au genou droit sans signe d'instabilité au niveau du ligament croisé antérieur droit et sans signe d'appel aux manœuvres méniscales;

À mon avis, il y a une atteinte du plateau thérapeutique et stabilisation de la condition pour le diagnostic retenu. 

Considérant les diagnostics retenus par la CNESST ainsi que sa consolidation;

Considérant tous les éléments mentionnés aux points précédents;

Je suis d'avis qu'il y a suffisance de traitements en date de consolidation soit le 9 septembre 2024.

Je recommande que le travailleur bénéficie d'un programme d'entraînement à domicile en renforcement musculaire créer par un kinésiologue."

EXEMPLE ATTEINTE PERMANENTE:
"Le médecin qui a charge ne se prononce pas sur ce point;

Considérant le diagnostic retenu par la CNESST ainsi que sa consolidation;

Considérant tous les points mentionnés aux points précédents;

J'attribue une atteinte permanente à l'intégrité physique.

Les pourcentages de l'atteinte permanente à l'intégrité physique seront présentés au point 12."

EXEMPLE LIMITATIONS FONCTIONNELLES:
"Le médecin qui a charge ne se prononce pas sur ce point;

Considérant le diagnostic retenu par la CNESST ainsi que sa consolidation;

Considérant tous les points mentionnés aux points précédents;

J'attribue des limitations fonctionnelles résultant de la lésion professionnelle."

EXEMPLE ÉVALUATION LIMITATIONS:
"Au niveau du membre inférieur droit :
        Le travailleur nécessite le port d'une orthèse à son genou droit.
        Éviter de travailler de façon répétitive en position accroupie.
        Éviter de travailler de façon répétitive en position à genoux.
        Éviter de marcher de façon répétitive en terrain accidenté ou glissant.
        Éviter de travailler dans une position instable (échafaud, échelle et escaliers).
        Éviter de ramper."

Génère une conclusion professionnelle en respectant le style médical québécois avec des considérants appropriés.

Réponds en JSON:
{
  "resume": "...",
  "diagnostic": "...",
  "dateConsolidation": "...",
  "soinsTraitements": "...",
  "atteintePermanente": "...",
  "limitationsFonctionnelles": "...",
  "evaluationLimitations": "..."
}`
        : `You are Dr. Centomo, expert in CNESST medical evaluations. Generate a complete conclusion based on the following medical data:

MEDICAL HISTORY: ${medicalHistory}
SURGICAL HISTORY: ${surgicalHistory}
CURRENT MEDICATION: ${medication}
HISTORY OF FACTS AND EVOLUTION: ${historyEvolution}
SUBJECTIVE ASSESSMENT: ${subjectiveAssessment}
COMPLAINTS AND PROBLEMS: ${complaintsProblems}
IMPACT ON ADL/IADL: ${impactADL}
PHYSICAL EXAMINATION: ${physicalExam}

Generate a professional conclusion using Quebec medical style with appropriate considerations.

Respond in JSON format:
{
  "resume": "...",
  "diagnostic": "...",
  "dateConsolidation": "...",
  "soinsTraitements": "...",
  "atteintePermanente": "...",
  "limitationsFonctionnelles": "...",
  "evaluationLimitations": "..."
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Tu es un médecin expert en évaluations CNESST québécoises. Réponds toujours en JSON valide.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      resume: result.resume || "",
      diagnostic: result.diagnostic || "",
      dateConsolidation: result.dateConsolidation || "",
      soinsTraitements: result.soinsTraitements || "",
      atteintePermanente: result.atteintePermanente || "",
      limitationsFonctionnelles: result.limitationsFonctionnelles || "",
      evaluationLimitations: result.evaluationLimitations || "",
    };
  } catch (error) {
    console.error("Error generating section 11 conclusion:", error);
    return {
      resume: "",
      diagnostic: "",
      dateConsolidation: "",
      soinsTraitements: "",
      atteintePermanente: "",
      limitationsFonctionnelles: "",
      evaluationLimitations: "",
    };
  }
}
