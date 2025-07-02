import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sample 1: Shoulder/Upper Limb Complex Case
const ENHANCED_SECTION_7_SAMPLE_1 = `7. Historique de faits et évolution

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

// Sample 2: Lower Limb/Calf Injury Case
const ENHANCED_SECTION_7_SAMPLE_2 = `7. Historique de faits et évolution

La travailleuse et une chauffeuse de taxi adapté. Ses tâches consistent à conduire un taxi de transport adapté, elle accompagne les gens en fauteuil roulant et donc doit monter et descendre des rampes d'accès avec les patients en fauteuil et parfois elle doit transporter des marchandises médicales d'un hôpital à l'autre. Parfois elle doit conduire jusqu'à Montréal.

La fiche de réclamation de la travailleuse décrit l'événement suivant survenu le 12 août 2020 :

« Je montais une pente à l'hôpital de Valleyfield en poussant un chariot avec des glacières dessus et à la fin de la pentente j'ai senti grosse douleur au niveau du mollet droit avec sensation de brûlure… Quand fut le temps de reposer mon pied par terre, j'en étais incapable j'ai tout de suite communiqué avec mon employeur pour lui expliquer ce qui venait de se passer… comme j'étais déjà dans un hôpital, il m'a dit d'aller tout de suite consulter… »

La travailleuse consulte la même journée à l'urgence l'hôpital Barrie Memorial. Elle rencontre le docteur Abdelaziz Balha qui diagnostique une déchirure du mollet droit. Il prescrit des anti-inflammatoires, des relaxants musculaires et un arrêt de travail de 7 jours.

La travailleuse consulte à nouveau à l'urgence de l'hôpital de Barrie Memorial pour une douleur augmentée à son mollet droit, le 19 août 2020. Elle rencontre le docteur Herma Bessaoud qui prescrit un doppler veineux du membre inférieur droit. Celui-ci est réalisé et interprété par le docteur Arnold Radu, radiologiste. Le doppler démontre aucune thrombophlébite au niveau du membre inférieur droit. L'arrêt de travail est prolongé.

La travailleuse revoit le docteur Balha, le 24 août 2020. Il maintient le diagnostic de déchirure du mollet droit. Il prolonge l'arrêt de travail.

La travailleuse revoit le docteur Balha, le 31 août 2020. Il maintient le diagnostic de déchirure du mollet droit. Il prescrit un arrêt de travail de deux semaines et ne compte pas revoir la patiente.

La travailleuse rencontre le docteur Daniel Leblanc, le 3 novembre 2020. Il maintient le diagnostic de déchirure du mollet droit. Il prescrit de la physiothérapie et de l'ergothérapie. Il maintient l'arrêt de travail.

La travailleuse rencontre le docteur Adama-Rabi Youla, le 9 février 2021. Elle maintient le diagnostic de déchirure du mollet droit. Elle maintient les traitements en physiothérapie et ergothérapie. Elle juge la condition clinique stable. Elle prescrit une assignation temporaire à partir du 10 mars 2021.

Le docteur Youla remplit une information complémentaire écrite. Elle mentionne qu'elle ne peut statuer sur l'évolution de la condition de la patiente étant donné qu'elle vient tout juste de la prendre en charge. Elle spécifie que le plan de traitement est orienté vers des interventions en ergothérapie et physiothérapie ainsi qu'une assignation temporaire. Elle prévoit un retour au travail en mai 2021. Elle juge que la patiente n'aura pas d'atteinte permanente.

La travailleuse revoit le docteur Youla, le 17 août 2021. Elle maintient le diagnostic de déchirure du mollet droit. Elle note une condition clinique stable et elle cesse les traitements en physiothérapie et ergothérapie. Elle note un arrêt de travail à la suite du refus de l'assignation temporaire par son employeur.

