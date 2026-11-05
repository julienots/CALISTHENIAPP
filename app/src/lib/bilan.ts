// Bilan de forme : tests de calisthenics standardisés, notés /100 par qualité physique.
// Barèmes construits sur des repères courants en calisthenics (débutant → élite).
import type { Bilan } from './types'

export type Quality = 'push' | 'pull' | 'core' | 'balance' | 'mobility'

export const QUALITY_LABEL: Record<Quality, string> = {
  push: 'Poussée',
  pull: 'Tirage',
  core: 'Gainage',
  balance: 'Équilibre',
  mobility: 'Mobilité',
}

export interface BilanTest {
  id: string
  quality: Quality
  name: string
  kind: 'reps' | 'hold' | 'timed-reps' | 'choice'
  /** Pour timed-reps : durée du test en secondes. */
  duration?: number
  how: string[]
  /** Valeurs donnant 0, 15, 30, 45, 60, 75, 90, 100 points (interpolation linéaire). */
  scale?: number[]
  choices?: { label: string; score: number }[]
  /** Équipement nécessaire : le test peut être passé si absent. */
  needs?: string
  /** Test de remplacement proposé quand le résultat est 0. */
  fallback?: string
  unit?: string
}

const STEPS = [0, 15, 30, 45, 60, 75, 90, 100]

export const BILAN_TESTS: BilanTest[] = [
  {
    id: 'pushups',
    quality: 'push',
    name: 'Pompes strictes',
    kind: 'reps',
    how: ['Corps gainé, poitrine à un poing du sol, bras verrouillés en haut', 'D\'une traite, sans pause de plus de 2 s', 'Une rep qui casse le gainage ne compte pas'],
    scale: [0, 3, 8, 15, 25, 35, 45, 60],
    unit: 'reps',
    fallback: 'kneepushups',
  },
  {
    id: 'kneepushups',
    quality: 'push',
    name: 'Pompes sur les genoux',
    kind: 'reps',
    how: ['Genoux au sol, corps droit des genoux aux épaules', 'Max de répétitions propres d\'une traite'],
    scale: [0, 5, 12, 20, 30, 40, 50, 60],
    unit: 'reps',
  },
  {
    id: 'dips',
    quality: 'push',
    name: 'Dips',
    kind: 'reps',
    needs: 'parallèles',
    how: ['Barres parallèles, descends jusqu\'à épaule sous le coude', 'Remonte bras verrouillés, épaules basses'],
    scale: [0, 2, 5, 10, 15, 20, 28, 40],
    unit: 'reps',
  },
  {
    id: 'pullups',
    quality: 'pull',
    name: 'Tractions strictes',
    kind: 'reps',
    needs: 'barre',
    how: ['Pronation, bras complètement tendus en bas', 'Menton au-dessus de la barre, sans élan', 'Max d\'une traite'],
    scale: [0, 1, 3, 6, 10, 15, 20, 28],
    unit: 'reps',
    fallback: 'hang',
  },
  {
    id: 'hang',
    quality: 'pull',
    name: 'Suspension à la barre',
    kind: 'hold',
    needs: 'barre',
    how: ['Bras tendus, épaules légèrement actives', 'Tiens le plus longtemps possible'],
    // un débutant sans traction plafonne volontairement à 30 points
    scale: [0, 10, 25, 40, 60, 90, 120, 150],
    unit: 's',
  },
  {
    id: 'hollow',
    quality: 'core',
    name: 'Hollow body hold',
    kind: 'hold',
    how: ['Sur le dos, bas du dos plaqué au sol', 'Bras tendus derrière la tête, jambes tendues décollées', 'Arrête dès que le dos décolle'],
    scale: [0, 10, 20, 30, 45, 60, 90, 120],
    unit: 's',
  },
  {
    id: 'lsit',
    quality: 'core',
    name: 'L-sit jambes tendues',
    kind: 'hold',
    how: ['Au sol, sur parallettes ou aux barres', 'Bras verrouillés, épaules basses, jambes tendues à l\'horizontale', 'Arrête dès que les talons touchent'],
    scale: [0, 2, 5, 10, 15, 20, 30, 45],
    unit: 's',
    fallback: 'tucklsit',
  },
  {
    id: 'tucklsit',
    quality: 'core',
    name: 'Tuck L-sit',
    kind: 'hold',
    how: ['Même appui, genoux groupés contre la poitrine', 'Pieds décollés, bras verrouillés'],
    scale: [0, 3, 8, 15, 20, 30, 45, 60],
    unit: 's',
  },
  {
    id: 'wallhs',
    quality: 'balance',
    name: 'Handstand ventre au mur',
    kind: 'hold',
    how: ['Monte en marchant les pieds au mur, ventre face au mur', 'Mains à 10–20 cm du mur, corps aligné', 'Si c\'est trop dur : tiens un pike sur une chaise et note 0'],
    scale: [0, 5, 15, 30, 45, 60, 90, 120],
    unit: 's',
  },
  {
    id: 'pike',
    quality: 'mobility',
    name: 'Flexion assis jambes tendues',
    kind: 'choice',
    how: ['Assis, jambes tendues et serrées', 'Penche-toi depuis les hanches, sans élan', 'Où arrivent tes mains ?'],
    choices: [
      { label: 'Genoux', score: 10 },
      { label: 'Tibias', score: 35 },
      { label: 'Chevilles', score: 60 },
      { label: 'Orteils', score: 80 },
      { label: 'Paumes au-delà des pieds', score: 100 },
    ],
  },
  {
    id: 'shoulders',
    quality: 'mobility',
    name: 'Bras tendus au-dessus de la tête',
    kind: 'choice',
    how: ['Dos contre le mur, talons, fesses et bas du dos collés', 'Monte les bras tendus jusqu\'au mur', 'Sans cambrer ni plier les coudes'],
    choices: [
      { label: 'Loin du mur', score: 15 },
      { label: 'Presque', score: 55 },
      { label: 'Touche le mur', score: 85 },
      { label: 'Facilement, sans cambrer', score: 100 },
    ],
  },
]

