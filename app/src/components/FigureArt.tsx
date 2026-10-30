// Illustrations vectorielles détaillées des figures.
// Squelette cinématique (angles) → muscles galbés, lumière, ombre portée,
// matériel réaliste, et annotations techniques optionnelles (ligne, angles).
import { useId } from 'react'
import type { Skill } from '../data/skills'

type V = { x: number; y: number }
const rad = (d: number) => (d * Math.PI) / 180
const dir = (deg: number): V => ({ x: Math.cos(rad(deg)), y: Math.sin(rad(deg)) })
const add = (a: V, b: V, k = 1): V => ({ x: a.x + b.x * k, y: a.y + b.y * k })
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y })
const len = (a: V) => Math.hypot(a.x, a.y)
const norm = (a: V): V => {
  const l = len(a) || 1
  return { x: a.x / l, y: a.y / l }
}
const perp = (a: V): V => ({ x: -a.y, y: a.x })
const f = (n: number) => n.toFixed(2)
const angDeg = (a: V) => (Math.atan2(a.y, a.x) * 180) / Math.PI

// ---------------------------------------------------------------- Poses
type Equip = 'floor' | 'parallettes' | 'bar' | 'barGap' | 'rings' | 'pbars' | 'pole' | 'bench' | 'air' | 'barHips'
type Support = 'hands' | 'feet' | 'hips' | 'shoulders'
type Motion = 'arc' | 'spin' | 'flip' | 'updown' | 'press' | null

interface Pose {
  T: number // angle hanche → épaules
  c: 1 | -1 // côté poitrine (+1 = rotation +90° de l'axe du tronc)
  arm: [number, number] // bras proche : humérus, avant-bras (angles absolus)
  arm2?: [number, number] | null // bras éloigné (null = caché, ex. one arm)
  hip: number // flexion de hanche (vers la poitrine)
  knee: number // flexion du genou
  hip2?: number
  knee2?: number
  spread?: number // écart de la jambe éloignée (straddle), en degrés
  view?: 'side' | 'front'
  equip: Equip
  support: Support[]
  motion?: Motion
  annotate?: ('line' | 'elbow' | 'hip' | 'lean' | 'vertical')[]
  /** Posture fine : protraction scapulaire (dos rond) et rétroversion du bassin. */
  posture?: { prot?: number; ppt?: number }
  /** Repères techniques légendés sur la fiche. */
  cues?: Cue[]
}

type Cue = 'protraction' | 'depression' | 'ppt' | 'hollow' | 'locked' | 'lean' | 'toes' | 'open' | 'push' | 'compression' | 'pullTop' | 'pushBottom' | 'glutes'

const BASE: Record<string, Pose> = {
  planche: { T: 180, c: -1, arm: [50, 50], arm2: [48, 48], hip: 0, knee: 0, equip: 'floor', support: ['hands'], annotate: ['line', 'lean'], posture: { prot: 1, ppt: 1 }, cues: ['protraction', 'depression', 'ppt', 'hollow', 'locked', 'lean', 'toes'] },
  bentPlanche: { T: 180, c: -1, arm: [8, 92], arm2: [12, 92], hip: 0, knee: 0, equip: 'floor', support: ['hands'], annotate: ['line', 'elbow'], posture: { prot: 0.6, ppt: 1 }, cues: ['ppt', 'hollow', 'toes'] },
  elbowLever: { T: 178, c: -1, arm: [40, 96], arm2: [44, 96], hip: 0, knee: 0, equip: 'floor', support: ['hands'], annotate: ['line', 'elbow'], posture: { ppt: 1 }, cues: ['hollow', 'toes'] },
  frog: { T: 165, c: -1, arm: [70, 105], arm2: [74, 105], hip: 140, knee: 150, equip: 'floor', support: ['hands'] },
  frontLever: { T: 180, c: 1, arm: [-78, -78], arm2: [-80, -80], hip: 0, knee: 0, equip: 'bar', support: ['hands'], annotate: ['line', 'hip'], posture: { prot: 0.3, ppt: 1 }, cues: ['depression', 'locked', 'ppt', 'hollow', 'toes'] },
  backLever: { T: 180, c: -1, arm: [-64, -64], arm2: [-66, -66], hip: 0, knee: 0, equip: 'bar', support: ['hands'], annotate: ['line', 'hip'], posture: { ppt: 1 }, cues: ['locked', 'glutes', 'ppt', 'toes'] },
  handstand: { T: 90, c: -1, arm: [90, 90], arm2: [92, 92], hip: 0, knee: 0, equip: 'floor', support: ['hands'], annotate: ['vertical'], posture: { ppt: 1 }, cues: ['open', 'ppt', 'hollow', 'push', 'toes'] },
  lsit: { T: -90, c: 1, arm: [96, 92], arm2: [98, 92], hip: 90, knee: 0, equip: 'parallettes', support: ['hands'], annotate: ['hip'], posture: { prot: 0.4, ppt: 0.6 }, cues: ['depression', 'locked', 'compression', 'toes'] },
  support: { T: -90, c: 1, arm: [94, 90], arm2: [92, 90], hip: 0, knee: 0, equip: 'pbars', support: ['hands'], annotate: ['vertical'], posture: { ppt: 0.6 }, cues: ['depression', 'locked', 'hollow'] },
  flag: { T: 180, c: -1, arm: [-122, -122], arm2: [128, 128], hip: 0, knee: 0, equip: 'pole', support: ['hands'], annotate: ['line'], posture: { ppt: 0.8 }, cues: ['pullTop', 'pushBottom', 'hollow', 'toes'] },
  dragon: { T: 152, c: 1, arm: [200, 150], arm2: [196, 150], hip: 0, knee: 0, equip: 'bench', support: ['shoulders'], annotate: ['line'] },
  cross: { T: -90, c: 1, arm: [0, 0], arm2: [180, 180], hip: 0, knee: 0, hip2: 0, view: 'front', equip: 'rings', support: ['hands'], cues: ['locked', 'depression'] },
  pull: { T: -90, c: 1, arm: [60, -95], arm2: [64, -95], hip: 8, knee: 10, equip: 'bar', support: ['hands'], motion: 'updown' },
  muscleUp: { T: -88, c: 1, arm: [96, 90], arm2: [94, 90], hip: 6, knee: 0, equip: 'barHips', support: ['hands'], motion: 'updown' },
  push: { T: 204, c: -1, arm: [90, 90], arm2: [88, 88], hip: 0, knee: 0, equip: 'floor', support: ['hands', 'feet'], motion: 'updown', annotate: ['line'], posture: { ppt: 0.7 }, cues: ['hollow', 'ppt'] },
  dips: { T: -80, c: 1, arm: [55, 96], arm2: [58, 96], hip: 10, knee: 60, equip: 'pbars', support: ['hands'], motion: 'updown' },
  squat: { T: -68, c: 1, arm: [-5, -5], arm2: [0, 0], hip: 105, knee: 140, hip2: 95, knee2: 0, equip: 'floor', support: ['feet'], motion: 'updown' },
  hspu: { T: 90, c: -1, arm: [60, 122], arm2: [62, 122], hip: 0, knee: 0, equip: 'floor', support: ['hands'], motion: 'updown' },
  swing: { T: -118, c: 1, arm: [-98, -98], arm2: [-96, -96], hip: -8, knee: 0, equip: 'bar', support: ['hands'], motion: 'arc' },
  spin: { T: -105, c: 1, arm: [-92, -92], arm2: [-88, -88], hip: 20, knee: 0, equip: 'barGap', support: [], motion: 'spin' },
  giant: { T: 90, c: -1, arm: [90, 90], arm2: [92, 92], hip: 0, knee: 0, equip: 'bar', support: ['hands'], motion: 'arc' },
  release: { T: 175, c: -1, arm: [75, 75], arm2: [80, 80], hip: -10, knee: 0, equip: 'barGap', support: [], motion: 'arc' },
  flip: { T: -60, c: 1, arm: [40, 100], arm2: [44, 100], hip: 135, knee: 145, equip: 'air', support: [], motion: 'flip' },
  cartwheel: { T: 110, c: -1, arm: [100, 100], arm2: [60, 60], hip: 0, knee: 0, spread: 70, equip: 'floor', support: ['hands'], motion: 'flip' },
  hang: { T: -78, c: -1, arm: [-118, -118], arm2: [-114, -114], hip: 0, knee: 0, equip: 'bar', support: ['hands'] },
  stand: { T: -90, c: 1, arm: [-95, -95], arm2: [-92, -92], hip: 0, knee: 0, equip: 'floor', support: ['feet'] },
  hero: { T: -90, c: 1, arm: [76, 92], arm2: [104, 88], hip: 0, knee: 0, spread: -16, view: 'front', equip: 'floor', support: ['feet'] },
  coach: { T: -90, c: 1, arm: [60, -60], arm2: [104, 88], hip: 0, knee: 0, spread: -14, view: 'front', equip: 'air', support: [] },
}

