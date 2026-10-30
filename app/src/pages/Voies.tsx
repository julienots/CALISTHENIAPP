import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CoachTour } from '../components/CoachTour'
import { FigureArt } from '../components/FigureArt'
import { Icon } from '../components/Icon'
import { Bar, Header, Page, TierBadge } from '../components/ui'
import { unitOf } from '../data/skills'
import { skillStatuses } from '../lib/scoring'
import { useStore } from '../lib/store'
import { VOIES, voieProgress, type Voie } from '../lib/voies'

/** Emblème de palier : hexagone + chiffre romain, doré quand validé. */
export function PalierEmblem({ label, done, current, color, size = 40 }: { label: string; done: boolean; current?: boolean; color: string; size?: number }) {
  const roman = label.split(' ').pop()
  const c = done ? color : current ? '#ffcf3f' : '#5c3e2c'
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className="shrink-0">
      <defs>
        <linearGradient id={`pe-${label}-${done}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} />
          <stop offset="1" stopColor={c} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {(done || current) && <circle cx="20" cy="20" r="19" fill={c} opacity="0.18" />}
      <path d="M20 3 35 11.5v17L20 37 5 28.5v-17Z" fill="#170f0b" stroke={`url(#pe-${label}-${done})`} strokeWidth="2.4" />
      <path d="M11 26c2 3 5 4.5 9 4.5s7-1.5 9-4.5" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      <text x="20" y="23.5" textAnchor="middle" fontSize="10.5" fontWeight="900" fill={done || current ? '#fff' : '#9a8a80'} fontFamily="Bebas Neue, Impact, sans-serif">
        {roman}
      </text>
    </svg>
  )
}

export default function Voies() {
  const records = useStore((s) => s.records)
  const analyses = useStore((s) => s.analyses)
  const skin = useStore((s) => s.skin)
  const statuses = useMemo(() => skillStatuses(records, analyses), [records, analyses])
  const [vid, setVid] = useState<Voie['id']>('push')
  const voie = VOIES.find((v) => v.id === vid)!
  const prog = voieProgress(voie, statuses)

  return (
    <Page>
      <Header title="Mes paliers" sub="Une échelle par voie. Chaque palier : l'une OU l'autre figure." back />

      <div className="grid grid-cols-4 gap-1.5">
        {VOIES.map((v) => {
          const pr = voieProgress(v, statuses)
          const on = v.id === vid
          return (
            <button key={v.id} onClick={() => setVid(v.id)} className="rounded-2xl border p-2 text-center transition active:scale-95" style={{ borderColor: on ? v.color : '#ffb4801a', background: on ? `linear-gradient(160deg, ${v.color}33, #21150f)` : '#21150f' }}>
              <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: v.color }}>{v.name}</div>
              <div className="h-display text-xl leading-tight">{pr.current?.name ?? '—'}</div>
              <div className="mt-1"><Bar value={pr.ladder / pr.total} color={v.color} h={4} /></div>
            </button>
          )
        })}
      </div>

      <div className="card-hi mt-3 flex items-center gap-3" style={{ borderColor: voie.color + '66' }}>
        <div className="h-display text-6xl leading-none" style={{ color: voie.color }}>{prog.ladder}</div>
        <div className="flex-1 text-sm text-white/75">
          paliers validés sur <b className="text-white">{prog.total}</b> en {voie.name}
          {prog.next && (
            <div className="mt-1 text-xs text-white/60">
              Prochain : <b className="text-white">{prog.next.name}</b> — {prog.next.options.map((o) => o.name).join(' ou ')}
            </div>
          )}
        </div>
        {prog.next && (
          <button onClick={() => document.getElementById(`palier-${prog.next!.index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="chip-on shrink-0">
            Mon palier
          </button>
        )}
      </div>

      <div className="relative mt-5 pl-1">
        <div className="absolute bottom-0 left-[24px] top-0 w-[3px] rounded-full" style={{ background: `linear-gradient(${voie.color}, #ffffff10)` }} />
        {prog.paliers.map((p, i) => {
          const current = i === prog.ladder
          const locked = i > prog.ladder
          return (
            <motion.div
              key={p.index}
              id={`palier-${p.index}`}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '60px' }}
              className={`relative mb-3 flex gap-3 ${locked ? 'opacity-55' : ''}`}
            >
              <div className="relative z-10 pt-1">
                <PalierEmblem label={p.name} done={p.done} current={current} color={voie.color} size={48} />
              </div>
              <div className={`flex-1 rounded-2xl border p-2.5 ${current ? 'shadow-[0_0_30px_-10px_#ffcf3f]' : ''}`} style={{ borderColor: current ? '#ffcf3f88' : p.done ? voie.color + '55' : '#ffb4801a', background: '#1c120d' }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: p.done ? voie.color : current ? '#ffcf3f' : '#ffffff99' }}>
                    {p.name}
                  </span>
                  {p.done && <Icon name="check" size={14} className="text-volt" />}
                  {current && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-black text-gold">EN COURS</span>}
                </div>
                <div className="flex items-stretch gap-1.5">
                  {p.options.map((o, k) => {
                    const st = statuses[o.id]
                    const ok = (st?.mastery ?? 0) >= 2
                    return (
                      <div key={o.id} className="flex flex-1 items-center gap-1.5">
                        {k > 0 && <span className="text-[10px] font-black text-white/45">OU</span>}
                        <Link to={`/skill/${o.id}`} className={`flex flex-1 flex-col rounded-xl border p-1.5 ${ok ? 'border-volt/60 bg-volt/10' : 'border-white/10 bg-white/[0.03]'}`}>
                          <div className="grid h-14 place-items-center overflow-hidden rounded-lg bg-[#140c09]">
                            <FigureArt skill={o} fit detailed={false} skin={skin} mastered={ok} />
                          </div>
                          <div className="mt-1 flex items-start gap-1">
                            <TierBadge tier={o.tier} />
                            <span className="text-[11px] font-bold leading-tight">{o.name}</span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-white/55">
                            {o.kind === 'hold' ? 'Tenue' : o.kind === 'reps' ? 'Répétitions' : 'Réussites'} : {o.standard} {unitOf(o)}
                            {st?.best ? ` · toi ${st.best}` : ''}
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
                {current && (
                  <Link to={`/analyzer?skill=${p.options[0].id}`} className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-gold/15 py-2 text-[12px] font-bold text-gold">
                    <Icon name="camera" size={15} /> Valider par l'analyseur
                  </Link>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <CoachTour
        id="voies"
        steps={[
          'Voici tes voies : Push, Pull, Équilibre et Agilité. Chacune est une échelle de paliers.',
          'Pour valider un palier, il suffit de réussir l\'UNE OU l\'AUTRE de ses deux figures au standard.',
          'Appuie sur une figure pour voir sa fiche, ou filme-toi pour la faire certifier par l\'analyseur.',
        ]}
      />
    </Page>
  )
}
