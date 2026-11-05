// Bilan de forme guidé : chaque test a son chrono ou son compteur intégré,
// puis une note /100 par qualité, la comparaison avec le bilan précédent et un plan d'action.
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Radar, Ring } from '../components/charts'
import { Icon, IconTile } from '../components/Icon'
import { Bar, Header, Page, Stepper } from '../components/ui'
import { EX_BY_ID } from '../data/exercises'
import { ADVICE, MAIN_TESTS, QUALITY_LABEL, scoreBilan, TEST_BY_ID, weakest, type BilanTest, type Quality } from '../lib/bilan'
import { buzz, countdownBeep, endBeep, goBeep, keepAwake } from '../lib/feedback'
import { generateProgram } from '../lib/generator'
import { LEVEL_NAMES, skillStatuses } from '../lib/scoring'
import { fmtSec } from '../lib/stats'
import { uid, useStore } from '../lib/store'
import { toast } from '../lib/toast'
import type { Bilan as BilanT } from '../lib/types'

const QCOLOR: Record<Quality, string> = { push: '#ff7a1a', pull: '#ff3d6e', core: '#ffcf3f', balance: '#ff4fa0', mobility: '#c9a27e' }

/** Chrono précis (horloge réelle) avec compte à rebours 3-2-1. */
function useClock() {
  const [state, setState] = useState<'idle' | 'count' | 'run' | 'done'>('idle')
  const [ms, setMs] = useState(0)
  const [pre, setPre] = useState(3)
  const t0 = useRef(0)
  const iv = useRef<number | null>(null)
  const stop = () => {
    if (iv.current) clearInterval(iv.current)
    iv.current = null
  }
  useEffect(() => stop, [])
  const start = (limitMs?: number) => {
    stop()
    setState('count')
    setPre(3)
    setMs(0)
    countdownBeep()
    const c0 = Date.now()
    iv.current = window.setInterval(() => {
      const left = 3 - Math.floor((Date.now() - c0) / 1000)
      if (left > 0) {
        setPre((p) => {
          if (p !== left) countdownBeep()
          return left
        })
        return
      }
      stop()
      goBeep()
      buzz()
      setState('run')
      t0.current = Date.now()
      iv.current = window.setInterval(() => {
        const e = Date.now() - t0.current
        if (limitMs && e >= limitMs) {
          stop()
          setMs(limitMs)
          setState('done')
          endBeep()
          buzz(true)
          return
        }
        setMs(e)
      }, 100)
    }, 100)
  }
  const finish = () => {
    stop()
    if (state === 'run') setMs(Date.now() - t0.current)
    setState('done')
    endBeep()
  }
  const reset = () => (stop(), setState('idle'), setMs(0))
  return { state, ms, pre, start, finish, reset }
}

