import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ring } from '../components/charts'
import { Header, Page, Segmented, SkillPicker, Stepper } from '../components/ui'
import { SKILL_BY_ID } from '../data/skills'
import { buzz, countdownBeep, endBeep, goBeep, keepAwake, say } from '../lib/feedback'
import { fmtSec } from '../lib/stats'
import { useStore } from '../lib/store'

type Mode = 'hold' | 'interval' | 'emom' | 'tabata'

interface Seg { label: string; sec: number; kind: 'work' | 'rest' | 'prep' }

function buildIntervals(mode: Mode, work: number, rest: number, rounds: number): Seg[] {
  const segs: Seg[] = [{ label: 'Préparation', sec: 10, kind: 'prep' }]
  if (mode === 'tabata') {
    work = 20
    rest = 10
    rounds = 8
  }
  if (mode === 'emom') {
    for (let i = 1; i <= rounds; i++) segs.push({ label: `Minute ${i}`, sec: 60, kind: 'work' })
    return segs
  }
  for (let i = 1; i <= rounds; i++) {
    segs.push({ label: `Round ${i}`, sec: work, kind: 'work' })
    if (i < rounds && rest > 0) segs.push({ label: 'Repos', sec: rest, kind: 'rest' })
  }
  return segs
}

export const PRESETS = [
  { l: '45s / 45s', w: 45, r: 45, n: 3 },
  { l: '1min / 1min', w: 60, r: 60, n: 3 },
  { l: '30s / 30s', w: 30, r: 30, n: 4 },
  { l: '1min30 / 1min', w: 90, r: 60, n: 2 },
  { l: '2min / 2min', w: 120, r: 120, n: 2 },
]

export function IntervalRunner({ segs, onDone }: { segs: Seg[]; onDone?: () => void }) {
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(segs[0]?.sec ?? 0)
  const [running, setRunning] = useState(false)
  const iv = useRef<number | null>(null)
  const state = useRef({ i: 0, left: segs[0]?.sec ?? 0 })
  const done = useRef(onDone)
  done.current = onDone
  const segsRef = useRef(segs)
  segsRef.current = segs
  const segsKey = JSON.stringify(segs)

  useEffect(() => {
    const first = segsRef.current[0]?.sec ?? 0
    state.current = { i: 0, left: first }
    setI(0)
    setLeft(first)
    setRunning(false)
  }, [segsKey])

  useEffect(() => {
    if (!running) return
    keepAwake(true)
    iv.current = window.setInterval(() => {
      const segs = segsRef.current
      const st = state.current
      st.left -= 1
      if (st.left === 10 && segs[st.i].sec > 20) say('Dix secondes')
      if (st.left <= 3 && st.left > 0) countdownBeep()
      if (st.left <= 0) {
        st.i += 1
        if (st.i >= segs.length) {
          endBeep()
          buzz(true)
          say('Terminé')
          setRunning(false)
          done.current?.()
          st.i = segs.length - 1
          st.left = 0
        } else {
          st.left = segs[st.i].sec
          const seg = segs[st.i]
          goBeep()
          buzz(true)
          say(seg.kind === 'work' ? `${seg.label}, go` : seg.label)
        }
      }
      setI(st.i)
      setLeft(st.left)
    }, 1000)
    return () => {
      if (iv.current) clearInterval(iv.current)
      keepAwake(false)
    }
  }, [running])

  const seg = segs[i]
  const color = seg?.kind === 'work' ? '#c6ff3d' : seg?.kind === 'rest' ? '#7c5cff' : '#ffc83d'
  const total = segs.reduce((n, x) => n + x.sec, 0)
  const elapsed = segs.slice(0, i).reduce((n, x) => n + x.sec, 0) + (seg ? seg.sec - left : 0)
  return (
    <div className="flex flex-col items-center">
      <motion.div key={i} initial={{ scale: 0.9, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}>
        <Ring value={seg ? left / seg.sec : 0} size={260} stroke={14} color={color}>
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color }}>{seg?.label}</div>
            <div className="h-display text-8xl leading-none">{fmtSec(left)}</div>
            <div className="text-xs text-white/40">{i + 1}/{segs.length}</div>
          </div>
        </Ring>
      </motion.div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-white/50 transition-all" style={{ width: `${(elapsed / total) * 100}%` }} />
      </div>
      <div className="mt-4 grid w-full grid-cols-2 gap-2">
        <button className="btn-primary !py-4" onClick={() => setRunning(!running)}>{running ? '❚❚ Pause' : '▶ Démarrer'}</button>
        <button className="btn-ghost" onClick={() => {
          setRunning(false)
          state.current = { i: 0, left: segs[0].sec }
          setI(0)
          setLeft(segs[0].sec)
        }}>Réinitialiser</button>
      </div>
    </div>
  )
}

