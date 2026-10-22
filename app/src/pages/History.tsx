import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Empty, Header, Page } from '../components/ui'
import { sessionXp } from '../lib/scoring'
import { fmtDate } from '../lib/stats'
import { useStore } from '../lib/store'

export default function History() {
  const all = useStore((s) => s.sessions)
  const sessions = useMemo(() => [...all].sort((a, b) => b.date.localeCompare(a.date)), [all])
  let lastMonth = ''
  return (
    <Page>
      <Header title="Journal" sub={`${sessions.length} séances enregistrées`} back right={<Link to="/log" className="btn-primary !py-2">+ Séance</Link>} />
      {!sessions.length && <Empty icon="📓" title="Journal vide" text="Chaque séance enregistrée nourrit le coach, tes stats et ton rang." action={<Link to="/log" className="btn-primary">Noter ma première séance</Link>} />}
      <div className="space-y-2">
        {sessions.map((x) => {
          const month = fmtDate(x.date, { month: 'long', year: 'numeric' })
          const header = month !== lastMonth ? ((lastMonth = month), <div className="h-display mt-4 text-lg capitalize text-white/60">{month}</div>) : null
          return (
            <div key={x.id}>
              {header}
              <Link to={`/log/${x.id}`} className="card block">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold">{x.title}</div>
                    <div className="text-xs text-white/50">
                      {fmtDate(x.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {x.durationMin} min · RPE {x.rpe} · {x.type}
                      {x.location ? ` · ${x.location}` : ''}
                    </div>
                  </div>
                  <span className="text-xs font-black text-gold">+{sessionXp(x)} XP</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {x.exercises.slice(0, 6).map((e, i) => (
                    <span key={i} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                      {e.name} <b>{e.sets.map((st) => (st.seconds ? `${st.seconds}s` : st.reps ?? '')).filter(Boolean).join('/')}</b>
                    </span>
                  ))}
                </div>
                {!!x.pain?.length && <div className="mt-1 text-[11px] text-ember">Douleurs : {x.pain.join(', ')}</div>}
              </Link>
            </div>
          )
        })}
      </div>
    </Page>
  )
}