function TapCounter({ value, onChange, active = true }: { value: number; onChange: (v: number) => void; active?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <motion.button
        whileTap={{ scale: 0.93 }}
        disabled={!active}
        onClick={() => (onChange(value + 1), buzz())}
        className="grid h-48 w-48 place-items-center rounded-full border-4 border-volt/60 bg-volt/10 shadow-[0_0_50px_#ff7a1a33] disabled:opacity-40"
      >
        <div>
          <motion.div key={value} initial={{ scale: 1.3, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="h-display text-7xl leading-none text-volt">
            {value}
          </motion.div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/60">Touche à chaque rep</div>
        </div>
      </motion.button>
      <div className="mt-3 flex gap-2">
        <button className="btn-ghost !px-4 !py-2" onClick={() => onChange(Math.max(0, value - 1))}>−1</button>
        <button className="btn-ghost !px-4 !py-2" onClick={() => onChange(0)}>Remettre à 0</button>
      </div>
    </div>
  )
}

function TestStep({ test, onDone, onSkip }: { test: BilanTest; onDone: (v: number) => void; onSkip: () => void }) {
  const [v, setV] = useState(0)
  const clock = useClock()
  const sec = Math.floor(clock.ms / 1000)
  useEffect(() => {
    if (test.kind === 'hold' && clock.state === 'done') setV(Math.round(clock.ms / 1000))
  }, [clock.state, clock.ms, test.kind])

  return (
    <div>
      <div className="card">
        {test.how.map((h, i) => (
          <div key={h} className="flex gap-2 py-1 text-[13px] text-white/80">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-volt/20 text-[11px] font-black text-volt">{i + 1}</span>
            {h}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col items-center">
        {test.kind === 'choice' && (
          <div className="w-full space-y-2">
            {test.choices!.map((c) => (
              <motion.button whileTap={{ scale: 0.98 }} key={c.label} className="card flex w-full items-center justify-between text-left" onClick={() => onDone(c.score)}>
                <span className="font-bold">{c.label}</span>
                <Icon name="play" size={12} className="text-white/40" />
              </motion.button>
            ))}
          </div>
        )}

        {test.kind === 'reps' && <TapCounter value={v} onChange={setV} />}

        {(test.kind === 'hold' || test.kind === 'timed-reps') && (
          <>
            {clock.state === 'count' ? (
              <motion.div key={clock.pre} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-display grid h-48 place-items-center text-9xl text-volt">
                {clock.pre}
              </motion.div>
            ) : test.kind === 'hold' ? (
              <Ring value={(sec % 60) / 60} size={200} stroke={12} color="#ffcf3f">
                <div className="text-center">
                  <div className="h-display text-6xl">{clock.state === 'done' ? v : sec}</div>
                  <div className="text-xs uppercase tracking-widest text-white/60">secondes</div>
                </div>
              </Ring>
            ) : (
              <>
                <div className="mb-3 text-center">
                  <span className="h-display text-4xl">{fmtSec(Math.max(0, (test.duration ?? 60) - sec))}</span>
                </div>
                <TapCounter value={v} onChange={setV} active={clock.state === 'run' || clock.state === 'done'} />
              </>
            )}
            <div className="mt-4 flex w-full gap-2">
              {clock.state === 'idle' && (
                <button className="btn-primary flex-1" onClick={() => clock.start(test.kind === 'timed-reps' ? (test.duration ?? 60) * 1000 : undefined)}>
                  <Icon name="play" size={16} /> Démarrer
                </button>
              )}
              {clock.state === 'run' && test.kind === 'hold' && (
                <button className="btn-primary flex-1 !bg-none !bg-ember" onClick={clock.finish}>
                  <Icon name="stop" size={16} /> Stop, j'ai lâché
                </button>
              )}
              {clock.state === 'done' && (
                <button className="btn-ghost flex-1" onClick={() => (clock.reset(), setV(0))}>
                  <Icon name="refresh" size={16} /> Recommencer
                </button>
              )}
            </div>
          </>
        )}

        {test.kind !== 'choice' && (
          <div className="card mt-4 flex w-full items-center justify-between">
            <span className="text-sm font-semibold">Résultat</span>
            <Stepper value={v} onChange={setV} min={0} max={999} unit={test.unit} />
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn-ghost" onClick={onSkip}>
          {test.needs ? `Pas de ${test.needs}` : 'Passer'}
        </button>
        {test.kind !== 'choice' && (
          <button className="btn-primary flex-1" onClick={() => onDone(v)} disabled={clock.state === 'count' || clock.state === 'run'}>
            Valider {v} {test.unit}
          </button>
        )}
      </div>
    </div>
  )
}

function Result({ b, prev }: { b: BilanT; prev?: BilanT }) {
  const s = useStore()
  const nav = useNavigate()
  const weak = weakest(b)
  const adapt = () => {
    const p = s.profile
    if (!p) return
    const r = b.results
    s.patchProfile({ level: b.level, maxPushups: r.pushups ?? p.maxPushups, maxPullups: r.pullups ?? p.maxPullups, maxDips: r.dips ?? p.maxDips })
    const st = useStore.getState()
    const prog = generateProgram(
      { specialty: p.specialty, level: b.level, goal: p.goals[0] ?? 'skills', goalSkills: p.goalSkills.map((g) => g.skillId), weeks: 6, daysPerWeek: p.daysPerWeek, sessionMinutes: p.sessionMinutes, equipment: p.equipment },
      skillStatuses(st.records, st.analyses),
      p.name,
    )
    st.saveProgram(prog)
    st.setActiveProgram(prog.id)
    toast('Niveau mis à jour et programme regénéré', { label: 'Voir', to: `/program/${prog.id}` })
    nav('/')
  }
  return (
    <div>
      <div className="card-hi flex items-center gap-4">
        <Ring value={b.global / 100} size={96} stroke={9}>
          <div className="text-center">
            <div className="h-display text-3xl leading-none">{b.global}</div>
            <div className="text-[9px] text-white/60">/100</div>
          </div>
        </Ring>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Ton niveau</div>
          <div className="h-display text-3xl text-volt">{LEVEL_NAMES[b.level]}</div>
          {prev && (
            <div className={`text-sm font-bold ${b.global >= prev.global ? 'text-volt' : 'text-ember'}`}>
              {b.global >= prev.global ? '+' : ''}
              {b.global - prev.global} pts depuis le {new Date(prev.date).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-3">
        <Radar axes={(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => ({ label: QUALITY_LABEL[q], value: Math.max(0, b.scores[q] ?? 0) / 100 }))} />
        <div className="mt-2 space-y-2">
          {(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => {
            const v = b.scores[q]
            const d = prev && prev.scores[q] >= 0 && v >= 0 ? v - prev.scores[q] : null
            return (
              <div key={q}>
                <div className="flex justify-between text-[13px]">
                  <span className="font-semibold">{QUALITY_LABEL[q]}</span>
                  <span className="font-bold">
                    {v < 0 ? <span className="text-white/45">non testé</span> : v}
                    {d !== null && d !== 0 && <span className={`ml-1.5 text-[11px] ${d > 0 ? 'text-volt' : 'text-ember'}`}>{d > 0 ? `+${d}` : d}</span>}
                  </span>
                </div>
                <Bar value={Math.max(0, v) / 100} color={QCOLOR[q]} />
              </div>
            )
          })}
        </div>
      </div>

      <h2 className="h-display mt-5 text-xl tracking-wider">Ton plan d'action</h2>
      {weak.map((q) => (
        <div key={q} className="card relative mt-2 overflow-hidden !pl-5">
          <div className="absolute inset-y-0 left-0 w-1" style={{ background: QCOLOR[q] }} />
          <div className="text-sm font-bold">
            Priorité : {QUALITY_LABEL[q]} ({b.scores[q]}/100)
          </div>
          <div className="mt-0.5 text-[13px] text-white/70">{ADVICE[q].low}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ADVICE[q].ex
              .filter((id) => EX_BY_ID[id])
              .map((id) => (
                <Link key={id} to={`/exercices?id=${id}`} className="chip !text-[11px]">
                  {EX_BY_ID[id].name}
                </Link>
              ))}
          </div>
        </div>
      ))}

      <button className="btn-primary mt-4 w-full" onClick={adapt}>
        <Icon name="sparkle" size={16} /> Adapter mon niveau et mon programme
      </button>
      <Link to="/" className="btn-ghost mt-2 w-full">
        Garder mon programme actuel
      </Link>
      <p className="mt-3 text-center text-[11px] text-white/50">Refais ton bilan toutes les 6 à 8 semaines pour mesurer tes progrès.</p>
    </div>
  )
}

export default function BilanPage() {
  const s = useStore()
  const bilans = useMemo(() => [...(s.bilans ?? [])].sort((a, b) => a.date.localeCompare(b.date)), [s.bilans])
  const [queue, setQueue] = useState<string[]>(() => MAIN_TESTS.map((t) => t.id))
  const [i, setI] = useState(-1)
  const [results, setResults] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState<BilanT | null>(null)

  useEffect(() => {
    keepAwake(i >= 0 && !saved)
    return () => void keepAwake(false)
  }, [i, saved])

  const next = (res: Record<string, number>, q = queue) => {
    if (i + 1 < q.length) return setI(i + 1)
    const sc = scoreBilan(res)
    const b: BilanT = { id: uid(), date: new Date().toISOString(), results: res, ...sc }
    s.addBilan(b)
    const now = b.date
    if ((res.pushups ?? 0) > 0) s.addRecord({ skillId: 'push-up', value: res.pushups, date: now, source: 'test' })
    if ((res.pullups ?? 0) > 0) s.addRecord({ skillId: 'pull-up', value: res.pullups, date: now, source: 'test' })
    if ((res.dips ?? 0) > 0) s.addRecord({ skillId: 'dips', value: res.dips, date: now, source: 'test' })
    setSaved(b)
  }
  const done = (v: number) => {
    const t = TEST_BY_ID[queue[i]]
    const res = { ...results, [t.id]: v }
    setResults(res)
    let q = queue
    if (v === 0 && t.fallback && !q.includes(t.fallback)) {
      q = [...q.slice(0, i + 1), t.fallback, ...q.slice(i + 1)]
      setQueue(q)
      toast(`Pas de souci : on passe à « ${TEST_BY_ID[t.fallback].name} »`)
    }
    next(res, q)
  }
  const skip = () => next(results)

  if (saved) {
    return (
      <Page>
        <Header title="Ton bilan" sub={new Date(saved.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} back />
        <Result b={saved} prev={bilans.filter((x) => x.id !== saved.id).at(-1)} />
      </Page>
    )
  }

  if (i < 0) {
    const last = bilans.at(-1)
    return (
      <Page>
        <Header title="Bilan de forme" sub="Mesure ton vrai niveau, qualité par qualité" back />
        <div className="card-hi">
          <div className="flex items-center gap-3">
            <IconTile name="target" color="#ff7a1a" size={50} />
            <div>
              <div className="font-extrabold">{MAIN_TESTS.length} tests · 15 minutes environ</div>
              <div className="text-[12px] text-white/65">Chrono et compteur intégrés. Débutant ou confirmé : chaque test a sa version.</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {MAIN_TESTS.map((t) => (
              <div key={t.id} className="flex items-center gap-1.5 text-[12px] text-white/75">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: QCOLOR[t.quality] }} />
                {t.name}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-white/55">Échauffe-toi 5 minutes avant. Repose-toi 2 à 3 minutes entre les tests de force.</p>
          <button className="btn-primary mt-3 w-full" onClick={() => setI(0)}>
            <Icon name="play" size={16} /> Commencer le bilan
          </button>
        </div>

        {last && (
          <>
            <h2 className="h-display mt-5 text-xl tracking-wider">Dernier bilan</h2>
            <div className="card mt-2">
              <div className="flex items-baseline justify-between">
                <span className="font-bold">{new Date(last.date).toLocaleDateString('fr-FR')}</span>
                <span className="h-display text-2xl text-volt">{last.global}/100</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => (
                  <div key={q}>
                    <div className="text-[10px] text-white/55">{QUALITY_LABEL[q]}</div>
                    <Bar value={Math.max(0, last.scores[q]) / 100} color={QCOLOR[q]} h={4} />
                  </div>
                ))}
              </div>
              {Date.now() - new Date(last.date).getTime() > 42 * 864e5 && <div className="mt-2 text-[12px] font-bold text-gold">Plus de 6 semaines : c'est le moment de le refaire.</div>}
            </div>
            {bilans.length > 1 && (
              <div className="card mt-2 space-y-1">
                {[...bilans].reverse().map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-white/70">{new Date(b.date).toLocaleDateString('fr-FR')}</span>
                    <span className="font-bold">
                      {b.global}/100 · {LEVEL_NAMES[b.level]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Page>
    )
  }

  const t = TEST_BY_ID[queue[i]]
  return (
    <Page>
      <div className="flex items-center gap-3 pb-3" style={{ paddingTop: 'calc(var(--safe-top) + 14px)' }}>
        <button className="grid h-9 w-9 place-items-center rounded-xl border border-white/10" aria-label="Quitter" onClick={() => confirm('Quitter le bilan ? Les résultats ne seront pas enregistrés.') && setI(-1)}>
          <Icon name="cross" size={16} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: QCOLOR[t.quality] }}>
            {QUALITY_LABEL[t.quality]} · test {i + 1}/{queue.length}
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full bg-volt" animate={{ width: `${((i + 1) / queue.length) * 100}%` }} />
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={t.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
          <h1 className="h-display mb-3 text-4xl leading-none">{t.name}</h1>
          <TestStep test={t} onDone={done} onSkip={skip} />
        </motion.div>
      </AnimatePresence>
    </Page>
  )
}

