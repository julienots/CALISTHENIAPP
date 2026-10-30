import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header, Page, Section, Sheet } from '../components/ui'
import { SKILL_BY_ID } from '../data/skills'
import { generateProgram } from '../lib/generator'
import { skillStatuses } from '../lib/scoring'
import { uid, useStore } from '../lib/store'
import { comboScore } from './Combos'
import { IntervalRunner, PRESETS } from './Timers'

const CRITERIA = [
  ['Difficulté', 'Niveau des figures et des transitions'],
  ['Exécution', 'Bras tendus, lignes, pointes, stabilité'],
  ['Créativité', 'Originalité, variété des figures'],
  ['Enchaînements', 'Fluidité, liaisons sans pause'],
  ['Endurance', 'Qualité maintenue jusqu\'à la fin'],
] as const

const CHECKLIST = [
  'Lire le règlement (format, critères, figures interdites)',
  'Routines fixées et répétées au timer 2×/semaine',
  'Plan B pour chaque combo (version plus facile)',
  'Dernière semaine : −50 % de volume, intensité maintenue',
  'Sommeil 8 h la semaine précédente',
  'Échauffement compétition testé (20-25 min)',
  'Magnésie, grips, tenue, gourde, collation',
  'Musique / visualisation du passage',
]

export default function CompetitionPrep() {
  const s = useStore()
  const nav = useNavigate()
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  const [preset, setPreset] = useState(0)
  const [rounds, setRounds] = useState<string[]>([])
  const [sim, setSim] = useState(false)
  const [judge, setJudge] = useState(false)
  const [scores, setScores] = useState<number[]>([6, 6, 6, 6, 6])
  const [checks, setChecks] = useState<string[]>([])
  const p = s.profile!
  const days = p.competitionDate ? Math.ceil((new Date(p.competitionDate).getTime() - Date.now()) / 86400000) : null
  const pr = PRESETS[preset]

  const segs = useMemo(() => {
    const out: { label: string; sec: number; kind: 'work' | 'rest' | 'prep' }[] = [{ label: 'Préparation', sec: 10, kind: 'prep' }]
    for (let i = 0; i < pr.n; i++) {
      const combo = s.combos.find((c) => c.id === rounds[i])
      out.push({ label: combo ? `R${i + 1} · ${combo.name}` : `Round ${i + 1}`, sec: pr.w, kind: 'work' })
      if (i < pr.n - 1) out.push({ label: 'Repos', sec: pr.r, kind: 'rest' })
    }
    return out
  }, [pr, rounds, s.combos])

  const saveJudge = () => {
    const total = scores.reduce((a, b) => a + b, 0)
    s.saveSession({
      id: uid(),
      date: new Date().toISOString(),
      title: `Simulation compétition ${pr.l}`,
      durationMin: Math.round(segs.reduce((n, x) => n + x.sec, 0) / 60) + 20,
      type: 'competition',
      exercises: rounds.map((rid, i) => ({ name: `Round ${i + 1} : ${s.combos.find((c) => c.id === rid)?.name ?? 'libre'}`, sets: [{ seconds: pr.w, done: true }] })),
      rpe: 9,
      feeling: Math.round(total / 10),
      notes: `Auto-évaluation jury : ${CRITERIA.map(([c], i) => `${c} ${scores[i]}/10`).join(', ')} → ${total}/50`,
    })
    setJudge(false)
    nav('/history')
  }

  return (
    <Page>
      <Header title="Prépa compétition" sub="Simulation, jury, affûtage" back />

      <div className="card-hi">
        <div className="label">Ma compétition</div>
        <input className="input mb-2" placeholder="Nom de la compétition" value={p.competitionName ?? ''} onChange={(e) => s.patchProfile({ competitionName: e.target.value })} />
        <input type="date" className="input" value={p.competitionDate ?? ''} onChange={(e) => s.patchProfile({ competitionDate: e.target.value })} />
        {days !== null && (
          <div className="mt-3 text-center">
            <div className="h-display text-7xl text-volt">{days > 0 ? `J-${days}` : days === 0 ? 'JOUR J' : 'Passée'}</div>
            <div className="text-xs text-white/65">{days > 7 ? `${Math.floor(days / 7)} semaines de préparation` : days > 0 ? 'Phase d\'affûtage : volume −50 %' : ''}</div>
          </div>
        )}
        <button
          className="btn-primary mt-3 w-full"
          onClick={() => {
            const weeks = days && days > 0 ? Math.max(2, Math.min(16, Math.ceil(days / 7))) : 6
            const prog = generateProgram({ specialty: p.specialty, level: p.level, goal: 'competition', goalSkills: p.goalSkills.map((g) => g.skillId), weeks, daysPerWeek: p.daysPerWeek, sessionMinutes: p.sessionMinutes, equipment: p.equipment, competitionDate: p.competitionDate }, statuses, p.name)
            s.saveProgram(prog)
            s.setActiveProgram(prog.id)
            nav(`/program/${prog.id}`)
          }}
        >
          Générer le plan de peaking
        </button>
      </div>

      <Section title="Simulateur de passage" className="mt-5">
        <div className="card space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((x, i) => (
              <button key={x.l} className={preset === i ? 'chip-on' : 'chip'} onClick={() => setPreset(i)}>
                {x.l} ×{x.n}
              </button>
            ))}
          </div>
          {Array.from({ length: pr.n }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 text-xs font-bold text-white/65">R{i + 1}</span>
              <select className="input !py-2" value={rounds[i] ?? ''} onChange={(e) => setRounds(Object.assign([...rounds], { [i]: e.target.value }))}>
                <option value="">Freestyle libre</option>
                {s.combos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({comboScore(c, statuses).total} pts)
                  </option>
                ))}
              </select>
            </div>
          ))}
          {!s.combos.length && <Link to="/combos" className="text-xs text-volt">Crée tes combos pour les assigner aux rounds →</Link>}
          <button className="btn-primary w-full !py-4" onClick={() => setSim(true)}>▶ Lancer la simulation</button>
        </div>
      </Section>

      <Section title="Checklist">
        <div className="card space-y-2">
          {CHECKLIST.map((c) => (
            <label key={c} className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#ff7a1a]" checked={checks.includes(c)} onChange={() => setChecks(checks.includes(c) ? checks.filter((x) => x !== c) : [...checks, c])} />
              <span className={checks.includes(c) ? 'text-white/55 line-through' : 'text-white/80'}>{c}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Figures à forte valeur">
        <div className="space-y-1.5">
          {Object.values(statuses)
            .filter((x) => x.mastery >= 2)
            .sort((a, b) => b.skill.tier - a.skill.tier)
            .slice(0, 8)
            .map((x) => (
              <div key={x.skill.id} className="flex justify-between rounded-xl bg-ink-800/70 px-3 py-2 text-sm">
                <span>{x.skill.name}</span>
                <span className="text-white/65">{x.best}{x.skill.kind === 'hold' ? ' s' : ''} {x.bestScore !== undefined && `· ${x.bestScore}/10`}</span>
              </div>
            ))}
          <p className="text-[11px] text-white/55">Construis tes rounds autour des figures validées avec une note d'exécution ≥ 8 : les juges sanctionnent plus une figure ratée qu'une figure absente.</p>
        </div>
      </Section>

      <Sheet open={sim} onClose={() => setSim(false)} title={`Simulation ${pr.l}`}>
        <IntervalRunner segs={segs} onDone={() => (setSim(false), setJudge(true))} />
        <button className="btn-ghost mt-3 w-full" onClick={() => (setSim(false), setJudge(true))}>Passer à la notation</button>
      </Sheet>

      <Sheet open={judge} onClose={() => setJudge(false)} title="Auto-évaluation jury">
        <div className="space-y-4">
          {CRITERIA.map(([c, d], i) => (
            <div key={c}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{c}</span>
                <b className="text-volt">{scores[i]}/10</b>
              </div>
              <div className="text-[11px] text-white/60">{d}</div>
              <input type="range" min={0} max={10} step={0.5} value={scores[i]} className="w-full" onChange={(e) => setScores(scores.map((v, j) => (j === i ? Number(e.target.value) : v)))} />
            </div>
          ))}
          <div className="h-display text-center text-5xl text-gold">{scores.reduce((a, b) => a + b, 0)}/50</div>
          <button className="btn-primary w-full" onClick={saveJudge}>Enregistrer dans le journal</button>
        </div>
      </Sheet>
      {rounds.length > 0 && rounds.some((r) => r) && (
        <p className="text-[11px] text-white/55">Rounds : {rounds.map((r) => s.combos.find((c) => c.id === r)?.steps.map((st) => SKILL_BY_ID[st.skillId]?.name).join(' → ') ?? 'libre').join(' | ')}</p>
      )}
    </Page>
  )
}
