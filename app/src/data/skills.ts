// Catalogue complet des figures. Chaque figure appartient à une "ligne" de
// progression (ordre croissant de difficulté) utilisée par le générateur
// de programmes, le coach et le système de rang.

export type Discipline = 'statique' | 'agilite' | 'fondamental'
export type SkillKind = 'hold' | 'reps' | 'trick'
export type Category =
  | 'Assis & compression'
  | 'Statiques push'
  | 'Équilibres'
  | 'Statiques pull'
  | 'Anneaux'
  | 'Flags & core'
  | 'Dynamiques push'
  | 'Dynamiques pull'
  | 'Freestyle barre'
  | 'Acrobatie sol'
  | 'Fondamentaux'

export type AnalyzerProfile =
  | 'planche'
  | 'bentPlanche'
  | 'frontLever'
  | 'backLever'
  | 'handstand'
  | 'lsit'
  | 'vsit'
  | 'flag'
  | 'elbowLever'
  | 'support'
  | 'pushReps'
  | 'pullReps'
  | 'dipReps'
  | 'hspuReps'
  | 'squatReps'
  | 'generic'

export interface Skill {
  id: string
  name: string
  category: Category
  discipline: Discipline
  line: string
  tier: number // 1 (débutant) → 10 (élite mondiale)
  kind: SkillKind
  standard: number // secondes (hold), répétitions (reps) ou réussites propres (trick)
  equipment: string[]
  profile: AnalyzerProfile
  aka?: string
  danger?: boolean
}

type Row = [id: string, name: string, line: string, tier: number, kind?: SkillKind, extra?: Partial<Skill>]

const defaults: Record<Category, { discipline: Discipline; equipment: string[]; profile: AnalyzerProfile; kind: SkillKind }> = {
  'Assis & compression': { discipline: 'statique', equipment: ['sol', 'parallettes'], profile: 'lsit', kind: 'hold' },
  'Statiques push': { discipline: 'statique', equipment: ['sol', 'parallettes'], profile: 'planche', kind: 'hold' },
  'Équilibres': { discipline: 'statique', equipment: ['sol'], profile: 'handstand', kind: 'hold' },
  'Statiques pull': { discipline: 'statique', equipment: ['barre'], profile: 'frontLever', kind: 'hold' },
  'Anneaux': { discipline: 'statique', equipment: ['anneaux'], profile: 'generic', kind: 'hold' },
  'Flags & core': { discipline: 'statique', equipment: ['espalier'], profile: 'flag', kind: 'hold' },
  'Dynamiques push': { discipline: 'statique', equipment: ['sol', 'parallettes'], profile: 'pushReps', kind: 'reps' },
  'Dynamiques pull': { discipline: 'statique', equipment: ['barre'], profile: 'pullReps', kind: 'reps' },
  'Freestyle barre': { discipline: 'agilite', equipment: ['barre'], profile: 'generic', kind: 'trick' },
  'Acrobatie sol': { discipline: 'agilite', equipment: ['sol'], profile: 'generic', kind: 'trick' },
  'Fondamentaux': { discipline: 'fondamental', equipment: ['barre'], profile: 'generic', kind: 'reps' },
}

