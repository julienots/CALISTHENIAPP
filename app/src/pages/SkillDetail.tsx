import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LineChart, Ring } from '../components/charts'
import { Bar, Header, Page, Section, Stat, Stepper, TierBadge } from '../components/ui'
import { EX_BY_ID, LINE_DRILLS } from '../data/exercises'
import { CUES, lineOf, SKILL_BY_ID, skillBasePoints, unitOf } from '../data/skills'
import { MASTERY, skillStatuses } from '../lib/scoring'
import { dailyBest, DAY, fmtDate, linReg, projection } from '../lib/stats'
import { useStore } from '../lib/store'

export default function SkillDetail() {
  const { id = '' } = useParams()
  const skill = SKILL_BY_ID[id]
  const s = useStore()
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  const [val, setVal] = useState(skill?.kind === 'hold' ? 5 : 3)
  if (!skill) return <Page><Header title="Introuvable" back /></Page>
  const st = statuses[skill.id]
  const recs = s.records.filter((r) => r.skillId === skill.id).sort((a, b) => a.date.localeCompare(b.date))
  const ans = s.analyses.filter((a) => a.skillId === skill.id).sort((a, b) => a.date.localeCompare(b.date))
  const unit = unitOf(skill)
  const daily = dailyBest(recs)
  const t0 = daily.length ? new Date(daily[0].date).getTime() : 0
  const pts = daily.map((d) => ({ x: (new Date(d.date).getTime() - t0) / DAY, y: d.value, label: fmtDate(d.date) }))
  const reg = linReg(pts)
  const proj = projection(recs, st.mastery >= 2 ? skill.standard * 2 : skill.standard)
  const target = st.mastery >= 2 ? skill.standard * 2 : skill.standard
  const margin = Math.max(0, target - st.best)
  const last5 = recs.slice(-5)
  const avg5 = last5.length ? last5.reduce((n, r) => n + r.value, 0) / last5.length : 0
  const consistency = st.best > 0 ? avg5 / st.best : 0

  // Moyenne de chaque critère sur toutes les analyses
  const critAvg = new Map<string, { sum: number; n: number; tip: string }>()
  for (const a of ans) for (const c of a.criteria) {
    const cur = critAvg.get(c.label) ?? { sum: 0, n: 0, tip: c.tip }
    critAvg.set(c.label, { sum: cur.sum + c.score, n: cur.n + 1, tip: c.tip })
  }
  const crit = [...critAvg.entries()].map(([label, v]) => ({ label, avg: v.sum / v.n, tip: v.tip })).sort((a, b) => a.avg - b.avg)
  const scorePts = ans.map((a, i) => ({ x: i, y: a.score, label: fmtDate(a.date) }))

  const line = lineOf(skill)
  const drills = (LINE_DRILLS[skill.line] ?? []).map((d) => EX_BY_ID[d]).filter(Boolean)

  return (
    <Page>
      <Header title={skill.name} sub={`${skill.category} · ${skill.discipline}`} back right={<TierBadge tier={skill.tier} size="lg" />} />

      <div className="card-hi flex items-center gap-4">
        <Ring value={Math.min(1, st.best / target)} size={86} color={st.mastery >= 2 ? '#c6ff3d' : '#7c5cff'}>
          <div className="text-center">
            <div className="h-display text-2xl leading-none">{st.best}</div>
            <div className="text-[9px] text-white/50">{unit}</div>
          </div>
        </Ring>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-white/45">Statut</div>
          <div className="h-display text-3xl" style={{ color: ['#ffffff70', '#7c5cff', '#c6ff3d', '#ffc83d'][st.mastery] }}>
            {MASTERY[st.mastery]} {st.certified && <span className="text-gold">· CERTIFIÉ</span>}
          </div>
          <div className="text-xs text-white/55">
            Standard : {skill.standard} {unit} · Maîtrise : {skill.standard * 2} {unit}
          </div>
          <div className="text-xs text-white/55">Valeur : {skillBasePoints(skill.tier).toLocaleString('fr-FR')} PR (×1.4 maîtrisé, ×1.25 certifié)</div>
        </div>
      </div>

      <div className="card mt-3">
        <div className="label">Enregistrer une performance</div>
        <div className="flex items-center justify-between gap-2">
          <Stepper value={val} onChange={setVal} min={0} max={600} step={skill.kind === 'hold' ? 1 : 1} unit={unit} />
          <button className="btn-primary" onClick={() => s.addRecord({ skillId: skill.id, value: val, date: new Date().toISOString(), source: 'test' })}>
            Valider
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {skill.kind === 'hold' && (
            <Link to={`/timers?mode=hold&skill=${skill.id}`} className="btn-ghost">
              ⏱️ Chrono hold
            </Link>
          )}
          <Link to={`/analyzer?skill=${skill.id}`} className={`btn-ghost ${skill.kind !== 'hold' ? 'col-span-2' : ''}`}>
            🎥 Analyser / certifier
          </Link>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Marge" value={margin > 0 ? `${margin}` : '0'} sub={`${unit} jusqu'à ${st.mastery >= 2 ? 'maîtrise' : 'validation'}`} accent="#ffc83d" />
        <Stat label="Tendance" value={reg ? `${reg.slope * 7 >= 0 ? '+' : ''}${(reg.slope * 7).toFixed(1)}` : '—'} sub={`${unit} / semaine`} accent="#3dd6ff" />
        <Stat label="Régularité" value={st.best ? `${Math.round(consistency * 100)}%` : '—'} sub="moy. 5 dernières / record" accent="#7c5cff" />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="Tentatives" value={st.attempts} />
        <Stat label="Note max" value={st.bestScore !== undefined ? st.bestScore : '—'} sub="/10 analyseur" accent="#ffc83d" />
        <Stat label="Analyses" value={ans.length} accent="#ff5ca8" />
      </div>

      <Section title="Progression" className="mt-5">
        <div className="card">
          <LineChart data={pts} unit={unit === 's' ? ' s' : ''} target={target} trend={reg ? { ...reg, untilX: proj?.date ? Math.min((proj.date.getTime() - t0) / DAY, (pts.at(-1)?.x ?? 0) + 120) : undefined } : undefined} />
          <div className="mt-2 text-sm text-white/65">
            {!proj
              ? 'Enregistre au moins 2 jours de performances pour obtenir une projection.'
              : proj.reached
                ? `Objectif atteint 🎉 Prochain palier : ${skill.standard * 2} ${unit}.`
                : proj.date
                  ? `Projection : ${target} ${unit} vers le ${proj.date.toLocaleDateString('fr-FR')} (~${Math.ceil(proj.weeks)} sem., fiabilité ${Math.round(proj.r2 * 100)} %).`
                  : 'Tendance plate ou négative : change de stimulus (voir exercices d\'assistance).'}
          </div>
        </div>
      </Section>

      {ans.length > 0 && (
        <Section title="Notes de l'analyseur">
          <div className="card">
            <LineChart data={scorePts} color="#ffc83d" format={(v) => v.toFixed(1)} unit="/10" />
            <div className="mt-3 space-y-2.5">
              {crit.map((c) => (
                <div key={c.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-white/75">{c.label}</span>
                    <span className="font-bold">{c.avg.toFixed(1)}/10</span>
                  </div>
                  <Bar value={c.avg / 10} color={c.avg >= 8 ? '#c6ff3d' : c.avg >= 6 ? '#ffc83d' : '#ff5c39'} />
                </div>
              ))}
            </div>
            {crit[0] && crit[0].avg < 8 && <p className="mt-3 rounded-xl bg-ember/10 p-3 text-xs text-ember">Priorité technique : {crit[0].tip}</p>}
          </div>
        </Section>
      )}

      <Section title="Ligne de progression">
        <div className="space-y-1.5">
          {line.map((x) => (
            <Link key={x.id} to={`/skill/${x.id}`} className={`flex items-center gap-3 rounded-xl border p-2.5 ${x.id === skill.id ? 'border-volt/50 bg-volt/10' : 'border-white/5 bg-ink-800/70'}`}>
              <TierBadge tier={x.tier} />
              <span className="flex-1 text-sm font-semibold">{x.name}</span>
              <span className="text-xs text-white/50">{MASTERY[statuses[x.id].mastery]}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Points techniques">
        <div className="card space-y-2">
          {CUES[skill.profile].map((c) => (
            <div key={c} className="flex gap-2 text-sm text-white/75">
              <span className="text-volt">▸</span>
              {c}
            </div>
          ))}
          {skill.danger && <div className="rounded-xl bg-ember/10 p-3 text-xs text-ember">⚠️ Figure à haut risque articulaire / tendineux. Progression très lente, échauffement spécifique obligatoire.</div>}
        </div>
      </Section>

      {drills.length > 0 && (
        <Section title="Exercices d'assistance">
          <div className="flex flex-wrap gap-1.5">
            {drills.map((d) => (
              <span key={d.id} className="chip">
                {d.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Historique">
        <div className="space-y-1">
          {[...recs].reverse().slice(0, 30).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
              <span className="text-white/60">{fmtDate(r.date, { day: 'numeric', month: 'short', year: '2-digit' })}</span>
              <span className="text-xs text-white/40">{r.source}</span>
              <span className="font-bold">
                {r.value} {unit} {r.score !== undefined && <span className="text-gold">· {r.score}/10</span>}
              </span>
              <button className="text-white/30" onClick={() => confirm('Supprimer ce record ?') && s.deleteRecord(r.id)}>
                ✕
              </button>
            </div>
          ))}
          {!recs.length && <p className="text-sm text-white/40">Aucune donnée pour l'instant.</p>}
        </div>
      </Section>
    </Page>
  )
}