Le dernier rapport de la physiothérapie, en date du 23 août 2021, rapporte un plateau thérapeutique avec une suggestion d'évaluation et développement des capacités fonctionnelles. Pour ce qui est du rapport en ergothérapie, datant du 24 août 2021, on rapporte une mobilité et une force du membre inférieur droit fonctionnelle et on recommande l'arrêt des traitements.

Une résonance magnétique de la jambe droite est réalisée le 17 septembre 2021. Elle est interprétée par le docteur Paul Bajsarowicz, radiologiste. Celui-ci observe :

« Les tissus mous de la jambe droite ne démontrent pas d'œdème tissulaire sous-cutané avec absence d'un hypersignal STIR, il n'y a pas d'évidence de déchirure focale au niveau des structures musculaires et tendineuses du mollet droit. Le muscle gastrocnémien, soléaire et le tendon d'Achille sont dans les limites de la normale sans évidence d'atteinte post-traumatique aiguë. Pas d'asymétrie significative à signaler au niveau des structures musculaires des membres inférieurs.

Opinion :

IRM de la jambe droite dans les limites de la normale. En particulier, pas d'évidence de déchirure myo-tendineuse, oedème tissulaire sous-cutané ou de contusion osseuse à signaler. »

La travailleuse revoit le docteur Youla, le 23 septembre 2021. Elle constate les résultats de la résonance magnétique avec absence de déchirure musculaire du mollet droit. Elle ajoute un diagnostic de tendinite calcifiée de l'épaule droite. Elle juge la condition clinique stable. Elle considère un retour au travail à compter du 27 septembre 2021.

La travailleuse revoit le docteur Youla, le 24 novembre 2021. Elle rapport un diagnostic de douleur au mollet droit exacerbée. Elle juge la condition clinique stable. Le docteur Youla mentionne un refus de l'employeur de la travailleuse pour un retour au travail en assignation temporaire. Elle maintient un arrêt de travail jusqu'en janvier 2022.`;

// Sample 3: Knee Injury with Arthritis Activation Case
const ENHANCED_SECTION_7_SAMPLE_3 = `7. Historique de faits et évolution

La fiche de réclamation du travailleur décrit l'événement suivant survenu le 5 mars 2021 :

« Lors de la vérification du statut de mon véhicule j'ai monté sur le marché pieds et fait une rotation du genou. »

Le travailleur rencontre le docteur Martine Dupuis, le 5 mars 2021. Elle diagnostique une entorse du genou droit. Elle prescrit de la physiothérapie. Elle suggère un arrêt de travail.

Une radiographie du genou droit sera réalisée le 5 mars 2021. Cette dernière démontre :

« Pas de fracture grossière identifiée. Pincement sclérose et ostéophytose volumineuse en fémorotibial interne et externe ainsi que fémoropatellaire. Score à KL 4. »

Le docteur Martine Dupuis remplit une assignation temporaire de travail avec horaire progressif du 8 mars 2021 au 16 mars 2021.

Le travailleur revoit le docteur Dupuis, le 16 mars 2021. Elle maintient le diagnostic d'entorse du genou droit. Elle constate les résultats de la radiographie où il n'y a pas de fracture notée. Elle note une nette amélioration. Elle maintient les travaux légers ainsi que les traitements en physiothérapie.

Le travailleur rencontre le docteur Stéphanie Lavoie-Lennon, le 19 avril 2021. Elle diagnostique une entorse du genou droit avec activation d'arthrose (ancienne blessure de CNESST de plusieurs années). Synovite aiguë secondaire à entorse genou droit aigu. Elle maintient les traitements en physiothérapie. Elle suggère de cesser le TRP. Elle suggère une infiltration de visco-supplémentation. Elle maintient les travaux légers.

Le travailleur revoit le docteur Lavoie-Lennon, le 17 mai 2021. Elle maintient un diagnostic d'entorse du genou droit avec activation d'arthrose. Synovite aiguë secondaire à l'entorse du genou droit. Elle maintient les traitements de physiothérapie et suggère l'infiltration de visco-supplémentation et procède à l'infiltration de Synvisc, procédure qui sera bien tolérée.

