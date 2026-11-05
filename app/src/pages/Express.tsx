// Séance express : 3 choix (temps, lieu, envie) → une séance guidée prête à lancer.
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Header, Page, Segmented } from '../components/ui'
import { HOWTO } from '../data/howto'
import { buildExpress, FOCUS, PLACES, type Focus, type Place } from '../lib/express'
import { LEVEL_NAMES } from '../lib/scoring'
import { useStore } from '../lib/store'

const BLOCK_COLOR: Record<string, string> = { Échauffement: '#ffcf3f', Force: '#ff7a1a', Conditionnement: '#ff3d6e', Mobilité: '#c9a27e' }

export default function Express() {
  const s = useStore()
  const nav = useNavigate()
  const [minutes, setMinutes] = useState(20)
  const [place, setPlace] = useState<Place>('maison')
  const [focus, setFocus] = useState<Focus>('full')
  const [level, setLevel] = useState(Math.max(1, s.profile?.level ?? 1))
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const prog = useMemo(() => buildExpress({ minutes, place, focus, level, equipment: s.profile?.equipment ?? [], seed }), [minutes, place, focus, level, seed, s.profile?.equipment])
  const day = prog.days[0]

  const start = () => {
    s.saveProgram(prog)
    nav('/workout/express/x1')
  }

  return (
    <Page>
      <Header title="Séance express" sub="Pas de programme ? Une séance complète en 3 choix" back />

      <div className="label">Temps dispo</div>
      <Segmented value={minutes} onChange={setMinutes} options={[10, 20, 30, 45].map((m) => ({ v: m, l: `${m} min` }))} />

      <div className="label mt-4">Où es-tu ?</div>
      <div className="grid grid-cols-2 gap-2">
        {PLACES.map((p) => (
          <button key={p.id} className={`card !p-3 text-left text-[13px] font-bold transition ${place === p.id ? '!border-volt/70 text-volt' : ''}`} onClick={() => setPlace(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="label mt-4">Envie du jour</div>
      <div className="grid grid-cols-2 gap-2">
        {FOCUS.map((f) => (
          <button key={f.id} className={`card !p-3 text-left transition ${focus === f.id ? '!border-volt/70' : ''}`} onClick={() => setFocus(f.id)}>
            <div className={`text-[13px] font-extrabold ${focus === f.id ? 'text-volt' : ''}`}>{f.label}</div>
            <div className="text-[11px] leading-tight text-white/55">{f.desc}</div>
          </button>
        ))}
      </div>

      <div className="label mt-4">Niveau</div>
      <Segmented value={level} onChange={setLevel} options={[1, 2, 3, 4, 5].map((l) => ({ v: l, l: LEVEL_NAMES[l].split(' ')[0] }))} />

      <div className="card-hi mt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-display text-2xl leading-none">{day.title}</div>
            <div className="text-[12px] text-white/60">
              {day.items.length} exercices · ~{day.estMinutes} min
            </div>
          </div>
          <motion.button whileTap={{ rotate: 180 }} className="btn-ghost !px-3 !py-2" onClick={() => setSeed(Math.floor(Math.random() * 1e9))} aria-label="Autre séance">
            <Icon name="refresh" size={16} />
          </motion.button>
        </div>
        <div className="mt-3 space-y-1.5">
          <AnimatePresence mode="popLayout">
            {day.items.map((it, i) => (
              <motion.div key={seed + it.name} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-2.5 py-2">
                <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: BLOCK_COLOR[it.block] ?? '#ff7a1a' }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold">{it.name}</div>
                  <div className="truncate text-[11px] text-white/55">{it.exerciseId && HOWTO[it.exerciseId] ? HOWTO[it.exerciseId].how[0] : it.block}</div>
                </div>
                <div className="shrink-0 text-right text-[12px] font-bold">
                  {it.sets > 1 ? `${it.sets} × ` : ''}
                  {it.target}
                </div>
                {it.exerciseId && (
                  <Link to={`/exercices?id=${it.exerciseId}`} className="shrink-0 text-white/40" aria-label="Fiche technique">
                    <Icon name="book" size={16} />
                  </Link>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <button className="btn-primary mt-4 w-full" onClick={start}>
          <Icon name="play" size={16} /> Lancer la séance guidée
        </button>
      </div>
    </Page>
  )
}
