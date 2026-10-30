// Fiches techniques par ligne de progression : muscles, prérequis, erreurs
// fréquentes et durée d'apprentissage indicative (variable selon l'athlète).

export interface Knowledge {
  muscles: string[]
  prereq: string[]
  mistakes: string[]
  timeline: string
}

const K: Record<string, Knowledge> = {
  planche: {
    muscles: ['Deltoïdes antérieurs', 'Pectoraux', 'Dentelé antérieur', 'Biceps (tendon, bras tendus)', 'Avant-bras & poignets', 'Gainage antérieur'],
    prereq: ['30 s de planche lean propre', '15+ dips', 'Poignets échauffés et sans douleur', 'Protraction scapulaire maîtrisée'],
    mistakes: ['Coudes fléchis (le bras doit être verrouillé)', 'Épaules en rétraction (dos creux)', 'Pas assez de lean', 'Hanches trop basses ou trop hautes'],
    timeline: 'Tuck : 3-6 mois · Straddle : 1-2 ans · Full : 2-5 ans',
  },
  'planche-elite': {
    muscles: ['Deltoïdes antérieurs', 'Dentelé antérieur', 'Fléchisseurs des doigts', 'Tendons du poignet', 'Gainage total'],
    prereq: ['Full planche 5 s+', 'Conditionnement spécifique des doigts / poings', 'Plusieurs années de tendons préparés'],
    mistakes: ['Brûler les étapes : risque tendineux élevé', 'Charger les doigts sans préparation progressive'],
    timeline: 'Plusieurs années après la full planche',
  },
  'bent-planche': {
    muscles: ['Triceps', 'Deltoïdes antérieurs', 'Pectoraux', 'Gainage'],
    prereq: ['Pseudo planche push-ups', 'Crow pose / elbow lever'],
    mistakes: ['Coudes qui s\'écartent', 'Corps non horizontal', 'Poids trop en arrière'],
    timeline: '90° hold : 6-12 mois',
  },
  maltese: {
    muscles: ['Deltoïdes antérieurs', 'Pectoraux', 'Biceps (tendon distal)', 'Dentelé antérieur'],
    prereq: ['Full planche solide', 'Mains larges et supination progressive', 'Biceps tendons conditionnés'],
    mistakes: ['Bras fléchis', 'Mains trop proches', 'Monter trop vite le volume'],
    timeline: 'Élite : plusieurs années',
  },
  'front-lever': {
    muscles: ['Grand dorsal', 'Grand rond', 'Abdominaux (rétroversion)', 'Deltoïdes postérieurs', 'Avant-bras'],
    prereq: ['10+ tractions strictes', 'Hollow body 30 s', 'Dépression scapulaire active'],
    mistakes: ['Hanches qui tombent', 'Bras fléchis', 'Épaules haussées (pas de dépression)', 'Regard vers les pieds qui casse la ligne'],
    timeline: 'Tuck : 1-3 mois · Straddle : 6-18 mois · Full : 1-3 ans',
  },
  'front-lever-elite': {
    muscles: ['Grand dorsal', 'Grand rond', 'Rotateurs', 'Gainage total'],
    prereq: ['Full front lever 10 s', 'Tractions lestées lourdes', 'Archer pull-ups'],
    mistakes: ['Rotation du corps sur le one arm', 'Bras fléchi'],
    timeline: 'One arm : plusieurs années',
  },
  'back-lever': {
    muscles: ['Grand dorsal', 'Pectoraux (étirés)', 'Biceps (tendon long)', 'Érecteurs & fessiers'],
    prereq: ['German hang 30 s sans douleur', 'Skin the cat contrôlé', 'Mobilité d\'épaule en extension'],
    mistakes: ['Cambrure au lieu d\'une ligne', 'Bras fléchis', 'Progresser trop vite (biceps)'],
    timeline: 'Tuck : 1 mois · Full : 6-12 mois',
  },
  handstand: {
    muscles: ['Deltoïdes', 'Trapèzes supérieurs', 'Triceps', 'Avant-bras & doigts', 'Gainage'],
    prereq: ['Wall handstand 60 s', 'Ouverture d\'épaules complète', 'Sortie de secours (pirouette / roulade)'],
    mistakes: ['Banane (dos creux)', 'Épaules fermées', 'Corrections avec tout le corps au lieu des doigts'],
    timeline: '30 s libre : 6 mois à 2 ans de pratique quotidienne',
  },
  oahs: {
    muscles: ['Deltoïdes', 'Obliques', 'Avant-bras', 'Moyen fessier'],
    prereq: ['Handstand libre 60 s', 'Straddle handstand stable', 'Shifts de poids d\'une main à l\'autre'],
    mistakes: ['Pas assez de transfert du poids', 'Hanche qui s\'ouvre'],
    timeline: '2 à 5 ans',
  },
  lsit: {
    muscles: ['Fléchisseurs de hanche', 'Quadriceps', 'Abdominaux', 'Triceps', 'Dépresseurs scapulaires'],
    prereq: ['Tuck L-sit 20 s', 'Souplesse ischio-jambiers (pike)'],
    mistakes: ['Épaules haussées', 'Genoux fléchis', 'Pieds qui descendent sous les hanches'],
    timeline: 'L-sit 10 s : 1-3 mois · V-sit : 1-2 ans · Manna : 3+ ans',
  },
  flag: {
    muscles: ['Grand dorsal (bras du haut)', 'Deltoïdes (bras du bas)', 'Obliques', 'Carré des lombes'],
    prereq: ['10+ tractions', '15+ pompes en pike', 'Planche latérale 60 s'],
    mistakes: ['Corps qui tourne vers le sol', 'Bras du bas fléchi', 'Prise trop serrée'],
    timeline: '3 à 12 mois',
  },
  dragon: {
    muscles: ['Abdominaux', 'Fléchisseurs de hanche', 'Grand dorsal', 'Gainage profond'],
    prereq: ['Hollow body 45 s', 'Relevés de jambes suspendu'],
    mistakes: ['Cassure à la hanche', 'Appui sur la nuque'],
    timeline: '2-6 mois',
  },
  hspu: {
    muscles: ['Deltoïdes', 'Triceps', 'Trapèzes', 'Gainage'],
    prereq: ['Pike push-ups pieds surélevés 10+', 'Wall handstand 60 s'],
    mistakes: ['Coudes trop écartés', 'Amplitude partielle', 'Tête qui frappe le sol'],
    timeline: 'Au mur : 3-6 mois · Freestanding : 1-2 ans',
  },
  ppu: {
    muscles: ['Deltoïdes antérieurs', 'Pectoraux', 'Triceps', 'Dentelé antérieur'],
    prereq: ['Tuck planche 10 s pour les variantes planche', 'Pseudo planche push-ups 10+'],
    mistakes: ['Perte du lean en descendant', 'Hanches qui montent'],
    timeline: 'Suit la progression de la planche',
  },
  press: {
    muscles: ['Compression (abdominaux, fléchisseurs de hanche)', 'Deltoïdes', 'Trapèzes'],
    prereq: ['Handstand libre', 'Pike / pancake profonds', 'L-sit 15 s'],
    mistakes: ['Saut au lieu de presser', 'Épaules pas assez en avant'],
    timeline: '6 mois à 2 ans',
  },
  mu: {
    muscles: ['Grand dorsal', 'Triceps', 'Pectoraux', 'Avant-bras'],
    prereq: ['12+ tractions strictes', '20+ dips', 'Tractions poitrine à la barre'],
    mistakes: ['Chicken wing (un bras après l\'autre)', 'Kip excessif', 'Transition trop basse'],
    timeline: '1-6 mois avec les prérequis',
  },
  cross: {
    muscles: ['Grand dorsal', 'Pectoraux', 'Biceps (tendons)', 'Coiffe des rotateurs'],
    prereq: ['Support aux anneaux RTO 60 s', 'Plusieurs années d\'anneaux', 'Tendons conditionnés'],
    mistakes: ['Bras qui fléchissent', 'Anneaux qui tournent', 'Excès de volume'],
    timeline: '2+ ans de travail spécifique',
  },
  swing: {
    muscles: ['Avant-bras (grip)', 'Grand dorsal', 'Gainage hollow / arch', 'Coordination'],
    prereq: ['Suspension 60 s', 'Balancier hollow-arch contrôlé', 'Tapis et parade pour les rotations'],
    mistakes: ['Lâcher trop tôt', 'Rotation de tête qui désaxe', 'Poignets non échauffés'],
    timeline: '180 : quelques semaines · 360 : 3-12 mois · 540+ : années',
  },
  giant: {
    muscles: ['Grip', 'Grand dorsal', 'Gainage', 'Épaules'],
    prereq: ['Balancier ample et contrôlé', 'Hip circle', 'Grip solide'],
    mistakes: ['Corps cassé en haut du tour', 'Prise mal tournée'],
    timeline: '3-12 mois',
  },
  release: {
    muscles: ['Grip', 'Grand dorsal', 'Proprioception'],
    prereq: ['Swing 180 maîtrisé', 'Lâchers-reprises sur barre basse'],
    mistakes: ['Regard perdu pendant le vol', 'Rattrapage bras fléchis'],
    timeline: '6 mois à 2 ans',
  },
  dismount: {
    muscles: ['Gainage', 'Membres inférieurs (réception)', 'Proprioception'],
    prereq: ['Flips maîtrisés au sol / trampoline', 'Tapis épais', 'Parade'],
    mistakes: ['Rotation insuffisante', 'Réception jambes tendues'],
    timeline: 'Variable : toujours progresser sur tapis',
  },
  ground: {
    muscles: ['Membres inférieurs (explosivité)', 'Gainage', 'Épaules'],
    prereq: ['Sauts groupés hauts', 'Pont, roulades', 'Trampoline ou fosse si possible'],
    mistakes: ['Lancer la tête en arrière trop tôt', 'Pas assez de hauteur'],
    timeline: 'Backflip : 1-6 mois avec parade',
  },
}

const DEFAULT: Knowledge = {
  muscles: ['Chaîne complète selon la figure', 'Gainage'],
  prereq: ['Maîtriser la figure précédente de la ligne'],
  mistakes: ['Brûler les étapes', 'Négliger l\'échauffement spécifique'],
  timeline: 'Variable selon l\'athlète',
}

const ALIAS: Record<string, string> = {
  'back-lever-elite': 'back-lever',
  'bl-dyn': 'back-lever',
  'fl-dyn': 'front-lever',
  victorian: 'front-lever-elite',
  cti: 'front-lever-elite',
  'mu-dyn': 'mu',
  'mu-elite': 'mu',
  'base-pull': 'mu',
  opp: 'front-lever-elite',
  'dips-dyn': 'bent-planche',
  'push-dyn': 'ppu',
  'base-push': 'ppu',
  'base-dips': 'bent-planche',
  elbow: 'bent-planche',
  'balance-arm': 'bent-planche',
  support: 'bent-planche',
  'bar-basics': 'giant',
  skin: 'back-lever',
}

export const knowledgeFor = (line: string) => K[line] ?? K[ALIAS[line]] ?? DEFAULT