Le travailleur obtient une radiographie de son genou droit, le 21 mai 2021. Celle-ci démontre :

« Gonarthrose tricompartimentale prédominante en fémorotibiale médiale et fémoropatellaire. L'atteinte est modérée. »

Le travailleur revoit le docteur Lavoie-Lennon, le 16 août 2021. Elle maintient les diagnostics d'entorse genou droit, synovite genou droit et gonarthrose droite. Elle juge la condition clinique stable. Elle maintient les traitements en physiothérapie et ajoute des traitements en ergothérapie. Elle prescrit une orthèse d'extension nocturne étant donné le flexum au genou droit. Elle note peu d'amélioration avec l'infiltration de visco-supplémentation et que le travailleur demeure symptomatique.

Le travailleur revoit le docteur Lavoie-Lennon, le 4 octobre 2021. Elle maintient les diagnostics d'entorse genou droit, synovite genou droit et gonarthrose droite. Elle maintient les traitements en physiothérapie. Elle note une évolution lente mais favorable avec le port de l'orthèse d'extension. Elle suggère un retour au travail régulier à partir du 18 octobre 2021.

Le travailleur revoit le docteur Lavoie-Lennon, le 17 janvier 2022. Elle maintient le diagnostic d'entorse genou droit, synovite genou droit et gonarthrose droite. Elle consolide le patient avec atteinte permanente à l'intégrité physique et limitations fonctionnelles. Elle réitère fortement la suggestion d'une orthèse d'extension à tourillon nocturne pour le flexum persistant et une orthèse de stabilisation pour le jour du genou droit.`;

// Sample 4: Complex Ankle Injury with Complications
const ENHANCED_SECTION_7_SAMPLE_4 = `7. Historique de faits et évolution

La fiche de réclamation du travailleur décrit l'événement suivant survenu le 3 mars 2021 :

« Je nettoyais les tuiles au plafond. Quand je suis descendu de l'échelle, j'ai mis le pied dans un trou qui était dans le sol. Ma cheville droit a fait une torsion et je suis tombé. Au moment de la chute j'ai tenté de retenir avec ma main et je me suis fait mal au 3e doigt de la main droite. Au moment de la chute ça a fait mal, mais je croyais que sa passerait, cependant dans la nuit du 3 mars au 4 mars la DLR est venue de façon vive et intense, m'empêchant de dormir. »

Le travailleur rencontre le docteur Mélinka Blais-Rétamal, le 4 mars 2021. Elle diagnostique une entorse à la cheville droite et une entorse du 3e doigt de la main droite. Elle prescrit des radiographies, suggère d'éviter la mise en charge, prescrit un arrêt de travail et de l'analgésie.

Le travailleur obtient des radiographies du pied et de la cheville droits, le 4 mars 2021. Elles sont interprétées par le docteur Anna Barbara Sinsky, radiologiste. Cette dernière constate :

« Pied et cheville droits
Il n'y a pas d'épanchement intra-articulaire à la cheville. Œdème des tissus mous autour de la malléole externe. La mortaise est bien préservée. Il n'y a pas d'anomalie démontrée au niveau du pied. »

Le travailleur rencontre le docteur André Ménard, le 12 mars 2021. Il diagnostique une entorse de la cheville droite et une entorse du 3e doigt de la main droite. Il juge la condition clinique stable. Il note une amélioration au niveau du doigt. Il suggère un retour au travail dans une semaine et prescrit de la physiothérapie.

Le travailleur revoit le docteur Ménard, le 28 mars 2021. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et prescrit un arrêt de travail après un échec de retour au travail.

Le travailleur revoit le docteur Ménard, le 21 avril 2021. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie, l'arrêt de travail et prescrit une botte de marche.

