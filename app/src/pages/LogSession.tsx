// Noter une séance : l'essentiel en haut, un grand chiffre par série,
// le reste replié en « optionnel ». Bouton Enregistrer toujours visible.
import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { Header, Page, Sheet, SkillPicker } from '../components/ui'
import { EXERCISES } from '../data/exercises'
import { SKILL_BY_ID } from '../data/skills'
import { buzz, endBeep } from '../lib/feedback'
import { sessionXp } from '../lib/scoring'
import { uid, useStore } from '../lib/store'
import type { Band, ExerciseLog, SessionLog, SetLog, Variant } from '../lib/types'

const PAINS = ['Poignets', 'Coudes', 'Épaules', 'Bas du dos', 'Genoux', 'Doigts']
const TYPES: { v: SessionLog['type']; l: string; i: IconName }[] = [
  { v: 'skills', l: 'Figures', i: 'star' },
  { v: 'force', l: 'Force', i: 'bolt' },
  { v: 'agilite', l: 'Agilité', i: 'spiral' },
  { v: 'competition', l: 'Compét', i: 'swords' },
  { v: 'mobilite', l: 'Mobilité', i: 'sparkle' },
  { v: 'libre', l: 'Libre', i: 'target' },
]
const FATIGUE = ['', 'Frais', 'Normal', 'Fatigué', 'Épuisé']
const BANDS: (Band | undefined)[] = [undefined, 'léger', 'moyen', 'fort']
const EFFORT = ['', 'Très facile', 'Facile', 'Facile', 'Modéré', 'Modéré', 'Soutenu', 'Dur', 'Très dur', 'Extrême', 'Maximum']

const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function Fold({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card !p-0">
      <button className="flex w-full items-center gap-2 px-4 py-3.5 text-left" onClick={() => setOpen(!open)}>
        <Icon name={icon} size={18} className="text-volt" />
        <span className="flex-1 text-sm font-bold">{title}</span>
        <span className="text-[11px] text-white/50">optionnel</span>
        <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-white/60">›</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Num({ value, onChange, step = 1, unit }: { value: number; onChange: (v: number) => void; step?: number; unit: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.button whileTap={{ scale: 0.85 }} className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-xl font-bold" onClick={() => onChange(Math.max(0, +(value - step).toFixed(1)))}>
        −
      </motion.button>
      <div className="w-20 text-center">
        <input inputMode="decimal" className="h-display w-full bg-transparent text-center text-3xl leading-none outline-none" value={value || ''} placeholder="0" onChange={(e) => onChange(Number(e.target.value.replace(',', '.')) || 0)} />
        <div className="text-[10px] font-bold uppercase text-white/50">{unit}</div>
      </div>
      <motion.button whileTap={{ scale: 0.85 }} className="grid h-10 w-10 place-items-center rounded-xl bg-volt/20 text-xl font-bold text-volt" onClick={() => onChange(+(value + step).toFixed(1))}>
        +
      </motion.button>
    </div>
  )
}

