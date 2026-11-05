// Générateur de programmes : périodisation par blocs, prescription
// individualisée d'après les records réels de l'athlète, variation
// pseudo-aléatoire contrôlée par une graine → programmes illimités.
import { EXERCISES, EX_BY_ID, LINE_DRILLS, type Exercise, type Pattern } from '../data/exercises'
import { SKILLS, SKILL_BY_ID, type Skill } from '../data/skills'
import { currentInLine, nextInLine, type SkillStatus } from './scoring'
import { uid } from './store'
import type { GeneratorParams, Program, ProgramDay, ProgramItem } from './types'

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type R = () => number
const pick = <T,>(r: R, arr: T[]) => arr[Math.floor(r() * arr.length)]
const shuffle = <T,>(r: R, arr: T[]) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const PUSH_LINES = ['planche', 'planche-elite', 'bent-planche', 'maltese', 'handstand', 'oahs', 'hspu', 'ppu', 'press', 'lsit', 'elbow', 'cross', 'support', 'dips-dyn', 'push-dyn', 'base-push', 'base-dips']
const PULL_LINES = ['front-lever', 'front-lever-elite', 'fl-dyn', 'back-lever', 'back-lever-elite', 'bl-dyn', 'victorian', 'cti', 'mu', 'mu-elite', 'opp', 'skin', 'base-pull', 'flag', 'dragon']
const AGI_LINES = ['swing', 'mu-dyn', 'giant', 'release', 'dismount', 'ground', 'bar-basics']

const CODENAMES = ['Opération', 'Protocole', 'Projet', 'Bloc', 'Cycle', 'Mission']
const WORDS = ['Apex', 'Zéro-G', 'Titan', 'Onyx', 'Spartan', 'Vortex', 'Eclipse', 'Forge', 'Nova', 'Atlas', 'Kraken', 'Hydra', 'Phantom', 'Inferno', 'Obsidian']

export const GOAL_LABEL: Record<GeneratorParams['goal'], string> = {
  skills: 'Figures (skills)',
  force: 'Force maximale',
  competition: 'Préparation compétition',
  endurance: 'Endurance / reps',
  hypertrophie: 'Hypertrophie',
}

function defaultLines(p: GeneratorParams): string[] {
  if (p.specialty === 'agilite') return p.level <= 2 ? ['mu-dyn', 'swing', 'bar-basics'] : ['swing', 'mu-dyn', 'release', 'giant']
  if (p.specialty === 'statique') return p.level <= 1 ? ['handstand', 'lsit', 'back-lever'] : ['planche', 'front-lever', 'handstand']
  return p.level <= 1 ? ['handstand', 'mu-dyn', 'back-lever'] : ['planche', 'front-lever', 'swing']
}

function phasesFor(weeks: number, goal: GeneratorParams['goal']) {
  const out: { week: number; name: string; intent: string; intensity: number; volume: number }[] = []
  for (let w = 1; w <= weeks; w++) {
    const isDeload = weeks >= 5 && w % 4 === 0 && w !== weeks
    const frac = w / weeks
    if (goal === 'competition' && w === weeks && weeks >= 3)
      out.push({ week: w, name: 'Affûtage', intent: 'Volume −50 %, intensité maintenue, simulations de passage', intensity: 0.9, volume: 0.5 })
    else if (isDeload) out.push({ week: w, name: 'Décharge', intent: 'Récupération active, technique propre, −40 % de volume', intensity: 0.65, volume: 0.6 })
    else if (frac <= 0.4) out.push({ week: w, name: 'Accumulation', intent: 'Volume élevé, qualité technique, base de tendons', intensity: 0.68 + frac * 0.1, volume: 1 })
    else if (frac <= 0.8) out.push({ week: w, name: 'Intensification', intent: 'Progressions plus dures, moins de volume, RPE 8-9', intensity: 0.78 + (frac - 0.4) * 0.15, volume: 0.85 })
    else out.push({ week: w, name: 'Réalisation', intent: 'Tests de max, tentatives sur la progression suivante', intensity: 0.9, volume: 0.7 })
  }
  return out
}

interface DayTemplate {
  title: string
  focus: string
  lines: 'push' | 'pull' | 'agi' | 'all'
  patterns: Pattern[]
  extra?: 'conditioning' | 'competition' | 'mobility'
}