Le travailleur revoit le docteur Ménard, le 23 juin 2021. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. Il prescrit une échographie de surface au niveau des tendons fibulaires et une résonance magnétique de la cheville droite afin d'éliminer une atteinte tarsienne.

Le travailleur obtient une résonance magnétique de la cheville droite, le 30 juillet 2021. Elle est interprétée par le docteur Laurent Bilodeau, radiologiste. Ce dernier constate :

« Conclusion :
Signes d'ancienne entorse des ligaments tibiopéronier antérieurs, talopéronier antérieur, calcanéopéronier et des fibres profondes du ligament deltoïde.

Pas d'atteinte des tendons péroniers.

Doute sur une légère ténosynovite des tendons tibial postérieur, long fléchisseur des orteils et long fléchisseur de l'hallux, de signification clinique incertaine. »

Le travailleur revoit le docteur Ménard, le 25 août 2021. Il juge la condition clinique stable. Il constate les résultats de la résonance magnétique, maintient les traitements en physiothérapie, ergothérapie et l'arrêt de travail.

Le travailleur revoit le docteur Ménard, le 19 janvier 2022. Il juge la condition clinique stable. Il suspecte un syndrome douleur régional complexe. Il prescrit un EMG des membres inférieurs. Il maintient les traitements en physiothérapie, ergothérapie et l'arrêt de travail.

Le travailleur revoit le docteur Ménard, le 14 mars 2022. Il juge la condition clinique stable. Il maintient l'arrêt de travail. Le docteur Ménard note : « a eu des moments difficiles et était en désintox depuis 6 semaines, troubles anxiodépressifs secondaires se sont développé » Le docteur Ménard demande de réinitialiser les traitements physiothérapie et ergothérapie.

Le travailleur rencontre le docteur Blouin, chirurgien orthopédiste, le 18 mai 2022. Le docteur Blouin rapporte aucun signe d'instabilité au niveau de la cheville droite et recommande un traitement conservateur. Il note une lombosciatalgie droite et prescrit un scan du rachis lombaire. Il désire revoir le travailleur après les investigations.

Le travailleur obtient un EMG des membres inférieurs, le 1er mars 2023. L'examen est réalisé par le docteur Valérie Dahan, physiatre. Cette dernière constate :

« Impression :
L'étude électrophysiologique met en évidence des signes de radiculopathie motrice chronique L5 droite. Il n'y avait pas de dénervation active. Les racines L3, L4 et S1 droites semblent intactes, et cliniquement, je n'ai pas de méralgia paresthetica droite, ne suit pas le territoire. »

Le travailleur revoit le docteur Ménard, le 7 mars 2023. Il diagnostique une entorse de la cheville droite et une atteinte tendineuse au niveau des muscles péroniers. Il juge la condition clinique stable. Il demande que le travailleur revoie le docteur Blouin afin de statuer s'il y a des traitements complémentaires avant de finaliser le dossier.

Le travailleur revoit le docteur Ménard, le 27 février 2024. Il maintient le diagnostic d'entorse de cheville droite et atteinte tendineuse des muscles péroniers de la cheville droite. Il note une aggravation avec une fracture de la jambe gauche à la suite d'un déséquilibre, nombreuses complications post-opératoires avec ostéomyélite. Le docteur Ménard note que le travailleur ne s'est pas présenté à son rendez-vous pour une infiltration à la cheville droite.

