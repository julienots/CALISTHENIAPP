import { RANKS, type Rank } from '../data/ranks'
import { SKILLS, SKILL_BY_ID, skillBasePoints, type Skill } from '../data/skills'
import type { Analysis, SessionLog, SkillRecord } from './types'

export const MASTERY = ['Verrouillé', 'En cours', 'Validé', 'Maîtrisé'] as const

export interface SkillStatus {
  skill: Skill
  best: number
  last?: SkillRecord
  mastery: 0 | 1 | 2 | 3
  certified: boolean
  bestScore?: number
  points: number
  attempts: number
}

export function skillStatuses(records: SkillRecord[], analyses: Analysis[]): Record<string, SkillStatus> {
  const out: Record<string, SkillStatus> = {}
  const bySkill = new Map<string, SkillRecord[]>()
  for (const r of records) {
    if (!bySkill.has(r.skillId)) bySkill.set(r.skillId, [])
    bySkill.get(r.skillId)!.push(r)
  }
  for (const skill of SKILLS) {
    const recs = bySkill.get(skill.id) ?? []
    const best = recs.reduce((m, r) => Math.max(m, r.value), 0)
    const mastery: SkillStatus['mastery'] = best <= 0 ? 0 : best < skill.standard ? 1 : best < skill.standard * 2 ? 2 : 3
    const an = analyses.filter((a) => a.skillId === skill.id)
    const bestScore = an.length ? Math.max(...an.map((a) => a.score)) : undefined
    const certified = an.some((a) => a.score >= 8 && (a.reps ?? a.holdSeconds) >= skill.standard)
    const mult = [0, 0.15, 1, 1.4][mastery] * (certified ? 1.25 : 1)
    const sorted = [...recs].sort((a, b) => a.date.localeCompare(b.date))
    out[skill.id] = {
      skill,
      best,
      last: sorted[sorted.length - 1],
      mastery,
      certified,
      bestScore,
      points: Math.round(skillBasePoints(skill.tier) * mult),
      attempts: recs.length,
    }
  }
  return out
}

export function sessionXp(s: SessionLog) {
  const sets = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done !== false).length, 0)
  return Math.round(15 + s.durationMin * 0.6 + sets * 2 + s.rpe * 2)
}

export interface RankState {
  rp: number
  skillRp: number
  xpRp: number
  rank: Rank
  next?: Rank
  progress: number
  missing: string[]
  validatedCount: number
  certifiedCount: number
}

export function computeRank(statuses: Record<string, SkillStatus>, sessions: SessionLog[], bonusXp: number): RankState {
  const list = Object.values(statuses)
  const skillRp = list.reduce((n, s) => n + s.points, 0)
  const rawXp = sessions.reduce((n, s) => n + sessionXp(s), 0) + bonusXp
  // L'assiduité compte, mais ne remplace jamais la maîtrise des figures.
  const xpRp = Math.min(rawXp, Math.round(skillRp * 0.2) + 300)
  const rp = skillRp + xpRp
  const validated = list.filter((s) => s.mastery >= 2)
  const certifiedCount = list.filter((s) => s.certified).length

  const unmet = (r: Rank) => {
    const miss: string[] = []
    if (rp < r.rp) miss.push(`${(r.rp - rp).toLocaleString('fr-FR')} PR manquants`)
    for (const req of r.requires ?? []) {
      const have = validated.filter((s) => s.skill.tier >= req.tier).length
      if (have < req.count) miss.push(`${req.count - have} figure(s) tier ${req.tier}+ à valider`)
    }
    if (r.certified && certifiedCount < r.certified) miss.push(`${r.certified - certifiedCount} figure(s) à certifier via l'analyseur`)
    return miss
  }

  let rank = RANKS[0]
  for (const r of RANKS) if (unmet(r).length === 0) rank = r
    else break
  const next = RANKS[rank.id + 1]
  const progress = next ? Math.max(0, Math.min(1, (rp - rank.rp) / (next.rp - rank.rp))) : 1
  return { rp, skillRp, xpRp, rank, next, progress, missing: next ? unmet(next) : [], validatedCount: validated.length, certifiedCount }
}

/** Niveau estimé 1-5 à partir des fondamentaux et des figures. */
export function estimateLevel(p: { maxPullups?: number; maxDips?: number; maxPushups?: number }, statuses?: Record<string, SkillStatus>) {
  let score = 0
  score += Math.min(4, (p.maxPullups ?? 0) / 5)
  score += Math.min(3, (p.maxDips ?? 0) / 8)
  score += Math.min(2, (p.maxPushups ?? 0) / 20)
  if (statuses) {
    const topTier = Math.max(0, ...Object.values(statuses).filter((s) => s.mastery >= 2).map((s) => s.skill.tier))
    score = Math.max(score, topTier)
  }
  return score < 2 ? 1 : score < 4 ? 2 : score < 6 ? 3 : score < 8 ? 4 : 5
}

export const LEVEL_NAMES = ['', 'Débutant', 'Intermédiaire', 'Avancé', 'Élite', 'Pro / Compétiteur']

/** Prochaine figure à viser dans chaque ligne : la plus facile non validée. */
export function nextInLine(lineId: string, statuses: Record<string, SkillStatus>) {
  const line = SKILLS.filter((s) => s.line === lineId).sort((a, b) => a.tier - b.tier)
  return line.find((s) => (statuses[s.id]?.mastery ?? 0) < 2)
}

/** Progression actuelle d'une ligne : la plus dure validée (ou la première). */
export function currentInLine(lineId: string, statuses: Record<string, SkillStatus>) {
  const line = SKILLS.filter((s) => s.line === lineId).sort((a, b) => a.tier - b.tier)
  const validated = line.filter((s) => (statuses[s.id]?.mastery ?? 0) >= 2)
  return validated[validated.length - 1]
}

export const skillName = (id: string) => SKILL_BY_ID[id]?.name ?? id