function templates(p: GeneratorParams): DayTemplate[] {
  const P: DayTemplate = { title: 'Push statique', focus: 'Planche, équilibre, poussée', lines: 'push', patterns: ['push', 'core'] }
  const L: DayTemplate = { title: 'Pull statique', focus: 'Leviers, tirage, muscle-up', lines: 'pull', patterns: ['pull', 'core'] }
  const A: DayTemplate = { title: 'Agilité & freestyle', focus: 'Swing, rotations, lâchers', lines: 'agi', patterns: ['power', 'pull'] }
  const F: DayTemplate = { title: 'Full body', focus: 'Toutes les lignes, densité', lines: 'all', patterns: ['push', 'pull', 'legs'] }
  const C: DayTemplate = { title: 'Combos & endurance', focus: 'Enchaînements, rounds de compétition', lines: 'all', patterns: ['core', 'cardio'], extra: 'competition' }
  const M: DayTemplate = { title: 'Technique & mobilité', focus: 'Handstand, compression, souplesse', lines: 'push', patterns: ['mobility', 'core'], extra: 'mobility' }
  const S = p.specialty
  const byDays: Record<number, DayTemplate[]> =
    S === 'agilite'
      ? {
          2: [A, F],
          3: [A, L, { ...A, title: 'Explosivité & sol', focus: 'Flips, plyo, dismounts' }],
          4: [A, L, { ...A, title: 'Explosivité & sol', focus: 'Flips, plyo, dismounts' }, C],
          5: [A, L, { ...A, title: 'Explosivité & sol' }, P, C],
          6: [A, L, { ...A, title: 'Explosivité & sol' }, P, A, C],
        }
      : S === 'statique'
        ? { 2: [P, L], 3: [P, L, F], 4: [P, L, M, F], 5: [P, L, M, F, C], 6: [P, L, M, P, L, C] }
        : { 2: [F, { ...A, lines: 'all' }], 3: [P, L, A], 4: [P, L, A, C], 5: [P, L, A, M, C], 6: [P, L, A, P, L, C] }
  const days = Math.max(2, Math.min(6, p.daysPerWeek))
  let list = byDays[days]
  if (p.goal === 'competition' && !list.some((d) => d.extra === 'competition')) list = [...list.slice(0, -1), C]
  return list
}

function lineMatches(line: string, kind: DayTemplate['lines']) {
  if (kind === 'all') return true
  if (kind === 'push') return PUSH_LINES.includes(line)
  if (kind === 'pull') return PULL_LINES.includes(line)
  return AGI_LINES.includes(line)
}

function hasEquip(eq: string[], available: string[]) {
  return eq.some((e) => e === 'sol' || available.includes(e))
}

function repScheme(goal: GeneratorParams['goal'], level: number, r: R) {
  switch (goal) {
    case 'force':
      return { reps: pick(r, [3, 4, 5]), sets: 4 + (level >= 3 ? 1 : 0), rest: 180, rpe: 8.5 }
    case 'hypertrophie':
      return { reps: pick(r, [8, 10, 12]), sets: 4, rest: 90, rpe: 8 }
    case 'endurance':
      return { reps: pick(r, [15, 20, 25]), sets: 3, rest: 60, rpe: 7.5 }
    case 'competition':
      return { reps: pick(r, [6, 8, 10]), sets: 4, rest: 90, rpe: 8 }
    default:
      return { reps: pick(r, [5, 6, 8]), sets: 4, rest: 120, rpe: 8 }
  }
}

function holdTarget(skill: Skill, status: SkillStatus | undefined, intensity: number) {
  const best = status?.best ?? 0
  if (best > 0) return Math.max(2, Math.round(best * intensity))
  return skill.tier >= 7 ? 3 : skill.tier >= 4 ? 5 : 10
}

function skillBlock(skill: Skill, status: SkillStatus | undefined, phase: ReturnType<typeof phasesFor>[number], level: number, r: R, isTarget: boolean): ProgramItem[] {
  const items: ProgramItem[] = []
  const vol = phase.volume
  if (skill.kind === 'hold') {
    const t = holdTarget(skill, status, phase.intensity)
    items.push({
      name: skill.name,
      skillId: skill.id,
      block: 'Skill',
      sets: Math.max(3, Math.round((5 + Math.min(level, 3)) * vol)),
      target: `${t} s`,
      rest: skill.tier >= 7 ? 180 : 120,
      rpe: Math.round(phase.intensity * 10),
      note: isTarget ? 'Tentatives sur la figure visée : qualité > durée, arrêt si la forme casse.' : 'Holds de qualité, forme parfaite. Filme 1 série pour l\'analyseur.',
    })
  } else if (skill.kind === 'reps') {
    const best = status?.best ?? 0
    const reps = best > 0 ? Math.max(1, Math.round(best * phase.intensity * 0.8)) : skill.tier >= 7 ? 1 : 3
    items.push({
      name: skill.name,
      skillId: skill.id,
      block: 'Skill',
      sets: Math.max(3, Math.round(5 * vol)),
      target: `${reps} reps`,
      rest: 150,
      rpe: Math.round(phase.intensity * 10),
      tempo: pick(r, ['2-0-1-0', '3-0-1-0', 'X-0-2-0']),
      note: isTarget ? 'Singles / doubles de qualité sur la progression visée.' : undefined,
    })
  } else {
    items.push({
      name: skill.name,
      skillId: skill.id,
      block: 'Agilité',
      sets: Math.max(4, Math.round(8 * vol)),
      target: isTarget ? '1 essai propre' : `${Math.max(1, Math.round((status?.best ?? 1) * 0.7))} réussite(s)`,
      rest: 90,
      note: isTarget ? 'Avec parade / tapis si nécessaire. Stop dès la fatigue technique.' : 'Répétitions propres, amplitude maximale.',
    })
  }
  return items
}

