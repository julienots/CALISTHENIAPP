// Actions rapides partagées par le widget Android, les raccourcis de l'icône et l'accueil.
import { nextProgramDay } from './coach'
import { dayKey } from './stats'
import { uid, useStore } from './store'
import type { SessionLog } from './types'

export function todayKey() {
  return dayKey(new Date())
}

/**
 * Valide la séance du jour en un geste. Reprend la séance prévue du programme actif
 * (titre, exercices, nombre de séries) sans inventer de performances : aucune valeur
 * n'est saisie, donc aucun record de figure n'est créé. Détails modifiables ensuite.
 */
export function quickValidate(today = todayKey()): { id: string; created: boolean } {
  const s = useStore.getState()
  const existing = s.sessions.find((x) => dayKey(x.date) === today)
  if (existing) return { id: existing.id, created: false }
  const np = nextProgramDay(s)
  const day = np?.day
  const items = (day?.items ?? []).filter((i) => i.block !== 'Échauffement' && i.block !== 'Mobilité')
  const session: SessionLog = {
    id: uid(),
    date: today === todayKey() ? new Date().toISOString() : new Date(`${today}T18:00:00`).toISOString(),
    title: day?.title ?? 'Séance',
    durationMin: day?.estMinutes ?? s.profile?.sessionMinutes ?? 60,
    type: day ? (/agil/i.test(day.title) ? 'agilite' : /combo|compét/i.test(day.title) ? 'competition' : 'skills') : 'libre',
    exercises: items.map((i) => ({ name: i.name, skillId: i.skillId, exerciseId: i.exerciseId, sets: Array.from({ length: i.sets }, () => ({ done: true })) })),
    rpe: 7,
    feeling: 3,
    programId: np?.program.id,
    dayKey: day?.key,
  }
  if (s.restDays.includes(today)) s.toggleRest(today)
  s.saveSession(session)
  if (np && day) s.markDay(np.program.id, day.key)
  return { id: session.id, created: true }
}

export function quickRest(today = todayKey()) {
  const s = useStore.getState()
  if (s.sessions.some((x) => dayKey(x.date) === today)) return
  if (!s.restDays.includes(today)) s.toggleRest(today)
}
