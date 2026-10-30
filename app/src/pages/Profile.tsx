import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RankBadge } from '../components/RankBadge'
import { Header, Page, Section, Segmented, SkillPicker, Stat, Stepper, TierBadge } from '../components/ui'
import { SKILL_BY_ID } from '../data/skills'
import { computeRank, estimateLevel, LEVEL_NAMES, skillStatuses } from '../lib/scoring'
import { useStore } from '../lib/store'
import { Icon } from '../components/Icon'

const EQUIP = ['barre', 'parallèles', 'parallettes', 'anneaux', 'élastique', 'lest', 'espalier', 'banc', 'box']

export default function Profile() {
  const s = useStore()
  const p = s.profile!
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  const r = computeRank(statuses, s.sessions, s.bonusXp)
  const [picker, setPicker] = useState(false)
  const est = estimateLevel(p, statuses)
  const bw = s.sessions.filter((x) => x.bodyweight).sort((a, b) => a.date.localeCompare(b.date))
  const certified = Object.values(statuses).filter((x) => x.certified)

  return (
    <Page>
      <Header title="Profil" back right={<Link to="/settings" className="chip" aria-label="Réglages"><Icon name="gear" size={16} /></Link>} />
      <div className="card-hi flex items-center gap-4">
        <RankBadge rank={r.rank} size={90} />
        <div className="min-w-0 flex-1">
          <input className="h-display w-full bg-transparent text-3xl outline-none" value={p.name} onChange={(e) => s.patchProfile({ name: e.target.value })} />
          <div className="text-sm" style={{ color: r.rank.color }}>{r.rank.name}</div>
          <div className="text-xs text-white/65">Membre depuis {new Date(p.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Niveau" value={p.level} sub={LEVEL_NAMES[p.level]} />
        <Stat label="Estimé" value={est} sub="d'après tes figures" accent="#ffcf3f" />
        <Stat label="Poids" value={p.bodyweight ?? '—'} sub={bw.length > 1 ? `${(bw.at(-1)!.bodyweight! - bw[0].bodyweight!).toFixed(1)} kg depuis le début` : 'kg'} accent="#ffb000" />
      </div>
      {est !== p.level && <button className="btn-ghost mt-2 w-full text-xs" onClick={() => s.patchProfile({ level: est })}>Passer au niveau estimé : {LEVEL_NAMES[est]}</button>}

      <Section title="Spécialité" className="mt-5">
        <Segmented value={p.specialty} onChange={(v) => s.patchProfile({ specialty: v })} options={[{ v: 'statique', l: 'Statique' }, { v: 'agilite', l: 'Agilité' }, { v: 'mixte', l: 'Les deux' }]} />
      </Section>

      <Section title="Objectifs de figures" right={<button className="chip" onClick={() => setPicker(true)}>+ Ajouter</button>}>
        <div className="space-y-1.5">
          {p.goalSkills.map((g) => {
            const sk = SKILL_BY_ID[g.skillId]
            return (
              <div key={g.skillId} className="card flex items-center gap-3 !p-3">
                <TierBadge tier={sk.tier} />
                <Link to={`/skill/${sk.id}`} className="flex-1 text-sm font-semibold">{sk.name}</Link>
                <input type="date" className="input !w-36 !py-1 text-xs" value={g.deadline ?? ''} onChange={(e) => s.patchProfile({ goalSkills: p.goalSkills.map((x) => (x.skillId === g.skillId ? { ...x, deadline: e.target.value } : x)) })} />
                <button className="text-white/45" onClick={() => s.patchProfile({ goalSkills: p.goalSkills.filter((x) => x.skillId !== g.skillId) })}>✕</button>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Entraînement">
        <div className="card space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Niveau déclaré</span><Stepper value={p.level} onChange={(v) => s.patchProfile({ level: v })} min={1} max={5} /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Séances / semaine</span><Stepper value={p.daysPerWeek} onChange={(v) => s.patchProfile({ daysPerWeek: v })} min={2} max={6} /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Durée</span><Stepper value={p.sessionMinutes} onChange={(v) => s.patchProfile({ sessionMinutes: v })} min={30} max={180} step={15} unit="min" /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Poids</span><Stepper value={p.bodyweight ?? 70} onChange={(v) => s.patchProfile({ bodyweight: v })} min={30} max={180} step={0.5} unit="kg" /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Taille</span><Stepper value={p.height ?? 175} onChange={(v) => s.patchProfile({ height: v })} min={120} max={220} unit="cm" /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Âge</span><Stepper value={p.age ?? 25} onChange={(v) => s.patchProfile({ age: v })} min={10} max={90} /></div>
          <div>
            <div className="label">Matériel</div>
            <div className="flex flex-wrap gap-1.5">
              {EQUIP.map((e) => (
                <button key={e} className={p.equipment.includes(e) ? 'chip-on' : 'chip'} onClick={() => s.patchProfile({ equipment: p.equipment.includes(e) ? p.equipment.filter((x) => x !== e) : [...p.equipment, e] })}>{e}</button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {certified.length > 0 && (
        <Section title="Figures certifiées">
          <div className="flex flex-wrap gap-1.5">
            {certified.map((x) => <Link key={x.skill.id} to={`/skill/${x.skill.id}`} className="chip-on !border-gold/50 !bg-gold/10 !text-gold"><Icon name="medal" size={15} /> {x.skill.name}</Link>)}
          </div>
        </Section>
      )}

      <SkillPicker open={picker} onClose={() => setPicker(false)} onPick={(sk) => s.patchProfile({ goalSkills: [...p.goalSkills.filter((g) => g.skillId !== sk.id), { skillId: sk.id }] })} />
    </Page>
  )
}