const table: Record<Category, Row[]> = {
  'Assis & compression': [
    ['l-sit', 'L-sit', 'lsit', 3],
    ['straddle-l-sit', 'Straddle L-sit', 'lsit', 4],
    ['compressed-l-sit', 'Compressed L-sit', 'lsit', 4],
    ['advanced-l-sit', 'Advanced L-sit', 'lsit', 5],
    ['v-sit', 'V-sit', 'lsit', 6, 'hold', { profile: 'vsit' }],
    ['manna', 'Manna', 'lsit', 9, 'hold', { profile: 'vsit' }],
  ],
  'Statiques push': [
    ['support-hold', 'Support hold', 'support', 1, 'hold', { profile: 'support', equipment: ['parallèles'] }],
    ['frog-stand', 'Frog stand', 'balance-arm', 1, 'hold', { profile: 'generic' }],
    ['crow-pose', 'Crow pose', 'balance-arm', 2, 'hold', { profile: 'generic' }],
    ['elbow-lever', 'Elbow lever', 'elbow', 3, 'hold', { profile: 'elbowLever' }],
    ['one-arm-elbow-lever', 'One arm elbow lever', 'elbow', 6, 'hold', { profile: 'elbowLever' }],
    ['planche-lean', 'Planche lean', 'planche', 2],
    ['tuck-planche', 'Tuck planche', 'planche', 4],
    ['adv-tuck-planche', 'Advanced tuck planche', 'planche', 5],
    ['one-leg-planche', 'One leg planche', 'planche', 6],
    ['straddle-planche', 'Straddle planche', 'planche', 7],
    ['half-lay-planche', 'Half lay planche', 'planche', 8],
    ['wide-planche', 'Wide planche', 'planche', 8],
    ['full-planche', 'Full planche', 'planche', 9],
    ['dead-planche', 'Dead planche', 'planche-elite', 9],
    ['bent-arm-planche', 'Bent arm planche (pseudo / 90° hold)', 'bent-planche', 6, 'hold', { profile: 'bentPlanche', aka: '90° hold' }],
    ['bent-arm-straddle-planche', 'Bent arm straddle planche', 'bent-planche', 7, 'hold', { profile: 'bentPlanche' }],
    ['forearm-planche', 'Forearm planche / biceps planche', 'bent-planche', 7, 'hold', { profile: 'bentPlanche' }],
    ['prayer-planche', 'Prayer planche', 'bent-planche', 8, 'hold', { profile: 'bentPlanche' }],
    ['straddle-maltese', 'Straddle maltese', 'maltese', 9],
    ['maltese', 'Maltese / Airplane', 'maltese', 10],
    ['maltese-box-hold', 'Maltese box hold', 'maltese', 9],
    ['knuckle-planche', 'Planche sur poings', 'planche-elite', 9],
    ['reverse-planche', 'Reverse planche', 'planche-elite', 9],
    ['rings-planche', 'Planche aux anneaux', 'planche-elite', 10, 'hold', { equipment: ['anneaux'] }],
    ['fingertip-planche', 'Fingertip planche', 'planche-elite', 10],
    ['two-finger-planche', '2 fingers planche', 'planche-elite', 10, 'hold', { danger: true }],
    ['thumb-planche', 'Thumb planche', 'planche-elite', 10, 'hold', { danger: true }],
    ['supinated-planche', 'Supinated planche', 'planche-elite', 10],
    ['supinated-maltese', 'Supinated maltese', 'maltese', 10],
    ['one-arm-forearm-planche', 'One arm forearm planche', 'planche-elite', 10, 'hold', { profile: 'bentPlanche' }],
    ['one-arm-planche', 'One arm planche', 'planche-elite', 10],
  ],
  'Équilibres': [
    ['handstand', 'Handstand', 'handstand', 4],
    ['straddle-handstand', 'Straddle handstand', 'handstand', 4],
    ['hollowback', 'Hollowback', 'handstand', 6],
    ['japanese-handstand', 'Japanese handstand', 'handstand', 7],
    ['finger-handstand', 'Finger handstand', 'handstand', 8],
    ['one-arm-handstand', 'One arm handstand', 'oahs', 9],
  ],
  'Statiques pull': [
    ['german-hang', 'German hang', 'skin', 1, 'hold', { profile: 'generic' }],
    ['inverted-hang', 'Inverted hang', 'skin', 1, 'hold', { profile: 'generic' }],
    ['tuck-front-lever', 'Tuck front lever', 'front-lever', 3],
    ['adv-tuck-front-lever', 'Advanced tuck front lever', 'front-lever', 4],
    ['one-leg-front-lever', 'One leg front lever', 'front-lever', 5],
    ['straddle-front-lever', 'Straddle front lever', 'front-lever', 6],
    ['half-lay-front-lever', 'Half lay front lever', 'front-lever', 6],
    ['full-front-lever', 'Full front lever', 'front-lever', 7],
    ['wide-front-lever', 'Wide front lever', 'front-lever', 7],
    ['dead-front-lever', 'Dead front lever', 'front-lever-elite', 8],
    ['sat', 'SAT (Straight Arm Touch)', 'front-lever-elite', 8],
    ['front-lever-touch', 'Front lever touch', 'front-lever-elite', 8],
    ['one-arm-front-lever', 'One arm front lever', 'front-lever-elite', 10],
    ['victorian', 'Victorian (anneaux)', 'victorian', 10, 'hold', { equipment: ['anneaux'] }],
    ['victorian-floor', 'Victorian au sol', 'victorian', 10, 'hold', { equipment: ['sol'] }],
    ['victorian-pbars', 'Victorian aux parallèles', 'victorian', 10, 'hold', { equipment: ['parallèles'] }],
    ['tuck-back-lever', 'Tuck back lever', 'back-lever', 2, 'hold', { profile: 'backLever' }],
    ['adv-tuck-back-lever', 'Advanced tuck back lever', 'back-lever', 3, 'hold', { profile: 'backLever' }],
    ['one-leg-back-lever', 'One leg back lever', 'back-lever', 4, 'hold', { profile: 'backLever' }],
    ['straddle-back-lever', 'Straddle back lever', 'back-lever', 4, 'hold', { profile: 'backLever' }],
    ['half-lay-back-lever', 'Half lay back lever', 'back-lever', 5, 'hold', { profile: 'backLever' }],
    ['full-back-lever', 'Full back lever', 'back-lever', 5, 'hold', { profile: 'backLever' }],
    ['wide-back-lever', 'Wide back lever', 'back-lever', 5, 'hold', { profile: 'backLever' }],
    ['high-back-lever', 'High back lever', 'back-lever-elite', 7, 'hold', { profile: 'backLever' }],
    ['back-lever-sat', 'Back lever SAT', 'back-lever-elite', 7, 'hold', { profile: 'backLever' }],
    ['back-lever-touch', 'Back lever touch', 'back-lever-elite', 7, 'hold', { profile: 'backLever' }],
    ['one-arm-back-lever', 'One arm back lever', 'back-lever-elite', 9, 'hold', { profile: 'backLever' }],
    ['cti', 'CTI (Close To Impossible)', 'cti', 10],
    ['back-cti', 'Back CTI', 'cti', 10, 'hold', { profile: 'backLever' }],
  ],
  'Anneaux': [
    ['iron-cross', 'Iron cross', 'cross', 8],
    ['l-cross', 'L-cross', 'cross', 9],
    ['v-cross', 'V-cross', 'cross', 10],
    ['azarian-cross', 'Azarian cross', 'cross', 10],
    ['inverted-cross', 'Inverted cross', 'cross', 10],
  ],
  'Flags & core': [
    ['dragon-flag', 'Dragon flag', 'dragon', 4, 'hold', { equipment: ['banc', 'sol'] }],
    ['shoulder-flag', 'Shoulder flag', 'dragon', 5, 'hold', { equipment: ['sol'] }],
    ['reverse-dragon-flag', 'Reverse dragon flag', 'dragon', 6, 'hold', { equipment: ['sol'] }],
    ['dragon-press', 'Dragon press', 'dragon', 6, 'reps', { equipment: ['sol'] }],
    ['human-flag', 'Human flag', 'flag', 6],
    ['t-flag', 'T-flag', 'flag', 7],
    ['x-flag', 'X-flag', 'flag', 7],
    ['reverse-flag', 'Reverse flag', 'flag', 8],
    ['neck-hold', 'Neck hold / iron neck', 'neck', 8, 'hold', { danger: true, equipment: ['barre'] }],
  ],
  'Dynamiques push': [
    ['bulgarian-push-ups', 'Bulgarian push-ups', 'push-dyn', 3, 'reps', { equipment: ['anneaux'] }],
    ['korean-dips', 'Korean dips', 'dips-dyn', 4, 'reps', { profile: 'dipReps', equipment: ['barre'] }],
    ['pseudo-planche-push-ups', 'Pseudo planche push-ups', 'ppu', 4],
    ['hspu-wall', 'HSPU au mur', 'hspu', 5, 'reps', { profile: 'hspuReps' }],
    ['pike-press', 'Pike press to handstand', 'press', 5, 'reps', { profile: 'generic' }],
    ['impossible-dips', 'Impossible dips', 'dips-dyn', 6, 'reps', { profile: 'dipReps', equipment: ['parallèles'] }],
    ['tuck-planche-push-ups', 'Tuck planche push-ups', 'ppu', 6],
    ['tiger-bend-push-up', 'Tiger bend push-up', 'hspu', 6, 'reps', { profile: 'generic' }],
    ['straddle-press', 'Straddle press to handstand', 'press', 6, 'reps', { profile: 'generic' }],
    ['one-leg-planche-push-ups', 'One leg planche push-ups', 'ppu', 7],
    ['ninety-push-up', '90° push-up', 'hspu', 7, 'reps', { profile: 'bentPlanche' }],
    ['freestanding-hspu', 'Freestanding HSPU', 'hspu', 7, 'reps', { profile: 'hspuReps' }],
    ['deficit-hspu', 'Deficit HSPU', 'hspu', 7, 'reps', { profile: 'hspuReps' }],
    ['l-sit-press', 'L-sit press to handstand', 'press', 7, 'reps', { profile: 'generic' }],
    ['straddle-planche-push-ups', 'Straddle planche push-ups', 'ppu', 8],
    ['stalder-press', 'Stalder press', 'press', 8, 'reps', { profile: 'generic' }],
    ['handstand-to-planche', 'Handstand to planche', 'press', 9, 'reps', { profile: 'generic' }],
    ['full-planche-push-ups', 'Full planche push-ups', 'ppu', 10],
    ['maltese-push-ups', 'Maltese push-ups', 'ppu', 10],
    ['planche-to-handstand', 'Planche to handstand press', 'press', 10, 'reps', { profile: 'generic' }],
    ['manna-to-handstand', 'Manna to handstand press', 'press', 10, 'reps', { profile: 'generic' }],
    ['maltese-press', 'Maltese press', 'press', 10, 'reps', { profile: 'generic' }],
  ],
  'Dynamiques pull': [
    ['dragon-flag-raises', 'Dragon flag raises', 'dragon', 5, 'reps', { profile: 'generic', equipment: ['banc', 'sol'] }],
    ['front-lever-raises', 'Front lever raises', 'fl-dyn', 6],
    ['back-lever-raises', 'Back lever raises', 'bl-dyn', 6, 'reps', { profile: 'generic' }],
    ['front-lever-rows', 'Front lever rows', 'fl-dyn', 7],
    ['back-lever-pull-ups', 'Back lever pull-ups', 'bl-dyn', 7, 'reps', { profile: 'generic' }],
    ['front-lever-pull-ins', 'Front lever pull-ins (vers la candle)', 'fl-dyn', 8],
    ['human-flag-pull-ups', 'Human flag pull-ups', 'flag', 8, 'reps', { profile: 'generic', equipment: ['espalier'] }],
    ['german-hang-muscle-up', 'German hang muscle-up', 'mu-elite', 8, 'reps', { profile: 'generic' }],
    ['front-lever-pull-ups', 'Front lever pull-ups', 'fl-dyn', 9],
    ['hefesto', 'Hefesto', 'mu-elite', 9, 'reps', { profile: 'generic' }],
    ['reverse-muscle-up', 'Reverse muscle-up', 'mu-elite', 9, 'reps', { profile: 'generic' }],
    ['straight-arm-mu-cross', 'Muscle-up bras tendus via la croix', 'cross', 10, 'reps', { profile: 'generic', equipment: ['anneaux'] }],
    ['azarian', 'Azarian (back lever → croix)', 'cross', 10, 'reps', { profile: 'generic', equipment: ['anneaux'] }],
    ['zanetti', 'Zanetti / Van Gelder', 'cross', 10, 'reps', { profile: 'generic', equipment: ['anneaux'] }],
    ['pelican', 'Pelican', 'mu-elite', 10, 'reps', { profile: 'generic', equipment: ['anneaux'] }],
    ['barker-russo', 'Barker Russo', 'mu-elite', 10, 'reps', { profile: 'generic', equipment: ['anneaux'] }],
  ],
  'Freestyle barre': [
    ['skin-the-cat', 'Skin the cat', 'bar-basics', 2, 'reps'],
    ['pullover', 'Pullover (tour d\'appui)', 'bar-basics', 2, 'reps'],
    ['hip-circle', 'Hip circle (avant / arrière)', 'bar-basics', 3, 'reps'],
    ['swing', 'Swing (balancier)', 'swing', 2, 'trick'],
    ['underswitch', 'Underswitch', 'swing', 4],
    ['swing-180', 'Swing 180', 'swing', 4],
    ['swing-360', 'Swing 360', 'swing', 6],
    ['swing-540', 'Swing 540', 'swing', 8],
    ['swing-720', 'Swing 720', 'swing', 10],
    ['kipping-muscle-up', 'Muscle-up dynamique (kipping)', 'mu-dyn', 3, 'reps'],
    ['clap-muscle-up', 'Clap muscle-up', 'mu-dyn', 6, 'reps'],
    ['muscle-up-180', 'Muscle-up 180', 'mu-dyn', 6],
    ['muscle-up-360', 'Muscle-up 360', 'mu-dyn', 8],
    ['giant', 'Tour géant (giant)', 'giant', 5],
    ['reverse-giant', 'Tour géant arrière', 'giant', 6],
    ['eagle-giant', 'Eagle giant', 'giant', 8],
    ['castaway', 'Castaway', 'release', 6],
    ['superman', 'Superman (lâcher)', 'release', 7],
    ['kong', 'Kong', 'release', 7],
    ['windmill', 'Windmill', 'release', 7],
    ['backflip-dismount', 'Backflip de la barre', 'dismount', 5],
    ['frontflip-dismount', 'Frontflip de la barre', 'dismount', 6],
    ['360-dismount', '360 de la barre', 'dismount', 7],
    ['double-backflip-dismount', 'Double backflip de la barre', 'dismount', 10, 'trick', { danger: true }],
  ],
  'Acrobatie sol': [
    ['cartwheel', 'Roue', 'ground', 1],
    ['round-off', 'Rondade', 'ground', 3],
    ['kip-up', 'Kip-up', 'ground', 3],
    ['backflip', 'Backflip', 'ground', 5],
    ['frontflip', 'Frontflip', 'ground', 6],
    ['sideflip', 'Sideflip', 'ground', 6],
    ['aerial', 'Aerial (roue sans mains)', 'ground', 6],
    ['back-handspring', 'Flip arrière (back handspring)', 'ground', 6],
    ['webster', 'Webster', 'ground', 7],
    ['handstand-walk', 'Marche sur les mains (10 m)', 'ground', 4],
  ],
  'Fondamentaux': [
    ['push-up', 'Pompes', 'base-push', 1, 'reps', { profile: 'pushReps', equipment: ['sol'] }],
    ['australian-pull-up', 'Tractions australiennes', 'base-pull', 1, 'reps', { profile: 'generic' }],
    ['pull-up', 'Tractions', 'base-pull', 2, 'reps', { profile: 'pullReps' }],
    ['dips', 'Dips', 'base-dips', 2, 'reps', { profile: 'dipReps', equipment: ['parallèles'] }],
    ['pistol-squat', 'Pistol squat', 'base-legs', 3, 'reps', { profile: 'squatReps', equipment: ['sol'] }],
    ['muscle-up', 'Muscle-up strict (barre)', 'mu', 4, 'reps', { profile: 'pullReps' }],
    ['ring-muscle-up', 'Muscle-up anneaux', 'mu', 5, 'reps', { profile: 'pullReps', equipment: ['anneaux'] }],
    ['archer-pull-up', 'Archer pull-up', 'opp', 5, 'reps', { profile: 'pullReps' }],
    ['one-arm-pull-up', 'One arm pull-up', 'opp', 8, 'reps', { profile: 'pullReps' }],
    ['one-arm-push-up', 'One arm push-up', 'base-push', 4, 'reps', { profile: 'pushReps', equipment: ['sol'] }],
  ],
}