Le travailleur revoit le docteur Ménard, le 7 mai 2024. Il juge la condition clinique stable. Il note une infiltration à la cheville droite partiellement efficace. Il est en attente pour une 2ième infiltration prévue dans 1 à 2 mois. Le docteur Ménard demande une IRM de contrôle au niveau de la cheville droite.`;

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
- Lésions: tendinite, élongation musculaire, déchirure partielle, entorse cervicale, plexopathie brachiale, entorse genou, synovite, gonarthrose, entorse cheville, ténosynovite
- Anatomie: supra-épineux, trapèze, grand pectoral, rachis cervical, plexus brachial, C5-C7, fémorotibial, fémoropatellaire, gastrocnémien, soléaire, malléole externe, mortaise, ligaments tibiopéronier, talopéronier, calcanéopéronier, deltoïde
- Examens: IRM, échographie, radiographie, arthro-IRM, EMG, doppler veineux, score KL, hypersignal STIR, échographie de surface, scan du rachis
- Traitements: physiothérapie, ergothérapie, acupuncture, infiltration cortisonée, visco-supplémentation, Synvisc, orthèse d'extension, botte de marche, analgésie
- Évolution: condition améliorée/stable/détériorée, plateau thérapeutique, consolidation avec séquelles, atteinte permanente, flexum persistant, syndrome douleur régional complexe, troubles anxiodépressifs secondaires, radiculopathie motrice chronique

EXEMPLES DE FORMAT AUTHENTIQUE:

Exemple 1 - Cas complexe membre supérieur:
${ENHANCED_SECTION_7_SAMPLE_1}

Exemple 2 - Cas membre inférieur avec évolution:
${ENHANCED_SECTION_7_SAMPLE_2}

Exemple 3 - Cas genou avec activation d'arthrose:
${ENHANCED_SECTION_7_SAMPLE_3}

Exemple 4 - Cas cheville complexe avec complications:
${ENHANCED_SECTION_7_SAMPLE_4}

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
- Injuries: tendinitis, muscle elongation, partial tear, cervical sprain, brachial plexopathy, knee sprain, synovitis, gonarthrosis, ankle sprain, tenosynovitis
- Anatomy: supraspinatus, trapezius, pectoralis major, cervical spine, brachial plexus, C5-C7, femorotibial, femoropatellar, gastrocnemius, soleus, external malleolus, mortise, tibiofibular ligaments, talofibular, calcaneofibular, deltoid
- Examinations: MRI, ultrasound, radiography, arthro-MRI, EMG, venous doppler, KL score, STIR hypersignal, surface ultrasound, spine scan
- Treatments: physiotherapy, occupational therapy, acupuncture, corticosteroid infiltration, visco-supplementation, Synvisc, extension orthosis, walking boot, analgesia
- Evolution: improved/stable/deteriorated condition, therapeutic plateau, consolidation with sequelae, permanent impairment, persistent flexum, complex regional pain syndrome, secondary anxiety-depressive disorders, chronic motor radiculopathy

AUTHENTIC FORMAT EXAMPLES:

Example 1 - Complex Upper Limb Case:
${ENHANCED_SECTION_7_SAMPLE_1}

Example 2 - Lower Limb Evolution Case:
${ENHANCED_SECTION_7_SAMPLE_2}

Example 3 - Knee Injury with Arthritis Activation:
${ENHANCED_SECTION_7_SAMPLE_3}

Example 4 - Complex Ankle Injury with Complications:
${ENHANCED_SECTION_7_SAMPLE_4}

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

EXEMPLES DE FORMAT:

Exemple 1 - Cas complexe membre supérieur:
${ENHANCED_SECTION_7_SAMPLE_1}

Exemple 2 - Cas membre inférieur avec évolution:
${ENHANCED_SECTION_7_SAMPLE_2}

Exemple 3 - Cas genou avec activation d'arthrose:
${ENHANCED_SECTION_7_SAMPLE_3}

Exemple 4 - Cas cheville complexe avec complications:
${ENHANCED_SECTION_7_SAMPLE_4}

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

FORMAT EXAMPLES:

Example 1 - Complex Upper Limb Case:
${ENHANCED_SECTION_7_SAMPLE_1}

Example 2 - Lower Limb Evolution Case:
${ENHANCED_SECTION_7_SAMPLE_2}

Example 3 - Knee Injury with Arthritis Activation:
${ENHANCED_SECTION_7_SAMPLE_3}

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