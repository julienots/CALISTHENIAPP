// Séance express : une séance complète et cohérente selon le temps, le lieu et l'envie du jour.
// Échauffement adapté → bloc principal en alternance (poussée / tirage / jambes / gainage) → retour au calme.
import { EXERCISES, EX_BY_ID, type Exercise, type Pattern } from '../data/exercises'
import { estimate, rng } from './generator'
import type { Program, ProgramItem } from './types'

export type Place = 'maison' | 'barre' | 'parc' | 'mon-materiel'
export type Focus = 'full' | 'haut' | 'statique' | 'agilite' | 'gainage' | 'mobilite'

export const PLACES: { id: Place; label: string; equip: string[] }[] = [
  { id: 'maison', label: 'Maison, sans matériel', equip: ['sol'] },
  { id: 'barre', label: 'Avec une barre', equip: ['sol', 'barre'] },
  { id: 'parc', label: 'Parc de street workout', equip: ['sol', 'barre', 'parallèles', 'banc', 'box'] },
  { id: 'mon-materiel', label: 'Mon matériel', equip: [] },
]
export const FOCUS: { id: Focus; label: string; desc: string }[] = [
  { id: 'full', label: 'Fondamentaux', desc: 'Poussée, tirage, gainage, explosivité' },
  { id: 'haut', label: 'Force', desc: 'Pompes, tractions, dips et variantes' },
  { id: 'statique', label: 'Statique', desc: 'Planche, front lever, L-sit, handstand' },
  { id: 'agilite', label: 'Agilité', desc: 'Swings, lâchers, explosivité, muscle-up' },
  { id: 'gainage', label: 'Gainage & compression', desc: 'Hollow, L-sit, relevés' },
  { id: 'mobilite', label: 'Mobilité', desc: 'Épaules, poignets, pike, pancake' },
]

/** Un créneau = un type de mouvement (pattern) ou une liste d'exercices de calisthenics ciblés. */
type Slot = Pattern | 'static-push' | 'static-pull' | 'static-core' | 'agi'
const POOLS: Record<Exclude<Slot, Pattern>, string[]> = {
  'static-push': ['planche-lean-hold', 'pseudo-pushup', 'tuck-planche-pushup', 'band-planche', 'planche-negatives', 'wall-handstand', 'chest-to-wall-shoulder-taps', 'pike-pushup', 'scap-push'],
  'static-pull': ['dead-hang', 'scap-pull', 'fl-tuck-raise', 'band-fl', 'fl-row', 'fl-negatives', 'skin-cat-reps', 'german-hang-stretch', 'ice-cream-maker'],
  'static-core': ['hollow-hold', 'arch-hold', 'l-sit-hold', 'compression-pulse', 'pike-lift', 'dragon-flag-neg'],
  agi: ['kipping-swing', 'bar-release-drill', 'tuck-jump', 'clap-pushup', 'explosive-pullup', 'high-pullup', 'mu-transition', 'clap-pullup', 'kick-up-drill', 'skin-cat-reps'],
}
const ROTATION: Record<Focus, Slot[]> = {
  full: ['push', 'pull', 'core', 'power', 'push', 'pull', 'core'],
  haut: ['push', 'pull', 'push', 'pull', 'push', 'pull', 'core'],
  statique: ['static-push', 'static-pull', 'static-core', 'static-push', 'static-pull', 'static-core', 'static-push'],
  agilite: ['agi', 'agi', 'pull', 'agi', 'push', 'agi', 'core'],
  gainage: ['core', 'static-core', 'core', 'scap', 'static-core', 'core', 'core'],
  mobilite: ['mobility', 'wrist', 'mobility', 'scap', 'mobility', 'mobility', 'wrist'],
}

const has = (need: string[], eq: string[]) => need.every((x) => eq.includes(x))

export interface ExpressParams {
  minutes: number
  place: Place
  focus: Focus
  level: number
  equipment: string[]
  seed?: number
}

