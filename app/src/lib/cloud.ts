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

/** Récupère toutes les compétitions : flux embarqué + fichier public du dépôt GitHub (gratuit, aucun serveur). */
export async function loadCompetitions(): Promise<{ items: Competition[]; online: boolean; errors: string[] }> {
  const errors: string[] = []
  const all = new Map<string, Competition>()
  const add = (list: Competition[]) => list.forEach((c) => all.set(c.id, c))
  try {
    add(await fetchJSON<Competition[]>('./competitions.json'))
  } catch {
    errors.push('Flux embarqué illisible')
  }
  let online = false
  const { feedUrl } = useStore.getState().settings
  if (feedUrl && navigator.onLine) {
    try {
      add(await fetchJSON<Competition[]>(feedUrl + (feedUrl.includes('?') ? '&' : '?') + 't=' + Date.now()))
      online = true
    } catch (e) {
      errors.push(`Flux en ligne indisponible (${(e as Error).message})`)
    }
  }
  const items = [...all.values()]
  if (items.length) useStore.getState().setFeedCache(items)
  return { items, online, errors }
}

export function compStatus(c: Competition, now = new Date()) {
  const start = new Date(c.start + 'T00:00:00')
  const end = new Date((c.end ?? c.start) + 'T23:59:59')
  if (now >= start && now <= end) return 'live' as const
  if (now < start) return 'upcoming' as const
  return 'past' as const
}