function exerciseItem(ex: Exercise, goal: GeneratorParams['goal'], level: number, phase: ReturnType<typeof phasesFor>[number], week: number, r: R, block: ProgramItem['block'] = 'Force'): ProgramItem {
  const sc = repScheme(goal, level, r)
  const prog = Math.min(3, Math.floor((week - 1) / 2)) // surcharge progressive
  if (ex.kind === 'hold') {
    const base = ex.pattern === 'mobility' ? 45 : ex.level >= 4 ? 10 : 20 + level * 3
    return { name: ex.name, exerciseId: ex.id, block, sets: Math.max(2, Math.round(3 * phase.volume)), target: `${base + prog * 3} s`, rest: ex.pattern === 'mobility' ? 30 : 75, note: ex.cue }
  }
  return {
    name: ex.name,
    exerciseId: ex.id,
    block,
    sets: Math.max(2, Math.round(sc.sets * phase.volume)),
    target: `${sc.reps + (phase.name === 'Décharge' ? 0 : prog)} reps`,
    rest: sc.rest,
    rpe: phase.name === 'Décharge' ? 6 : sc.rpe,
    tempo: goal === 'hypertrophie' ? '3-1-1-0' : undefined,
    note: ex.cue,
  }
}

function warmup(t: DayTemplate, equipment: string[], r: R): ProgramItem[] {
  const base: string[] = ['wrist-circles', 'band-dislocate']
  const spec = t.lines === 'pull' ? ['scap-pull', 'german-hang-stretch', 'aus-row'] : t.lines === 'agi' ? ['kipping-swing', 'tuck-jump', 'scap-pull'] : ['scap-push', 'planche-lean-hold', 'pike-pushup']
  const ids = [...base, ...shuffle(r, spec).slice(0, 2)].filter((id) => hasEquip(EX_BY_ID[id].equipment, equipment) || id === 'band-dislocate')
  return [
    { name: 'Cardio léger (corde, jumping jacks)', block: 'Échauffement', sets: 1, target: '3 min', rest: 0 },
    ...ids.map((id) => ({ name: EX_BY_ID[id].name, exerciseId: id, block: 'Échauffement' as const, sets: 2, target: EX_BY_ID[id].kind === 'hold' ? '20 s' : '10 reps', rest: 20 })),
  ]
}

export function estimate(items: ProgramItem[]) {
  let sec = 0
  for (const it of items) {
    const m = it.target.match(/(\d+)\s*(s|reps|min)/)
    const v = m ? Number(m[1]) : 5
    const work = m?.[2] === 'min' ? v * 60 : m?.[2] === 's' ? v : v * 3
    sec += it.sets * (work + it.rest)
  }
  return Math.round(sec / 60)
}

