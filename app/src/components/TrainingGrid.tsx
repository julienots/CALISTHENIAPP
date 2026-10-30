// Grille d'entraînement : une case par jour sur les dernières semaines.
// Orange = séance (plus intense = plus vif), jaune = repos, rouge pâle = rien.
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { dayKey, streak } from '../lib/stats'
import { useStore } from '../lib/store'
import type { SessionLog } from '../lib/types'
import { Icon } from './Icon'

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function useByDay() {
  const sessions = useStore((s) => s.sessions)
  return useMemo(() => {
    const m = new Map<string, SessionLog[]>()
    for (const s of sessions) {
      const k = dayKey(s.date)
      m.set(k, [...(m.get(k) ?? []), s])
    }
    return m
  }, [sessions])
}

export function TrainingGrid({ weeks = 16, compact = false }: { weeks?: number; compact?: boolean }) {
  const nav = useNavigate()
  const sessions = useStore((s) => s.sessions)
  const restDays = useStore((s) => s.restDays)
  const byDay = useByDay()
  const rest = useMemo(() => new Set(restDays), [restDays])
  const today = startOfDay(new Date())
  const lastMonday = addDays(today, -((today.getDay() + 6) % 7))
  const first = addDays(lastMonday, -(weeks - 1) * 7)
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)))

  // stats du mois en cours
  let done = 0
  let rested = 0
  let missed = 0
  for (let d = 1; d <= today.getDate(); d++) {
    const k = dayKey(new Date(today.getFullYear(), today.getMonth(), d))
    if (byDay.get(k)?.length) done++
    else if (rest.has(k)) rested++
    else if (d < today.getDate()) missed++
  }

  const cell = (d: Date) => {
    if (d > today) return { bg: 'transparent', border: '#ffffff10' }
    const k = dayKey(d)
    const ss = byDay.get(k)
    if (ss?.length) {
      const load = ss.reduce((n, s) => n + s.durationMin * s.rpe, 0)
      return { bg: load > 700 ? '#ff7a1a' : load > 400 ? '#e85d04' : '#a8400a', border: 'transparent', glow: load > 700 }
    }
    if (rest.has(k)) return { bg: '#ffcf3f66', border: 'transparent' }
    return { bg: '#ff3b3022', border: 'transparent' }
  }

  return (
    <div>
      {!compact && (
        <div className="mb-3 grid grid-cols-4 gap-1 text-center">
          {[
            [done, 'séances', '#ff7a1a'],
            [rested, 'repos', '#ffcf3f'],
            [missed, 'ratés', '#ff3b30'],
            [streak(sessions), 'série', '#ffb000'],
          ].map(([v, l, c]) => (
            <div key={l as string}>
              <div className="h-display text-3xl leading-none" style={{ color: c as string }}>
                {v}
                {l === 'série' && <Icon name="flame" size={18} className="ml-0.5 inline align-baseline" />}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/55">{l}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] pr-0.5 pt-[14px]">
          {DAYS.map((d, i) => (
            <div key={i} className="grid aspect-square w-3 place-items-center text-[8px] font-bold text-white/40">
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>
        {cols.map((col, ci) => {
          const month = col[0].getDate() <= 7 || ci === 0 ? col[0].toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') : ''
          return (
            <div key={ci} className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <div className="h-[11px] truncate text-[8px] font-bold capitalize text-white/50">{month}</div>
              {col.map((d, di) => {
                const c = cell(d)
                const isToday = d.getTime() === today.getTime()
                return (
                  <motion.button
                    key={di}
                    aria-label={d.toLocaleDateString('fr-FR')}
                    disabled={d > today}
                    onClick={() => nav(`/calendar?jump=${dayKey(d)}`)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (ci * 7 + di) * 0.004, type: 'spring', damping: 14 }}
                    className="aspect-square w-full rounded-[4px]"
                    style={{ background: c.bg, boxShadow: isToday ? '0 0 0 1.5px #fff' : c.glow ? '0 0 8px -1px #ff7a1a' : undefined, border: `1px solid ${c.border}` }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-end gap-3 text-[10px] text-white/55">
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-volt" /> séance</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#ffcf3f66]" /> repos</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#ff3b3022]" /> rien</span>
      </div>
    </div>
  )
}
