// Données en ligne : flux de compétitions (JSON public) et, si configuré,
// backend Supabase pour les compétitions communautaires et les coachs.
import type { CoachProfile, Competition } from './types'
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

function supa() {
  const { supabaseUrl, supabaseKey } = useStore.getState().settings
  if (!supabaseUrl || !supabaseKey) return null
  const base = supabaseUrl.replace(/\/$/, '') + '/rest/v1'
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }
  return {
    get: async <T,>(path: string) => {
      const res = await fetch(`${base}/${path}`, { headers })
      if (!res.ok) throw new Error(`Supabase ${res.status}`)
      return (await res.json()) as T
    },
    post: async (path: string, body: unknown, upsert = false) => {
      const Prefer = upsert ? 'return=minimal,resolution=merge-duplicates' : 'return=minimal'
      const res = await fetch(`${base}/${path}`, { method: 'POST', headers: { ...headers, Prefer }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`Supabase ${res.status} : ${await res.text()}`)
    },
  }
}

export const cloudEnabled = () => supa() !== null

/** Récupère toutes les compétitions : flux embarqué + flux distant + Supabase. */
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
  const s = supa()
  if (s) {
    try {
      add(await s.get<Competition[]>('competitions?select=*&order=start.asc'))
      online = true
    } catch (e) {
      errors.push((e as Error).message)
    }
  }
  const items = [...all.values()]
  if (items.length) useStore.getState().setFeedCache(items)
  return { items, online, errors }
}

export async function publishCompetition(c: Competition) {
  const s = supa()
  if (!s) throw new Error('Backend non configuré')
  await s.post('competitions', { ...c, userAdded: undefined, verified: false })
}

export async function loadCloudCoaches(): Promise<CoachProfile[]> {
  const s = supa()
  if (!s) return []
  const rows = await s.get<{ id: string; data: CoachProfile }[]>('coaches?select=id,data&order=updated_at.desc')
  return rows.map((r) => ({ ...r.data, id: r.id, remote: true }))
}

export async function publishCoach(c: CoachProfile) {
  const s = supa()
  if (!s) throw new Error('Backend non configuré')
  await s.post('coaches?on_conflict=id', { id: c.id, data: c, updated_at: new Date().toISOString() }, true)
}

export function compStatus(c: Competition, now = new Date()) {
  const start = new Date(c.start + 'T00:00:00')
  const end = new Date((c.end ?? c.start) + 'T23:59:59')
  if (now >= start && now <= end) return 'live' as const
  if (now < start) return 'upcoming' as const
  return 'past' as const
}