export default function LogSession() {
  const { id } = useParams()
  const s = useStore()
  const nav = useNavigate()
  const existing = s.sessions.find((x) => x.id === id)
  const [params] = useSearchParams()
  const forDay = params.get('date') // YYYY-MM-DD depuis le calendrier
  const [sess, setSess] = useState<SessionLog>(
    existing ?? { id: uid(), date: forDay ? new Date(`${forDay}T18:00:00`).toISOString() : new Date().toISOString(), title: 'Séance', durationMin: 60, type: 'skills', exercises: [], rpe: 7, feeling: 4, energy: 3, sleepHours: 7.5, bodyweight: s.profile?.bodyweight, pain: [], notes: '', location: '' },
  )
  const [picker, setPicker] = useState(false)
  const [exSheet, setExSheet] = useState(false)
  const [comboSheet, setComboSheet] = useState(false)
  const [comboName, setComboName] = useState('')
  const [exQ, setExQ] = useState('')
  const [details, setDetails] = useState<string | null>(null)
  const [burst, setBurst] = useState<number | null>(null)
  const set = <K extends keyof SessionLog>(k: K, v: SessionLog[K]) => setSess((cur) => ({ ...cur, [k]: v }))
  const setEx = (i: number, ex: ExerciseLog) => setSess((cur) => ({ ...cur, exercises: cur.exercises.map((e, j) => (j === i ? ex : e)) }))
  const isHold = (ex: ExerciseLog) => (ex.skillId ? SKILL_BY_ID[ex.skillId]?.kind === 'hold' : EXERCISES.find((e) => e.id === ex.exerciseId)?.kind === 'hold')
  const setSet = (i: number, k: number, patch: Partial<SetLog>) => {
    const ex = sess.exercises[i]
    setEx(i, { ...ex, sets: ex.sets.map((x, j) => (j === k ? { ...x, ...patch } : x)) })
  }
  const addExercise = (ex: ExerciseLog) => setSess((cur) => ({ ...cur, exercises: [...cur.exercises, ex] }))

  const xp = sessionXp(sess)
  const save = () => {
    s.saveSession(sess)
    if (sess.bodyweight) s.patchProfile({ bodyweight: sess.bodyweight })
    endBeep()
    buzz(true)
    setBurst(xp)
    setTimeout(() => nav('/calendar', { replace: true }), 1100)
  }

  const when = new Date(sess.date)

  return (
    <Page>
      <Header title={existing ? 'Modifier la séance' : 'Noter une séance'} back />

      {/* L'essentiel */}
      <div className="card space-y-4">
        <label className="relative flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-2.5">
          <Icon name="calendar" size={22} className="text-volt" />
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Quand</div>
            <div className="font-bold capitalize">
              {when.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <span className="text-xs font-bold text-volt">Changer</span>
          <input type="datetime-local" className="absolute inset-0 opacity-0" value={toLocalInput(sess.date)} onChange={(e) => e.target.value && set('date', new Date(e.target.value).toISOString())} />
        </label>

        <div>
          <div className="label">Type de séance</div>
          <div className="grid grid-cols-3 gap-1.5">
            {TYPES.map((t) => {
              const on = sess.type === t.v
              return (
                <motion.button key={t.v} whileTap={{ scale: 0.94 }} onClick={() => set('type', t.v)} className={`flex flex-col items-center gap-1 rounded-2xl border py-2.5 text-[12px] font-bold transition ${on ? 'border-volt bg-volt/20 text-[#ffb27a] shadow-[0_0_18px_-6px_#ff7a1a]' : 'border-white/10 bg-white/[0.03] text-white/75'}`}>
                  <Icon name={t.i} size={20} />
                  {t.l}
                </motion.button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-end justify-between">
            <div className="label !mb-0">Durée</div>
            <div className="h-display text-3xl leading-none">
              {sess.durationMin} <span className="font-sans text-xs text-white/55">min</span>
            </div>
          </div>
          <input type="range" min={5} max={240} step={5} value={sess.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))} className="w-full" />
          <div className="mt-1 flex gap-1.5">
            {[45, 60, 90, 120].map((m) => (
              <button key={m} className={sess.durationMin === m ? 'chip-on' : 'chip'} onClick={() => set('durationMin', m)}>
                {m} min
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-end justify-between">
            <div className="label !mb-0">Effort ressenti</div>
            <div className="text-sm font-bold text-volt">
              {sess.rpe}/10 · {EFFORT[sess.rpe]}
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, k) => k + 1).map((v) => (
              <motion.button
                key={v}
                whileTap={{ scale: 0.85 }}
                onClick={() => set('rpe', v)}
                className="h-9 flex-1 rounded-lg text-[11px] font-black transition"
                style={{ background: v <= sess.rpe ? `hsl(${40 - v * 4} 100% ${62 - v * 2}%)` : '#ffffff10', color: v <= sess.rpe ? '#1a0b04' : '#ffffff80' }}
              >
                {v}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Fatigue, en une ligne */}
      <div className="card mt-3 !p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/60">
          <Icon name="moon" size={13} /> Fatigue avant la séance
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((v) => {
            const on = sess.fatigue === v
            const c = ['', '#ffcf3f', '#ff7a1a', '#ff3d6e', '#ff3b30'][v]
            return (
              <motion.button key={v} whileTap={{ scale: 0.92 }} onClick={() => set('fatigue', on ? undefined : v)} className="rounded-xl border py-2 text-[12px] font-bold transition" style={{ borderColor: on ? c : '#ffffff1a', background: on ? c + '2e' : '#ffffff08', color: on ? c : '#ffffffb3' }}>
                {FATIGUE[v]}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Exercices */}
      <div className="mb-2 mt-5 flex items-end justify-between">
        <h2 className="h-display text-xl tracking-wider">Ce que tu as fait</h2>
        <span className="text-[11px] text-white/55">{sess.exercises.length} exercice(s)</span>
      </div>
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {sess.exercises.map((ex, i) => {
            const hold = isHold(ex)
            const unit = hold ? 'secondes' : 'reps'
            return (
              <motion.div key={ex.name + i} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -40 }} className="card">
                <div className="mb-2 flex items-center gap-2">
                  <Icon name={ex.skillId ? 'star' : 'bolt'} size={18} className="text-volt" />
                  <div className="flex-1 font-extrabold">{ex.name}</div>
                  <button className="grid h-8 w-8 place-items-center rounded-lg text-white/50" aria-label="Retirer" onClick={() => setSess((cur) => ({ ...cur, exercises: cur.exercises.filter((_, j) => j !== i) }))}>
                    <Icon name="cross" size={16} />
                  </button>
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <button
                    className={ex.band ? 'chip-on' : 'chip'}
                    onClick={() => setEx(i, { ...ex, band: BANDS[(BANDS.indexOf(ex.band) + 1) % BANDS.length] })}
                  >
                    Élastique{ex.band ? ` · ${ex.band}` : ''}
                  </button>
                  {(['négatives', 'partielle'] as Variant[]).map((v) => {
                    const on = ex.variants?.includes(v)
                    return (
                      <button key={v} className={on ? 'chip-on' : 'chip'} onClick={() => setEx(i, { ...ex, variants: on ? ex.variants!.filter((x) => x !== v) : [...(ex.variants ?? []), v] })}>
                        {v === 'négatives' ? 'Négatives' : 'Amplitude partielle'}
                      </button>
                    )
                  })}
                </div>
                {ex.skillId && (ex.band || ex.variants?.length) ? (
                  <p className="mb-2 text-[11px] text-white/50">Assisté : compté dans ta séance, pas comme record de la figure.</p>
                ) : null}
                <div className="space-y-2">
                  {ex.sets.map((st, k) => {
                    const key = `${i}-${k}`
                    return (
                      <div key={k} className="rounded-2xl bg-white/[0.035] p-2">
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[11px] font-black uppercase text-white/55">Série {k + 1}</span>
                          <div className="flex flex-1 justify-center">
                            <Num value={(hold ? st.seconds : st.reps) ?? 0} unit={unit} step={hold ? 1 : 1} onChange={(v) => setSet(i, k, hold ? { seconds: v } : { reps: v })} />
                          </div>
                          <button className={`grid h-8 w-8 place-items-center rounded-lg ${details === key ? 'bg-volt/20 text-volt' : 'text-white/45'}`} aria-label="Détails" onClick={() => setDetails(details === key ? null : key)}>
                            <Icon name="gear" size={16} />
                          </button>
                        </div>
                        <AnimatePresence>
                          {details === key && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <label className="text-[10px] font-bold uppercase text-white/50">
                                  Lest (+) ou aide (−) en kg
                                  <input className="input mt-1 !py-2" inputMode="decimal" placeholder="0" value={st.load ?? ''} onChange={(e) => setSet(i, k, { load: e.target.value === '' ? undefined : Number(e.target.value.replace(',', '.')) })} />
                                </label>
                                <label className="text-[10px] font-bold uppercase text-white/50">
                                  Effort de la série /10
                                  <input className="input mt-1 !py-2" inputMode="numeric" placeholder="8" value={st.rpe ?? ''} onChange={(e) => setSet(i, k, { rpe: Number(e.target.value) || undefined })} />
                                </label>
                              </div>
                              {ex.sets.length > 1 && (
                                <button className="mt-2 text-[11px] font-bold text-ember" onClick={() => setEx(i, { ...ex, sets: ex.sets.filter((_, j) => j !== k) })}>
                                  Supprimer cette série
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-volt/35 py-2.5 text-[13px] font-bold text-volt" onClick={() => setEx(i, { ...ex, sets: [...ex.sets, { ...(ex.sets.at(-1) ?? {}), done: true }] })}>
                  <Icon name="plus" size={16} strokeWidth={2.8} /> Ajouter une série
                </motion.button>
                <input className="input mt-2 !py-2 text-xs" placeholder="Note sur l'exercice (facultatif)" value={ex.notes ?? ''} onChange={(e) => setEx(i, { ...ex, notes: e.target.value })} />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {(sess.combos ?? []).map((cb, ci) => (
          <motion.div key={ci} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card !p-3">
            <div className="flex items-center gap-2">
              <Icon name="link" size={18} className="text-[#ff4fa0]" />
              <div className="min-w-0 flex-1 text-sm font-extrabold">{cb.name}</div>
              <button className="grid h-8 w-8 place-items-center text-white/50" aria-label="Retirer" onClick={() => set('combos', (sess.combos ?? []).filter((_, j) => j !== ci))}>
                <Icon name="cross" size={15} />
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-white/55">Passages réussis</span>
              <Num value={cb.clean} unit="propres" onChange={(v) => set('combos', (sess.combos ?? []).map((x, j) => (j === ci ? { ...x, clean: v } : x)))} />
            </div>
          </motion.div>
        ))}

        <div className="grid grid-cols-3 gap-2">
          <button className="btn-primary !px-2 !py-4" onClick={() => setPicker(true)}>
            <Icon name="star" size={18} /> Figure
          </button>
          <button className="btn-ghost !px-2 !py-4" onClick={() => setExSheet(true)}>
            <Icon name="bolt" size={18} /> Exercice
          </button>
          <button className="btn-ghost !px-2 !py-4" onClick={() => setComboSheet(true)}>
            <Icon name="link" size={18} /> Combo
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <Fold title="Ressenti & récupération" icon="flame">
          <div>
            <div className="label">Forme du jour</div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} className={`flex-1 rounded-xl py-2 text-sm font-black ${sess.feeling >= v ? 'bg-volt/25 text-volt' : 'bg-white/[0.05] text-white/45'}`} onClick={() => set('feeling', v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Sommeil la veille</span>
            <Num value={sess.sleepHours ?? 7} onChange={(v) => set('sleepHours', v)} step={0.5} unit="heures" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Poids de corps</span>
            <Num value={sess.bodyweight ?? 70} onChange={(v) => set('bodyweight', v)} step={0.5} unit="kg" />
          </div>
          <div>
            <div className="label">Une gêne ?</div>
            <div className="flex flex-wrap gap-1.5">
              {PAINS.map((p) => (
                <button key={p} className={sess.pain?.includes(p) ? 'chip-on !border-ember/60 !bg-ember/15 !text-ember' : 'chip'} onClick={() => set('pain', sess.pain?.includes(p) ? sess.pain.filter((x) => x !== p) : [...(sess.pain ?? []), p])}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Fold>
        <Fold title="Nom, lieu et notes" icon="pencil">
          <input className="input" placeholder="Nom de la séance" value={sess.title} onChange={(e) => set('title', e.target.value)} />
          <input className="input" placeholder="Lieu (parc, salle…)" value={sess.location ?? ''} onChange={(e) => set('location', e.target.value)} />
          <textarea className="input h-24" placeholder="Sensations, technique, météo…" value={sess.notes} onChange={(e) => set('notes', e.target.value)} />
        </Fold>
        {existing && (
          <button className="btn-danger w-full" onClick={() => confirm('Supprimer cette séance ?') && (s.deleteSession(existing.id), nav('/calendar', { replace: true }))}>
            Supprimer la séance
          </button>
        )}
      </div>

      {/* Barre d'enregistrement toujours visible */}
      <div className="fixed inset-x-0 z-30 px-4" style={{ bottom: 'calc(var(--safe-bottom) + 84px)' }}>
        <div className="mx-auto max-w-xl">
          <motion.button whileTap={{ scale: 0.97 }} className="btn-primary w-full !py-4 text-base" onClick={save} disabled={!!burst}>
            <Icon name="check" size={20} strokeWidth={3} /> Enregistrer · +{xp} XP
          </motion.button>
        </div>
      </div>
      <div className="h-24" />

      <AnimatePresence>
        {burst !== null && (
          <motion.div className="pointer-events-none fixed inset-0 z-[80] grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="text-center" initial={{ scale: 0.3, y: 40 }} animate={{ scale: [0.3, 1.25, 1], y: [40, -10, -30] }} transition={{ duration: 0.9 }}>
              <div className="h-display bg-gradient-to-b from-[#ffe7a3] to-volt bg-clip-text text-8xl text-transparent drop-shadow-[0_0_30px_#ff7a1a]">+{burst} XP</div>
              <div className="text-sm font-bold text-white/80">Séance enregistrée</div>
            </motion.div>
            {Array.from({ length: 14 }).map((_, k) => (
              <motion.span key={k} className="absolute h-2 w-2 rounded-full" style={{ background: k % 2 ? '#ffcf3f' : '#ff7a1a' }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos((k / 14) * Math.PI * 2) * 160, y: Math.sin((k / 14) * Math.PI * 2) * 160, opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <SkillPicker open={picker} onClose={() => setPicker(false)} onPick={(sk) => addExercise({ name: sk.name, skillId: sk.id, sets: [{ done: true }] })} />
      <Sheet open={comboSheet} onClose={() => setComboSheet(false)} title="Ajouter un combo">
        <div className="space-y-1.5">
          {s.combos.map((c) => (
            <button key={c.id} className="flex w-full items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-3 text-left text-sm" onClick={() => (set('combos', [...(sess.combos ?? []), { comboId: c.id, name: c.name, clean: 1 }]), setComboSheet(false))}>
              <Icon name="link" size={16} className="text-[#ff4fa0]" />
              <span className="flex-1 font-semibold">{c.name}</span>
              <span className="text-[11px] text-white/50">{c.steps.length} figures</span>
            </button>
          ))}
          {!s.combos.length && <p className="text-xs text-white/55">Aucun combo enregistré : écris son nom ci-dessous, ou crée-le dans « Plus › Combos ».</p>}
          <div className="flex gap-2 pt-1">
            <input className="input" placeholder="Combo libre (ex : HS → planche → press)" value={comboName} onChange={(e) => setComboName(e.target.value)} />
            <button className="btn-primary shrink-0" disabled={!comboName.trim()} onClick={() => (set('combos', [...(sess.combos ?? []), { name: comboName.trim(), clean: 1 }]), setComboName(''), setComboSheet(false))}>
              Ajouter
            </button>
          </div>
        </div>
      </Sheet>
      <Sheet open={exSheet} onClose={() => setExSheet(false)} title="Ajouter un exercice">
        <input className="input mb-2" placeholder="Rechercher (tractions, dips, squats…)" value={exQ} onChange={(e) => setExQ(e.target.value)} />
        <div className="space-y-1">
          {EXERCISES.filter((e) => e.name.toLowerCase().includes(exQ.toLowerCase())).map((e) => (
            <button key={e.id} className="flex w-full items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-3 text-left text-sm" onClick={() => (addExercise({ name: e.name, exerciseId: e.id, sets: [{ done: true }] }), setExSheet(false), setExQ(''))}>
              <Icon name="bolt" size={16} className="text-volt" />
              {e.name}
            </button>
          ))}
          {exQ && (
            <button className="w-full rounded-xl border border-dashed border-volt/40 px-3 py-3 text-left text-sm font-bold text-volt" onClick={() => (addExercise({ name: exQ, sets: [{ done: true }] }), setExSheet(false), setExQ(''))}>
              + Créer « {exQ} »
            </button>
          )}
        </div>
      </Sheet>
    </Page>
  )
}
