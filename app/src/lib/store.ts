import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Analysis,
  ChallengeState,
  CoachProfile,
  Combo,
  Competition,
  Profile,
  Program,
  SessionLog,
  SkillRecord,
} from './types'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export interface Settings {
  voice: boolean
  beeps: boolean
  haptics: boolean
  anthropicKey: string
  feedUrl: string
}

interface State {
  profile: Profile | null
  records: SkillRecord[]
  sessions: SessionLog[]
  analyses: Analysis[]
  programs: Program[]
  activeProgramId: string | null
  completedDays: Record<string, string[]> // programId → dayKeys
  combos: Combo[]
  userCompetitions: Competition[]
  feedCache: { at: string; items: Competition[] } | null
  myCoach: CoachProfile | null
  importedCoaches: CoachProfile[]
  challenges: ChallengeState[]
  bonusXp: number
  restDays: string[]
  skin: string
  toursSeen: string[]
  dailyClaims: string[]
  lastRankSeen: number
  settings: Settings
  chat: { role: 'user' | 'assistant'; content: string }[]

  setProfile: (p: Profile) => void
  patchProfile: (p: Partial<Profile>) => void
  addRecord: (r: Omit<SkillRecord, 'id'>) => void
  deleteRecord: (id: string) => void
  saveSession: (s: SessionLog) => void
  deleteSession: (id: string) => void
  addAnalysis: (a: Analysis) => void
  deleteAnalysis: (id: string) => void
  saveProgram: (p: Program) => void
  deleteProgram: (id: string) => void
  setActiveProgram: (id: string | null) => void
  markDay: (programId: string, dayKey: string) => void
  saveCombo: (c: Combo) => void
  deleteCombo: (id: string) => void
  addCompetition: (c: Competition) => void
  deleteCompetition: (id: string) => void
  setFeedCache: (items: Competition[]) => void
  setMyCoach: (c: CoachProfile | null) => void
  importCoach: (c: CoachProfile) => void
  removeCoach: (id: string) => void
  completeChallenge: (c: ChallengeState) => void
  setLastRankSeen: (n: number) => void
  toggleRest: (day: string) => void
  setSkin: (id: string) => void
  markTour: (id: string) => void
  claimDaily: (day: string, xp: number) => void
  setSettings: (s: Partial<Settings>) => void
  setChat: (c: State['chat']) => void
  importAll: (data: Partial<State>) => void
  resetAll: () => void
}

const initial = {
  profile: null,
  records: [],
  sessions: [],
  analyses: [],
  programs: [],
  activeProgramId: null,
  completedDays: {},
  combos: [],
  userCompetitions: [],
  feedCache: null,
  myCoach: null,
  importedCoaches: [],
  challenges: [],
  bonusXp: 0,
  lastRankSeen: 0,
  restDays: [] as string[],
  skin: 'braise',
  toursSeen: [] as string[],
  dailyClaims: [] as string[],
  chat: [],
  settings: {
    voice: true,
    beeps: true,
    haptics: true,
    anthropicKey: '',
    feedUrl: 'https://raw.githubusercontent.com/julienots/calistheniapp/main/app/public/competitions.json',
  },
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...initial,
      setProfile: (profile) => set({ profile }),
      patchProfile: (p) => set((s) => (s.profile ? { profile: { ...s.profile, ...p } } : {})),
      addRecord: (r) => set((s) => ({ records: [...s.records, { ...r, id: uid() }] })),
      deleteRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
      saveSession: (session) =>
        set((s) => {
          const exists = s.sessions.some((x) => x.id === session.id)
          // Chaque série sur une figure alimente l'historique de la figure.
          const fromSession: SkillRecord[] = session.exercises.flatMap((ex) => {
            if (!ex.skillId) return []
            const best = Math.max(0, ...ex.sets.filter((st) => st.done !== false).map((st) => st.seconds ?? st.reps ?? 0))
            return best > 0 ? [{ id: uid(), skillId: ex.skillId, date: session.date, value: best, source: 'seance' as const }] : []
          })
          const records = s.records.filter((r) => !(r.source === 'seance' && r.id.startsWith(session.id)))
          return {
            sessions: exists ? s.sessions.map((x) => (x.id === session.id ? session : x)) : [...s.sessions, session],
            records: [...records, ...fromSession.map((r, i) => ({ ...r, id: `${session.id}-${i}` }))],
          }
        }),
      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id), records: s.records.filter((r) => !r.id.startsWith(id + '-')) })),
      addAnalysis: (a) =>
        set((s) => ({
          analyses: [...s.analyses, a],
          records:
            a.holdSeconds > 0 || (a.reps ?? 0) > 0
              ? [...s.records, { id: uid(), skillId: a.skillId, date: a.date, value: a.reps ?? a.holdSeconds, source: 'analyse', score: a.score }]
              : s.records,
        })),
      deleteAnalysis: (id) => set((s) => ({ analyses: s.analyses.filter((a) => a.id !== id) })),
      saveProgram: (p) => set((s) => ({ programs: [p, ...s.programs.filter((x) => x.id !== p.id)] })),
      deleteProgram: (id) => set((s) => ({ programs: s.programs.filter((p) => p.id !== id), activeProgramId: s.activeProgramId === id ? null : s.activeProgramId })),
      setActiveProgram: (activeProgramId) => set({ activeProgramId }),
      markDay: (programId, dayKey) =>
        set((s) => {
          const cur = s.completedDays[programId] ?? []
          return { completedDays: { ...s.completedDays, [programId]: cur.includes(dayKey) ? cur : [...cur, dayKey] } }
        }),
      saveCombo: (c) => set((s) => ({ combos: [c, ...s.combos.filter((x) => x.id !== c.id)] })),
      deleteCombo: (id) => set((s) => ({ combos: s.combos.filter((c) => c.id !== id) })),
      addCompetition: (c) => set((s) => ({ userCompetitions: [...s.userCompetitions, c] })),
      deleteCompetition: (id) => set((s) => ({ userCompetitions: s.userCompetitions.filter((c) => c.id !== id) })),
      setFeedCache: (items) => set({ feedCache: { at: new Date().toISOString(), items } }),
      setMyCoach: (myCoach) => set({ myCoach }),
      importCoach: (c) => set((s) => ({ importedCoaches: [c, ...s.importedCoaches.filter((x) => x.id !== c.id)] })),
      removeCoach: (id) => set((s) => ({ importedCoaches: s.importedCoaches.filter((c) => c.id !== id) })),
      completeChallenge: (c) => set((s) => ({ challenges: [...s.challenges, c], bonusXp: s.bonusXp + c.xp })),
      setLastRankSeen: (lastRankSeen) => set({ lastRankSeen }),
      setSkin: (skin) => set({ skin }),
      markTour: (id) => set((s) => ({ toursSeen: s.toursSeen.includes(id) ? s.toursSeen : [...s.toursSeen, id] })),
      claimDaily: (day, xp) => set((s) => (s.dailyClaims.includes(day) ? {} : { dailyClaims: [...s.dailyClaims, day], bonusXp: s.bonusXp + xp })),
      toggleRest: (day) => set((s) => ({ restDays: s.restDays.includes(day) ? s.restDays.filter((d) => d !== day) : [...s.restDays, day] })),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setChat: (chat) => set({ chat }),
      importAll: (data) => set((s) => ({ ...s, ...data })),
      resetAll: () => set({ ...initial }),
    }),
    { name: 'gravitas-v1', version: 1 },
  ),
)
