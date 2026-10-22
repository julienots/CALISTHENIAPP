import type { SessionLog, SkillRecord } from './types'

export const DAY = 86400000
export const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10)
export const fmtDate = (d: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(d).toLocaleDateString('fr-FR', opts)

export function linReg(points: { x: number; y: number }[]) {
  const n = points.length
  if (n < 2) return null
  const mx = points.reduce((s, p) => s + p.x, 0) / n
  const my = points.reduce((s, p) => s + p.y, 0) / n
  let num = 0
  let den = 0
  for (const p of points) {
    num += (p.x - mx) * (p.y - my)
    den += (p.x - mx) ** 2
  }
  if (den === 0) return null
  const slope = num / den
  const intercept = my - slope * mx
  const ssTot = points.reduce((s, p) => s + (p.y - my) ** 2, 0)
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0)
  return { slope, intercept, r2: ssTot === 0 ? 1 : 1 - ssRes / ssTot }
}

/** Meilleure valeur par jour, ordonnée. */
export function dailyBest(records: SkillRecord[]) {
  const m = new Map<string, number>()
  for (const r of records) {
    const k = dayKey(r.date)
    m.set(k, Math.max(m.get(k) ?? 0, r.value))
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }))
}

/** Projection : date estimée pour atteindre `target`, d'après la tendance des 60 derniers jours. */
export function projection(records: SkillRecord[], target: number) {
  const pts = dailyBest(records)
  if (pts.length < 2) return null
  const t0 = new Date(pts[0].date).getTime()
  const recent = pts.filter((p) => new Date(p.date).getTime() > Date.now() - 60 * DAY)
  const use = recent.length >= 2 ? recent : pts
  const reg = linReg(use.map((p) => ({ x: (new Date(p.date).getTime() - t0) / DAY, y: p.value })))
  if (!reg) return null
  const best = Math.max(...pts.map((p) => p.value))
  const perWeek = reg.slope * 7
  if (best >= target) return { reached: true, perWeek, r2: reg.r2, date: null as Date | null, weeks: 0 }
  if (reg.slope <= 0) return { reached: false, perWeek, r2: reg.r2, date: null as Date | null, weeks: Infinity }
  const xTarget = (target - reg.intercept) / reg.slope
  const date = new Date(t0 + xTarget * DAY)
  const weeks = Math.max(0, (date.getTime() - Date.now()) / (7 * DAY))
  return { reached: false, perWeek, r2: reg.r2, date, weeks }
}

export const sessionLoad = (s: SessionLog) => s.durationMin * s.rpe // charge sRPE (Foster)

/** Ratio charge aiguë / chronique (7 j / moyenne hebdo sur 28 j). */
export function acwr(sessions: SessionLog[], now = Date.now()) {
  const acute = sessions.filter((s) => now - new Date(s.date).getTime() < 7 * DAY).reduce((n, s) => n + sessionLoad(s), 0)
  const chronic = sessions.filter((s) => now - new Date(s.date).getTime() < 28 * DAY).reduce((n, s) => n + sessionLoad(s), 0) / 4
  return { acute, chronic, ratio: chronic > 0 ? acute / chronic : acute > 0 ? 1.5 : 0 }
}

export function streak(sessions: SessionLog[]) {
  const days = new Set(sessions.map((s) => dayKey(s.date)))
  // Une série reste active tant qu'il n'y a pas plus de 2 jours de repos d'affilée.
  let count = 0
  let gap = 0
  for (let i = 0; i < 365; i++) {
    const k = dayKey(new Date(Date.now() - i * DAY))
    if (days.has(k)) {
      count++
      gap = 0
    } else if (++gap > 2) break
  }
  return count
}

export function weekly(sessions: SessionLog[], weeks = 12) {
  const out: { label: string; sessions: number; minutes: number; load: number; sets: number }[] = []
  const now = new Date()
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
  for (let i = weeks - 1; i >= 0; i--) {
    const start = monday.getTime() - i * 7 * DAY
    const end = start + 7 * DAY
    const ss = sessions.filter((s) => {
      const t = new Date(s.date).getTime()
      return t >= start && t < end
    })
    out.push({
      label: new Date(start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }),
      sessions: ss.length,
      minutes: ss.reduce((n, s) => n + s.durationMin, 0),
      load: ss.reduce((n, s) => n + sessionLoad(s), 0),
      sets: ss.reduce((n, s) => n + s.exercises.reduce((m, e) => m + e.sets.length, 0), 0),
    })
  }
  return out
}

export const pct = (v: number) => `${Math.round(v * 100)} %`
export const fmtSec = (s: number) => {
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}`
}