export const TEST_BY_ID = Object.fromEntries(BILAN_TESTS.map((t) => [t.id, t])) as Record<string, BilanTest>

/** Tests du parcours principal (les remplacements sont proposés à la demande). */
export const MAIN_TESTS = BILAN_TESTS.filter((t) => !BILAN_TESTS.some((o) => o.fallback === t.id))

/** Note /100 d'un résultat brut. */
export function testScore(t: BilanTest, value: number): number {
  if (t.kind === 'choice') return value
  const sc = t.scale!
  if (value <= sc[0]) return 0
  for (let i = 1; i < sc.length; i++) {
    if (value <= sc[i]) return Math.round(STEPS[i - 1] + ((value - sc[i - 1]) / (sc[i] - sc[i - 1])) * (STEPS[i] - STEPS[i - 1]))
  }
  return 100
}

/** Plafonds pour les tests de remplacement : ils ne valent pas le test principal. */
const CAP: Record<string, number> = { kneepushups: 30, hang: 30, tucklsit: 35 }

export function scoreBilan(results: Record<string, number>): { scores: Record<Quality, number>; global: number; level: number } {
  const byQ: Partial<Record<Quality, number[]>> = {}
  for (const [id, v] of Object.entries(results)) {
    const t = TEST_BY_ID[id]
    if (!t || v < 0) continue
    // si le test principal est réussi, son remplacement n'est pas compté
    const main = BILAN_TESTS.find((o) => o.fallback === id)
    if (main && (results[main.id] ?? 0) > 0) continue
    if (t.fallback && v === 0 && results[t.fallback] !== undefined) continue
    const sc = Math.min(CAP[id] ?? 100, testScore(t, v))
    ;(byQ[t.quality] ??= []).push(sc)
  }
  const scores = {} as Record<Quality, number>
  for (const q of Object.keys(QUALITY_LABEL) as Quality[]) {
    const a = byQ[q]
    scores[q] = a?.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : -1
  }
  const known = Object.values(scores).filter((v) => v >= 0)
  const global = known.length ? Math.round(known.reduce((x, y) => x + y, 0) / known.length) : 0
  const level = global < 30 ? 1 : global < 50 ? 2 : global < 68 ? 3 : global < 85 ? 4 : 5
  return { scores, global, level }
}

/** Recommandations concrètes pour les 2 qualités les plus faibles. */
export const ADVICE: Record<Quality, { low: string; ex: string[] }> = {
  push: { low: 'Monte ta base de poussée avant les figures : pompes propres puis dips.', ex: ['incline-pushup', 'negative-pushup', 'pushup', 'negative-dips', 'dips'] },
  pull: { low: 'Le tirage débloque muscle-up, front lever et protège les épaules.', ex: ['dead-hang', 'scap-pull', 'negative-pullup', 'aus-row', 'pullup'] },
  core: { low: 'Gainage et compression : la base de toutes les figures statiques.', ex: ['hollow-hold', 'arch-hold', 'compression-pulse', 'l-sit-hold', 'hanging-leg-raise'] },
  balance: { low: 'L\'équilibre sur les mains se travaille un peu tous les jours.', ex: ['pike-pushup', 'wall-handstand', 'chest-to-wall-shoulder-taps', 'kick-up-drill'] },
  mobility: { low: 'La mobilité ouvre la porte au L-sit, au press et au handstand.', ex: ['pike-stretch', 'pancake', 'shoulder-flexion', 'band-dislocate', 'wrist-circles'] },
}

export function weakest(b: Pick<Bilan, 'scores'>, n = 2): Quality[] {
  return (Object.entries(b.scores) as [Quality, number][])
    .filter(([, v]) => v >= 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([q]) => q)
}