export function generateProgram(params: GeneratorParams, statuses: Record<string, SkillStatus>, author: string, seed = Math.floor(Math.random() * 1e9)): Program {
  const r = rng(seed)
  const phases = phasesFor(params.weeks, params.goal)
  const tpls = templates(params)
  const goalSkills = params.goalSkills.map((id) => SKILL_BY_ID[id]).filter(Boolean)
  const goalLines = [...new Set(goalSkills.map((s) => s.line))]
  const lines = goalLines.length ? goalLines : defaultLines(params)
  const level = params.level
  const equipment = [...params.equipment, 'sol']

  const days: ProgramDay[] = []
  for (const phase of phases) {
    tpls.forEach((t, di) => {
      const dr = rng(seed + phase.week * 101 + di * 7)
      let items: ProgramItem[] = [...warmup(t, equipment, dr)]

      // 1) Bloc skill : lignes objectifs qui correspondent au jour.
      let dayLines = lines.filter((l) => lineMatches(l, t.lines))
      if (dayLines.length === 0) {
        const pool = (t.lines === 'pull' ? PULL_LINES : t.lines === 'agi' ? AGI_LINES : PUSH_LINES).filter((l) =>
          SKILLS.some((s) => s.line === l && s.tier <= level * 2 + 1 && hasEquip(s.equipment, equipment)),
        )
        dayLines = shuffle(dr, pool).slice(0, 2)
      }
      for (const line of dayLines.slice(0, t.lines === 'all' ? 3 : 2)) {
        const goal = goalSkills.find((g) => g.line === line)
        const cur = currentInLine(line, statuses)
        const next = nextInLine(line, statuses)
        const work = cur ?? next
        if (work) items.push(...skillBlock(work, statuses[work.id], phase, level, dr, false))
        // Travail sur la progression suivante (pas pendant la décharge)
        if (next && next.id !== work?.id && phase.name !== 'Décharge' && (!goal || next.tier <= goal.tier))
          items.push(...skillBlock(next, statuses[next.id], { ...phase, volume: phase.volume * 0.6 }, level, dr, true))
        // Exercices spécifiques de la ligne
        const drills = (LINE_DRILLS[line] ?? []).map((id) => EX_BY_ID[id]).filter((e) => e && e.level <= level + 1 && (level <= 1 || e.level >= 1) && hasEquip(e.equipment, equipment))
        for (const ex of shuffle(dr, drills).slice(0, level >= 3 ? 2 : 1)) items.push(exerciseItem(ex, params.goal, level, phase, phase.week, dr, 'Assistance'))
      }

      // 2) Force générale selon les patterns du jour
      for (const pat of t.patterns) {
        const pool = EXERCISES.filter((e) => e.pattern === pat && e.level <= level + 1 && e.level >= (level <= 1 ? 0 : Math.max(1, level - 2)) && hasEquip(e.equipment, equipment) && !items.some((i) => i.exerciseId === e.id))
        if (pool.length) items.push(exerciseItem(pick(dr, pool), params.goal, level, phase, phase.week, dr))
      }

      // 3) Conditionnement / compétition
      if (t.extra === 'competition' || params.goal === 'competition') {
        const fmt = pick(dr, ['45s/45s', '1min/1min', '30s/30s'])
        items.push({
          name: `Simulation de passage freestyle (${fmt})`,
          block: 'Compétition',
          sets: phase.name === 'Affûtage' ? 2 : 3 + (level >= 4 ? 1 : 0),
          target: fmt,
          rest: 180,
          note: 'Utilise le Timer compétition. Enchaîne tes combos sans pause, note ton RPE.',
        })
      }
      if (params.goal === 'endurance' || t.extra === 'competition') {
        items.push({ name: pick(dr, ['EMOM pull-ups + dips', 'Pyramide tractions', 'Circuit burpees / muscle-ups']), block: 'Conditionnement', sets: 1, target: `${pick(dr, [8, 10, 12])} min`, rest: 0, rpe: 8 })
      }

      // 4) Mobilité / retour au calme
      const mob = EXERCISES.filter((e) => e.pattern === 'mobility' && hasEquip(e.equipment, equipment))
      for (const ex of shuffle(dr, mob).slice(0, t.extra === 'mobility' ? 4 : 2)) items.push(exerciseItem(ex, params.goal, level, phase, phase.week, dr, 'Mobilité'))

      // Ajuste à la durée de séance demandée : on retire de l'assistance puis de la force.
      const order: ProgramItem['block'][] = ['Mobilité', 'Assistance', 'Force', 'Conditionnement']
      let guard = 0
      while (estimate(items) > params.sessionMinutes * 1.1 && guard++ < 20) {
        const blk = order.find((b) => items.filter((i) => i.block === b).length > (b === 'Mobilité' ? 1 : 0))
        if (!blk) break
        const idx = items.map((i) => i.block).lastIndexOf(blk)
        items = items.filter((_, i) => i !== idx)
      }

      days.push({
        key: `w${phase.week}d${di + 1}`,
        week: phase.week,
        day: di + 1,
        title: t.title,
        focus: t.focus,
        items,
        estMinutes: estimate(items),
      })
    })
  }

  const mainName = goalSkills[0]?.name ?? (params.specialty === 'agilite' ? 'Freestyle' : params.specialty === 'statique' ? 'Statique' : 'Hybride')
  return {
    id: uid(),
    name: `${pick(r, CODENAMES)} ${pick(r, WORDS)} — ${mainName}`,
    createdAt: new Date().toISOString(),
    author,
    seed,
    params,
    phases: phases.map(({ week, name, intent }) => ({ week, name, intent })),
    days,
  }
}

export function programToCSV(p: Program) {
  const rows = [['Semaine', 'Jour', 'Séance', 'Bloc', 'Exercice', 'Séries', 'Cible', 'Repos (s)', 'RPE', 'Tempo', 'Note']]
  for (const d of p.days) for (const it of d.items) rows.push([String(d.week), String(d.day), d.title, it.block, it.name, String(it.sets), it.target, String(it.rest), it.rpe ? String(it.rpe) : '', it.tempo ?? '', it.note ?? ''])
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n')
}
