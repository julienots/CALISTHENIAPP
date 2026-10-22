import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, Header, Page, Section, Segmented, Sheet, SkillPicker, Stepper, TierBadge } from '../components/ui'
import { SKILL_BY_ID } from '../data/skills'
import { generateProgram, GOAL_LABEL } from '../lib/generator'
import { LEVEL_NAMES, skillStatuses } from '../lib/scoring'
import { decodeShare } from '../lib/share'
import { uid, useStore } from '../lib/store'
import type { GeneratorParams, Program } from '../lib/types'

const EQUIP = ['barre', 'parallèles', 'parallettes', 'anneaux', 'élastique', 'lest', 'espalier', 'banc', 'box']

export default function Programs() {
  const s = useStore()
  const nav = useNavigate()
  const p = s.profile!
  const [params, setParams] = useState<GeneratorParams>({
    specialty: p.specialty,
    level: p.level,
    goal: p.goals[0] ?? 'skills',
    goalSkills: p.goalSkills.map((g) => g.skillId),
    weeks: 6,
    daysPerWeek: p.daysPerWeek,
    sessionMinutes: p.sessionMinutes,
    equipment: p.equipment,
  })
  const [picker, setPicker] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  const set = <K extends keyof GeneratorParams>(k: K, v: GeneratorParams[K]) => setParams({ ...params, [k]: v })

  const generate = () => {
    setBusy(true)
    setTimeout(() => {
      const prog = generateProgram(params, statuses, p.name)
      s.saveProgram(prog)
      if (!s.activeProgramId) s.setActiveProgram(prog.id)
      setBusy(false)
      nav(`/program/${prog.id}`)
    }, 350)
  }

  const doImport = () => {
    try {
      const prog = decodeShare<Program>(code)
      if (!prog.days?.length) throw new Error()
      const copy = { ...prog, id: uid(), createdAt: new Date().toISOString() }
      s.saveProgram(copy)
      setImportOpen(false)
      nav(`/program/${copy.id}`)
    } catch {
      alert('Code invalide.')
    }
  }

  return (
    <Page>
      <Header title="Programmes" sub="Générés sur mesure, à l'infini" right={<button className="chip" onClick={() => setImportOpen(true)}>Importer</button>} />

      <Section title="Générateur">
        <div className="card space-y-4">
          <div>
            <div className="label">Spécialité</div>
            <Segmented value={params.specialty} onChange={(v) => set('specialty', v)} options={[{ v: 'statique', l: 'Statique' }, { v: 'agilite', l: 'Agilité' }, { v: 'mixte', l: 'Les deux' }]} />
          </div>
          <div>
            <div className="label">Objectif</div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(GOAL_LABEL) as GeneratorParams['goal'][]).map((g) => (
                <button key={g} className={params.goal === g ? 'chip-on' : 'chip'} onClick={() => set('goal', g)}>
                  {GOAL_LABEL[g]}
                </button>
              ))}
            </div>
          </div>
          {params.goal === 'competition' && (
            <div>
              <div className="label">Date de la compétition</div>
              <input
                type="date"
                className="input"
                value={params.competitionDate ?? ''}
                onChange={(e) => {
                  const d = e.target.value
                  const weeks = d ? Math.max(3, Math.min(16, Math.ceil((new Date(d).getTime() - Date.now()) / (7 * 86400000)))) : params.weeks
                  setParams({ ...params, competitionDate: d, weeks })
                }}
              />
            </div>
          )}
          <div>
            <div className="label">Figures visées</div>
            <div className="flex flex-wrap gap-1.5">
              {params.goalSkills.map((id) => (
                <button key={id} className="chip-on" onClick={() => set('goalSkills', params.goalSkills.filter((x) => x !== id))}>
                  {SKILL_BY_ID[id]?.name} ✕
                </button>
              ))}
              <button className="chip" onClick={() => setPicker(true)}>
                + figure
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label">Niveau</div>
              <Stepper value={params.level} onChange={(v) => set('level', v)} min={1} max={5} />
              <div className="text-[11px] text-white/45">{LEVEL_NAMES[params.level]}</div>
            </div>
            <div>
              <div className="label">Semaines</div>
              <Stepper value={params.weeks} onChange={(v) => set('weeks', v)} min={1} max={16} />
            </div>
            <div>
              <div className="label">Séances/sem</div>
              <Stepper value={params.daysPerWeek} onChange={(v) => set('daysPerWeek', v)} min={2} max={6} />
            </div>
            <div>
              <div className="label">Minutes</div>
              <Stepper value={params.sessionMinutes} onChange={(v) => set('sessionMinutes', v)} min={30} max={180} step={15} />
            </div>
          </div>
          <div>
            <div className="label">Matériel</div>
            <div className="flex flex-wrap gap-1.5">
              {EQUIP.map((e) => (
                <button key={e} className={params.equipment.includes(e) ? 'chip-on' : 'chip'} onClick={() => set('equipment', params.equipment.includes(e) ? params.equipment.filter((x) => x !== e) : [...params.equipment, e])}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full !py-4 text-base" disabled={busy} onClick={generate}>
            {busy ? 'Calcul de la périodisation…' : '⚡ Générer un programme'}
          </button>
          <p className="text-[11px] text-white/40">Chaque génération est unique : périodisation par blocs, charges calculées sur tes records réels, progressions adaptées à ta ligne actuelle. Fonctionne hors ligne.</p>
        </div>
      </Section>

      <Section title="Mes programmes">
        <div className="space-y-2">
          {s.programs.map((prog) => {
            const done = s.completedDays[prog.id]?.length ?? 0
            return (
              <Link key={prog.id} to={`/program/${prog.id}`} className={`card block ${s.activeProgramId === prog.id ? '!border-volt/50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{prog.name}</div>
                    <div className="text-xs text-white/50">
                      {prog.params.weeks} sem. · {prog.params.daysPerWeek}×/sem · {GOAL_LABEL[prog.params.goal]} {prog.fromCoach && `· coach ${prog.fromCoach}`}
                    </div>
                  </div>
                  {s.activeProgramId === prog.id && <span className="rounded-md bg-volt px-1.5 py-0.5 text-[10px] font-black text-ink-950">ACTIF</span>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Bar value={done / prog.days.length} />
                  <span className="text-[11px] text-white/50">
                    {done}/{prog.days.length}
                  </span>
                </div>
                <div className="mt-2 flex gap-1">
                  {prog.params.goalSkills.slice(0, 3).map((id) => SKILL_BY_ID[id] && <TierBadge key={id} tier={SKILL_BY_ID[id].tier} />)}
                </div>
              </Link>
            )
          })}
          {!s.programs.length && <p className="text-sm text-white/40">Aucun programme. Génère ton premier ci-dessus.</p>}
        </div>
      </Section>

      <SkillPicker open={picker} onClose={() => setPicker(false)} onPick={(sk) => set('goalSkills', [...new Set([...params.goalSkills, sk.id])].slice(0, 4))} />
      <Sheet open={importOpen} onClose={() => setImportOpen(false)} title="Importer un programme">
        <p className="mb-2 text-sm text-white/55">Colle le code de partage (GRV1.…) reçu d'un coach ou d'un ami.</p>
        <textarea className="input h-32 font-mono text-xs" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn-primary mt-3 w-full" onClick={doImport}>
          Importer
        </button>
      </Sheet>
    </Page>
  )
}
