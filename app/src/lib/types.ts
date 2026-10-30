export type Specialty = 'statique' | 'agilite' | 'mixte'
export type Goal = 'skills' | 'force' | 'competition' | 'endurance' | 'hypertrophie'

export interface Profile {
  name: string
  specialty: Specialty
  level: number // 1 → 5
  goals: Goal[]
  goalSkills: { skillId: string; deadline?: string }[]
  equipment: string[]
  daysPerWeek: number
  sessionMinutes: number
  bodyweight?: number
  height?: number
  age?: number
  maxPullups?: number
  maxDips?: number
  maxPushups?: number
  createdAt: string
  isCoach?: boolean
  avatarHue: number
  competitionDate?: string
  competitionName?: string
}

/** Une tentative / performance enregistrée sur une figure. */
export interface SkillRecord {
  id: string
  skillId: string
  date: string
  value: number // secondes, répétitions ou réussites
  source: 'seance' | 'analyse' | 'test'
  score?: number // note /10 issue de l'analyseur
}

export interface SetLog {
  reps?: number
  seconds?: number
  load?: number // kg (+ lest, - assistance)
  rpe?: number
  done?: boolean
}

export type Band = 'léger' | 'moyen' | 'fort'
export type Variant = 'négatives' | 'partielle'

export interface ExerciseLog {
  name: string
  skillId?: string
  exerciseId?: string
  sets: SetLog[]
  notes?: string
  /** Élastique d'assistance utilisé sur cet exercice. */
  band?: Band
  /** Variantes facilitées : la performance ne compte pas comme record de figure. */
  variants?: Variant[]
}

export interface ComboLog {
  comboId?: string
  name: string
  /** Passages réussis proprement. */
  clean: number
}

export interface SessionLog {
  id: string
  date: string
  title: string
  durationMin: number
  type: 'skills' | 'force' | 'agilite' | 'competition' | 'mobilite' | 'libre'
  exercises: ExerciseLog[]
  rpe: number // effort global 1-10
  feeling: number // 1-5
  energy?: number // 1-5
  sleepHours?: number
  bodyweight?: number
  pain?: string[]
  notes?: string
  programId?: string
  dayKey?: string
  location?: string
  /** 1 frais · 2 normal · 3 fatigué · 4 épuisé */
  fatigue?: number
  combos?: ComboLog[]
}

export interface Analysis {
  id: string
  date: string
  skillId: string
  mode: 'video' | 'photo'
  score: number
  holdSeconds: number
  reps?: number
  criteria: { key: string; label: string; score: number; value: string; target: string; tip: string }[]
  verdict: string
  judge: { execution: number; difficulty: number; total: number }
  thumbnail?: string
}

export interface ProgramItem {
  name: string
  skillId?: string
  exerciseId?: string
  block: 'Échauffement' | 'Skill' | 'Force' | 'Assistance' | 'Agilité' | 'Conditionnement' | 'Mobilité' | 'Compétition'
  sets: number
  target: string // ex: "8 s", "5 reps", "45s/45s"
  rest: number // secondes
  rpe?: number
  tempo?: string
  note?: string
}

export interface ProgramDay {
  key: string // w1d1
  week: number
  day: number
  title: string
  focus: string
  items: ProgramItem[]
  estMinutes: number
}

export interface Program {
  id: string
  name: string
  createdAt: string
  author: string
  seed: number
  params: GeneratorParams
  phases: { week: number; name: string; intent: string }[]
  days: ProgramDay[]
  fromCoach?: string
}

export interface GeneratorParams {
  specialty: Specialty
  level: number
  goal: Goal
  goalSkills: string[]
  weeks: number
  daysPerWeek: number
  sessionMinutes: number
  equipment: string[]
  competitionDate?: string
}

export interface Combo {
  id: string
  name: string
  steps: { skillId: string; seconds: number; transition?: string }[]
  createdAt: string
}

export interface Competition {
  id: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
  start: string
  end?: string
  disciplines: string[]
  organizer?: string
  url?: string
  source?: string
  verified?: boolean
  userAdded?: boolean
}

export interface CoachProfile {
  id: string
  name: string
  bio: string
  specialties: string[]
  city?: string
  contact?: string
  price?: string
  certifications?: string
  rating?: number
  programs: Program[]
  remote?: boolean
}

export interface ChallengeState {
  id: string
  completedAt: string
  xp: number
}
