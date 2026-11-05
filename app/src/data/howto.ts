// Fiches techniques de chaque exercice : muscles, exécution, erreurs fréquentes, régression / progression.
// Sources : principes standards d'entraînement au poids du corps (progressions par levier, amplitude, tempo).

export interface HowTo {
  muscles: string
  how: string[]
  mistakes: string[]
  easier?: string
  harder?: string
  /** Point de vigilance sécurité. */
  safety?: string
}

const H = (muscles: string, how: string[], mistakes: string[], easier?: string, harder?: string, safety?: string): HowTo => ({ muscles, how, mistakes, easier, harder, safety })

export const HOWTO: Record<string, HowTo> = {
  // ——— Premiers pas
  'wall-pushup': H('Pectoraux, triceps, épaules', ['Mains sur le mur à hauteur d\'épaules, un peu plus larges', 'Corps droit des talons à la tête, recule les pieds pour durcir', 'Poitrine vers le mur, coudes à 45°, puis repousse'], ['Fesses en arrière (corps cassé)', 'Coudes écartés à 90°'], undefined, 'incline-pushup'),
  'incline-pushup': H('Pectoraux, triceps, épaules', ['Mains sur une table, un banc ou une marche solide', 'Gainage : fessiers et abdos serrés, corps en planche', 'Descends la poitrine jusqu\'au support, pousse en expirant'], ['Hanches qui s\'affaissent', 'Amplitude réduite à mi-course'], 'wall-pushup', 'knee-pushup'),
  'knee-pushup': H('Pectoraux, triceps, épaules', ['Genoux au sol, ligne droite genoux → épaules', 'Mains sous les épaules, doigts écartés', 'Poitrine à un poing du sol, puis repousse'], ['Fesses en l\'air', 'Tête qui avance avant la poitrine'], 'incline-pushup', 'negative-pushup'),
  'negative-pushup': H('Pectoraux, triceps, gainage', ['Pars en haut de la pompe, corps gainé', 'Descends en 4 secondes jusqu\'au sol', 'Pose les genoux pour remonter, recommence'], ['Se laisser tomber à la fin', 'Perdre le gainage en bas'], 'knee-pushup', 'pushup'),
  'bench-dips': H('Triceps, avant des épaules', ['Mains au bord d\'une chaise stable, doigts vers l\'avant', 'Jambes pliées (facile) ou tendues (dur)', 'Descends jusqu\'à 90° au coude, épaules basses, remonte'], ['Descendre trop bas (épaules en avant)', 'Hausser les épaules vers les oreilles'], undefined, 'negative-dips', 'Arrête si l\'avant de l\'épaule pince'),
  'negative-dips': H('Triceps, pectoraux, épaules', ['Monte en appui bras tendus (saute si besoin)', 'Descends en 4 s jusqu\'à épaule sous le coude', 'Pose les pieds, remonte, recommence'], ['Descente trop rapide', 'Épaules qui roulent en avant'], 'bench-dips', 'dips'),
  'table-row': H('Dos, biceps, arrière d\'épaule', ['Allongé sous une table solide, mains au bord', 'Corps gainé, talons au sol', 'Tire la poitrine vers la table, omoplates serrées'], ['Hanches qui tombent', 'Tirer avec le cou'], undefined, 'aus-row', 'Teste d\'abord que la table ne bascule pas'),
  'dead-hang': H('Avant-bras, grip, épaules', ['Suspends-toi bras tendus, prise pronation', 'Épaules actives (légèrement tirées vers le bas)', 'Respire calmement, tiens le temps'], ['Balancer', 'Épaules totalement relâchées dès le début'], undefined, 'scap-pull'),
  'jumping-pullup': H('Dos, biceps', ['Barre accessible en sautant (ou une box)', 'Saute et aide-toi des jambes pour monter menton au-dessus', 'Descends lentement, 3 s'], ['Tout faire avec les jambes', 'Tomber en bas'], 'dead-hang', 'negative-pullup'),
  'negative-pullup': H('Dos, biceps, grip', ['Monte menton au-dessus de la barre (saut ou box)', 'Descends en 4 secondes jusqu\'aux bras tendus', 'Contrôle surtout la fin de la descente'], ['Lâcher à mi-chemin', 'Descente en 1 s'], 'jumping-pullup', 'pullup'),
  'band-pullup': H('Dos, biceps', ['Élastique accroché à la barre, un pied ou genou dedans', 'Traction complète : bras tendus → menton au-dessus', 'Change pour un élastique plus fin dès 8 reps propres'], ['Rebondir sur l\'élastique en bas', 'Rester sur le même élastique des mois'], 'negative-pullup', 'pullup'),

  // ——— Poussée
  pushup: H('Pectoraux, triceps, épaules, gainage', ['Mains sous les épaules, corps en planche', 'Coudes à 45°, poitrine à un poing du sol', 'Pousse le sol, termine en protraction (dos rond léger)'], ['Hanches qui tombent', 'Coudes à 90° du corps', 'Demi-amplitude'], 'negative-pushup', 'diamond-pushup'),
  'diamond-pushup': H('Triceps, pectoraux', ['Mains jointes en losange sous la poitrine', 'Coudes le long du corps', 'Poitrine touche les mains'], ['Coudes qui s\'ouvrent', 'Épaules qui s\'enroulent'], 'pushup', 'archer-pushup'),
  'pseudo-pushup': H('Épaules avant, pectoraux, biceps (planche)', ['Mains au niveau des hanches, doigts vers l\'extérieur ou l\'arrière', 'Penche les épaules loin devant les mains', 'Garde le lean pendant toute la pompe'], ['Perdre le lean en descendant', 'Coudes pliés en haut'], 'planche-lean-hold', 'tuck-planche-pushup', 'Poignets bien échauffés avant'),
  'archer-pushup': H('Pectoraux, triceps (unilatéral)', ['Mains très écartées', 'Descends vers une main, l\'autre bras reste tendu', 'Alterne les côtés'], ['Hanches qui tournent', 'Bras tendu qui se plie'], 'diamond-pushup', 'clap-pushup'),
  'pike-pushup': H('Épaules, triceps (vers le HSPU)', ['Fesses hautes, corps en V inversé', 'Tête vers un point devant les mains (triangle)', 'Pousse en remontant les hanches'], ['Tête qui descend entre les mains', 'Coudes ouverts sur les côtés'], 'pushup', 'elevated-pike-pushup'),
  'elevated-pike-pushup': H('Épaules, triceps', ['Pieds sur un banc, hanches au-dessus des épaules', 'Tête en avant des mains en bas', 'Remonte en poussant fort'], ['Banc trop bas (pas assez vertical)', 'Amplitude coupée'], 'pike-pushup', 'wall-hspu'),
  'wall-hspu': H('Épaules, triceps, trapèzes', ['Handstand dos au mur (ou ventre)', 'Descends la tête jusqu\'au sol, triangle tête-mains', 'Pousse jusqu\'aux bras verrouillés'], ['Cambrure lombaire', 'Taper la tête au sol'], 'elevated-pike-pushup', undefined, 'Pose un coussin sous la tête au début'),
  dips: H('Pectoraux, triceps, épaules', ['Appui bras tendus, épaules basses', 'Descends jusqu\'à épaule sous le coude', 'Remonte jusqu\'au verrouillage'], ['Épaules qui montent aux oreilles', 'Amplitude trop courte'], 'negative-dips', 'weighted-dips'),
  'weighted-dips': H('Pectoraux, triceps', ['Ceinture de lest, même technique que les dips', 'Charge qui permet des reps propres à RPE 8', 'Progresse par petits paliers (1,25–2,5 kg)'], ['Lest trop lourd = amplitude réduite'], 'dips', 'ring-dips'),
  'ring-dips': H('Pectoraux, triceps, stabilité', ['Appui aux anneaux, anneaux tournés vers l\'extérieur en haut', 'Anneaux serrés contre le corps', 'Descente contrôlée'], ['Anneaux qui s\'écartent', 'Sauter le RTO en haut'], 'dips', undefined),
  'rto-pushup': H('Pectoraux, biceps, épaules', ['Pompes aux anneaux', 'En haut, tourne les anneaux vers l\'extérieur (RTO)', 'Coudes verrouillés'], ['Anneaux qui partent en avant'], 'pushup', 'ring-dips'),
  'planche-lean-hold': H('Épaules avant, gainage, poignets', ['Position de pompe, mains orientées vers l\'extérieur', 'Bascule les épaules loin devant les mains', 'Protraction et rétroversion, bras verrouillés'], ['Coudes pliés', 'Dos creux', 'Épaules en rétraction'], undefined, 'pseudo-pushup', 'Monte le lean progressivement : les poignets doivent suivre'),
  'tuck-planche-pushup': H('Épaules, pectoraux, triceps', ['Tuck planche sur parallettes', 'Descends en gardant les genoux groupés', 'Repousse en protraction'], ['Pieds qui touchent', 'Hanches qui retombent'], 'pseudo-pushup', 'planche-negatives'),
  'band-planche': H('Toute la chaîne de planche', ['Élastique autour des hanches, accroché devant', 'Tiens la position cible (straddle, full)', 'Réduis l\'élastique au fil des semaines'], ['Lean insuffisant car l\'élastique aide trop'], 'planche-lean-hold', 'planche-negatives'),
  'planche-negatives': H('Épaules, gainage', ['Pars en handstand', 'Descends lentement vers la planche en avançant les épaules', 'Ralentis au maximum sur la position la plus dure'], ['Tomber d\'un coup', 'Coudes qui plient'], 'band-planche', undefined),
  'maltese-lean': H('Épaules, pectoraux, biceps', ['Mains très larges et basses, doigts vers l\'arrière', 'Lean profond, corps proche du sol', 'Bras verrouillés'], ['Bras qui se plient'], 'planche-lean-hold', undefined, 'Biceps et coudes : progression très lente'),
  'bench-press-alt': H('Pectoraux, triceps', ['Pieds surélevés, sac lesté sur le dos', 'Pompe complète', 'Charge progressive'], ['Dos creux sous la charge'], 'pushup', 'archer-pushup'),
  'wall-handstand': H('Épaules, gainage, équilibre', ['Ventre face au mur (meilleur alignement)', 'Mains à 10–20 cm du mur, épaules ouvertes', 'Pousse le sol, corps aligné, regarde entre les mains'], ['Dos creux (banane)', 'Épaules fermées'], 'pike-pushup', 'chest-to-wall-shoulder-taps'),
  'chest-to-wall-shoulder-taps': H('Épaules, équilibre', ['Handstand ventre au mur', 'Transfère le poids sur une main, touche l\'épaule', 'Alterne lentement'], ['Hanches qui partent sur le côté'], 'wall-handstand', 'kick-up-drill'),
  'kick-up-drill': H('Équilibre, sécurité', ['Kick-up doux vers l\'équilibre', 'Si tu tombes : pirouette (tourne une main) ou roulade', 'Cherche à rester 1–3 s sans mur'], ['Kick trop fort', 'Ne pas savoir sortir'], 'wall-handstand', undefined, 'Apprends la pirouette avant tout'),

  // ——— Tirage
  'aus-row': H('Dos, biceps, arrière d\'épaule', ['Barre basse, corps gainé sous la barre', 'Tire la poitrine à la barre', 'Plus les pieds sont loin, plus c\'est dur'], ['Hanches qui tombent', 'Mi-amplitude'], 'table-row', 'pullup'),
  pullup: H('Dorsaux, biceps, avant-bras', ['Suspension bras tendus, prise pronation largeur épaules', 'Commence par abaisser les omoplates', 'Menton au-dessus de la barre, descente contrôlée'], ['Kipping involontaire', 'Ne pas tendre les bras en bas', 'Menton qui force vers le haut'], 'negative-pullup', 'explosive-pullup'),
  chinup: H('Biceps, dorsaux', ['Prise supination (paumes vers toi)', 'Tire la poitrine vers la barre', 'Bras tendus en bas'], ['Demi-reps'], 'negative-pullup', 'weighted-pullup'),
  'explosive-pullup': H('Dorsaux, puissance', ['Traction la plus rapide possible', 'Vise la poitrine à la barre', 'Redescends contrôlé'], ['Balancer pour tricher'], 'pullup', 'high-pullup'),
  'weighted-pullup': H('Dorsaux, biceps', ['Lest à la ceinture', 'Amplitude complète obligatoire', 'Petits paliers de charge'], ['Amplitude qui diminue avec la charge'], 'pullup', 'archer-pullup'),
  'archer-pullup': H('Dorsaux (unilatéral)', ['Prise très large', 'Monte vers une main, l\'autre bras se tend sur la barre', 'Alterne'], ['Plier le bras « tendu »'], 'pullup', 'typewriter'),
  typewriter: H('Dorsaux, biceps', ['Monte en traction large', 'Glisse d\'une main à l\'autre en haut', 'Menton au-dessus de la barre tout le long'], ['Redescendre au milieu'], 'archer-pullup', undefined),
  'fl-tuck-raise': H('Dorsaux, gainage (front lever)', ['Suspension, genoux groupés', 'Monte en tuck front lever bras tendus', 'Redescends lentement'], ['Plier les bras', 'Dos rond excessif'], 'hanging-leg-raise', 'fl-row'),
  'fl-row': H('Dorsaux, rhomboïdes', ['Position de front lever (tuck/adv tuck)', 'Tire la barre vers le nombril', 'Garde le corps horizontal'], ['Hanches qui tombent pendant le tirage'], 'fl-tuck-raise', 'fl-negatives'),
  'fl-negatives': H('Dorsaux, gainage', ['Pars en inverted hang', 'Descends lentement vers le front lever', 'Freine au maximum à l\'horizontale'], ['Bras qui plient', 'Descente trop rapide'], 'band-fl', 'ice-cream-maker'),
  'band-fl': H('Chaîne du front lever', ['Élastique de la barre aux hanches/pieds', 'Tiens la position cible', 'Diminue l\'aide progressivement'], ['Garder l\'élastique trop longtemps'], 'fl-tuck-raise', 'fl-negatives'),
  'ice-cream-maker': H('Dorsaux, gainage', ['Traction jusqu\'en haut', 'Bascule le corps en front lever bras tendus', 'Reviens en traction'], ['Bras pliés en front lever'], 'fl-row', undefined),
  'straight-arm-pulldown': H('Dorsaux bras tendus', ['Élastique accroché en hauteur', 'Bras tendus, tire jusqu\'aux hanches', 'Omoplates abaissées'], ['Plier les coudes'], undefined, 'fl-tuck-raise'),
  'ring-row': H('Dos, biceps', ['Anneaux à hauteur de hanche', 'Corps gainé, tire les anneaux aux côtes', 'Tourne les paumes en haut'], ['Bassin qui tombe'], 'table-row', 'pullup'),
  'high-pullup': H('Dorsaux, puissance (muscle-up)', ['Traction explosive', 'Vise le nombril à la barre', 'Tire la barre vers les hanches'], ['Tirer vers le menton seulement'], 'explosive-pullup', 'mu-transition'),
  'mu-transition': H('Transition du muscle-up', ['Barre basse, pieds au sol', 'Passe de la traction à l\'appui en roulant les poignets', 'Répète le geste lentement'], ['Passer un coude après l\'autre (chicken wing)'], 'high-pullup', undefined),
  'skin-cat-reps': H('Épaules, mobilité, gainage', ['Suspension, monte les jambes entre les bras', 'Descends lentement vers le German hang', 'Remonte et repasse'], ['Aller trop loin trop vite'], 'hanging-leg-raise', 'german-hang-stretch', 'Épaules : amplitude très progressive'),

  // ——— Gainage
  'hollow-hold': H('Abdominaux, gainage (base de tout)', ['Sur le dos, bas du dos plaqué au sol', 'Bras derrière la tête, jambes tendues décollées', 'Plus les membres sont bas, plus c\'est dur'], ['Dos qui décolle', 'Menton levé'], undefined, 'l-sit-hold'),
  'arch-hold': H('Lombaires, fessiers, dos', ['Sur le ventre, bras devant', 'Décolle bras, poitrine et jambes', 'Fessiers serrés'], ['Lever la tête vers le haut'], undefined, 'bridge'),
  'hanging-leg-raise': H('Abdominaux, fléchisseurs de hanche', ['Suspension, épaules actives', 'Monte les jambes tendues à l\'horizontale ou plus', 'Descente contrôlée, sans balancer'], ['Balancier', 'Genoux pliés sans le vouloir'], 'dead-hang', 'toes-to-bar'),
  'toes-to-bar': H('Abdominaux, compression', ['Suspension, jambes tendues', 'Monte les pieds jusqu\'à la barre', 'Bras tendus, compression maximale'], ['Élan des hanches'], 'hanging-leg-raise', 'windshield'),
  'dragon-flag-neg': H('Abdominaux, gainage total', ['Sur un banc, mains derrière la tête agrippées', 'Corps droit sur les épaules', 'Descends lentement, corps gainé'], ['Plier aux hanches'], 'hollow-hold', undefined, 'Appuie sur les épaules, jamais sur la nuque'),
  'compression-pulse': H('Compression active (L-sit, press)', ['Assis jambes tendues, mains à côté des genoux', 'Décolle les talons par petites pulsations', 'Dos droit'], ['Se pencher en arrière'], 'pike-stretch', 'pike-lift'),
  'pike-lift': H('Compression, fléchisseurs', ['Assis jambes tendues, mains devant les hanches', 'Lève les jambes tendues le plus haut possible', 'Tiens 1 s'], ['Plier les genoux'], 'compression-pulse', 'l-sit-hold'),
  'l-sit-hold': H('Abdominaux, triceps, compression', ['Appui bras tendus, épaules basses', 'Jambes groupées (tuck) puis tendues', 'Pointes de pieds tendues'], ['Épaules qui montent', 'Genoux pliés'], 'hollow-hold', 'v-sit'),
  'side-plank': H('Obliques, épaules', ['Sur un avant-bras, corps aligné de côté', 'Hanches hautes', 'Respire'], ['Hanches qui tombent'], undefined, 'windshield'),
  windshield: H('Obliques, abdominaux', ['Suspension, jambes à la barre (toes to bar)', 'Balaye les jambes d\'un côté à l\'autre', 'Contrôle sans élan'], ['Plier les jambes'], 'toes-to-bar', undefined),

  // ——— Jambes
  squat: H('Quadriceps, fessiers', ['Pieds largeur épaules, pointes légèrement ouvertes', 'Descends hanches sous les genoux, dos neutre', 'Remonte en poussant le sol'], ['Genoux qui rentrent', 'Talons qui décollent'], undefined, 'shrimp'),
  pistol: H('Quadriceps, équilibre, mobilité de cheville', ['Sur une jambe, l\'autre tendue devant', 'Descends complètement, talon au sol', 'Remonte sans élan'], ['Talon qui décolle', 'Dos qui s\'arrondit fort'], 'shrimp', undefined, 'Tiens-toi à un poteau au début'),
  shrimp: H('Quadriceps, fessiers', ['Sur une jambe, tiens l\'autre pied derrière toi', 'Descends le genou arrière au sol', 'Remonte'], ['Perdre l\'équilibre vers l\'avant'], 'squat', 'pistol'),
  nordic: H('Ischios-jambiers', ['À genoux, chevilles bloquées', 'Descends le buste lentement, hanches tendues', 'Rattrape-toi avec les mains, remonte'], ['Plier aux hanches'], undefined, undefined, 'Très intense : peu de reps au début'),

  // ——— Omoplates, mobilité, poignets
  'scap-pull': H('Bas des trapèzes, dorsaux', ['Suspension bras tendus', 'Abaisse les omoplates sans plier les bras', 'Relâche lentement'], ['Plier les coudes'], 'dead-hang', 'pullup'),
  'scap-push': H('Dentelés, stabilité d\'épaule', ['Position de pompe bras tendus', 'Laisse la poitrine descendre entre les omoplates', 'Puis pousse pour arrondir le haut du dos'], ['Plier les coudes'], undefined, 'planche-lean-hold'),
  'scap-dips': H('Bas des trapèzes, dépression', ['Appui aux barres bras tendus', 'Laisse les épaules monter puis pousse-les vers le bas', 'Bras toujours tendus'], ['Plier les bras'], undefined, 'dips'),
  'band-dislocate': H('Mobilité d\'épaule', ['Élastique ou bâton prise large', 'Passe-le de devant à derrière bras tendus', 'Rapproche les mains au fil des semaines'], ['Plier les coudes', 'Prise trop serrée trop tôt'], undefined, 'german-hang-stretch'),
  'german-hang-stretch': H('Mobilité d\'épaule (extension)', ['Depuis le skin the cat, laisse le corps descendre derrière', 'Pieds au sol si possible au début', 'Respire, 10–20 s'], ['Forcer l\'amplitude'], 'band-dislocate', 'skin-cat-reps', 'Arrête en cas de douleur vive au biceps'),
  pancake: H('Adducteurs, ischios', ['Assis jambes écartées tendues', 'Bascule le bassin vers l\'avant, dos long', 'Respire et descends un peu plus à chaque expiration'], ['Arrondir le dos à la place'], undefined, undefined),
  'pike-stretch': H('Ischios, mollets', ['Assis jambes tendues serrées', 'Bascule depuis les hanches, dos long', 'Mains vers les pieds'], ['Tirer avec les bras'], undefined, 'compression-pulse'),
  bridge: H('Mobilité d\'épaules et de dos', ['Sur le dos, mains près des oreilles', 'Pousse pour monter en pont', 'Pousse les épaules au-dessus des mains'], ['Tout faire avec le bas du dos'], 'arch-hold', undefined),
  'shoulder-flexion': H('Mobilité d\'épaule (flexion)', ['Face au mur, mains au mur', 'Pousse la poitrine vers le sol', 'Bras tendus, 30 s'], ['Cambrer le bas du dos'], undefined, 'wall-handstand'),
  'wrist-circles': H('Poignets, avant-bras', ['Rotations dans les deux sens', 'Appui à quatre pattes : doigts devant, côté, derrière', 'Bascule doucement le poids'], ['Sauter cette étape avant planche / handstand'], undefined, 'wrist-pushup'),
  'wrist-pushup': H('Poignets, avant-bras', ['À genoux, dos des mains au sol', 'Petites pompes de poignets', 'Progressif'], ['Forcer en cas de douleur'], 'wrist-circles', 'finger-pushup'),
  'finger-pushup': H('Doigts, avant-bras', ['Pompes sur le bout des doigts', 'Commence à genoux', 'Doigts arqués et solides'], ['Doigts qui s\'écrasent'], 'wrist-pushup', undefined),

  // ——— Agilité / explosivité
  'kipping-swing': H('Coordination, épaules', ['Suspension, alterne hollow et arch', 'Le mouvement part des épaules', 'Bras toujours tendus'], ['Plier les bras', 'Balancer avec les jambes seulement'], 'dead-hang', 'bar-release-drill'),
  'bar-release-drill': H('Timing, grip', ['Balancier contrôlé', 'Lâche au point mort avant, rattrape', 'Augmente la hauteur progressivement'], ['Lâcher au mauvais moment'], 'kipping-swing', 'clap-pullup', 'Sol amorti sous la barre'),
  'tuck-jump': H('Puissance, gainage', ['Saut vertical', 'Genoux vers la poitrine en l\'air', 'Réception souple'], ['Réception lourde'], 'squat', 'kipping-swing'),
  'clap-pullup': H('Puissance du tirage', ['Traction explosive', 'Lâche la barre en haut, frappe dans les mains', 'Rattrape la barre'], ['Pas assez de hauteur'], 'explosive-pullup', undefined, 'Maîtrise d\'abord la traction poitrine à la barre'),
  'clap-pushup': H('Puissance de poussée', ['Pompe explosive', 'Décolle les mains, frappe', 'Réception bras fléchis'], ['Réception bras tendus'], 'pushup', 'archer-pushup'),
}
