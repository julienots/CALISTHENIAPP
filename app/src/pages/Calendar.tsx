// Calendrier infini : un jour par ligne, d'aujourd'hui vers le passé, sans fin.
// Séance → carte ; repos marqué → lune ; rien → croix rouge, ligne barrée.
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { TrainingGrid } from '../components/TrainingGrid'
import { CoachTour } from '../components/CoachTour'
import { Header, Page } from '../components/ui'
import { sessionXp } from '../lib/scoring'
import { DAY, dayKey } from '../lib/stats'
import { useStore } from '../lib/store'
import type { SessionLog } from '../lib/types'
import { Icon } from '../components/Icon'

const CHUNK = 60
const TYPE_COLOR: Record<SessionLog['type'], string> = {
  skills: '#ff7a1a',
  force: '#ff3d6e',
  agilite: '#ff5ca8',
  competition: '#ffb000',
  mobilite: '#5ec2a6',
  libre: '#ffcf3f',
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export default function Calendar() {
  const sessions = useStore((s) => s.sessions)
  const restDays = useStore((s) => s.restDays)
  const toggleRest = useStore((s) => s.toggleRest)
  const nav = useNavigate()
  const [count, setCount] = useState(CHUNK)
  const [jump, setJump] = useState('')
  const sentinel = useRef<HTMLDivElement>(null)
  const today = useMemo(() => startOfDay(new Date()), [])

  const byDay = useMemo(() => {
    const m = new Map<string, SessionLog[]>()
    for (const s of sessions) {
      const k = dayKey(s.date)
      m.set(k, [...(m.get(k) ?? []), s].sort((a, b) => a.date.localeCompare(b.date)))
    }
    return m
  }, [sessions])
  const rest = useMemo(() => new Set(restDays), [restDays])

  // Chargement infini : quand le bas de la liste approche, on ajoute 60 jours.
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && setCount((c) => c + CHUNK), { rootMargin: '1200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const days = useMemo(() => Array.from({ length: count }, (_, i) => addDays(today, -i)), [count, today])

  const monthStats = (y: number, m: number) => {
    let done = 0
    let rested = 0
    let missed = 0
    let minutes = 0
    const last = new Date(y, m + 1, 0).getDate()
    for (let d = 1; d <= last; d++) {
      const date = new Date(y, m, d)
      if (date > today) break
      const k = dayKey(date)
      const ss = byDay.get(k)
      if (ss?.length) {
        done++
        minutes += ss.reduce((n, s) => n + s.durationMin, 0)
      } else if (rest.has(k)) rested++
      else if (date < today) missed++
    }
    return { done, rested, missed, minutes }
  }

  const goTo = (value: string) => {
    if (!value) return
    const target = startOfDay(new Date(`${value}T12:00:00`))
    const diff = Math.round((today.getTime() - target.getTime()) / DAY)
    if (diff < 0) return alert('Le calendrier part d\'aujourd\'hui vers le passé.')
    setCount((c) => Math.max(c, diff + CHUNK))
    setTimeout(() => document.getElementById(`day-${value}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
  }

  const [params] = useSearchParams()
  const jumpParam = params.get('jump')
  useEffect(() => {
    if (jumpParam) goTo(jumpParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpParam])

  const cur = monthStats(today.getFullYear(), today.getMonth())
  const elapsed = today.getDate()

  return (
    <Page>
      <Header title="Calendrier" sub="Chaque jour compte. Défile à l'infini." right={<Link to="/log" className="btn-primary !py-2">+ Séance</Link>} />

      <div className="card-hi">
        <TrainingGrid weeks={18} />
        <div className="mt-1 text-center text-[11px] text-white/60">
          Ce mois-ci · régularité {Math.round(((cur.done + cur.rested) / Math.max(1, elapsed)) * 100)} % · {Math.round(cur.minutes / 60)} h d'entraînement
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input type="date" className="input" value={jump} max={dayKey(today)} onChange={(e) => (setJump(e.target.value), goTo(e.target.value))} />
        <button className="btn-ghost shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Aujourd'hui</button>
      </div>

      <div className="mt-4">
        {days.map((d, i) => {
          const k = dayKey(d)
          const ss = byDay.get(k) ?? []
          const isToday = i === 0
          const isRest = rest.has(k)
          const newMonth = i === 0 || d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
          const ms = newMonth ? monthStats(d.getFullYear(), d.getMonth()) : null
          return (
            <div key={k} id={`day-${k}`}>
              {ms && (
                <div className="sticky z-20 -mx-4 mb-2 mt-4 flex items-end justify-between bg-ink-950/90 px-4 py-2 backdrop-blur" style={{ top: 'calc(var(--safe-top) + 74px)' }}>
                  <span className="h-display text-2xl capitalize">{d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                  <span className="text-[11px] text-white/65">
                    <b className="text-volt">{ms.done}</b> séances · <b className="text-ice">{ms.rested}</b> repos · <b className="text-ember">{ms.missed}</b> ratés
                  </span>
                </div>
              )}
              <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '80px' }} transition={{ duration: 0.18 }} className="mb-1.5 flex gap-3">
                <div className={`flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5 ${isToday ? 'bg-volt text-ink-950' : ss.length ? 'bg-volt/10 text-volt' : 'bg-white/[0.03] text-white/60'}`}>
                  <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>
                  <span className="h-display text-2xl leading-none">{d.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  {ss.map((s) => (
                    <Link key={s.id} to={`/log/${s.id}`} className="card block !p-3" style={{ borderLeft: `3px solid ${TYPE_COLOR[s.type]}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate text-sm font-bold"><Icon name="check" size={16} className="text-volt" />{s.title}</div>
                          <div className="text-[11px] text-white/65">
                            {new Date(s.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {s.durationMin} min · RPE {s.rpe} · {s.type}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] font-black text-gold">+{sessionXp(s)}</span>
                      </div>
                      {s.exercises.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {s.exercises.slice(0, 5).map((e, j) => (
                            <span key={j} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/65">{e.name}</span>
                          ))}
                          {s.exercises.length > 5 && <span className="text-[10px] text-white/55">+{s.exercises.length - 5}</span>}
                        </div>
                      )}
                    </Link>
                  ))}
                  {!ss.length && isRest && (
                    <button className="flex w-full items-center gap-2 rounded-xl border border-ice/30 bg-ice/[0.06] px-3 py-3 text-left text-sm text-ice" onClick={() => toggleRest(k)}>
                      <Icon name="moon" size={18} /> <span className="font-semibold">Repos</span>
                      <span className="ml-auto text-[10px] text-white/55">toucher pour annuler</span>
                    </button>
                  )}
                  {!ss.length && !isRest && !isToday && (
                    <div className="flex items-center gap-2 rounded-xl border border-ember/25 bg-ember/[0.06] px-3 py-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ember text-white shadow-[0_0_12px_-2px_#ff3b30]"><Icon name="cross" size={15} /></span>
                      <span className="flex-1 text-sm font-semibold text-ember/90 line-through decoration-2">Pas de séance</span>
                      <button className="text-[11px] font-bold text-white/60" onClick={() => nav(`/log?date=${k}`)}>+ Ajouter</button>
                      <button className="text-[11px] font-bold text-ice/80" onClick={() => toggleRest(k)} aria-label="Marquer repos"><Icon name="moon" size={18} /></button>
                    </div>
                  )}
                  {isToday && !isRest && (
                    <div className="flex gap-1.5">
                      <button className="btn-primary flex-1 !py-2.5" onClick={() => nav(`/log?date=${k}`)}>{ss.length ? '+ Autre séance' : '+ Noter la séance du jour'}</button>
                      {!ss.length && <button className="btn-ghost !px-3 !py-2.5" onClick={() => toggleRest(k)}><Icon name="moon" size={16} /> Repos</button>}
                    </div>
                  )}
                  {ss.length > 0 && !isToday && (
                    <button className="text-[11px] font-bold text-white/50" onClick={() => nav(`/log?date=${k}`)}>+ ajouter une séance ce jour</button>
                  )}
                </div>
              </motion.div>
            </div>
          )
        })}
      <CoachTour id="calendar" steps={[`Ton calendrier : chaque jour défile, à l'infini vers le passé.`, `Une séance = une carte. Rien = croix rouge barrée. Le bouton lune marque un jour de repos.`, `En haut : ta grille des 18 dernières semaines et tes stats du mois.`]} />
        <div ref={sentinel} className="py-6 text-center text-xs text-white/45">Chargement des jours précédents…</div>
      </div>
    </Page>
  )
}