const P = (base: string, o: Partial<Pose> = {}): Pose => ({ ...BASE[base], ...o })
const LEGS: Record<string, Partial<Pose>> = {
  tuck: { hip: 138, knee: 145, hip2: 140, knee2: 145 },
  'adv-tuck': { hip: 92, knee: 95, hip2: 94, knee2: 95 },
  'one-leg': { hip: 0, knee: 0, hip2: 92, knee2: 95 },
  straddle: { spread: 34 },
  'half-lay': { hip: 0, knee: 90, hip2: 0, knee2: 90 },
}

function legVariant(id: string): Partial<Pose> {
  if (/adv-tuck/.test(id)) return LEGS['adv-tuck']
  if (/tuck/.test(id)) return LEGS.tuck
  if (/one-leg/.test(id)) return LEGS['one-leg']
  if (/straddle/.test(id)) return LEGS.straddle
  if (/half-lay/.test(id)) return LEGS['half-lay']
  return {}
}

export function poseFor(skill: Skill): Pose {
  const id = skill.id
  const v = legVariant(id)
  const oneArm = /one-arm/.test(id) ? { arm2: null } : {}
  const rings = /rings|anneaux/.test(id) || skill.equipment.includes('anneaux')
  switch (true) {
    case id === 'planche-lean':
      return P('planche', { T: 201, arm: [62, 62], arm2: [60, 60], support: ['hands', 'feet'], cues: ['protraction', 'locked', 'lean', 'hollow'] })
    case /maltese/.test(id):
      return P('planche', { arm: [44, 44], arm2: [42, 42], equip: rings ? 'rings' : 'floor', ...v })
    case /wide-planche/.test(id):
      return P('planche', { arm: [40, 40], arm2: [38, 38] })
    case /forearm-planche/.test(id):
      return P('bentPlanche', { arm: [90, 180], arm2: [92, 180], ...oneArm })
    case /bent-arm|prayer|ninety|90/.test(id):
      return P('bentPlanche', { ...v, motion: skill.kind === 'reps' ? 'updown' : null })
    case skill.line === 'planche' || skill.line === 'planche-elite': {
      // Plus la figure est groupée, moins il faut de lean : bras moins inclinés.
      const a = /adv-tuck/.test(id) ? 58 : /tuck/.test(id) ? 64 : /one-leg/.test(id) ? 56 : /straddle|half-lay/.test(id) ? 53 : 50
      return P('planche', { ...v, ...oneArm, arm: [a, a], arm2: [a - 2, a - 2], equip: rings ? 'rings' : /lean/.test(id) ? 'floor' : 'parallettes' })
    }
    case skill.line === 'ppu':
      return P('planche', { ...v, motion: 'updown' })
    case skill.line === 'elbow':
      return P('elbowLever', oneArm)
    case skill.line === 'balance-arm':
      return P('frog')
    case skill.line === 'front-lever' || skill.line === 'front-lever-elite' || skill.line === 'fl-dyn' || skill.line === 'cti':
      return P('frontLever', {
        ...v,
        ...oneArm,
        arm: /sat|touch/.test(id) ? [-125, -125] : /cti/.test(id) ? [-150, -150] : BASE.frontLever.arm,
        motion: skill.kind === 'reps' ? 'updown' : null,
      })
    case skill.line === 'victorian':
      return P('frontLever', { arm: [-20, -20], arm2: [-22, -22], equip: id === 'victorian-floor' ? 'floor' : id === 'victorian-pbars' ? 'pbars' : 'rings' })
    case skill.line === 'back-lever' || skill.line === 'back-lever-elite' || skill.line === 'bl-dyn':
      return P('backLever', { ...v, ...oneArm, T: /high/.test(id) ? 200 : 180, motion: skill.kind === 'reps' ? 'updown' : null })
    case skill.line === 'skin':
      return P('hang', id === 'inverted-hang' ? { T: 90, c: 1, arm: [-90, -90], arm2: [-92, -92] } : {})
    case id === 'one-arm-handstand':
      return P('handstand', { arm2: [200, 200], spread: 40 })
    case id === 'straddle-handstand':
      return P('handstand', { spread: 70 })
    case id === 'hollowback':
      return P('handstand', { T: 68, hip: -40, knee: 0, hip2: -40 })
    case id === 'handstand-walk':
      return P('handstand', { arm2: [110, 110], motion: 'press' })
    case skill.line === 'handstand' || skill.line === 'oahs':
      return P('handstand')
    case skill.line === 'hspu':
      return P('hspu')
    case skill.line === 'press':
      return P('handstand', { hip: /stalder|straddle|manna/.test(id) ? 0 : 60, spread: /straddle|stalder/.test(id) ? 60 : 0, motion: 'press' })
    case id === 'v-sit':
      return P('lsit', { T: -100, hip: 135 })
    case id === 'manna':
      return P('lsit', { T: -138, hip: 165, arm: [118, 118], arm2: [120, 120] })
    case id === 'compressed-l-sit' || id === 'advanced-l-sit':
      return P('lsit', { hip: 110 })
    case skill.line === 'lsit':
      return P('lsit', { spread: /straddle/.test(id) ? 30 : 0 })
    case skill.line === 'support':
      return P('support')
    case skill.line === 'flag':
      return P('flag', { spread: /x-flag/.test(id) ? 40 : 0, T: /reverse/.test(id) ? 180 : 180, c: /reverse/.test(id) ? 1 : -1, motion: skill.kind === 'reps' ? 'updown' : null })
    case skill.line === 'dragon':
      return P('dragon', { motion: skill.kind === 'reps' ? 'updown' : null })
    case skill.line === 'cross':
      if (/inverted/.test(id)) return P('cross', { T: 90 })
      if (/l-cross/.test(id)) return P('cross', { hip: 0, view: 'front' })
      if (/azarian|zanetti/.test(id)) return P('cross', { motion: 'press' })
      return P('cross')
    case skill.line === 'neck':
      return P('hang', { T: 180, c: 1, arm: [-90, -90], arm2: null })
    case skill.line === 'mu' || skill.line === 'mu-elite':
      return /reverse|hefesto/.test(id) ? P('hang', { motion: 'updown' }) : P('muscleUp', { equip: rings ? 'rings' : 'barHips' })
    case skill.line === 'base-pull' || skill.line === 'opp':
      return P('pull', id === 'australian-pull-up' ? { T: 190, arm: [-80, -80], support: ['hands', 'feet'], equip: 'bar' } : oneArm)
    case skill.line === 'base-push':
      return P('push', oneArm)
    case skill.line === 'push-dyn':
      return P('push', { equip: 'rings' })
    case skill.line === 'base-dips' || skill.line === 'dips-dyn':
      return P('dips')
    case skill.line === 'base-legs':
      return P('squat')
    case skill.line === 'swing':
      return /360|540|720|180|underswitch/.test(id) ? P('spin') : P('swing')
    case skill.line === 'mu-dyn':
      return P('muscleUp', { motion: 'spin' })
    case skill.line === 'giant':
      return P('giant')
    case skill.line === 'release':
      return P('release')
    case skill.line === 'dismount':
      return P('flip', { equip: 'barGap' })
    case skill.line === 'bar-basics':
      return id === 'skin-the-cat' ? P('hang') : P('swing', { T: 180, c: -1, arm: [90, 90], arm2: [92, 92], equip: 'barHips', motion: 'arc' })
    case id === 'cartwheel' || id === 'round-off' || id === 'aerial':
      return P('cartwheel', id === 'aerial' ? { arm: [200, 200], arm2: [-20, -20], support: [], equip: 'floor' } : {})
    case id === 'kip-up':
      return P('flip', { T: 160, hip: 110, knee: 20, equip: 'floor', support: ['shoulders'] })
    case skill.line === 'ground':
      return P('flip', { equip: 'floor', support: [] })
    default:
      return P('stand')
  }
}

