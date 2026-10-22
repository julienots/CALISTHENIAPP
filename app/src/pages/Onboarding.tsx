import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SkillPicker, Stepper, TierBadge } from '../components/ui'
import { SKILLS, SKILL_BY_ID } from '../data/skills'
import { generateProgram } from '../lib/generator'
import { estimateLevel, LEVEL_NAMES, skillStatuses } from '../lib/scoring'
import { useStore } from '../lib/store'
import type { Goal, Profile, Specialty } from '../lib/types'

const EQUIP = ['barre', 'parallèles', 'parallettes', 'anneaux', 'élastique', 'lest', 'espalier', 'banc', 'box']
const QUICK_SKILLS = ['pull-up', 'dips', 'muscle-up', 'l-sit', 'handstand', 'tuck-planche', 'adv-tuck-planche', 'straddle-planche', 'full-planche', 'tuck-front-lever', 'adv-tuck-front-lever', 'straddle-front-lever', 'full-front-lever', 'full-back-lever', 'human-flag', 'v-sit', 'freestanding-hspu', 'swing-360', 'muscle-up-180', 'backflip', 'giant', 'one-arm-handstand']

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <motion.path d="M32 6 58 54H6Z" fill="none" stroke="#c6ff3d" strokeWidth={4.5} strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      <motion.path d="M19 40h26" stroke="#7c5cff" strokeWidth={4.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 0.5 }} />
    </svg>
  )
}