function HoldTimer({ skillId, setSkillId }: { skillId?: string; setSkillId: (id: string) => void }) {
  const s = useStore()
  const sk = skillId ? SKILL_BY_ID[skillId] : undefined
  const best = sk ? s.records.filter((r) => r.skillId === sk.id).reduce((m, r) => Math.max(m, r.value), 0) : 0
  const [target, setTarget] = useState(sk ? Math.max(3, Math.round((best || sk.standard) * 1)) : 10)
  const [t, setT] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'count' | 'run' | 'done'>('idle')
  const [cd, setCd] = useState(3)
  const [picker, setPicker] = useState(false)
  const iv = useRef<number | null>(null)
  const clear = () => iv.current && clearInterval(iv.current)
  useEffect(() => () => (clear(), void keepAwake(false)), [])

  const start = () => {
    keepAwake(true)
    setPhase('count')
    let c = 3
    setCd(c)
    countdownBeep()
    iv.current = window.setInterval(() => {
      c--
      if (c > 0) return void (setCd(c), countdownBeep())
      clear()
      goBeep()
      buzz(true)
      setPhase('run')
      const t0 = Date.now()
      let hit = false
      let lastSec = 0
      iv.current = window.setInterval(() => {
        const el = (Date.now() - t0) / 1000
        setT(el)
        const sec = Math.floor(el)
        if (sec !== lastSec) {
          lastSec = sec
          if (target - sec <= 3 && target - sec > 0) countdownBeep()
        }
        if (!hit && el >= target) {
          hit = true
          endBeep()
          buzz(true)
          say(best && el > best ? 'Nouveau record' : 'Objectif atteint')
        }
      }, 50)
    }, 1000)
  }
  const stop = () => {
    clear()
    keepAwake(false)
    setPhase('done')
  }

  return (
    <div className="flex flex-col items-center">
      <button className="chip mb-3" onClick={() => setPicker(true)}>{sk ? `🎯 ${sk.name}` : 'Choisir une figure'}</button>
      {sk && <div className="mb-2 text-xs text-white/50">Record : {best || '—'} s · standard {sk.standard} s</div>}
      <div className="relative">
        <Ring value={phase === 'run' || phase === 'done' ? t / target : 0} size={270} stroke={16} color={t >= target ? '#ffc83d' : '#c6ff3d'}>
          <div className="text-center">
            {phase === 'count' ? (
              <motion.div key={cd} initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-display text-9xl text-volt">{cd}</motion.div>
            ) : (
              <>
                <div className="h-display text-8xl leading-none">{t.toFixed(1)}</div>
                <div className="text-xs text-white/45">objectif {target} s</div>
              </>
            )}
          </div>
        </Ring>
      </div>
      {phase === 'idle' && <div className="mt-3"><Stepper value={target} onChange={setTarget} min={1} max={300} unit="s" /></div>}
      <div className="mt-4 w-full space-y-2">
        {(phase === 'idle' || phase === 'done') && <button className="btn-primary w-full !py-5 text-lg" onClick={() => (setT(0), start())}>▶ Lancer (3-2-1)</button>}
        {(phase === 'run' || phase === 'count') && <button className="btn-primary w-full !bg-ember !py-5 text-lg !text-white" onClick={stop}>■ STOP</button>}
        {phase === 'done' && sk && (
          <button className="btn-ghost w-full" onClick={() => {
            s.addRecord({ skillId: sk.id, value: Math.round(t * 10) / 10, date: new Date().toISOString(), source: 'test' })
            setPhase('idle')
            setT(0)
          }}>💾 Enregistrer {t.toFixed(1)} s sur {sk.name}</button>
        )}
      </div>
      <SkillPicker open={picker} onClose={() => setPicker(false)} filter={(x) => x.kind === 'hold'} onPick={(x) => setSkillId(x.id)} />
    </div>
  )
}

export default function Timers() {
  const [params] = useSearchParams()
  const [mode, setMode] = useState<Mode>((params.get('mode') as Mode) || 'interval')
  const [skillId, setSkillId] = useState<string | undefined>(params.get('skill') ?? undefined)
  const [work, setWork] = useState(45)
  const [rest, setRest] = useState(45)
  const [rounds, setRounds] = useState(3)
  const [segs, setSegs] = useState(() => buildIntervals('interval', 45, 45, 3))
  useEffect(() => setSegs(buildIntervals(mode, work, rest, rounds)), [mode, work, rest, rounds])

  return (
    <Page>
      <Header title="Timers" sub="Holds, compétition, EMOM, Tabata" back />
      <Segmented value={mode} onChange={setMode} options={[{ v: 'hold', l: 'Hold' }, { v: 'interval', l: 'Compét' }, { v: 'emom', l: 'EMOM' }, { v: 'tabata', l: 'Tabata' }]} />
      <div className="mt-5">
        {mode === 'hold' ? (
          <HoldTimer key={skillId} skillId={skillId} setSkillId={setSkillId} />
        ) : (
          <>
            {mode === 'interval' && (
              <div className="card mb-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button key={p.l} className={work === p.w && rest === p.r ? 'chip-on' : 'chip'} onClick={() => (setWork(p.w), setRest(p.r), setRounds(p.n))}>{p.l}</button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><div className="label">Travail</div><Stepper value={work} onChange={setWork} min={5} max={600} step={5} /></div>
                  <div><div className="label">Repos</div><Stepper value={rest} onChange={setRest} min={0} max={600} step={5} /></div>
                  <div><div className="label">Rounds</div><Stepper value={rounds} onChange={setRounds} min={1} max={30} /></div>
                </div>
              </div>
            )}
            {mode === 'emom' && (
              <div className="card mb-4 flex items-center justify-between"><span className="font-semibold">Minutes</span><Stepper value={rounds} onChange={setRounds} min={1} max={60} /></div>
            )}
            <IntervalRunner segs={segs} />
          </>
        )}
      </div>
    </Page>
  )
}