// ---------------------------------------------------------------- Skins
export interface SkinDef {
  id: string
  name: string
  stops: [string, string, string]
  far: [string, string]
  hair: string
  unlockRank: number
}

export const SKINS: SkinDef[] = [
  { id: 'braise', name: 'Braise', stops: ['#ffc08a', '#ff7a1a', '#c23a1a'], far: ['#b2502a', '#7a2f17'], hair: '#2a130a', unlockRank: 0 },
  { id: 'rubis', name: 'Rubis', stops: ['#ff9aa8', '#ff3d4e', '#8f0f22'], far: ['#a52032', '#5c0a16'], hair: '#1a0507', unlockRank: 2 },
  { id: 'or', name: 'Or massif', stops: ['#fff1c1', '#ffb000', '#a8580a'], far: ['#b8770d', '#6b3d06'], hair: '#3b2306', unlockRank: 4 },
  { id: 'obsidienne', name: 'Obsidienne', stops: ['#8a7a72', '#3a2c26', '#140c09'], far: ['#2a1f1a', '#0d0806'], hair: '#000000', unlockRank: 6 },
  { id: 'magma', name: 'Magma', stops: ['#fff3a0', '#ff6a00', '#5a0d00'], far: ['#c0400a', '#4a0a00'], hair: '#ffcf3f', unlockRank: 8 },
  { id: 'spectre', name: 'Spectre', stops: ['#ffd6f0', '#ff4fa0', '#5a0a3a'], far: ['#a02a6a', '#3a0626'], hair: '#ffe7a3', unlockRank: 10 },
]
const SKIN_BY_ID = Object.fromEntries(SKINS.map((k) => [k.id, k]))

export const HERO_POSE = BASE.hero
export const COACH_POSE = BASE.coach

// ---------------------------------------------------------------- Squelette
interface Rig {
  hipN: V
  hipF: V
  sh: V
  shN: V
  shF: V
  head: V
  el: V
  wr: V
  el2?: V
  wr2?: V
  knN: V
  anN: V
  knF: V
  anF: V
  u: V
  n: V
  thigh: number
  shin: number
  thigh2: number
  shin2: number
}

const L = { torso: 30, upper: 15.5, fore: 14.5, thigh: 21.5, shin: 21, neck: 8.5 }

function rig(p: Pose): Rig {
  const hip: V = { x: 0, y: 0 }
  const u = dir(p.T)
  const n = { x: u.x * Math.cos(rad(90 * p.c)) - u.y * Math.sin(rad(90 * p.c)), y: u.x * Math.sin(rad(90 * p.c)) + u.y * Math.cos(rad(90 * p.c)) }
  const sh = add(hip, u, L.torso)
  const front = p.view === 'front'
  const w = front ? 8 : 0
  const across = perp(u)
  const shN = add(sh, across, w)
  const shF = add(sh, across, -w)
  const hipN = add(hip, across, front ? 4.5 : 0)
  const hipF = add(hip, across, front ? -4.5 : 0)
  const head = add(add(sh, u, L.neck), n, front ? 0 : 1.6)
  const el = add(shN, dir(p.arm[0]), L.upper)
  const wr = add(el, dir(p.arm[1]), L.fore)
  const el2 = p.arm2 ? add(shF, dir(p.arm2[0]), L.upper) : undefined
  const wr2 = p.arm2 && el2 ? add(el2, dir(p.arm2[1]), L.fore) : undefined
  const legDir = p.T + 180
  const thigh = legDir - p.c * p.hip + (p.spread ?? 0) / 2
  const shin = thigh + p.c * p.knee
  const hip2 = p.hip2 ?? p.hip
  const knee2 = p.knee2 ?? p.knee
  const thigh2 = legDir - p.c * hip2 - (p.spread ?? 0) / 2
  const shin2 = thigh2 + p.c * knee2
  const knN = add(hipN, dir(thigh), L.thigh)
  const anN = add(knN, dir(shin), L.shin)
  const knF = add(hipF, dir(thigh2), L.thigh)
  const anF = add(knF, dir(shin2), L.shin)
  return { hipN, hipF, sh, shN, shF, head, el, wr, el2, wr2, knN, anN, knF, anF, u, n, thigh, shin, thigh2, shin2 }
}

