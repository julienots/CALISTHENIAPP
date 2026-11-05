import { create } from 'zustand'
import { del, get, set as idbSet } from 'idb-keyval'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type {
  Analysis,
  Bilan,
  ChallengeState,
  CoachProfile,
  Combo,
  Competition,
  Profile,
  Program,
  SessionLog,
  SkillRecord,
} from './types'

/**
 * Stockage IndexedDB (bien plus de place que localStorage, plus robuste dans la WebView Android).
 * Migration transparente : si une ancienne sauvegarde localStorage existe, elle est reprise une fois.
 */
const idbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const v = await get<string>(name)
      if (v != null) return v
    } catch {
      /* IndexedDB indisponible : repli sur localStorage */
    }
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: async (name, value) => {
    try {
      await idbSet(name, value)
      try {
        localStorage.removeItem(name) // migration terminée
      } catch {
        /* rien */
      }
    } catch {
      try {
        localStorage.setItem(name, value)
      } catch {
        /* aucun stockage disponible : l'appli continue en mémoire */
      }
    }
  },
  removeItem: async (name) => {
    try {
      await del(name)
    } catch {
      /* rien */
    }
    try {
      localStorage.removeItem(name)
    } catch {
      /* rien */
    }
  },
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export interface Settings {
  voice: boolean
  beeps: boolean
  haptics: boolean
  anthropicKey: string
  feedUrl: string
  /** Taille de l'interface (accessibilité) : 1, 1.1 ou 1.2. */
  textScale?: number
  reduceMotion?: boolean
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
  bilans: Bilan[]
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
  addBilan: (b: Bilan) => void
  deleteBilan: (id: string) => void
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
  bilans: [] as Bilan[],
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
            // une série assistée (élastique, négatives, amplitude partielle) n'est pas un vrai record de figure
            if (!ex.skillId || ex.band || ex.variants?.length) return []
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
      addBilan: (b) => set((s) => ({ bilans: [...(s.bilans ?? []), b] })),
      deleteBilan: (id) => set((s) => ({ bilans: (s.bilans ?? []).filter((b) => b.id !== id) })),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setChat: (chat) => set({ chat }),
      importAll: (data) => set((s) => ({ ...s, ...data })),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'gravitas-v1',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      // on ne sauvegarde pas l'historique du chat ni le cache des compétitions s'ils sont vides
    },
  ),
)
