// Voies de progression : chaque voie est une échelle de paliers.
// Un palier se valide avec l'UNE ou l'AUTRE de ses figures.
import { SKILLS, type Category, type Skill } from '../data/skills'
import type { SkillStatus } from './scoring'

export interface Voie {
  id: 'push' | 'pull' | 'equilibre' | 'agilite'
  name: string
  color: string
  categories: Category[]
}

export const VOIES: Voie[] = [
  { id: 'push', name: 'Push', color: '#ff3b30', categories: ['Statiques push', 'Dynamiques push'] },
  { id: 'pull', name: 'Pull', color: '#ff7a1a', categories: ['Statiques pull', 'Dynamiques pull', 'Anneaux'] },
  { id: 'equilibre', name: 'Équilibre', color: '#ffb000', categories: ['Équilibres', 'Assis & compression', 'Flags & core'] },
  { id: 'agilite', name: 'Agilité', color: '#ff4fa0', categories: ['Freestyle barre', 'Acrobatie sol'] },
]

const PALIER_NAMES = ['Novice', 'Initié', 'Athlète', 'Confirmé', 'Expert', 'Élite', 'Maître', 'Titan', 'Légende', 'Mythe']
const ROMAN = ['I', 'II', 'III', 'IV']

export interface Palier {
  index: number
  name: string
  tier: number
  options: Skill[]
  done: boolean
}

/** Paliers d'une voie : figures triées par difficulté, groupées par deux. */
export function paliersOf(voie: Voie, statuses: Record<string, SkillStatus>): Palier[] {
  const skills = SKILLS.filter((s) => voie.categories.includes(s.category) && !s.danger).sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))
  const out: Palier[] = []
  for (let i = 0; i < skills.length; i += 2) {
    const options = skills.slice(i, i + 2)
    const index = out.length
    const tier = Math.max(...options.map((o) => o.tier))
    const family = PALIER_NAMES[Math.min(PALIER_NAMES.length - 1, tier - 1)]
    const sameFamily = out.filter((p) => p.name.startsWith(family)).length
    out.push({
      index,
      name: `${family} ${ROMAN[Math.min(3, sameFamily)]}`,
      tier,
      options,
      done: options.some((o) => (statuses[o.id]?.mastery ?? 0) >= 2),
    })
  }
  return out
}

export function voieProgress(voie: Voie, statuses: Record<string, SkillStatus>) {
  const paliers = paliersOf(voie, statuses)
  const done = paliers.filter((p) => p.done).length
  // le rang de la voie = dernier palier validé en partant du bas, sans trou
  let streak = 0
  for (const p of paliers) {
    if (!p.done) break
    streak++
  }
  const current = streak > 0 ? paliers[streak - 1] : null
  const next = paliers[streak] ?? null
  return { paliers, done, total: paliers.length, current, next, ladder: streak }
}