// ---------------------------------------------------------------- Formes
/** Segment galbé : rayons aux extrémités + ventre musculaire de chaque côté. */
function limb(A: V, B: V, rA: number, rB: number, bulgeL: number, bulgeR: number) {
  const d = sub(B, A)
  const l = len(d)
  const uu = norm(d)
  const nn = perp(uu)
  const p1 = add(A, nn, rA)
  const p2 = add(B, nn, rB)
  const c1 = add(add(A, uu, l * 0.3), nn, rA + bulgeL)
  const c2 = add(add(A, uu, l * 0.72), nn, (rA + rB) / 2 + bulgeL * 0.45)
  const q1 = add(B, nn, -rB)
  const q2 = add(A, nn, -rA)
  const k1 = add(add(A, uu, l * 0.72), nn, -((rA + rB) / 2 + bulgeR * 0.45))
  const k2 = add(add(A, uu, l * 0.3), nn, -(rA + bulgeR))
  return `M${f(p1.x)},${f(p1.y)} C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(p2.x)},${f(p2.y)} A${f(rB)},${f(rB)} 0 0 0 ${f(q1.x)},${f(q1.y)} C${f(k1.x)},${f(k1.y)} ${f(k2.x)},${f(k2.y)} ${f(q2.x)},${f(q2.y)} A${f(rA)},${f(rA)} 0 0 0 ${f(p1.x)},${f(p1.y)}Z`
}

/** Ligne de définition musculaire, le long d'un segment, côté ventre. */
function muscleLine(A: V, B: V, offset: number, from = 0.2, to = 0.75, belly = 1.4) {
  const d = sub(B, A)
  const uu = norm(d)
  const nn = perp(uu)
  const l = len(d)
  const s = add(add(A, uu, l * from), nn, offset)
  const e = add(add(A, uu, l * to), nn, offset * 0.6)
  const m = add(add(A, uu, l * ((from + to) / 2)), nn, offset + belly)
  return `M${f(s.x)},${f(s.y)} Q${f(m.x)},${f(m.y)} ${f(e.x)},${f(e.y)}`
}

function torsoPath(r: Rig, p: Pose) {
  const hip = { x: 0, y: 0 }
  const u = r.u
  const front = p.view === 'front'
  if (front) {
    const a = perp(u)
    const pts = [add(hip, a, 6.5), add(add(hip, u, 15), a, 6), add(r.sh, a, 10.5), add(add(r.sh, u, 2.5), a, 6), add(add(r.sh, u, 2.5), a, -6), add(r.sh, a, -10.5), add(add(hip, u, 15), a, -6), add(hip, a, -6.5)]
    const [h1, w1, s1, n1, n2, s2, w2, h2] = pts
    return `M${f(h1.x)},${f(h1.y)} Q${f(w1.x)},${f(w1.y)} ${f(s1.x)},${f(s1.y)} Q${f(n1.x + u.x * 2)},${f(n1.y + u.y * 2)} ${f(n1.x)},${f(n1.y)} L${f(n2.x)},${f(n2.y)} Q${f(n2.x + u.x * 2)},${f(n2.y + u.y * 2)} ${f(s2.x)},${f(s2.y)} Q${f(w2.x)},${f(w2.y)} ${f(h2.x)},${f(h2.y)} Q${f(hip.x - u.x * 4)},${f(hip.y - u.y * 4)} ${f(h1.x)},${f(h1.y)}Z`
  }
  const n = r.n
  // côté poitrine (n) : pectoraux bombés, abdos ; côté dos (-n) : dorsaux, fessiers
  const chestHip = add(hip, n, 5.2)
  const chestWaist = add(add(hip, u, 13), n, 5.4)
  const chestPec = add(add(hip, u, 24), n, 7.6)
  const chestSh = add(r.sh, n, 4.2)
  const prot = p.posture?.prot ?? 0
  const ppt = p.posture?.ppt ?? 0
  const backSh = add(add(r.sh, u, -1), n, -(5.4 + prot * 0.6))
  const backLat = add(add(hip, u, 21 - prot * 2), n, -(6.6 + prot * 2.4))
  const backWaist = add(add(hip, u, 9), n, -(5.2 + ppt * 0.9))
  const glute = add(add(hip, u, -1.5 + ppt * 1.2), n, -(7 - ppt * 2.2))
  const capTop = add(r.sh, u, 4)
  return [
    `M${f(chestHip.x)},${f(chestHip.y)}`,
    `Q${f(chestWaist.x)},${f(chestWaist.y)} ${f(add(chestWaist, u, 5).x)},${f(add(chestWaist, u, 5).y)}`,
    `Q${f(chestPec.x)},${f(chestPec.y)} ${f(chestSh.x)},${f(chestSh.y)}`,
    `Q${f(capTop.x)},${f(capTop.y)} ${f(backSh.x)},${f(backSh.y)}`,
    `Q${f(backLat.x)},${f(backLat.y)} ${f(backWaist.x)},${f(backWaist.y)}`,
    `Q${f(glute.x)},${f(glute.y)} ${f(add(hip, n, -3).x)},${f(add(hip, n, -3).y)}`,
    `Q${f(add(hip, u, -6).x)},${f(add(hip, u, -6).y)} ${f(chestHip.x)},${f(chestHip.y)}Z`,
  ].join(' ')
}

// ---------------------------------------------------------------- Repères
const CUE_TEXT: Record<Cue, [string, string]> = {
  protraction: ['Protraction : dos rond', '#ffcf3f'],
  depression: ['Épaules basses', '#ffcf3f'],
  ppt: ['Rétroversion du bassin', '#ffcf3f'],
  hollow: ['Abdos gainés (hollow)', '#ff9a5a'],
  locked: ['Coudes verrouillés', '#ffffff'],
  lean: ['Épaules devant les mains', '#ff6b8e'],
  toes: ['Pointes tendues', '#ff9a5a'],
  open: ['Épaules ouvertes', '#ffcf3f'],
  push: ['Pousse le sol', '#ffffff'],
  compression: ['Compression active', '#ff9a5a'],
  pullTop: ['Bras haut : tire', '#ffffff'],
  pushBottom: ['Bras bas : pousse', '#ffffff'],
  glutes: ['Fessiers serrés', '#ff9a5a'],
}

