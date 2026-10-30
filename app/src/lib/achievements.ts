// Succès : une collection de trophées à débloquer.
import { SKILLS } from '../data/skills'
import type { IconName } from '../components/Icon'
import { computeRank, skillStatuses } from './scoring'
import { streak } from './stats'
import type { useStore } from './store'

type S = ReturnType<typeof useStore.getState>

export interface Achievement {
  id: string
  name: string
  text: string
  icon: IconName
  test: (s: S) => boolean
}

const statusesOf = (s: S) => skillStatuses(s.records, s.analyses)
const validated = (s: S) => Object.values(statusesOf(s)).filter((x) => x.mastery >= 2)

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-session', name: 'Premier pas', text: 'Enregistrer une séance', icon: 'pencil', test: (s) => s.sessions.length >= 1 },
  { id: 'ten-sessions', name: 'Habitué', text: '10 séances enregistrées', icon: 'calendar', test: (s) => s.sessions.length >= 10 },
  { id: 'fifty-sessions', name: 'Acharné', text: '50 séances enregistrées', icon: 'flame', test: (s) => s.sessions.length >= 50 },
  { id: 'streak-7', name: 'Semaine de feu', text: 'Série de 7 jours', icon: 'flame', test: (s) => streak(s.sessions) >= 7 },
  { id: 'five-skills', name: 'Collectionneur', text: '5 figures validées', icon: 'star', test: (s) => validated(s).length >= 5 },
  { id: 'tier-a', name: 'Rang A', text: 'Valider une figure de tier A', icon: 'gem', test: (s) => validated(s).some((x) => x.skill.tier >= 6) },
  { id: 'tier-s', name: 'Classe S', text: 'Valider une figure de tier S', icon: 'crown', test: (s) => validated(s).some((x) => x.skill.tier >= 7) },
  { id: 'certified', name: 'Œil du juge', text: 'Faire certifier une figure', icon: 'medal', test: (s) => Object.values(statusesOf(s)).some((x) => x.certified) },
  { id: 'analyses-10', name: 'Perfectionniste', text: '10 analyses vidéo', icon: 'camera', test: (s) => s.analyses.length >= 10 },
  { id: 'program', name: 'Planifié', text: 'Terminer une semaine de programme', icon: 'clipboard', test: (s) => Object.values(s.completedDays).some((d) => d.length >= (s.profile?.daysPerWeek ?? 3)) },
  { id: 'combo', name: 'Chorégraphe', text: 'Créer un combo', icon: 'link', test: (s) => s.combos.length >= 1 },
  { id: 'challenges-10', name: 'Relève le gant', text: '10 défis relevés', icon: 'trophy', test: (s) => s.challenges.length >= 10 },
  { id: 'statics-and-agility', name: 'Hybride', text: 'Une figure statique ET une figure d\'agilité validées', icon: 'spiral', test: (s) => validated(s).some((x) => x.skill.discipline === 'statique') && validated(s).some((x) => x.skill.discipline === 'agilite') },
  { id: 'rank-acier', name: 'Acier trempé', text: 'Atteindre le rang ACIER', icon: 'gem', test: (s) => computeRank(statusesOf(s), s.sessions, s.bonusXp).rank.id >= 3 },
  { id: 'half-catalog', name: 'Encyclopédie vivante', text: `Valider ${Math.round(SKILLS.length / 4)} figures`, icon: 'book', test: (s) => validated(s).length >= Math.round(SKILLS.length / 4) },
]
