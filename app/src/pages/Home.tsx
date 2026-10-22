import { motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Ring } from '../components/charts'
import { RankBadge } from '../components/RankBadge'
import { Bar, Page, Section, TierBadge, toneColor } from '../components/ui'
import { SKILL_BY_ID } from '../data/skills'
import { challengesFor } from '../lib/challenges'
import { compStatus, loadCompetitions } from '../lib/cloud'
import { coachInsights, readiness } from '../lib/coach'
import { computeRank, skillStatuses } from '../lib/scoring'
import { DAY, streak } from '../lib/stats'
import { useStore } from '../lib/store'

export default function Home() {
  const s = useStore()
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  const rank = useMemo(() => computeRank(statuses, s.sessions, s.bonusXp), [statuses, s.sessions, s.bonusXp])
  const insights = useMemo(() => coachInsights(s), [s])
  const ready = readiness(s)
  const week = s.sessions.filter((x) => Date.now() - new Date(x.date).getTime() < 7 * DAY).length
  const nextComp = (s.feedCache?.items ?? [])
    .filter((c) => compStatus(c) !== 'past')
    .sort((a, b) => a.start.localeCompare(b.start))[0]
  const todays = challengesFor().filter((c) => c.scope === 'jour')
  const doneIds = new Set(s.challenges.map((c) => c.id))

  useEffect(() => {
    if (!s.feedCache || Date.now() - new Date(s.feedCache.at).getTime() > 3600000) loadCompetitions().catch(() => {})
  }, [s.feedCache])

  const hour = new Date().getHours()
  const hello = hour < 6 ? 'Nuit blanche' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <Page>
      <div className="flex items-center justify-between pb-2" style={{ paddingTop: 'calc(var(--safe-top) + 16px)' }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">{hello}</div>
          <div className="h-display text-4xl leading-none">{s.profile?.name}</div>
        </div>
        <Link to="/profile" className="grid h-11 w-11 place-items-center rounded-2xl text-lg font-black text-ink-950" style={{ background: `hsl(${s.profile?.avatarHue ?? 90} 90% 65%)` }}>
          {s.profile?.name?.[0]?.toUpperCase()}
        </Link>
      </div>

      <Link to="/ranks">
        <motion.div className="card-hi relative mt-3 flex items-center gap-4 overflow-hidden" whileTap={{ scale: 0.98 }} style={{ borderColor: rank.rank.color + '55' }}>
          <RankBadge rank={rank.rank} size={96} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/45">Rang</div>
            <div className="h-display truncate text-4xl leading-none" style={{ color: rank.rank.color, textShadow: `0 0 18px ${rank.rank.glow}` }}>
              {rank.rank.name}
            </div>
            <div className="mt-1 text-xs text-white/55">{rank.rp.toLocaleString('fr-FR')} PR {rank.next && `· prochain : ${rank.next.name}`}</div>
            <div className="mt-2">
              <Bar value={rank.progress} color={rank.next?.color ?? rank.rank.color} />
            </div>
          </div>
        </motion.div>
      </Link>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="card flex flex-col items-center !p-3">
          <Ring value={ready / 100} size={58} color={ready > 70 ? '#c6ff3d' : ready > 45 ? '#ffc83d' : '#ff5c39'}>
            <span className="h-display text-xl">{ready}</span>
          </Ring>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/45">Forme</div>
        </div>
        <div className="card flex flex-col items-center justify-center !p-3">
          <div className="h-display text-4xl text-ember">{streak(s.sessions)}🔥</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">Série (j)</div>
        </div>
        <div className="card flex flex-col items-center justify-center !p-3">
          <div className="h-display text-4xl text-ice">{week}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">Séances / 7 j</div>
        </div>
      </div>

      <Section title="Ton coach" className="mt-5" right={<Link to="/coach" className="text-xs font-bold text-volt">Discuter →</Link>}>
        <div className="space-y-2">
          {insights.slice(0, 5).map((i, k) => (
            <motion.div key={k} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.05 }} className="card relative overflow-hidden !pl-5">
              <div className="absolute inset-y-0 left-0 w-1" style={{ background: toneColor[i.tone] }} />
              <div className="text-sm font-bold">{i.title}</div>
              <div className="mt-0.5 text-[13px] leading-snug text-white/60">{i.text}</div>
              {i.to && (
                <Link to={i.to} className="mt-2 inline-block text-xs font-bold" style={{ color: toneColor[i.tone] }}>
                  {i.cta} →
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-3 gap-2">
        {[
          ['/analyzer', '🎥', 'Analyser'],
          ['/timers', '⏱️', 'Timers'],
          ['/map', '🗺️', 'Compétitions'],
          ['/challenges', '🏆', 'Défis'],
          ['/competition', '⚔️', 'Prépa compét'],
          ['/coaches', '🧑‍🏫', 'Coachs'],
        ].map(([to, i, l]) => (
          <Link key={to} to={to} className="card flex flex-col items-center gap-1 !py-4 active:scale-95">
            <span className="text-2xl">{i}</span>
            <span className="text-xs font-bold">{l}</span>
          </Link>
        ))}
      </div>

      {(s.profile?.goalSkills.length ?? 0) > 0 && (
        <Section title="Objectifs" className="mt-5">
          <div className="space-y-2">
            {s.profile!.goalSkills.map((g) => {
              const sk = SKILL_BY_ID[g.skillId]
              const st = statuses[g.skillId]
              if (!sk) return null
              return (
                <Link key={g.skillId} to={`/skill/${sk.id}`} className="card flex items-center gap-3 !p-3">
                  <TierBadge tier={sk.tier} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="truncate">{sk.name}</span>
                      <span className="text-white/50">
                        {st.best}/{sk.standard}
                        {sk.kind === 'hold' ? ' s' : ''}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Bar value={st.best / sk.standard} color={st.mastery >= 2 ? '#c6ff3d' : '#7c5cff'} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Section>
      )}

      <Section title="Défis du jour" className="mt-5" right={<Link to="/challenges" className="text-xs font-bold text-volt">Tous →</Link>}>
        <div className="space-y-2">
          {todays.slice(0, 3).map((c) => (
            <div key={c.id} className={`card flex items-center gap-3 !p-3 ${doneIds.has(c.id) ? 'opacity-50' : ''}`}>
              <span className="text-xl">{doneIds.has(c.id) ? '✅' : '🎯'}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{c.title}</div>
                <div className="truncate text-xs text-white/50">{c.text}</div>
              </div>
              <span className="text-xs font-black text-gold">+{c.xp}</span>
            </div>
          ))}
        </div>
      </Section>

      {nextComp && (
        <Link to="/map" className="card-hi mt-2 block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Prochaine compétition</span>
            {compStatus(nextComp) === 'live' && <span className="rounded-full bg-ember px-2 py-0.5 text-[10px] font-black">EN DIRECT</span>}
          </div>
          <div className="h-display mt-1 text-2xl">{nextComp.name}</div>
          <div className="text-xs text-white/55">
            {nextComp.city}, {nextComp.country} · {new Date(nextComp.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </Link>
      )}
    </Page>
  )
}