function standardFor(kind: SkillKind, tier: number) {
  if (kind === 'hold') return tier <= 4 ? 10 : tier <= 7 ? 5 : 3
  if (kind === 'reps') return tier <= 2 ? 15 : tier <= 4 ? 8 : tier <= 7 ? 5 : tier <= 9 ? 3 : 1
  return tier <= 4 ? 5 : tier <= 7 ? 3 : 1
}

export const SKILLS: Skill[] = (Object.keys(table) as Category[]).flatMap((category) => {
  const d = defaults[category]
  return table[category].map(([id, name, line, tier, kind, extra]) => {
    const k = kind ?? d.kind
    return {
      id,
      name,
      category,
      line,
      tier,
      kind: k,
      discipline: d.discipline,
      equipment: d.equipment,
      profile: d.profile,
      standard: standardFor(k, tier),
      ...extra,
    }
  })
})

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]))
export const CATEGORIES = Object.keys(table) as Category[]

export const TIER_LABEL = ['', 'F', 'E', 'D', 'C', 'B', 'A', 'S', 'S+', 'SS', 'SSS']
export const TIER_COLOR = ['', '#7c8299', '#8fb3a8', '#5ec2a6', '#3dd6ff', '#5c8dff', '#7c5cff', '#c65cff', '#ff5ca8', '#ff5c39', '#ffc83d']

