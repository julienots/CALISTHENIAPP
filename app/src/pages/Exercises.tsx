// Bibliothèque d'exercices : une fiche technique par exercice, avec la chaîne de progression.
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Header, Page } from '../components/ui'
import { EXERCISES, EX_BY_ID, type Exercise, type Pattern } from '../data/exercises'
import { HOWTO } from '../data/howto'
import { SKILL_BY_ID } from '../data/skills'

const GROUPS: { id: string; label: string; patterns: Pattern[] }[] = [
  { id: 'all', label: 'Tout', patterns: [] },
  { id: 'push', label: 'Poussée', patterns: ['push'] },
  { id: 'pull', label: 'Tirage', patterns: ['pull'] },
  { id: 'core', label: 'Gainage', patterns: ['core'] },
  { id: 'legs', label: 'Jambes', patterns: ['legs'] },
  { id: 'mob', label: 'Mobilité', patterns: ['mobility', 'wrist', 'scap'] },
  { id: 'power', label: 'Agilité', patterns: ['power'] },
]
const LEVELS = [
  { id: 'all', label: 'Tous niveaux', test: () => true },
  { id: 'start', label: 'Premiers pas', test: (l: number) => l <= 1 },
  { id: 'mid', label: 'Intermédiaire', test: (l: number) => l === 2 || l === 3 },
  { id: 'adv', label: 'Avancé', test: (l: number) => l >= 4 },
]
const LEVEL_TAG = ['Premiers pas', 'Débutant', 'Intermédiaire', 'Confirmé', 'Avancé', 'Élite']
const LEVEL_COLOR = ['#7ee0a0', '#ffcf3f', '#ffb000', '#ff7a1a', '#ff3d6e', '#ff3b30']

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const noEquip = (e: Exercise) => e.equipment.every((x) => x === 'sol')

/** Lien vers un exercice ou une figure de la chaîne de progression. */
function ChainLink({ id, dir, onOpen }: { id: string; dir: 'easier' | 'harder'; onOpen: (id: string) => void }) {
  const ex = EX_BY_ID[id]
  const sk = SKILL_BY_ID[id]
  const label = ex?.name ?? sk?.name
  if (!label) return null
  const inner = (
    <>
      {dir === 'easier' && <Icon name="play" size={10} className="rotate-180" />}
      <span className="min-w-0 flex-1 truncate">
        <span className="block text-[9px] font-black uppercase tracking-widest text-white/50">{dir === 'easier' ? 'Plus facile' : 'Plus dur'}</span>
        {label}
      </span>
      {dir === 'harder' && <Icon name="play" size={10} />}
    </>
  )
  const cls = `flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-[12px] font-bold ${dir === 'harder' ? 'text-right' : ''}`
  return ex ? (
    <button className={cls} onClick={() => onOpen(id)}>
      {inner}
    </button>
  ) : (
    <Link to={`/skill/${id}`} className={cls}>
      {inner}
    </Link>
  )
}

export function ExerciseSheet({ ex, onOpen }: { ex: Exercise; onOpen: (id: string) => void }) {
  const h = HOWTO[ex.id]
  if (!h) return <p className="text-[13px] text-white/60">{ex.cue ?? 'Exécution propre, gainage permanent.'}</p>
  return (
    <div className="space-y-3">
      <div className="text-[12px] text-white/60">
        <span className="font-bold text-white/80">Muscles : </span>
        {h.muscles}
      </div>
      <div>
        <div className="label">Exécution</div>
        {h.how.map((x, i) => (
          <div key={x} className="flex gap-2 py-0.5 text-[13px] text-white/85">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-volt/20 text-[11px] font-black text-volt">{i + 1}</span>
            {x}
          </div>
        ))}
        {ex.cue && <div className="mt-1 text-[12px] font-semibold text-gold">▸ {ex.cue}</div>}
      </div>
      <div>
        <div className="label">Erreurs fréquentes</div>
        {h.mistakes.map((x) => (
          <div key={x} className="flex gap-2 py-0.5 text-[13px] text-white/75">
            <Icon name="cross" size={14} className="mt-0.5 text-ember" />
            {x}
          </div>
        ))}
      </div>
      {h.safety && (
        <div className="flex gap-2 rounded-xl bg-[#ffb0001a] p-2.5 text-[12px] text-gold">
          <Icon name="warning" size={16} />
          {h.safety}
        </div>
      )}
      {(h.easier || h.harder) && (
        <div className="flex gap-2">
          {h.easier ? <ChainLink id={h.easier} dir="easier" onOpen={onOpen} /> : <div className="flex-1" />}
          {h.harder ? <ChainLink id={h.harder} dir="harder" onOpen={onOpen} /> : <div className="flex-1" />}
        </div>
      )}
    </div>
  )
}

