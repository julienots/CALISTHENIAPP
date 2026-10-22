import { useMemo, useState } from 'react'
import { Empty, Header, Page, Section, Sheet, SkillPicker, Stepper, TierBadge } from '../components/ui'
import { SKILL_BY_ID, skillBasePoints } from '../data/skills'
import { skillStatuses } from '../lib/scoring'
import { uid, useStore } from '../lib/store'
import type { Combo } from '../lib/types'
import { IntervalRunner } from './Timers'

const TRANSITIONS = ['enchaîné direct', 'press', 'lâcher / regrab', 'rotation', 'descente contrôlée', 'switch de prise']

export function comboScore(c: Combo, statuses: ReturnType<typeof skillStatuses>) {
  let diff = 0
  let bonus = 0
  c.steps.forEach((st, i) => {
    const sk = SKILL_BY_ID[st.skillId]
    if (!sk) return
    const holdF = sk.kind === 'hold' ? Math.min(1.5, st.seconds / sk.standard) : 1
    diff += skillBasePoints(sk.tier) * holdF
    const prev = i > 0 ? SKILL_BY_ID[c.steps[i - 1].skillId] : undefined
    // Bonus d'enchaînement : deux figures difficiles liées sans pause
    if (prev && st.transition !== 'descente contrôlée') bonus += (Math.min(prev.tier, sk.tier) / 10) * 0.15 * skillBasePoints(Math.min(prev.tier, sk.tier))
  })
  const feasible = c.steps.length ? c.steps.filter((st) => (statuses[st.skillId]?.mastery ?? 0) >= 2).length / c.steps.length : 0
  const seconds = c.steps.reduce((n, st) => n + st.seconds + 2, 0)
  return { total: Math.round(diff + bonus), bonus: Math.round(bonus), feasible, seconds }
}

export default function Combos() {
  const s = useStore()
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  const [edit, setEdit] = useState<Combo | null>(null)
  const [picker, setPicker] = useState(false)
  const [practice, setPractice] = useState<Combo | null>(null)

  const newCombo = () => setEdit({ id: uid(), name: `Combo ${s.combos.length + 1}`, steps: [], createdAt: new Date().toISOString() })
  const move = (i: number, d: number) => {
    if (!edit) return
    const steps = [...edit.steps]
    const j = i + d
    if (j < 0 || j >= steps.length) return
    ;[steps[i], steps[j]] = [steps[j], steps[i]]
    setEdit({ ...edit, steps })
  }

  return (
    <Page>
      <Header title="Combos" sub="Conçois, note et répète tes enchaînements" back right={<button className="btn-primary !py-2" onClick={newCombo}>+ Combo</button>} />
      {!s.combos.length && <Empty icon="🔗" title="Aucun combo" text="Enchaîne tes figures (ex : handstand → planche → press), je calcule la difficulté et te fais répéter au timer." action={<button className="btn-primary" onClick={newCombo}>Créer un combo</button>} />}
      <div className="space-y-2">
        {s.combos.map((c) => {
          const sc = comboScore(c, statuses)
          return (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-white/50">{c.steps.length} figures · ~{sc.seconds} s · faisable à {Math.round(sc.feasible * 100)} %</div>
                </div>
                <div className="text-right">
                  <div className="h-display text-3xl text-gold">{sc.total}</div>
                  <div className="text-[10px] text-white/40">pts difficulté</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                {c.steps.map((st, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-white/30">→</span>}
                    <span className="rounded-md bg-white/5 px-1.5 py-0.5">{SKILL_BY_ID[st.skillId]?.name} {st.seconds}s</span>
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button className="btn-primary !py-2" onClick={() => setPractice(c)}>▶ Répéter</button>
                <button className="btn-ghost !py-2" onClick={() => setEdit(c)}>Modifier</button>
                <button className="btn-danger !py-2" onClick={() => confirm('Supprimer ?') && s.deleteCombo(c.id)}>Suppr.</button>
              </div>
            </div>
          )
        })}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title="Construire le combo">
        {edit && (
          <div className="space-y-3">
            <input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            {edit.steps.map((st, i) => {
              const sk = SKILL_BY_ID[st.skillId]
              return (
                <div key={i} className="card !p-3">
                  {i > 0 && (
                    <select className="input mb-2 !py-1.5 text-xs" value={st.transition ?? TRANSITIONS[0]} onChange={(e) => setEdit({ ...edit, steps: edit.steps.map((x, j) => (j === i ? { ...x, transition: e.target.value } : x)) })}>
                      {TRANSITIONS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  )}
                  <div className="flex items-center gap-2">
                    <TierBadge tier={sk.tier} />
                    <span className="flex-1 text-sm font-semibold">{sk.name}</span>
                    <button className="px-1 text-white/50" onClick={() => move(i, -1)}>↑</button>
                    <button className="px-1 text-white/50" onClick={() => move(i, 1)}>↓</button>
                    <button className="px-1 text-white/40" onClick={() => setEdit({ ...edit, steps: edit.steps.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                    <span>{sk.kind === 'hold' ? 'Durée du hold' : 'Durée estimée'}</span>
                    <Stepper value={st.seconds} onChange={(v) => setEdit({ ...edit, steps: edit.steps.map((x, j) => (j === i ? { ...x, seconds: v } : x)) })} min={1} max={60} unit="s" />
                  </div>
                </div>
              )
            })}
            <button className="btn-ghost w-full" onClick={() => setPicker(true)}>+ Ajouter une figure</button>
            {edit.steps.length > 0 && (() => {
              const sc = comboScore(edit, statuses)
              return (
                <div className="card-hi text-sm">
                  Difficulté <b className="text-gold">{sc.total}</b> (dont bonus enchaînement {sc.bonus}) · ~{sc.seconds}s · faisabilité {Math.round(sc.feasible * 100)} %
                </div>
              )
            })()}
            <button className="btn-primary w-full" onClick={() => (s.saveCombo(edit), setEdit(null))}>Enregistrer</button>
          </div>
        )}
      </Sheet>

      <SkillPicker open={picker} onClose={() => setPicker(false)} onPick={(sk) => edit && setEdit({ ...edit, steps: [...edit.steps, { skillId: sk.id, seconds: sk.kind === 'hold' ? Math.min(5, sk.standard) : 3, transition: TRANSITIONS[0] }] })} />

      <Sheet open={!!practice} onClose={() => setPractice(null)} title={practice?.name ?? ''}>
        {practice && (
          <Section title="Répétition guidée">
            <IntervalRunner segs={[{ label: 'Préparation', sec: 5, kind: 'prep' }, ...practice.steps.map((st) => ({ label: SKILL_BY_ID[st.skillId].name, sec: st.seconds, kind: 'work' as const }))]} />
          </Section>
        )}
      </Sheet>
    </Page>
  )
}