export default function Onboarding() {
  const nav = useNavigate()
  const st = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState<Specialty>('mixte')
  const [tests, setTests] = useState({ maxPullups: 5, maxDips: 8, maxPushups: 20 })
  const [acquired, setAcquired] = useState<Record<string, number>>({})
  const [goals, setGoals] = useState<Goal[]>(['skills'])
  const [goalSkills, setGoalSkills] = useState<string[]>([])
  const [days, setDays] = useState(4)
  const [minutes, setMinutes] = useState(75)
  const [equipment, setEquipment] = useState<string[]>(['barre', 'parallèles'])
  const [bw, setBw] = useState(72)
  const [picker, setPicker] = useState(false)
  const [levelOverride, setLevelOverride] = useState<number | null>(null)

  const estLevel = estimateLevel(tests)
  const level = levelOverride ?? Math.max(estLevel, Math.min(5, Math.max(0, ...Object.keys(acquired).map((id) => Math.ceil((SKILL_BY_ID[id]?.tier ?? 0) / 2)))))

  const finish = () => {
    const now = new Date().toISOString()
    const profile: Profile = {
      name: name || 'Athlète',
      specialty,
      level,
      goals,
      goalSkills: goalSkills.map((skillId) => ({ skillId })),
      equipment,
      daysPerWeek: days,
      sessionMinutes: minutes,
      bodyweight: bw,
      ...tests,
      createdAt: now,
      avatarHue: Math.floor(Math.random() * 360),
    }
    st.setProfile(profile)
    for (const [skillId, value] of Object.entries(acquired)) st.addRecord({ skillId, value, date: now, source: 'test' })
    st.addRecord({ skillId: 'pull-up', value: tests.maxPullups, date: now, source: 'test' })
    st.addRecord({ skillId: 'dips', value: tests.maxDips, date: now, source: 'test' })
    st.addRecord({ skillId: 'push-up', value: tests.maxPushups, date: now, source: 'test' })
    const s2 = useStore.getState()
    const prog = generateProgram(
      { specialty, level, goal: goals[0] ?? 'skills', goalSkills, weeks: 6, daysPerWeek: days, sessionMinutes: minutes, equipment },
      skillStatuses(s2.records, s2.analyses),
      profile.name,
    )
    st.saveProgram(prog)
    st.setActiveProgram(prog.id)
    nav('/', { replace: true })
  }

  const steps = [
    <div key="0" className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
        <Logo size={110} />
      </motion.div>
      <h1 className="h-display mt-6 text-7xl tracking-wider text-white">GRAVITAS</h1>
      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.35em] text-volt">Défie la gravité</p>
      <p className="mt-6 max-w-xs text-white/60">Ton coach de calisthenics : programmes sur mesure, analyse vidéo biomécanique, rangs, compétitions. En ligne et hors ligne.</p>
    </div>,
    <div key="1">
      <h2 className="h-display text-4xl">Qui es-tu ?</h2>
      <label className="label mt-4">Ton nom d'athlète</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Julien" />
      <label className="label mt-5">Ta spécialité</label>
      <div className="space-y-2">
        {(
          [
            ['statique', 'STATIQUE', 'Planche, levers, handstand, anneaux. La force pure.', '🧱'],
            ['agilite', 'AGILITÉ', 'Freestyle : swings, 360, lâchers, flips. Le flow.', '🌀'],
            ['mixte', 'LES DEUX', 'L\'athlète complet. Le format compétition.', '⚔️'],
          ] as const
        ).map(([v, t, d, i]) => (
          <button key={v} onClick={() => setSpecialty(v)} className={`card flex w-full items-center gap-3 text-left transition ${specialty === v ? '!border-volt/70 shadow-[0_0_30px_#c6ff3d22]' : ''}`}>
            <span className="text-3xl">{i}</span>
            <div>
              <div className={`h-display text-2xl ${specialty === v ? 'text-volt' : ''}`}>{t}</div>
              <div className="text-xs text-white/55">{d}</div>
            </div>
          </button>
        ))}
      </div>
    </div>,
    <div key="2">
      <h2 className="h-display text-4xl">Tes fondamentaux</h2>
      <p className="text-sm text-white/55">Max de répétitions strictes, d'une traite.</p>
      {(
        [
          ['maxPullups', 'Tractions'],
          ['maxDips', 'Dips'],
          ['maxPushups', 'Pompes'],
        ] as const
      ).map(([k, l]) => (
        <div key={k} className="card mt-3 flex items-center justify-between">
          <span className="font-semibold">{l}</span>
          <Stepper value={tests[k]} onChange={(v) => setTests({ ...tests, [k]: v })} />
        </div>
      ))}
      <div className="card-hi mt-4">
        <div className="label">Niveau estimé</div>
        <div className="h-display text-3xl text-volt">{LEVEL_NAMES[level]}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5].map((l) => (
            <button key={l} className={level === l ? 'chip-on' : 'chip'} onClick={() => setLevelOverride(l)}>
              {LEVEL_NAMES[l]}
            </button>
          ))}
        </div>
      </div>
    </div>,
    <div key="3">
      <h2 className="h-display text-4xl">Ce que tu maîtrises</h2>
      <p className="text-sm text-white/55">Touche les figures que tu tiens déjà (au standard). Tu pourras affiner chaque record plus tard.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_SKILLS.map((id) => {
          const s = SKILL_BY_ID[id]
          const on = acquired[id] !== undefined
          return (
            <button
              key={id}
              className={on ? 'chip-on' : 'chip'}
              onClick={() => {
                const n = { ...acquired }
                if (on) delete n[id]
                else n[id] = s.standard
                setAcquired(n)
              }}
            >
              <TierBadge tier={s.tier} /> {s.name}
            </button>
          )
        })}
      </div>
    </div>,
    <div key="4">
      <h2 className="h-display text-4xl">Tes objectifs</h2>
      <label className="label mt-3">Objectif principal</label>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['skills', 'Débloquer des figures'],
            ['force', 'Force max'],
            ['competition', 'Compétition'],
            ['endurance', 'Endurance'],
            ['hypertrophie', 'Muscle'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} className={goals.includes(v) ? 'chip-on' : 'chip'} onClick={() => setGoals(goals.includes(v) ? goals.filter((g) => g !== v) : [v, ...goals])}>
            {l}
          </button>
        ))}
      </div>
      <label className="label mt-5">Figures visées (3 max)</label>
      <div className="space-y-2">
        {goalSkills.map((id) => (
          <div key={id} className="card flex items-center gap-3 !p-3">
            <TierBadge tier={SKILL_BY_ID[id].tier} />
            <span className="flex-1 font-semibold">{SKILL_BY_ID[id].name}</span>
            <button className="text-white/40" onClick={() => setGoalSkills(goalSkills.filter((g) => g !== id))}>
              ✕
            </button>
          </div>
        ))}
        {goalSkills.length < 3 && (
          <button className="btn-ghost w-full" onClick={() => setPicker(true)}>
            + Ajouter une figure objectif
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-white/40">Suggestion : {SKILLS.filter((s) => s.tier === Math.min(10, level * 2 + 1) && (specialty === 'mixte' || s.discipline === specialty)).slice(0, 4).map((s) => s.name).join(', ')}</p>
      <SkillPicker open={picker} onClose={() => setPicker(false)} onPick={(s) => setGoalSkills([...new Set([...goalSkills, s.id])].slice(0, 3))} />
    </div>,
    <div key="5">
      <h2 className="h-display text-4xl">Ton entraînement</h2>
      <div className="card mt-3 flex items-center justify-between">
        <span className="font-semibold">Séances / semaine</span>
        <Stepper value={days} onChange={setDays} min={2} max={6} />
      </div>
      <div className="card mt-2 flex items-center justify-between">
        <span className="font-semibold">Durée</span>
        <Stepper value={minutes} onChange={setMinutes} min={30} max={180} step={15} unit="min" />
      </div>
      <div className="card mt-2 flex items-center justify-between">
        <span className="font-semibold">Poids de corps</span>
        <Stepper value={bw} onChange={setBw} min={35} max={150} unit="kg" />
      </div>
      <label className="label mt-4">Matériel disponible</label>
      <div className="flex flex-wrap gap-2">
        {EQUIP.map((e) => (
          <button key={e} className={equipment.includes(e) ? 'chip-on' : 'chip'} onClick={() => setEquipment(equipment.includes(e) ? equipment.filter((x) => x !== e) : [...equipment, e])}>
            {e}
          </button>
        ))}
      </div>
    </div>,
  ]

  const last = step === steps.length - 1
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-5" style={{ paddingTop: 'calc(var(--safe-top) + 20px)', paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}>
      <div className="mb-6 flex gap-1.5">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-volt' : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button className="btn-ghost" onClick={() => setStep(step - 1)}>
            Retour
          </button>
        )}
        <button className="btn-primary flex-1" onClick={() => (last ? finish() : setStep(step + 1))}>
          {step === 0 ? 'Commencer' : last ? 'Générer mon programme 🚀' : 'Continuer'}
        </button>
      </div>
    </div>
  )
}