export default function Exercises() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('all')
  const [level, setLevel] = useState('all')
  const [home, setHome] = useState(false)
  const open = params.get('id')
  const setOpen = (id: string | null) => setParams(id ? { id } : {}, { replace: true })

  useEffect(() => {
    if (open) setTimeout(() => document.getElementById(`ex-${open}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [open])

  const list = useMemo(() => {
    const g = GROUPS.find((x) => x.id === group)!
    const lv = LEVELS.find((x) => x.id === level)!
    const nq = norm(q.trim())
    return EXERCISES.filter((e) => (!g.patterns.length || g.patterns.includes(e.pattern)) && lv.test(e.level) && (!home || noEquip(e)) && (!nq || norm(e.name + ' ' + (HOWTO[e.id]?.muscles ?? '')).includes(nq))).sort(
      (a, b) => a.level - b.level || a.name.localeCompare(b.name),
    )
  }, [q, group, level, home])

  return (
    <Page>
      <Header title="Exercices" sub={`${EXERCISES.length} fiches techniques, du premier pas à l'élite`} back />
      <div className="space-y-2">
        <div className="relative">
          <input className="input !pl-9" placeholder="Rechercher (pompes, dos, épaules…)" value={q} onChange={(e) => setQ(e.target.value)} />
          <Icon name="target" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          {GROUPS.map((g) => (
            <button key={g.id} className={`shrink-0 ${group === g.id ? 'chip-on' : 'chip'}`} onClick={() => setGroup(g.id)}>
              {g.label}
            </button>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          <button className={`shrink-0 ${home ? 'chip-on' : 'chip'}`} onClick={() => setHome(!home)}>
            Sans matériel
          </button>
          {LEVELS.map((l) => (
            <button key={l.id} className={`shrink-0 ${level === l.id ? 'chip-on' : 'chip'}`} onClick={() => setLevel(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {list.map((e) => {
          const on = open === e.id
          return (
            <motion.div layout="position" key={e.id} id={`ex-${e.id}`} className={`card !p-0 overflow-hidden scroll-mt-28 ${on ? '!border-volt/50' : ''}`}>
              <button className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setOpen(on ? null : e.id)}>
                <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: LEVEL_COLOR[e.level] }} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold leading-tight">{e.name}</div>
                  <div className="truncate text-[11px] text-white/55">
                    {LEVEL_TAG[e.level]} · {noEquip(e) ? 'sans matériel' : e.equipment.filter((x) => x !== 'sol').join(', ')} · {e.kind === 'hold' ? 'maintien' : 'répétitions'}
                  </div>
                </div>
                <motion.span animate={{ rotate: on ? 90 : 0 }} className="text-white/40">
                  <Icon name="play" size={12} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="border-t border-white/[0.06] p-3">
                      <ExerciseSheet ex={e} onOpen={(id) => (setGroup('all'), setLevel('all'), setHome(false), setQ(''), setOpen(id))} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
        {!list.length && <p className="py-8 text-center text-sm text-white/55">Aucun exercice ne correspond.</p>}
      </div>
    </Page>
  )
}
