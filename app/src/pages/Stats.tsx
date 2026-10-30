import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Radar } from '../components/charts'
import { Header, Page, Section, Segmented, Stat, TierBadge } from '../components/ui'
import { CATEGORIES, SKILLS } from '../data/skills'
import { computeRank, skillStatuses } from '../lib/scoring'
import { acwr, streak, weekly } from '../lib/stats'
import { useStore } from '../lib/store'

export default function Stats() {
  const s = useStore()
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  const rank = computeRank(statuses, s.sessions, s.bonusXp)
  const [metric, setMetric] = useState<'minutes' | 'load' | 'sets' | 'sessions'>('minutes')
  const w = weekly(s.sessions, 12)
  const ac = acwr(s.sessions)
  const totalMin = s.sessions.reduce((n, x) => n + x.durationMin, 0)
  const totalHold = s.sessions.reduce((n, x) => n + x.exercises.reduce((m, e) => m + e.sets.reduce((k, st) => k + (st.seconds ?? 0), 0), 0), 0)

  // Radar : % de points obtenus par catégorie (pondéré par la difficulté)
  const radar = CATEGORIES.filter((c) => !['Fondamentaux'].includes(c)).map((cat) => {
    const list = SKILLS.filter((sk) => sk.category === cat)
    const got = list.reduce((n, sk) => n + (statuses[sk.id].mastery >= 2 ? sk.tier : statuses[sk.id].mastery === 1 ? sk.tier * 0.2 : 0), 0)
    const max = list.filter((sk) => sk.tier <= 8).reduce((n, sk) => n + sk.tier, 0) || 1
    return { label: cat.replace('Statiques ', 'Stat. ').replace('Dynamiques ', 'Dyn. ').replace(' & compression', '').replace(' & core', ''), value: Math.min(1, got / max) }
  })

  const topSkills = Object.values(statuses).filter((x) => x.best > 0).sort((a, b) => b.points - a.points).slice(0, 10)
  const avgScore = s.analyses.length ? s.analyses.reduce((n, a) => n + a.score, 0) / s.analyses.length : 0
  const rpeAvg = s.sessions.length ? s.sessions.reduce((n, x) => n + x.rpe, 0) / s.sessions.length : 0

  return (
    <Page>
      <Header title="Statistiques" sub="Ton profil d'athlète, chiffré" right={<Link to="/history" className="chip">Journal</Link>} />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Séances" value={s.sessions.length} sub={`${Math.round(totalMin / 60)} h au total`} />
        <Stat label="Temps sous tension" value={`${Math.round(totalHold / 60)}`} sub="min de holds" accent="#ffcf3f" />
        <Stat label="Série" value={streak(s.sessions)} sub="jours" accent="#ff3b30" />
        <Stat label="Figures" value={rank.validatedCount} sub={`validées / ${SKILLS.length}`} accent="#ff3d6e" />
        <Stat label="Note moy." value={avgScore ? avgScore.toFixed(1) : '—'} sub="/10 analyseur" accent="#ffb000" />
        <Stat label="ACWR" value={ac.ratio ? ac.ratio.toFixed(2) : '—'} sub={ac.ratio > 1.5 ? 'zone de risque' : ac.ratio > 0.8 ? 'zone optimale' : 'charge basse'} accent={ac.ratio > 1.5 ? '#ff3b30' : '#ff7a1a'} />
      </div>

      <Section title="Volume hebdomadaire" className="mt-5">
        <div className="card">
          <Segmented value={metric} onChange={setMetric} options={[{ v: 'minutes', l: 'Min' }, { v: 'load', l: 'Charge' }, { v: 'sets', l: 'Séries' }, { v: 'sessions', l: 'Séances' }]} />
          <div className="mt-3">
            <BarChart data={w.map((x) => ({ label: x.label, value: x[metric] }))} />
          </div>
          <p className="text-[11px] text-white/55">Charge = durée × RPE (méthode sRPE). RPE moyen : {rpeAvg.toFixed(1)}.</p>
        </div>
      </Section>

      <Section title="Profil par catégorie">
        <div className="card">
          <Radar axes={radar} />
        </div>
      </Section>

      <Section title="Figures les plus fortes">
        <div className="space-y-1.5">
          {topSkills.map((x) => (
            <Link key={x.skill.id} to={`/skill/${x.skill.id}`} className="flex items-center gap-3 rounded-xl bg-ink-800/70 p-2.5">
              <TierBadge tier={x.skill.tier} />
              <span className="flex-1 truncate text-sm font-semibold">{x.skill.name}</span>
              <span className="text-xs text-white/65">{x.best}{x.skill.kind === 'hold' ? ' s' : ''}</span>
              <span className="w-16 text-right text-xs font-black text-volt">{x.points} PR</span>
            </Link>
          ))}
          {!topSkills.length && <p className="text-sm text-white/55">Enregistre tes premières performances.</p>}
        </div>
      </Section>

      <Section title="Rang : détail">
        <div className="card text-sm text-white/70">
          <div className="flex justify-between"><span>Points figures</span><b>{rank.skillRp.toLocaleString('fr-FR')}</b></div>
          <div className="flex justify-between"><span>Points assiduité (plafonnés)</span><b>{rank.xpRp.toLocaleString('fr-FR')}</b></div>
          <div className="flex justify-between"><span>Figures certifiées</span><b>{rank.certifiedCount}</b></div>
        </div>
      </Section>
    </Page>
  )
}
