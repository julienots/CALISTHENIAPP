import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FigureArt } from '../components/FigureArt'
import { FigureTabs } from '../components/FigureTabs'
import { Header, Page, Segmented, TierBadge } from '../components/ui'
import { CATEGORIES, SKILLS } from '../data/skills'
import { MASTERY, skillStatuses } from '../lib/scoring'
import { useStore } from '../lib/store'
import { Icon } from '../components/Icon'

const MCOL = ['#ffffff30', '#ff3d6e', '#ff7a1a', '#ffb000']

export default function Skills() {
  const records = useStore((s) => s.records)
  const analyses = useStore((s) => s.analyses)
  const specialty = useStore((s) => s.profile?.specialty ?? 'mixte')
  const statuses = useMemo(() => skillStatuses(records, analyses), [records, analyses])
  const [disc, setDisc] = useState<'tout' | 'statique' | 'agilite'>(specialty === 'mixte' ? 'tout' : specialty)
  const [q, setQ] = useState('')
  const [only, setOnly] = useState<'all' | 'acquired' | 'todo'>('all')

  const list = SKILLS.filter((s) => disc === 'tout' || s.discipline === disc || s.discipline === 'fondamental')
    .filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()))
    .filter((s) => only === 'all' || (only === 'acquired' ? statuses[s.id].mastery >= 2 : statuses[s.id].mastery < 2))
  const validated = SKILLS.filter((s) => statuses[s.id].mastery >= 2).length

  return (
    <Page>
      <Header title="Figures" sub={`${validated} / ${SKILLS.length} validées · ${SKILLS.filter((s) => statuses[s.id].certified).length} certifiées`} />
      <FigureTabs />
      <Segmented value={disc} onChange={setDisc} options={[{ v: 'tout', l: 'Tout' }, { v: 'statique', l: 'Statique' }, { v: 'agilite', l: 'Agilité' }]} />
      <input className="input mt-2" placeholder="Rechercher une figure…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-2 flex gap-1.5">
        {(
          [
            ['all', 'Toutes'],
            ['acquired', 'Validées'],
            ['todo', 'À débloquer'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} className={only === v ? 'chip-on' : 'chip'} onClick={() => setOnly(v)}>
            {l}
          </button>
        ))}
      </div>
      {CATEGORIES.map((cat) => {
        const items = list.filter((s) => s.category === cat).sort((a, b) => a.tier - b.tier)
        if (!items.length) return null
        return (
          <div key={cat} className="mt-5">
            <div className="h-display mb-2 text-lg tracking-wider text-white/70">{cat}</div>
            <div className="space-y-1.5">
              {items.map((s) => {
                const st = statuses[s.id]
                return (
                  <Link key={s.id} to={`/skill/${s.id}`} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-ink-800/70 p-2.5 active:bg-ink-700">
                    <TierBadge tier={s.tier} />
                    <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#170f0b]">
                      <FigureArt skill={s} detailed={false} fit mastered={st.mastery >= 2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {s.name} {s.danger && <span title="Risque élevé" className="text-ember"><Icon name="warning" size={14} /></span>}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/60">
                        <span style={{ color: MCOL[st.mastery] }}>● {MASTERY[st.mastery]}</span>
                        {st.best > 0 && <span>record {st.best}{s.kind === 'hold' ? ' s' : ''}</span>}
                        {st.bestScore !== undefined && <span>note {st.bestScore}/10</span>}
                      </div>
                    </div>
                    {st.certified && <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-black text-gold">CERTIFIÉ</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </Page>
  )
}