function cueGeometry(p: Pose, r: Rig) {
  const hip = { x: 0, y: 0 }
  const { u, n } = r
  const center = add(hip, u, 15)
  const back = { x: -n.x, y: -n.y }
  const mix = (a: V, ka: number, b: V, kb: number) => norm({ x: a.x * ka + b.x * kb, y: a.y * ka + b.y * kb })
  const out: { key: Cue; label: string; color: string; a: V; end: V; box: { x0: number; x1: number; y0: number; y1: number } }[] = []
  const place = (key: Cue, a: V, d: V, dist = 15) => {
    const [label, color] = CUE_TEXT[key]
    const wdt = label.length * 1.86 + 3.4
    const hgt = 5.6
    // le cartouche se place du côté où pointe la flèche ; on l'éloigne tant qu'il chevauche un autre
    const overlaps = (b: { x0: number; x1: number; y0: number; y1: number }) => out.some((o) => b.x0 < o.box.x1 + 1 && b.x1 > o.box.x0 - 1 && b.y0 < o.box.y1 + 1 && b.y1 > o.box.y0 - 1)
    let c = add(a, d, dist)
    let box = { x0: 0, x1: 0, y0: 0, y1: 0 }
    for (let k = 0; k < 8; k++) {
      c = add(a, d, dist + k * 5)
      const cx = c.x + (d.x > 0.35 ? wdt / 2 : d.x < -0.35 ? -wdt / 2 : 0)
      const cy = c.y + (d.y > 0.35 ? hgt / 2 : d.y < -0.35 ? -hgt / 2 : 0)
      box = { x0: cx - wdt / 2, x1: cx + wdt / 2, y0: cy - hgt / 2, y1: cy + hgt / 2 }
      if (!overlaps(box)) break
    }
    out.push({ key, label, color, a, end: c, box })
  }
  for (const k of p.cues ?? []) {
    switch (k) {
      case 'protraction':
        place(k, add(add(r.sh, u, -7), n, -7.2), mix(back, 1, u, 0.15), 16)
        break
      case 'depression':
        place(k, add(add(r.sh, u, 2.5), n, p.view === 'front' ? 0 : -3), mix(u, 1, back, 0.5), 12)
        break
      case 'ppt':
        place(k, add(add(hip, u, -1.5), n, -6), mix(back, 1, u, -0.55), 15)
        break
      case 'glutes':
        place(k, add(add(hip, u, 3), n, -6), mix(back, 1, u, 0.4), 22)
        break
      case 'hollow':
        place(k, add(add(hip, u, 12), n, 5.3), mix(n, 1, u, -0.15), 13)
        break
      case 'locked':
        place(k, r.el, norm(sub(r.el, center)), 13)
        break
      case 'lean':
        place(k, { x: (r.wr.x + r.sh.x) / 2, y: (r.wr.y + r.sh.y) / 2 }, mix(u, 1, n, 0.25), 14)
        break
      case 'toes':
        place(k, add(r.anN, dir(r.shin), 5), mix(dir(r.shin), 1, back, 0.8), 10)
        break
      case 'open':
        place(k, r.sh, back, 14)
        break
      case 'push':
        place(k, r.wr, n, 12)
        break
      case 'compression':
        place(k, add(add(hip, n, 5), dir(r.thigh), 3), mix(n, 1, u, 1.2), 14)
        break
      case 'pullTop':
        place(k, r.el, norm(sub(r.el, r.sh)), 10)
        break
      case 'pushBottom':
        if (r.el2) place(k, r.el2, norm(sub(r.el2, r.sh)), 10)
        break
    }
  }
  return out
}