/** Points de rang d'une figure validée. Croissance exponentielle : une SSS vaut ~40 figures F. */
export const skillBasePoints = (tier: number) => Math.round(12 * Math.pow(1.82, tier))

/** Figures d'une même ligne, triées par difficulté. */
export function lineOf(skill: Skill) {
  return SKILLS.filter((s) => s.line === skill.line).sort((a, b) => a.tier - b.tier)
}

export function unitOf(skill: Skill) {
  return skill.kind === 'hold' ? 's' : skill.kind === 'reps' ? 'reps' : 'réussites'
}

// --- Points techniques (cues) par profil, utilisés par le coach et l'analyseur ---
export const CUES: Record<AnalyzerProfile, string[]> = {
  planche: [
    'Bras verrouillés, coudes tournés vers l\'extérieur',
    'Épaules protractées (dos rond entre les omoplates)',
    'Dépression scapulaire : épaules loin des oreilles',
    'Lean : épaules nettement devant les poignets',
    'Bassin en rétroversion, fessiers serrés',
    'Corps parallèle au sol, hanches à hauteur d\'épaules',
  ],
  bentPlanche: [
    'Coudes à 90°, avant-bras verticaux',
    'Corps horizontal et gainé',
    'Coudes collés au corps (bent arm) ou sous la hanche (90°)',
    'Regard légèrement devant les mains',
  ],
  frontLever: [
    'Bras tendus, dépression scapulaire active',
    'Rétroversion du bassin, gainage hollow',
    'Corps horizontal : hanches à hauteur des épaules',
    'Tirer la barre vers les hanches (lats engagés)',
    'Jambes serrées et pointes tendues',
  ],
  backLever: [
    'Bras tendus, coudes verrouillés',
    'Corps aligné, ne pas casser à la hanche',
    'Fessiers serrés, légère rétroversion',
    'Épaules en extension : vérifier la mobilité avant de charger',
  ],
  handstand: [
    'Ligne poignets – épaules – hanches – chevilles',
    'Épaules ouvertes à fond (oreilles couvertes par les bras)',
    'Gainage hollow, côtes rentrées',
    'Corrections par les doigts (pression) et la paume',
    'Pointes de pieds tendues',
  ],
  lsit: [
    'Bras tendus, épaules en dépression',
    'Jambes tendues, au moins parallèles au sol',
    'Pointes de pieds tendues',
    'Bassin en légère rétroversion, compression active',
  ],
  vsit: [
    'Épaules en dépression et en avant',
    'Compression maximale : jambes au-dessus de l\'horizontale',
    'Bras tendus, mains derrière les hanches pour la manna',
  ],
  flag: [
    'Bras du haut tiré, bras du bas poussant',
    'Corps horizontal, aligné sans rotation',
    'Gainage latéral maximum',
  ],
  elbowLever: [
    'Coudes dans le bas des hanches',
    'Corps horizontal et gainé',
    'Poignets bien échauffés',
  ],
  support: ['Bras verrouillés', 'Épaules basses (dépression)', 'Corps gainé et immobile'],
  pushReps: ['Amplitude complète', 'Coudes à ~45° du corps', 'Gainage de la tête aux pieds', 'Verrouiller en haut'],
  pullReps: ['Partir bras tendus (dead hang)', 'Menton au-dessus de la barre', 'Pas d\'élan (strict)', 'Descente contrôlée'],
  dipReps: ['Épaules sous les coudes en bas (≤ 90°)', 'Verrouillage complet en haut', 'Pas de balancement'],
  hspuReps: ['Tête qui touche (ou déficit complet)', 'Coudes ~45°', 'Verrouillage en haut', 'Ligne corporelle stable'],
  squatReps: ['Fesses sous la hauteur du genou', 'Talon au sol', 'Genou aligné avec le pied'],
  generic: ['Exécution propre et contrôlée', 'Bras tendus quand c\'est demandé', 'Gainage permanent', 'Atterrissage / sortie maîtrisés'],
}
