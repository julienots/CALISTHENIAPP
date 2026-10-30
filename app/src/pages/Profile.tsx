import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FigureArt, HERO_POSE, SKINS } from '../components/FigureArt'
import { IconTile } from '../components/Icon'
import { RankBadge } from '../components/RankBadge'
import { ACHIEVEMENTS } from '../lib/achievements'
import { exportPng } from '../lib/share'
import { streak } from '../lib/stats'
import { renderStoryPng } from '../lib/storyCard'
import { VOIES, voieProgress } from '../lib/voies'
import { PalierEmblem } from './Voies'
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
  const voies = VOIES.map((v) => ({ v, pr: voieProgress(v, statuses) }))
  const phares = Object.values(statuses).filter((x) => x.mastery >= 2).sort((a, b) => b.skill.tier - a.skill.tier).slice(0, 3)
  const unlocked = ACHIEVEMENTS.filter((a) => a.test(s))
  const [busy, setBusy] = useState(false)
  const story = async () => {
    setBusy(true)
    try {
      const png = await renderStoryPng({
        name: p.name,
        rank: r.rank,
        rp: r.rp,
        skin: s.skin,
        voies: voies.map(({ v, pr }) => ({ name: v.name, color: v.color, palier: pr.current?.name ?? '—' })),
        phares: phares.map((x) => x.skill.name),
        validated: r.validatedCount,
        streak: streak(s.sessions),
      })
      await exportPng(`gravitas-${p.name}.png`, png)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page>
      <Header title="Profil" back right={<Link to="/settings" className="chip" aria-label="Réglages"><Icon name="gear" size={16} /></Link>} />
      {/* L'arène : l'athlète sous les projecteurs */}
      <div className="relative -mx-4 overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 30%, #5c2a12, #1c100b 60%, #100a07)' }}>
        <div className="absolute left-4 top-3 z-10 rounded-md border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/80">L'arène</div>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 420" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="spotA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffcf3f" stopOpacity="0.32" />
              <stop offset="1" stopColor="#ffcf3f" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="pillar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2e1d15" />
              <stop offset="0.5" stopColor="#4a2f22" />
              <stop offset="1" stopColor="#1c120d" />
            </linearGradient>
          </defs>
          {[30, 95, 305, 370].map((x) => (
            <g key={x} opacity={x === 95 || x === 305 ? 0.9 : 0.55}>
              <rect x={x - 16} y="40" width="32" height="330" fill="url(#pillar)" />
              <rect x={x - 22} y="30" width="44" height="12" fill="#3a251a" />
              <rect x={x - 22} y="366" width="44" height="12" fill="#3a251a" />
            </g>
          ))}
          <path d="M150 0 L250 0 L320 380 L80 380 Z" fill="url(#spotA)" />
          <ellipse cx="200" cy="384" rx="120" ry="16" fill="#ffcf3f" opacity="0.12" />
        </svg>
        <motion.div className="relative mx-auto h-[300px] w-[220px] pt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <motion.div className="h-full w-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}>
            <FigureArt pose={HERO_POSE} fit skin={s.skin} cues={false} backdrop={false} />
          </motion.div>
        </motion.div>
        <div className="relative flex items-center gap-3 bg-gradient-to-t from-[#100a07] to-transparent px-4 pb-4 pt-6">
          <RankBadge rank={r.rank} size={70} />
          <div className="min-w-0 flex-1">
            <input className="h-display w-full bg-transparent text-4xl leading-none outline-none" value={p.name} onChange={(e) => s.patchProfile({ name: e.target.value })} />
            <div className="text-sm font-bold" style={{ color: r.rank.color }}>{r.rank.name} · {r.rp.toLocaleString('fr-FR')} PR</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-2xl border border-[#ffb4801a] bg-ink-800/80 text-center">
        <div className="p-3"><div className="text-[10px] font-black uppercase tracking-wider text-white/55">Figures</div><div className="h-display text-3xl">{r.validatedCount}</div></div>
        <div className="border-x border-white/5 p-3"><div className="text-[10px] font-black uppercase tracking-wider text-white/55">Série</div><div className="h-display text-3xl">{streak(s.sessions)} j</div></div>
        <div className="p-3"><div className="text-[10px] font-black uppercase tracking-wider text-white/55">Depuis</div><div className="h-display text-3xl">{new Date(p.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}</div></div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {voies.map(({ v, pr }) => (
          <Link key={v.id} to="/voies" className="card flex items-center gap-2 !p-3" style={{ borderColor: v.color + '55', background: `linear-gradient(160deg, ${v.color}22, #21150f 70%)` }}>
            <PalierEmblem label={pr.current?.name ?? 'Novice 0'} done={!!pr.current} color={v.color} size={42} />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: v.color }}>{v.name}</div>
              <div className="truncate text-sm font-extrabold">{pr.current?.name ?? 'Aucun palier'}</div>
              <div className="truncate text-[10px] text-white/55">vers {pr.next?.name ?? 'sommet'}</div>
            </div>
          </Link>
        ))}
      </div>

      {phares.length > 0 && (
        <Section title="Figures phares" className="mt-4">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {phares.map((x) => (
              <Link key={x.skill.id} to={`/skill/${x.skill.id}`} className="card w-36 shrink-0 !p-2">
                <div className="grid h-20 place-items-center overflow-hidden rounded-lg bg-[#140c09]"><FigureArt skill={x.skill} fit detailed={false} skin={s.skin} mastered /></div>
                <div className="mt-1 flex items-center gap-1"><TierBadge tier={x.skill.tier} /><span className="truncate text-[12px] font-bold">{x.skill.name}</span></div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title={`Succès ${unlocked.length}/${ACHIEVEMENTS.length}`}>
        <div className="grid grid-cols-5 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const ok = unlocked.includes(a)
            return (
              <div key={a.id} className={`flex flex-col items-center text-center ${ok ? '' : 'opacity-35 grayscale'}`} title={a.text}>
                <IconTile name={a.icon} color={ok ? '#ffb000' : '#9a8a80'} size={46} />
                <div className="mt-1 text-[9px] font-bold leading-tight">{a.name}</div>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Skins de l'athlète">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {SKINS.map((k) => {
            const ok = r.rank.id >= k.unlockRank
            const on = s.skin === k.id
            return (
              <button key={k.id} disabled={!ok} onClick={() => s.setSkin(k.id)} className={`card w-28 shrink-0 !p-2 text-center ${on ? '!border-volt shadow-[0_0_20px_-6px_#ff7a1a]' : ''} ${ok ? '' : 'opacity-45'}`}>
                <div className="grid h-24 place-items-center overflow-hidden rounded-lg bg-[#140c09]"><FigureArt pose={HERO_POSE} fit detailed={false} skin={k.id} backdrop={false} /></div>
                <div className="mt-1 text-[12px] font-bold">{k.name}</div>
                <div className="text-[10px] text-white/55">{on ? 'Équipé' : ok ? 'Débloqué' : `Rang ${k.unlockRank} requis`}</div>
              </button>
            )
          })}
        </div>
      </Section>

      <button className="btn-primary mb-4 w-full !py-4" disabled={busy} onClick={story}>
        {busy ? 'Création de ta carte…' : 'Ma carte story (image à partager)'}
      </button>

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
