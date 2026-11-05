// Exercices d'assistance utilisés par le générateur de programmes.
export type Pattern = 'push' | 'pull' | 'core' | 'legs' | 'mobility' | 'wrist' | 'scap' | 'power'

export interface Exercise {
  id: string
  name: string
  pattern: Pattern
  kind: 'reps' | 'hold'
  level: number // 0 = premiers pas (jamais proposé aux confirmés) · 1 → 5
  equipment: string[]
  cue?: string
}

const E = (id: string, name: string, pattern: Pattern, kind: 'reps' | 'hold', level: number, equipment: string[] = ['sol'], cue?: string): Exercise => ({ id, name, pattern, kind, level, equipment, cue })

export const EXERCISES: Exercise[] = [
  // Premiers pas : progressions pour démarrer de zéro, à la maison
  E('wall-pushup', 'Pompes au mur', 'push', 'reps', 0),
  E('incline-pushup', 'Pompes inclinées (mains sur table / banc)', 'push', 'reps', 0),
  E('knee-pushup', 'Pompes sur les genoux', 'push', 'reps', 0),
  E('negative-pushup', 'Pompes négatives (descente 4 s)', 'push', 'reps', 0),
  E('bench-dips', 'Dips sur chaise / banc', 'push', 'reps', 0),
  E('negative-dips', 'Dips négatifs', 'push', 'reps', 1, ['parallèles']),
  E('table-row', 'Rowing sous une table', 'pull', 'reps', 0, ['sol'], 'Table solide et stable uniquement'),
  E('dead-hang', 'Suspension à la barre (dead hang)', 'pull', 'hold', 0, ['barre']),
  E('jumping-pullup', 'Tractions sautées', 'pull', 'reps', 0, ['barre']),
  E('negative-pullup', 'Tractions négatives (descente 4 s)', 'pull', 'reps', 1, ['barre']),
  E('band-pullup', 'Tractions avec élastique', 'pull', 'reps', 1, ['barre', 'élastique']),
  // Push
  E('pushup', 'Pompes', 'push', 'reps', 1),
  E('diamond-pushup', 'Pompes diamant', 'push', 'reps', 2),
  E('pseudo-pushup', 'Pseudo planche push-ups', 'push', 'reps', 3, ['sol'], 'Mains au niveau des hanches, lean maximal'),
  E('archer-pushup', 'Archer push-ups', 'push', 'reps', 3),
  E('pike-pushup', 'Pike push-ups', 'push', 'reps', 2),
  E('elevated-pike-pushup', 'Pike push-ups pieds surélevés', 'push', 'reps', 3, ['sol', 'banc']),
  E('wall-hspu', 'HSPU au mur', 'push', 'reps', 4),
  E('dips', 'Dips', 'push', 'reps', 2, ['parallèles']),
  E('weighted-dips', 'Dips lestés', 'push', 'reps', 4, ['parallèles', 'lest']),
  E('ring-dips', 'Dips aux anneaux', 'push', 'reps', 4, ['anneaux']),
  E('rto-pushup', 'Pompes anneaux RTO', 'push', 'reps', 4, ['anneaux']),
  E('planche-lean-hold', 'Planche lean', 'push', 'hold', 2, ['sol', 'parallettes'], 'Épaules loin devant les mains'),
  E('tuck-planche-pushup', 'Tuck planche push-ups', 'push', 'reps', 5, ['parallettes']),
  E('band-planche', 'Planche assistée élastique', 'push', 'hold', 4, ['élastique', 'parallettes']),
  E('planche-negatives', 'Négatives de planche (HS → planche)', 'push', 'reps', 5, ['parallettes']),
  E('maltese-lean', 'Maltese lean au sol', 'push', 'hold', 5, ['parallettes']),
  E('bench-press-alt', 'Pompes déclinées lestées', 'push', 'reps', 3, ['sol', 'lest']),
  // Pull
  E('aus-row', 'Tractions australiennes', 'pull', 'reps', 1, ['barre']),
  E('pullup', 'Tractions pronation', 'pull', 'reps', 2, ['barre']),
  E('chinup', 'Tractions supination', 'pull', 'reps', 2, ['barre']),
  E('explosive-pullup', 'Tractions explosives (poitrine à la barre)', 'pull', 'reps', 3, ['barre']),
  E('weighted-pullup', 'Tractions lestées', 'pull', 'reps', 4, ['barre', 'lest']),
  E('archer-pullup', 'Archer pull-ups', 'pull', 'reps', 4, ['barre']),
  E('typewriter', 'Typewriter pull-ups', 'pull', 'reps', 4, ['barre']),
  E('fl-tuck-raise', 'Tuck front lever raises', 'pull', 'reps', 3, ['barre']),
  E('fl-row', 'Front lever rows (progression)', 'pull', 'reps', 4, ['barre']),
  E('fl-negatives', 'Négatives de front lever', 'pull', 'reps', 4, ['barre']),
  E('band-fl', 'Front lever assisté élastique', 'pull', 'hold', 3, ['barre', 'élastique']),
  E('ice-cream-maker', 'Ice cream makers', 'pull', 'reps', 4, ['barre']),
  E('straight-arm-pulldown', 'Tirage bras tendus élastique', 'pull', 'reps', 2, ['élastique']),
  E('ring-row', 'Rowing aux anneaux', 'pull', 'reps', 1, ['anneaux']),
  E('high-pullup', 'Tractions hautes (nombril à la barre)', 'pull', 'reps', 4, ['barre']),
  E('mu-transition', 'Transitions de muscle-up (barre basse)', 'pull', 'reps', 3, ['barre']),
  E('skin-cat-reps', 'Skin the cat contrôlés', 'pull', 'reps', 2, ['barre', 'anneaux']),
  // Core
  E('hollow-hold', 'Hollow body hold', 'core', 'hold', 1),
  E('arch-hold', 'Arch hold (superman)', 'core', 'hold', 1),
  E('hanging-leg-raise', 'Relevés de jambes suspendu', 'core', 'reps', 2, ['barre']),
  E('toes-to-bar', 'Toes to bar', 'core', 'reps', 3, ['barre']),
  E('dragon-flag-neg', 'Négatives de dragon flag', 'core', 'reps', 3, ['banc']),
  E('compression-pulse', 'Pulses de compression (jambes tendues)', 'core', 'reps', 2),
  E('pike-lift', 'Pike leg lifts', 'core', 'reps', 2),
  E('l-sit-hold', 'L-sit / tuck L-sit', 'core', 'hold', 2, ['parallettes']),
  E('side-plank', 'Planche latérale', 'core', 'hold', 1),
  E('windshield', 'Essuie-glaces suspendu', 'core', 'reps', 4, ['barre']),
  // Legs
  E('squat', 'Squats', 'legs', 'reps', 1),
  E('pistol', 'Pistol squats', 'legs', 'reps', 3),
  E('shrimp', 'Shrimp squats', 'legs', 'reps', 3),
  E('nordic', 'Nordic curls (négatives)', 'legs', 'reps', 4),
  // Scapula / épaules / poignets / mobilité
  E('scap-pull', 'Scapula pull-ups', 'scap', 'reps', 1, ['barre']),
  E('scap-push', 'Scapula push-ups', 'scap', 'reps', 1),
  E('scap-dips', 'Scapula dips', 'scap', 'reps', 1, ['parallèles']),
  E('band-dislocate', 'Dislocations élastique / bâton', 'mobility', 'reps', 1, ['élastique']),
  E('german-hang-stretch', 'German hang (étirement)', 'mobility', 'hold', 2, ['barre', 'anneaux']),
  E('pancake', 'Pancake stretch', 'mobility', 'hold', 1),
  E('pike-stretch', 'Pike stretch', 'mobility', 'hold', 1),
  E('bridge', 'Pont (bridge)', 'mobility', 'hold', 2),
  E('shoulder-flexion', 'Ouverture d\'épaules au mur', 'mobility', 'hold', 1),
  E('wrist-circles', 'Rotations et étirements de poignets', 'wrist', 'reps', 1),
  E('wrist-pushup', 'Pompes sur dos de main / poignets', 'wrist', 'reps', 2),
  E('finger-pushup', 'Pompes sur les doigts', 'wrist', 'reps', 4),
  E('wall-handstand', 'Handstand face au mur', 'push', 'hold', 2),
  E('chest-to-wall-shoulder-taps', 'Shoulder taps en handstand au mur', 'push', 'reps', 3),
  E('kick-up-drill', 'Kick-ups + saves (roulade / pirouette)', 'push', 'reps', 2),
  // Agilité / explosivité
  E('kipping-swing', 'Balanciers (kip swings) contrôlés', 'power', 'reps', 1, ['barre']),
  E('bar-release-drill', 'Lâchers-reprises à la barre', 'power', 'reps', 3, ['barre']),
  E('tuck-jump', 'Tuck jumps', 'power', 'reps', 1),
  E('clap-pullup', 'Tractions claquées / lâchers', 'power', 'reps', 4, ['barre']),
  E('clap-pushup', 'Pompes claquées', 'power', 'reps', 2),
]

