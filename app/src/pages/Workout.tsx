import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ring } from '../components/charts'
import { SkillPicker, Stepper } from '../components/ui'
import { EXERCISES } from '../data/exercises'
import { CUES, SKILL_BY_ID } from '../data/skills'
import { buzz, countdownBeep, endBeep, goBeep, keepAwake, say } from '../lib/feedback'
import { fmtSec } from '../lib/stats'
import { uid, useStore } from '../lib/store'
import type { ExerciseLog, ProgramItem, SessionLog } from '../lib/types'
import { IconTile } from '../components/Icon'

type Phase = 'ready' | 'countdown' | 'work' | 'log' | 'rest' | 'finish'
const PAINS = ['Poignets', 'Coudes', 'Épaules', 'Bas du dos', 'Genoux', 'Doigts']

const parseTarget = (t: string) => {
  const m = t.match(/(\d+)\s*(s|reps|min)?/)
  return { n: m ? Number(m[1]) : 5, isTime: m?.[2] === 's' || m?.[2] === 'min', mult: m?.[2] === 'min' ? 60 : 1 }
}

export default function Workout() {
  const { pid, day } = useParams()
  const nav = useNavigate()
  const s = useStore()
  const prog = s.programs.find((p) => p.id === pid)
  const pday = prog?.days.find((d) => d.key === day)
  const [items, setItems] = useState<ProgramItem[]>(() => pday?.items ?? [])
  const [idx, setIdx] = useState(0)
  const [setNo, setSetNo] = useState(1)
  const [phase, setPhase] = useState<Phase>('ready')
  const [clock, setClock] = useState(0)
  const [logs, setLogs] = useState<ExerciseLog[]>([])
  const [repInput, setRepInput] = useState(5)
  const [rpe, setRpe] = useState(8)
  const [picker, setPicker] = useState(false)
  const [exPicker, setExPicker] = useState(false)
  const start = useRef(Date.now())
  const tick = useRef<number | null>(null)
  const [summary, setSummary] = useState({ rpe: 7, feeling: 4, sleep: 7.5, pain: [] as string[], notes: '' })

  const item = items[idx]
  const target = item ? parseTarget(item.target) : { n: 0, isTime: false, mult: 1 }
  const isHold = target.isTime
  const goal = target.n * target.mult

  useEffect(() => {
    keepAwake(true)
    return () => {
      keepAwake(false)
      if (tick.current) clearInterval(tick.current)
    }
  }, [])

  useEffect(() => {
    if (item) setRepInput(isHold ? goal : target.n)
  }, [idx, item, isHold, goal, target.n])

  const stopTick = () => {
    if (tick.current) clearInterval(tick.current)
    tick.current = null
  }

  const announce = (i: number) => {
    const it = items[i]
    if (!it) return
    const sk = it.skillId ? SKILL_BY_ID[it.skillId] : undefined
    say(`${it.name}. ${it.sets} séries de ${it.target.replace('reps', 'répétitions').replace(/(\d+) s\b/, '$1 secondes')}. ${sk ? CUES[sk.profile][0] : it.note ?? ''}`)
  }

  useEffect(() => {
    if (phase === 'ready') announce(idx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase === 'ready'])

  const beginSet = () => {
    if (!isHold) {
      setPhase('work')
      say('Go')
      goBeep()
      return
    }
    setPhase('countdown')
    let c = 3
    setClock(c)
    countdownBeep()
    tick.current = window.setInterval(() => {
      c -= 1
      if (c > 0) {
        setClock(c)
        countdownBeep()
      } else {
        stopTick()
        goBeep()
        buzz(true)
        setPhase('work')
        const t0 = Date.now()
        setClock(0)
        let announced = false
        tick.current = window.setInterval(() => {
          const el = (Date.now() - t0) / 1000
          setClock(el)
          if (!announced && el >= goal) {
            announced = true
            endBeep()
            buzz(true)
            say('Objectif atteint')
          }
        }, 100)
      }
    }, 1000)
  }

  const endSet = () => {
    stopTick()
    if (isHold) setRepInput(Math.round(clock * 10) / 10)
    setPhase('log')
  }

  const logSet = () => {
    const entry = { [isHold ? 'seconds' : 'reps']: repInput, rpe, done: true }
    setLogs((prev) => {
      const name = item.name
      const ex = prev.find((l) => l.name === name)
      if (ex) return prev.map((l) => (l.name === name ? { ...l, sets: [...l.sets, entry] } : l))
      return [...prev, { name, skillId: item.skillId, exerciseId: item.exerciseId, sets: [entry] }]
    })
    const lastSet = setNo >= item.sets
    if (lastSet && idx >= items.length - 1) {
      setPhase('finish')
      say('Séance terminée. Bravo.')
      return
    }
    // Repos
    const rest = item.rest || 60
    setPhase('rest')
    setClock(rest)
    // calé sur l'horloge réelle : pas de dérive même si Android ralentit l'appli
    const endAt = Date.now() + rest * 1000
    let lastSec = rest
    tick.current = window.setInterval(() => {
      const r = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      if (r === lastSec) return
      lastSec = r
      setClock(r)
      if (r === 10) say('Dix secondes')
      if (r <= 3 && r > 0) countdownBeep()
      if (r <= 0) {
        stopTick()
        goBeep()
        if (lastSet) {
          setIdx((i) => i + 1)
          setSetNo(1)
        } else setSetNo((n) => n + 1)
        setPhase('ready')
      }
    }, 200)
  }

  const skipRest = () => {
    stopTick()
    if (setNo >= item.sets) {
      setIdx(idx + 1)
      setSetNo(1)
    } else setSetNo(setNo + 1)
    setPhase('ready')
  }

  const skipExercise = () => {
    stopTick()
    if (idx >= items.length - 1) setPhase('finish')
    else {
      setIdx(idx + 1)
      setSetNo(1)
      setPhase('ready')
    }
  }

  const save = () => {
    const session: SessionLog = {
      id: uid(),
      date: new Date().toISOString(),
      title: pday ? pday.title : 'Séance libre guidée',
      durationMin: Math.max(1, Math.round((Date.now() - start.current) / 60000)),
      type: pday ? (/agil/i.test(pday.title) ? 'agilite' : /combo|compét/i.test(pday.title) ? 'competition' : 'skills') : 'libre',
      exercises: logs,
      rpe: summary.rpe,
      feeling: summary.feeling,
      sleepHours: summary.sleep,
      pain: summary.pain,
      notes: summary.notes,
      programId: prog?.id,
      dayKey: pday?.key,
    }
    s.saveSession(session)
    if (prog && pday) s.markDay(prog.id, pday.key)
    nav('/history', { replace: true })
  }

  const addItem = (it: ProgramItem) => {
    setItems((x) => [...x, it])
    if (phase === 'finish') setPhase('ready')
  }

  const sk = item?.skillId ? SKILL_BY_ID[item.skillId] : undefined
  const progress = items.length ? (idx + (setNo - 1) / Math.max(1, item?.sets ?? 1)) / items.length : 0

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4" style={{ paddingTop: 'calc(var(--safe-top) + 12px)', paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
      <div className="flex items-center gap-3">
        <button className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-lg" onClick={() => confirm('Quitter la séance ? Les séries non enregistrées seront perdues.') && nav(-1)}>
          ✕
        </button>
        <div className="flex-1">
          <div className="h-display text-xl leading-none">{pday?.title ?? 'Séance libre'}</div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-volt transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <div className="text-xs text-white/65">{Math.round((Date.now() - start.current) / 60000)} min</div>
      </div>

      {!item && phase !== 'finish' ? (
        <div className="mt-10 text-center">
          <div className="flex justify-center"><IconTile name="bolt" color="#ff7a1a" size={64} /></div>
          <p className="mt-3 text-white/60">Ajoute des figures ou exercices : je te guide série par série.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button className="btn-primary" onClick={() => setPicker(true)}>+ Figure</button>
            <button className="btn-ghost" onClick={() => setExPicker(true)}>+ Exercice</button>
          </div>
        </div>
      ) : phase === 'finish' ? (
        <div className="mt-6 flex-1 space-y-4">
          <div className="h-display text-center text-5xl text-volt">Séance terminée</div>
          <div className="card">
            {logs.map((l) => (
              <div key={l.name} className="flex justify-between border-b border-white/5 py-1.5 text-sm last:border-0">
                <span>{l.name}</span>
                <span className="font-bold">{l.sets.map((x) => (x.seconds !== undefined ? `${x.seconds}s` : `${x.reps}`)).join(' · ')}</span>
              </div>
            ))}
          </div>
          <div className="card space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">Effort global (RPE)</span><Stepper value={summary.rpe} onChange={(v) => setSummary({ ...summary, rpe: v })} min={1} max={10} /></div>
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">Ressenti /5</span><Stepper value={summary.feeling} onChange={(v) => setSummary({ ...summary, feeling: v })} min={1} max={5} /></div>
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">Sommeil (h)</span><Stepper value={summary.sleep} onChange={(v) => setSummary({ ...summary, sleep: v })} min={0} max={14} step={0.5} /></div>
            <div>
              <div className="label">Douleurs</div>
              <div className="flex flex-wrap gap-1.5">
                {PAINS.map((p) => (
                  <button key={p} className={summary.pain.includes(p) ? 'chip-on !border-ember/60 !bg-ember/15 !text-ember' : 'chip'} onClick={() => setSummary({ ...summary, pain: summary.pain.includes(p) ? summary.pain.filter((x) => x !== p) : [...summary.pain, p] })}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <textarea className="input h-20" placeholder="Notes de séance…" value={summary.notes} onChange={(e) => setSummary({ ...summary, notes: e.target.value })} />
          </div>
          <button className="btn-primary w-full !py-4" onClick={save}>Enregistrer la séance</button>
          <button className="btn-ghost w-full" onClick={() => setPicker(true)}>+ Continuer avec une figure</button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="mt-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/55">
              {item.block} · exercice {idx + 1}/{items.length}
            </div>
            <div className="h-display text-4xl leading-tight">{item.name}</div>
            <div className="text-sm text-white/60">
              Série {setNo}/{item.sets} · cible <b className="text-white">{item.target}</b> · repos {item.rest}s {item.rpe && `· RPE ${item.rpe}`}
            </div>
          </div>

          <div className="my-6 grid flex-1 place-items-center">
            <AnimatePresence mode="wait">
              {phase === 'countdown' && (
                <motion.div key={'c' + clock} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="h-display text-[9rem] text-volt">
                  {clock}
                </motion.div>
              )}
              {phase === 'work' && isHold && (
                <motion.div key="w" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                  <Ring value={clock / goal} size={240} stroke={14} color={clock >= goal ? '#ffb000' : '#ff7a1a'}>
                    <div className="text-center">
                      <div className="h-display text-7xl">{clock.toFixed(1)}</div>
                      <div className="text-xs text-white/65">/ {goal} s</div>
                    </div>
                  </Ring>
                </motion.div>
              )}
              {phase === 'work' && !isHold && (
                <motion.div key="wr" className="text-center">
                  <div className="h-display text-8xl text-volt">{target.n}</div>
                  <div className="text-white/65">répétitions</div>
                </motion.div>
              )}
              {phase === 'rest' && (
                <motion.div key="r" className="text-center">
                  <Ring value={clock / (item.rest || 60)} size={220} stroke={12} color="#ff3d6e">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-white/65">Repos</div>
                      <div className="h-display text-7xl">{fmtSec(Math.max(0, clock))}</div>
                    </div>
                  </Ring>
                  <div className="mt-3 text-sm text-white/70">Ensuite : {setNo >= item.sets ? items[idx + 1]?.name ?? 'fin' : `série ${setNo + 1}`}</div>
                </motion.div>
              )}
              {phase === 'ready' && (
                <motion.div key="rd" className="w-full space-y-2">
                  {(sk ? CUES[sk.profile] : item.note ? [item.note] : ['Exécution propre, gainage permanent']).slice(0, 4).map((c) => (
                    <div key={c} className="card flex gap-2 !p-3 text-sm"><span className="text-volt">▸</span>{c}</div>
                  ))}
                  {item.note && sk && <div className="rounded-xl bg-plasma/10 p-3 text-xs text-white/80">{item.note}</div>}
                </motion.div>
              )}
              {phase === 'log' && (
                <motion.div key="l" className="card w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{isHold ? 'Durée tenue' : 'Répétitions'}</span>
                    <Stepper value={repInput} onChange={setRepInput} min={0} max={999} step={isHold ? 0.5 : 1} unit={isHold ? 's' : 'reps'} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">RPE série</span>
                    <Stepper value={rpe} onChange={setRpe} min={1} max={10} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            {phase === 'ready' && <button className="btn-primary w-full !py-5 text-lg" onClick={beginSet}>{isHold ? '▶ Lancer le hold' : '▶ Commencer la série'}</button>}
            {phase === 'work' && <button className="btn-primary w-full !py-5 text-lg" onClick={endSet}>{isHold ? '■ Fin du hold' : '✓ Série terminée'}</button>}
            {phase === 'log' && <button className="btn-primary w-full !py-5 text-lg" onClick={logSet}>Enregistrer la série</button>}
            {phase === 'rest' && <button className="btn-ghost w-full !py-4" onClick={skipRest}>Passer le repos</button>}
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 !py-2 text-xs" onClick={skipExercise}>Passer l'exercice</button>
              <button className="btn-ghost flex-1 !py-2 text-xs" onClick={() => setPicker(true)}>+ Figure</button>
              <button className="btn-ghost flex-1 !py-2 text-xs" onClick={() => (stopTick(), setPhase('finish'))}>Terminer</button>
            </div>
          </div>
        </div>
      )}

      <SkillPicker open={picker} onClose={() => setPicker(false)} onPick={(sk2) => addItem({ name: sk2.name, skillId: sk2.id, block: 'Skill', sets: 4, target: sk2.kind === 'hold' ? `${Math.max(3, Math.round((s.records.filter((r) => r.skillId === sk2.id).reduce((m, r) => Math.max(m, r.value), 0) || sk2.standard) * 0.8))} s` : `${sk2.kind === 'reps' ? 5 : 3} reps`, rest: 120 })} />
      {exPicker && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950 p-4" style={{ paddingTop: 'calc(var(--safe-top) + 16px)' }}>
          <div className="mb-3 flex items-center justify-between"><span className="h-display text-2xl">Exercices</span><button onClick={() => setExPicker(false)}>✕</button></div>
          {EXERCISES.map((e) => (
            <button key={e.id} className="mb-1 block w-full rounded-xl bg-white/[0.04] p-3 text-left text-sm" onClick={() => (addItem({ name: e.name, exerciseId: e.id, block: 'Force', sets: 3, target: e.kind === 'hold' ? '30 s' : '10 reps', rest: 90 }), setExPicker(false))}>
              {e.name} <span className="text-xs text-white/55">· {e.pattern}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
