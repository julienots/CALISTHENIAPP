import { motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Ring } from '../components/charts'
import { Icon, IconTile, type IconName } from '../components/Icon'
import { CoachTour } from '../components/CoachTour'
import { DailyReward } from '../components/DailyReward'
import { FigureArt, HERO_POSE } from '../components/FigureArt'
import { RankBadge } from '../components/RankBadge'
import { SKILLS as ALL_SKILLS } from '../data/skills'
import { VOIES } from '../lib/voies'
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
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55">{hello}</div>
          <div className="h-display text-4xl leading-none">{s.profile?.name}</div>
        </div>
        <Link to="/profile" className="grid h-11 w-11 place-items-center rounded-2xl text-lg font-black text-ink-950" style={{ background: `hsl(${s.profile?.avatarHue ?? 90} 90% 65%)` }}>
          {s.profile?.name?.[0]?.toUpperCase()}
        </Link>
      </div>

      {/* Bannière héros */}
      <div className="relative mt-2 overflow-hidden rounded-3xl border border-volt/30" style={{ background: 'radial-gradient(ellipse at 75% 35%, #6a2a0c, #24130c 55%, #140c09)' }}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 240" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="homeSpot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffcf3f" stopOpacity="0.28" />
              <stop offset="1" stopColor="#ffcf3f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M215 0 L300 0 L345 240 L170 240 Z" fill="url(#homeSpot)" />
        </svg>
        <div className="relative flex">
          <div className="z-10 flex-1 p-4 pr-0">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-volt">Ton arène</div>
            <h2 className="mt-1 text-[34px] font-black leading-[0.95] tracking-tight">Défie la<br />gravité.</h2>
            <p className="mt-2 text-[12px] leading-snug text-white/75">Valide tes paliers, fais certifier tes figures et grimpe jusqu'au rang ultime.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {[`${VOIES.length} voies`, '12 rangs', `${ALL_SKILLS.length} figures`].map((t) => (
                <span key={t} className="rounded-md border border-white/15 bg-black/25 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white/80">{t}</span>
              ))}
            </div>
            <Link to="/voies" className="btn-primary mt-3 !rounded-xl !px-4 !py-2.5 text-[13px]">Voir mes paliers</Link>
          </div>
          <motion.div className="h-[230px] w-[42%] shrink-0 self-end py-2" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}>
            <FigureArt pose={HERO_POSE} fit skin={s.skin} cues={false} backdrop={false} />
          </motion.div>
        </div>
      </div>

      <Link to="/ranks">
        <motion.div className="card-hi relative mt-3 flex items-center gap-4 overflow-hidden" whileTap={{ scale: 0.98 }} style={{ borderColor: rank.rank.color + '55' }}>
          <RankBadge rank={rank.rank} size={96} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Rang</div>
            <div className="h-display truncate text-4xl leading-none" style={{ color: rank.rank.color, textShadow: `0 0 18px ${rank.rank.glow}` }}>
              {rank.rank.name}
            </div>
            <div className="mt-1 text-xs text-white/70">{rank.rp.toLocaleString('fr-FR')} PR {rank.next && `· prochain : ${rank.next.name}`}</div>
            <div className="mt-2">
              <Bar value={rank.progress} color={rank.next?.color ?? rank.rank.color} />
            </div>
          </div>
        </motion.div>
      </Link>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="card flex flex-col items-center !p-3">
          <Ring value={ready / 100} size={58} color={ready > 70 ? '#ff7a1a' : ready > 45 ? '#ffb000' : '#ff3b30'}>
            <span className="h-display text-xl">{ready}</span>
          </Ring>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/60">Forme</div>
        </div>
        <div className="card flex flex-col items-center justify-center !p-3">
          <div className="h-display flex items-center gap-1 text-4xl text-ember">{streak(s.sessions)}<Icon name="flame" size={26} /></div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">Série (j)</div>
        </div>
        <div className="card flex flex-col items-center justify-center !p-3">
          <div className="h-display text-4xl text-ice">{week}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">Séances / 7 j</div>
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
        {(
          [
            ['/analyzer', 'camera', 'Analyser', '#ff7a1a'],
            ['/timers', 'timer', 'Timers', '#ffcf3f'],
            ['/map', 'map', 'Compétitions', '#ff3d6e'],
            ['/challenges', 'trophy', 'Défis', '#ffb000'],
            ['/competition', 'swords', 'Prépa compét', '#ff6b4a'],
            ['/coaches', 'whistle', 'Coachs', '#ff4fa0'],
          ] as [string, IconName, string, string][]
        ).map(([to, i, l, c]) => (
          <Link key={to} to={to} className="card flex flex-col items-center gap-2 !py-4" style={{ background: `linear-gradient(160deg, ${c}22, #21150f 65%)`, borderColor: c + '40' }}>
            <IconTile name={i} color={c} size={48} />
            <span className="text-[13px] font-extrabold">{l}</span>
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
                      <span className="text-white/65">
                        {st.best}/{sk.standard}
                        {sk.kind === 'hold' ? ' s' : ''}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Bar value={st.best / sk.standard} color={st.mastery >= 2 ? '#ff7a1a' : '#ff3d6e'} />
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
              <IconTile name={doneIds.has(c.id) ? 'check' : 'target'} color={doneIds.has(c.id) ? '#ffcf3f' : '#ff7a1a'} size={36} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{c.title}</div>
                <div className="truncate text-xs text-white/65">{c.text}</div>
              </div>
              <span className="text-xs font-black text-gold">+{c.xp}</span>
            </div>
          ))}
        </div>
      </Section>

      {nextComp && (
        <Link to="/map" className="card-hi mt-2 block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">Prochaine compétition</span>
            {compStatus(nextComp) === 'live' && <span className="rounded-full bg-ember px-2 py-0.5 text-[10px] font-black">EN DIRECT</span>}
          </div>
          <div className="h-display mt-1 text-2xl">{nextComp.name}</div>
          <div className="text-xs text-white/70">
            {nextComp.city}, {nextComp.country} · {new Date(nextComp.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </Link>
      )}
      <DailyReward />
      <CoachTour
        id="home"
        steps={[
          `Salut ${s.profile?.name ?? 'champion'} ! Je suis ton coach GRAVITAS. Je te suis à chaque séance.`,
          'Ici : ton rang, ta forme du jour, tes objectifs et mes conseils calculés sur tes vraies données.',
          'Le gros bouton + en bas lance tout : séance guidée, chrono de hold, analyse vidéo, combos.',
          'Reviens chaque jour : ta série fait grimper ta récompense quotidienne. À toi de jouer !',
        ]}
      />
    </Page>
  )
}