export const EX_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

/** Exercices d'assistance spécifiques par ligne de progression. */
export const LINE_DRILLS: Record<string, string[]> = {
  planche: ['planche-lean-hold', 'pseudo-pushup', 'band-planche', 'planche-negatives', 'tuck-planche-pushup', 'weighted-dips', 'scap-push', 'wrist-pushup'],
  'planche-elite': ['planche-negatives', 'maltese-lean', 'finger-pushup', 'tuck-planche-pushup', 'band-planche'],
  'bent-planche': ['pseudo-pushup', 'diamond-pushup', 'planche-lean-hold', 'wrist-pushup'],
  maltese: ['maltese-lean', 'band-planche', 'rto-pushup', 'planche-negatives'],
  'front-lever': ['fl-tuck-raise', 'fl-row', 'fl-negatives', 'band-fl', 'ice-cream-maker', 'straight-arm-pulldown', 'weighted-pullup', 'hollow-hold'],
  'front-lever-elite': ['fl-negatives', 'ice-cream-maker', 'archer-pullup', 'weighted-pullup', 'fl-row'],
  'fl-dyn': ['fl-row', 'ice-cream-maker', 'fl-negatives', 'weighted-pullup'],
  'back-lever': ['german-hang-stretch', 'skin-cat-reps', 'arch-hold', 'straight-arm-pulldown'],
  'back-lever-elite': ['german-hang-stretch', 'skin-cat-reps', 'arch-hold'],
  'bl-dyn': ['skin-cat-reps', 'german-hang-stretch'],
  handstand: ['wall-handstand', 'chest-to-wall-shoulder-taps', 'kick-up-drill', 'shoulder-flexion', 'wrist-circles', 'hollow-hold'],
  oahs: ['wall-handstand', 'chest-to-wall-shoulder-taps', 'side-plank', 'shoulder-flexion'],
  lsit: ['l-sit-hold', 'compression-pulse', 'pike-lift', 'pancake', 'pike-stretch', 'scap-dips'],
  hspu: ['pike-pushup', 'elevated-pike-pushup', 'wall-hspu', 'wall-handstand'],
  press: ['compression-pulse', 'pike-lift', 'elevated-pike-pushup', 'planche-lean-hold', 'pancake'],
  ppu: ['pseudo-pushup', 'tuck-planche-pushup', 'planche-lean-hold', 'weighted-dips'],
  flag: ['side-plank', 'windshield', 'pullup', 'pike-pushup'],
  dragon: ['dragon-flag-neg', 'hollow-hold', 'hanging-leg-raise'],
  elbow: ['wrist-circles', 'side-plank', 'hollow-hold'],
  cross: ['rto-pushup', 'ring-dips', 'straight-arm-pulldown'],
  victorian: ['fl-negatives', 'german-hang-stretch', 'weighted-pullup'],
  cti: ['german-hang-stretch', 'fl-negatives'],
  mu: ['high-pullup', 'explosive-pullup', 'mu-transition', 'dips'],
  'mu-dyn': ['explosive-pullup', 'clap-pullup', 'mu-transition', 'kipping-swing'],
  'mu-elite': ['high-pullup', 'skin-cat-reps', 'weighted-pullup', 'german-hang-stretch'],
  opp: ['archer-pullup', 'typewriter', 'weighted-pullup'],
  swing: ['kipping-swing', 'bar-release-drill', 'tuck-jump'],
  giant: ['kipping-swing', 'skin-cat-reps', 'hollow-hold', 'arch-hold'],
  release: ['bar-release-drill', 'kipping-swing', 'clap-pullup'],
  dismount: ['tuck-jump', 'kipping-swing', 'bar-release-drill'],
  ground: ['tuck-jump', 'bridge', 'kick-up-drill'],
  'bar-basics': ['hanging-leg-raise', 'skin-cat-reps', 'aus-row'],
  'base-push': ['incline-pushup', 'negative-pushup', 'pushup', 'diamond-pushup', 'archer-pushup'],
  'base-pull': ['dead-hang', 'negative-pullup', 'band-pullup', 'aus-row', 'pullup', 'scap-pull'],
  'base-dips': ['bench-dips', 'negative-dips', 'scap-dips', 'dips'],
  'base-legs': ['squat', 'shrimp', 'pistol'],
  skin: ['german-hang-stretch', 'skin-cat-reps'],
  support: ['scap-dips', 'dips'],
  'balance-arm': ['wrist-circles', 'wrist-pushup'],
  neck: ['side-plank'],
  'push-dyn': ['rto-pushup', 'ring-dips'],
  'dips-dyn': ['dips', 'weighted-dips', 'ring-dips'],
}