export function buildExpress(p: ExpressParams): Program {
  const seed = p.seed ?? Math.floor(Math.random() * 1e9)
  const r = rng(seed)
  const eq = [...new Set([...(p.place === 'mon-materiel' ? p.equipment : PLACES.find((x) => x.id === p.place)!.equip), 'sol'])]
  const L = Math.max(1, Math.min(5, p.level))
  const lo = L <= 1 ? 0 : Math.max(1, L - 2)
  const hi = L <= 1 ? 1 : L
  const rest = p.minutes <= 10 ? 30 : L <= 1 ? 75 : 60 + L * 6
  const sets = p.focus === 'mobilite' ? 2 : p.minutes <= 10 ? 2 : p.minutes >= 45 ? 4 : 3

  const prescribe = (ex: Exercise, block: ProgramItem['block']): ProgramItem => {
    if (ex.kind === 'hold') {
      const s = ex.pattern === 'mobility' || ex.pattern === 'wrist' ? 40 : ex.level >= 4 ? 10 : L <= 1 ? 20 : 15 + L * 5
      return { name: ex.name, exerciseId: ex.id, block, sets, target: `${s} s`, rest: ex.pattern === 'mobility' ? 20 : rest, note: ex.cue }
    }
    const reps = ex.pattern === 'legs' || ex.pattern === 'core' ? (L <= 1 ? 12 : 15) : ex.level >= 4 ? 5 : ex.level >= 3 ? 8 : L <= 1 ? 8 : 12
    return { name: ex.name, exerciseId: ex.id, block, sets, target: `${reps} reps`, rest, rpe: 8, note: ex.cue }
  }

  const used = new Set<string>()
  const pickFor = (slot: Slot): Exercise | undefined => {
    const inSlot = (e: Exercise) => (slot in POOLS ? POOLS[slot as keyof typeof POOLS].includes(e.id) : e.pattern === slot)
    const ok = (e: Exercise, a: number, b: number) => inSlot(e) && e.level >= a && e.level <= b && has(e.equipment, eq) && !used.has(e.id)
    let pool = EXERCISES.filter((e) => ok(e, lo, hi))
    if (!pool.length) pool = EXERCISES.filter((e) => ok(e, 0, hi + 1)).sort((a, b) => b.level - a.level).slice(0, 2)
    if (!pool.length) return undefined
    const ex = pool[Math.floor(r() * pool.length)]
    used.add(ex.id)
    return ex
  }

  // Échauffement articulaire ciblé (poignets, omoplates, épaules)
  const warmIds = ['wrist-circles', 'scap-push', ...(eq.includes('barre') ? ['scap-pull'] : []), 'shoulder-flexion']
  const warm = (p.focus === 'mobilite' ? ['wrist-circles', 'scap-push'] : warmIds).map((id) => {
    const ex = EX_BY_ID[id]
    used.add(id)
    return { name: ex.name, exerciseId: id, block: 'Échauffement' as const, sets: 1, target: ex.kind === 'hold' ? '30 s' : '10 reps', rest: 15 }
  })
  const cool: ProgramItem[] =
    p.focus === 'mobilite'
      ? []
      : [p.focus === 'statique' || p.focus === 'gainage' ? 'pike-stretch' : p.focus === 'agilite' ? 'german-hang-stretch' : 'shoulder-flexion']
          .filter((id) => has(EX_BY_ID[id].equipment, eq) && !used.has(id))
          .map((id) => ({ name: EX_BY_ID[id].name, exerciseId: id, block: 'Mobilité' as const, sets: 1, target: '45 s', rest: 0 }))

  const main: ProgramItem[] = []
  const block: ProgramItem['block'] = p.focus === 'mobilite' ? 'Mobilité' : p.focus === 'statique' ? 'Skill' : p.focus === 'agilite' ? 'Agilité' : 'Force'
  const rot = ROTATION[p.focus]
  for (let i = 0; i < 12; i++) {
    const ex = pickFor(rot[i % rot.length])
    if (!ex) continue
    const it = prescribe(ex, block)
    if (main.length >= 2 && estimate([...warm, ...main, it, ...cool]) > p.minutes) break
    main.push(it)
  }

  const items = [...warm, ...main, ...cool]
  const focus = FOCUS.find((f) => f.id === p.focus)!
  return {
    id: 'express',
    name: `Express · ${focus.label}`,
    createdAt: new Date().toISOString(),
    author: 'GRAVITAS',
    seed,
    params: { specialty: 'mixte', level: L, goal: p.focus === 'statique' || p.focus === 'agilite' ? 'skills' : 'force', goalSkills: [], weeks: 1, daysPerWeek: 1, sessionMinutes: p.minutes, equipment: eq },
    phases: [{ week: 1, name: 'Express', intent: focus.desc }],
    days: [{ key: 'x1', week: 1, day: 1, title: `${focus.label} · ${p.minutes} min`, focus: focus.desc, items, estMinutes: estimate(items) }],
  }
}
