// Données en ligne : uniquement la lecture d'un fichier public (pas de serveur, pas de compte).
import type { Competition } from './types'
import { useStore } from './store'

export async function fetchJSON<T>(url: string, timeout = 8000): Promise<T> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeout)
  try {
    const res = await fetch(url, { signal: ctl.signal, cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(t)
  }
}

const REPO_RAW = 'https://raw.githubusercontent.com/julienots/calistheniapp'
/** Fichiers publics essayés dans l'ordre : réglage perso, branche principale, branche de travail. */
function feedCandidates(file: string) {
  const { feedUrl } = useStore.getState().settings
  const custom = feedUrl && file === 'competitions.json' ? [feedUrl] : []
  return [...new Set([...custom, `${REPO_RAW}/main/app/public/${file}`, `${REPO_RAW}/ccr-ae020bf4-yiqyy8/app/public/${file}`])]
}

async function fetchFirst<T>(file: string, errors: string[]): Promise<T | null> {
  if (!navigator.onLine) return null
  for (const url of feedCandidates(file)) {
    try {
      return await fetchJSON<T>(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now())
    } catch (e) {
      errors.push(`${url.split('/').slice(-4, -3)[0] ?? 'flux'} : ${(e as Error).message}`)
    }
  }
  return null
}

/** Récupère toutes les compétitions : liste embarquée dans l'APK + fichier public du dépôt GitHub (gratuit, aucun serveur). */
export async function loadCompetitions(): Promise<{ items: Competition[]; online: boolean; errors: string[] }> {
  const errors: string[] = []
  const all = new Map<string, Competition>()
  const add = (list: Competition[]) => list.forEach((c) => c?.id && c.start && Number.isFinite(c.lat) && Number.isFinite(c.lng) && all.set(c.id, c))
  try {
    add(await fetchJSON<Competition[]>('./competitions.json'))
  } catch {
    errors.push('Liste embarquée illisible')
  }
  const remote = await fetchFirst<Competition[]>('competitions.json', errors)
  if (Array.isArray(remote)) add(remote)
  const items = [...all.values()]
  if (items.length) useStore.getState().setFeedCache(items)
  return { items, online: !!remote, errors: remote ? [] : errors }
}

export interface CompetitionSeries {
  id: string
  name: string
  where: string
  period: string
  disciplines: string[]
  url: string
}

/** Séries récurrentes dont la prochaine date n'est pas encore publiée. */
export async function loadSeries(): Promise<CompetitionSeries[]> {
  const m = new Map<string, CompetitionSeries>()
  try {
    for (const x of await fetchJSON<CompetitionSeries[]>('./competition-series.json')) m.set(x.id, x)
  } catch {
    /* fichier absent */
  }
  const remote = await fetchFirst<CompetitionSeries[]>('competition-series.json', [])
  if (Array.isArray(remote)) for (const x of remote) if (x?.id) m.set(x.id, x)
  return [...m.values()]
}

export function compStatus(c: Competition, now = new Date()) {
  const start = new Date(c.start + 'T00:00:00')
  const end = new Date((c.end ?? c.start) + 'T23:59:59')
  if (now >= start && now <= end) return 'live' as const
  if (now < start) return 'upcoming' as const
  return 'past' as const
}