// ---------------------------------------------------------------- Rendu
export function FigureArt({
  skill,
  pose,
  size = 280,
  detailed = true,
  mastered = false,
  fit = false,
  skin = 'braise',
  cues = true,
  backdrop = true,
}: {
  skill?: Skill
  pose?: Pose
  size?: number
  detailed?: boolean
  mastered?: boolean
  fit?: boolean
  skin?: string
  cues?: boolean
  backdrop?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const p = pose ?? poseFor(skill!)
  const r = rig(p)
  const front = p.view === 'front'

  // Points d'appui → sol / matériel
  const sup: V[] = []
  if (p.support.includes('hands')) sup.push(r.wr, ...(r.wr2 ? [r.wr2] : []))
  if (p.support.includes('feet')) sup.push(r.anN, r.anF)
  if (p.support.includes('shoulders')) sup.push(r.sh)
  if (p.support.includes('hips')) sup.push({ x: 0, y: 0 })
  const joints = [r.sh, r.shN, r.shF, r.head, r.el, r.wr, r.knN, r.anN, r.knF, r.anF, { x: 0, y: 0 }, ...(r.el2 && r.wr2 ? [r.el2, r.wr2] : [])]
  const callouts = detailed && cues ? cueGeometry(p, r) : []
  let minX = Math.min(...joints.map((j) => j.x)) - 9
  let maxX = Math.max(...joints.map((j) => j.x)) + 9
  let minY = Math.min(...joints.map((j) => j.y)) - 9
  let maxY = Math.max(...joints.map((j) => j.y)) + 9
  const handsY = Math.min(r.wr.y, r.wr2?.y ?? Infinity)
  const handsX = (r.wr.x + (r.wr2?.x ?? r.wr.x)) / 2
  const floorY = p.equip === 'floor' || p.equip === 'parallettes' || p.equip === 'bench' ? (sup.length ? Math.max(...sup.map((s) => s.y)) + (p.equip === 'parallettes' ? 9 : 2.6) : maxY + 6) : null
  if (floorY !== null) maxY = Math.max(maxY, floorY + 6)
  if (p.equip === 'bar' || p.equip === 'barGap' || p.equip === 'rings') minY = Math.min(minY, handsY - (p.equip === 'rings' ? 26 : 8))
  if (p.equip === 'pole') {
    minX = Math.min(minX, r.wr.x - 6)
    minY = Math.min(minY, Math.min(r.wr.y, r.wr2?.y ?? r.wr.y) - 14)
    maxY = Math.max(maxY, Math.max(r.wr.y, r.wr2?.y ?? r.wr.y) + 14)
  }
  if (p.motion) {
    minX -= 6
    maxX += 6
    minY -= 6
  }
  for (const c of callouts) {
    minX = Math.min(minX, c.box.x0)
    maxX = Math.max(maxX, c.box.x1)
    minY = Math.min(minY, c.box.y0)
    maxY = Math.max(maxY, c.box.y1)
  }
  const pad = 6
  const w = maxX - minX + pad * 2
  const h = maxY - minY + pad * 2
  const vb = `${f(minX - pad)} ${f(minY - pad)} ${f(w)} ${f(h)}`
  const cx = (minX + maxX) / 2

  const sk = SKIN_BY_ID[skin] ?? SKINS[0]
  const tone = mastered && skin === 'braise' ? (['#ffd29a', '#ff8a2a', '#e2461b'] as const) : sk.stops
  const g = (k: string) => `${k}-${uid}`

  // Bras/jambes : rayons + galbes (deltoïde, biceps/triceps, quadriceps, mollet)
  const upperArm = (A: V, B: V, flip: number) => limb(A, B, 4.9, 3.1, 1.6 * flip, 1.1 * flip)
  const foreArm = (A: V, B: V) => limb(A, B, 3.2, 2.1, 1.1, 0.5)
  const thigh = (A: V, B: V) => limb(A, B, 6.2, 3.9, 1.6, 1.2)
  const shin = (A: V, B: V) => limb(A, B, 3.9, 2.3, 0.6, 1.7)
  const foot = (A: V, deg: number) => limb(A, add(A, dir(deg), 6.5), 2.4, 1.1, 0.2, 0.2)
  const hand = (A: V, deg: number) => limb(A, add(A, dir(deg), 4.2), 2.3, 1.7, 0.3, 0.3)

  const armDeg = p.arm[1]
  const arm2Deg = p.arm2?.[1] ?? 0

  // Annotations techniques
  const annot = detailed ? p.annotate ?? [] : []
  const lineEnd = r.anN
  const elbowAngle = Math.round(180 - Math.abs(((p.arm[1] - p.arm[0] + 540) % 360) - 180))
  const hipAngle = Math.round(180 - Math.abs(p.hip))

  return (
    <svg viewBox={vb} width={fit ? '100%' : size} height={fit ? '100%' : (size * h) / w} preserveAspectRatio="xMidYMid meet" style={{ maxWidth: '100%', overflow: fit ? 'hidden' : 'visible' }} role="img" aria-label={skill?.name ?? 'Athlète'}>
      <defs>
        <linearGradient id={g('skin')} x1="0" y1={f(minY)} x2="0" y2={f(maxY)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={tone[0]} />
          <stop offset="0.45" stopColor={tone[1]} />
          <stop offset="1" stopColor={tone[2]} />
        </linearGradient>
        <linearGradient id={g('far')} x1="0" y1={f(minY)} x2="0" y2={f(maxY)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={sk.far[0]} />
          <stop offset="1" stopColor={sk.far[1]} />
        </linearGradient>
        <linearGradient id={g('metal')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3e6" />
          <stop offset="0.35" stopColor="#c9b8aa" />
          <stop offset="0.7" stopColor="#6c5a4e" />
          <stop offset="1" stopColor="#3b2c24" />
        </linearGradient>
        <linearGradient id={g('metalV')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b2c24" />
          <stop offset="0.4" stopColor="#e9dccf" />
          <stop offset="1" stopColor="#5a4a3f" />
        </linearGradient>
        <linearGradient id={g('wood')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a066" />
          <stop offset="1" stopColor="#7a4a22" />
        </linearGradient>
        <radialGradient id={g('glow')} cx="0.5" cy="0.55" r="0.6">
          <stop offset="0" stopColor="#ff7a1a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('shadow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id={g('soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* halo */}
      {backdrop && <ellipse cx={f(cx)} cy={f((minY + maxY) / 2)} rx={f(w * 0.55)} ry={f(h * 0.55)} fill={`url(#${g('glow')})`} />}

      {/* sol + ombre portée */}
      {floorY !== null && (
        <g>
          <ellipse cx={f(cx)} cy={f(floorY + 0.5)} rx={f((maxX - minX) * 0.42)} ry="3.2" fill={`url(#${g('shadow')})`} />
          <line x1={f(minX - pad)} x2={f(maxX + pad)} y1={f(floorY + 0.6)} y2={f(floorY + 0.6)} stroke="#ffb48033" strokeWidth="0.8" />
        </g>
      )}

      {/* matériel derrière le corps */}
      {p.equip === 'parallettes' &&
        [r.wr, r.wr2].filter((x): x is V => !!x).slice(0, 1).map((wv, i) => (
          <g key={i}>
            <rect x={f(wv.x - 9)} y={f(wv.y + 1.6)} width="18" height="2.6" rx="1.3" fill={`url(#${g('wood')})`} />
            <path d={`M${f(wv.x - 7)},${f(wv.y + 4)} L${f(wv.x - 9)},${f(floorY! - 0.4)} M${f(wv.x + 7)},${f(wv.y + 4)} L${f(wv.x + 9)},${f(floorY! - 0.4)}`} stroke="#8a5a30" strokeWidth="1.8" strokeLinecap="round" />
            <line x1={f(wv.x - 11)} x2={f(wv.x + 11)} y1={f(floorY! - 0.4)} y2={f(floorY! - 0.4)} stroke="#5a3a20" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        ))}
      {p.equip === 'bench' && floorY !== null && (
        <g>
          <rect x={f(r.sh.x - 14)} y={f(r.sh.y + 3)} width="34" height="4" rx="1.5" fill="#4a2c1c" stroke="#ffb48040" strokeWidth="0.4" />
          <path d={`M${f(r.sh.x - 10)},${f(r.sh.y + 7)} V${f(floorY)} M${f(r.sh.x + 16)},${f(r.sh.y + 7)} V${f(floorY)}`} stroke="#3a2216" strokeWidth="2.2" />
        </g>
      )}
      {(p.equip === 'pbars' || p.equip === 'barHips') && (
        <g>
          <rect x={f(handsX - 30)} y={f(Math.min(r.wr.y, r.wr2?.y ?? r.wr.y) + 0.8)} width="60" height="3" rx="1.5" fill={`url(#${g('metal')})`} opacity="0.55" />
        </g>
      )}
      {p.equip === 'rings' &&
        [r.wr, r.wr2].filter((x): x is V => !!x).map((wv, i) => (
          <g key={i} opacity={front || i === 0 ? 1 : 0.6}>
            <line x1={f(wv.x)} x2={f(wv.x + (front ? 0 : 1))} y1={f(minY - pad)} y2={f(wv.y - 4)} stroke="#d9c2a8" strokeWidth="1" />
            <circle cx={f(wv.x)} cy={f(wv.y + 0.5)} r="4.4" fill="none" stroke={`url(#${g('wood')})`} strokeWidth="1.8" />
          </g>
        ))}
      {p.equip === 'pole' && <rect x={f(Math.min(r.wr.x, r.wr2?.x ?? r.wr.x) - 2.2)} y={f(minY - pad)} width="4.4" height={f(h)} rx="2.2" fill={`url(#${g('metalV')})`} />}

      {/* mouvement */}
      {p.motion === 'arc' && <path d={`M${f(handsX - 26)},${f(handsY + 30)} A30,30 0 0 0 ${f(handsX + 26)},${f(handsY + 30)}`} fill="none" stroke="#ffcf3f" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="2 3" markerEnd="" />}
      {p.motion === 'spin' && (
        <g fill="none" stroke="#ffcf3f" strokeLinecap="round" strokeOpacity="0.7">
          <ellipse cx={f(cx)} cy={f((minY + maxY) / 2)} rx={f(w * 0.36)} ry="5" strokeWidth="1.2" strokeDasharray="5 3" />
          <path d={`M${f(cx + w * 0.36 - 3)},${f((minY + maxY) / 2 - 3)} l3,3 l-4,1.6`} strokeWidth="1.2" />
        </g>
      )}
      {p.motion === 'flip' && <path d={`M${f(cx - 22)},${f(maxY - 4)} A26,26 0 1 1 ${f(cx + 22)},${f(maxY - 4)}`} fill="none" stroke="#ffcf3f" strokeOpacity="0.6" strokeWidth="1.3" strokeDasharray="4 3" />}

      {/* membres éloignés (dans l'ombre, ou symétriques en vue de face) */}
      <g fill={front ? `url(#${g('skin')})` : `url(#${g('far')})`} opacity={front ? 1 : 0.92} stroke="#4a1606" strokeOpacity="0.5" strokeWidth="0.4">
        {r.el2 && r.wr2 && (
          <>
            <path d={upperArm(r.shF, r.el2, -1)} />
            <path d={foreArm(r.el2, r.wr2)} />
            <path d={hand(r.wr2, arm2Deg)} />
          </>
        )}
        <path d={thigh(r.hipF, r.knF)} />
        <path d={shin(r.knF, r.anF)} />
        <path d={foot(r.anF, r.shin2)} />
      </g>

      {/* tronc + tête */}
      <g fill={`url(#${g('skin')})`} filter={detailed ? `url(#${g('soft')})` : undefined}>
        <path d={limb(r.sh, r.head, 2.9, 2.6, 0.4, 0.4)} />
        <path d={torsoPath(r, p)} />
        {/* tête : chevelure (côté dos) puis visage décalé vers l'avant */}
        <ellipse cx={f(r.head.x)} cy={f(r.head.y)}  rx="5.4" ry="6" fill={sk.hair} transform={`rotate(${f(angDeg(r.u) + 90)} ${f(r.head.x)} ${f(r.head.y)})`} />
        <ellipse
          cx={f(add(add(r.head, front ? { x: 0, y: 0 } : r.n, 1.1), r.u, -0.9).x)}
          cy={f(add(add(r.head, front ? { x: 0, y: 0 } : r.n, 1.1), r.u, -0.9).y)}
          rx="4.6"
          ry="5.2"
          transform={`rotate(${f(angDeg(r.u) + 90)} ${f(add(add(r.head, front ? { x: 0, y: 0 } : r.n, 1.1), r.u, -0.9).x)} ${f(add(add(r.head, front ? { x: 0, y: 0 } : r.n, 1.1), r.u, -0.9).y)})`}
        />
      </g>

      {/* membres proches */}
      <g fill={`url(#${g('skin')})`} stroke="#6b2208" strokeOpacity="0.55" strokeWidth="0.45" strokeLinejoin="round">
        <path d={thigh(r.hipN, r.knN)} />
        <path d={shin(r.knN, r.anN)} />
        <path d={foot(r.anN, r.shin)} />
        <path d={upperArm(r.shN, r.el, 1)} />
        <path d={foreArm(r.el, r.wr)} />
        <path d={hand(r.wr, armDeg)} />
      </g>

      {/* définition musculaire + reflets */}
      {detailed && (
        <g fill="none" strokeLinecap="round">
          <g stroke="#ffe2c4" strokeOpacity="0.55" strokeWidth="0.55">
            <path d={muscleLine(r.shN, r.el, 2.6, 0.08, 0.5, 1.2)} />
            <path d={muscleLine(r.el, r.wr, 1.5, 0.1, 0.6, 0.6)} />
            <path d={muscleLine(r.hipN, r.knN, 3.4, 0.25, 0.85, 1.3)} />
            <path d={muscleLine(r.knN, r.anN, -2.6, 0.12, 0.5, -1)} />
            {!front && <path d={muscleLine({ x: 0, y: 0 }, r.sh, p.c > 0 ? 4 : -4, 0.35, 0.8, p.c > 0 ? 1.4 : -1.4)} />}
          </g>
          <g stroke="#5a1c08" strokeOpacity="0.45" strokeWidth="0.5">
            {/* abdos / pectoraux */}
            {!front &&
              [0.3, 0.45, 0.6].map((t) => {
                const a = add(add({ x: 0, y: 0 }, r.u, L.torso * t), r.n, 3.2)
                const b = add(a, r.n, 1.8)
                return <path key={t} d={`M${f(a.x)},${f(a.y)} L${f(b.x)},${f(b.y)}`} />
              })}
            {front &&
              (() => {
                const x = perp(r.u)
                const at = (t: number, k: number) => add(add({ x: 0, y: 0 }, r.u, L.torso * t), x, k)
                const pecL = [at(0.82, -7.5), at(0.68, -3.5), at(0.7, 0)]
                const pecR = [at(0.82, 7.5), at(0.68, 3.5), at(0.7, 0)]
                const q = (pts: V[]) => `M${f(pts[0].x)},${f(pts[0].y)} Q${f(pts[1].x)},${f(pts[1].y)} ${f(pts[2].x)},${f(pts[2].y)}`
                return (
                  <>
                    <path d={q(pecL)} />
                    <path d={q(pecR)} />
                    <path d={`M${f(at(0.66, 0).x)},${f(at(0.66, 0).y)} L${f(at(0.18, 0).x)},${f(at(0.18, 0).y)}`} />
                    {[0.55, 0.43, 0.31].map((t) => (
                      <path key={t} d={`M${f(at(t, -3.2).x)},${f(at(t, -3.2).y)} L${f(at(t, 3.2).x)},${f(at(t, 3.2).y)}`} />
                    ))}
                  </>
                )
              })()}
            <path d={muscleLine(r.shN, r.el, -2.2, 0.3, 0.85, -0.8)} />
          </g>
          {/* liseré de lumière */}
          <path d={torsoPath(r, p)} stroke="#fff1dd" strokeOpacity="0.25" strokeWidth="0.45" />
        </g>
      )}

      {/* matériel devant : barre */}
      {(p.equip === 'bar' || p.equip === 'barGap') && (
        <g>
          <rect x={f(handsX - 34)} y={f(handsY - (p.equip === 'barGap' ? 9 : 1.8))} width="68" height="3.6" rx="1.8" fill={`url(#${g('metal')})`} />
          <rect x={f(handsX - 34)} y={f(handsY - (p.equip === 'barGap' ? 9 : 1.8) + 0.6)} width="68" height="0.7" rx="0.35" fill="#fff" opacity="0.55" />
        </g>
      )}
      {p.equip === 'pbars' && <rect x={f(handsX - 30)} y={f(Math.max(r.wr.y, r.wr2?.y ?? r.wr.y) + 0.8)} width="60" height="3.2" rx="1.6" fill={`url(#${g('metal')})`} />}
      {p.equip === 'barHips' && <rect x={f(handsX - 30)} y={f(r.wr.y + 0.6)} width="60" height="3.4" rx="1.7" fill={`url(#${g('metal')})`} />}

      {/* annotations techniques */}
      {annot.includes('line') && (
        <g>
          <line x1={f(r.sh.x)} y1={f(r.sh.y)} x2={f(lineEnd.x + (lineEnd.x - r.sh.x) * 0.08)} y2={f(lineEnd.y + (lineEnd.y - r.sh.y) * 0.08)} stroke="#ffcf3f" strokeWidth="0.7" strokeDasharray="2.5 1.8" />
          <text x={f(lineEnd.x)} y={f(lineEnd.y - 7)} fontSize="4.2" fill="#ffcf3f" textAnchor="middle" fontWeight="700">ligne</text>
        </g>
      )}
      {annot.includes('vertical') && (
        <g>
          <line x1={f(r.wr.x)} y1={f(minY - 2)} x2={f(r.wr.x)} y2={f(maxY)} stroke="#ffcf3f" strokeWidth="0.6" strokeDasharray="2.5 1.8" />
          <text x={f(r.wr.x + 3)} y={f(minY + 2)} fontSize="4" fill="#ffcf3f" fontWeight="700">90°</text>
        </g>
      )}
      {annot.includes('elbow') && !(p.cues ?? []).includes('locked') && (
        <g>
          <circle cx={f(r.el.x)} cy={f(r.el.y)} r="3.4" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="0.5" />
          <text x={f(r.el.x + 4.5)} y={f(r.el.y + 1.5)} fontSize="4" fill="#fff" fontWeight="800">{elbowAngle}°</text>
        </g>
      )}
      {annot.includes('hip') && (
        <text x={f(3)} y={f(-6)} fontSize="4" fill="#fff" fontWeight="800">{hipAngle}°</text>
      )}
      {annot.includes('lean') && (
        <g stroke="#ff3d6e" strokeWidth="0.7" fill="#ff3d6e">
          <line x1={f(r.wr.x)} y1={f(r.wr.y - 1)} x2={f(r.sh.x)} y2={f(r.wr.y - 1)} />
          <path d={`M${f(r.sh.x)},${f(r.wr.y - 1)} l2.2,-1.3 v2.6z`} />
          <text x={f((r.wr.x + r.sh.x) / 2)} y={f(r.wr.y - 3)} fontSize="3.6" textAnchor="middle" stroke="none" fontWeight="700">lean</text>
        </g>
      )}
      {detailed && (p.cues ?? []).includes('ppt') && !front && (() => {
        // flèche courbe : le bassin bascule (rétroversion)
        const a = add(add({ x: 0, y: 0 }, r.u, 5), r.n, -8.2)
        const b = add(add({ x: 0, y: 0 }, r.u, -5.5), r.n, -6.4)
        const sweep = p.c > 0 ? 1 : 0
        return (
          <g stroke="#ffcf3f" strokeWidth="0.75" fill="none" strokeLinecap="round">
            <path d={`M${f(a.x)},${f(a.y)} A9,9 0 0 ${sweep} ${f(b.x)},${f(b.y)}`} />
            <path d={`M${f(b.x)},${f(b.y)} l${f(-r.u.x * 0.4 + r.n.x * 1.8)},${f(-r.u.y * 0.4 + r.n.y * 1.8)} M${f(b.x)},${f(b.y)} l${f(r.u.x * 1.9 - r.n.x * 0.2)},${f(r.u.y * 1.9 - r.n.y * 0.2)}`} />
          </g>
        )
      })()}
      {detailed && (p.cues ?? []).includes('protraction') && !front && (() => {
        const a = add(add(r.sh, r.u, -12), r.n, -8.6)
        const b = add(add(r.sh, r.u, -2), r.n, -7.6)
        return <path d={`M${f(a.x)},${f(a.y)} Q${f(add(add(r.sh, r.u, -7), r.n, -11).x)},${f(add(add(r.sh, r.u, -7), r.n, -11).y)} ${f(b.x)},${f(b.y)}`} stroke="#ffcf3f" strokeWidth="0.75" fill="none" strokeDasharray="1.4 1" />
      })()}
      {callouts.map((c) => (
        <g key={c.key}>
          <line x1={f(c.a.x)} y1={f(c.a.y)} x2={f(c.end.x)} y2={f(c.end.y)} stroke="#fff" strokeOpacity="0.7" strokeWidth="0.35" />
          <circle cx={f(c.a.x)} cy={f(c.a.y)} r="0.95" fill="#fff" />
          <rect x={f(c.box.x0)} y={f(c.box.y0)} width={f(c.box.x1 - c.box.x0)} height={f(c.box.y1 - c.box.y0)} rx="1.6" fill="#100a07" fillOpacity="0.82" stroke={c.color} strokeOpacity="0.7" strokeWidth="0.3" />
          <text x={f((c.box.x0 + c.box.x1) / 2)} y={f(c.box.y1 - 1.75)} fontSize="3.5" fill={c.color} textAnchor="middle" fontWeight="700">
            {c.label}
          </text>
        </g>
      ))}
      {p.motion === 'updown' && detailed && (
        <g stroke="#ffcf3f" strokeWidth="0.9" fill="#ffcf3f" strokeLinecap="round">
          <line x1={f(maxX + 1)} y1={f(minY + 6)} x2={f(maxX + 1)} y2={f(minY + 20)} />
          <path d={`M${f(maxX + 1)},${f(minY + 4)} l-2,3 h4z M${f(maxX + 1)},${f(minY + 22)} l-2,-3 h4z`} stroke="none" />
        </g>
      )}
    </svg>
  )
}
