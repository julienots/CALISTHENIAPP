import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header, Page, Section, SkillPicker, Stepper } from '../components/ui'
import { EXERCISES } from '../data/exercises'
import { SKILL_BY_ID } from '../data/skills'
import { uid, useStore } from '../lib/store'
import type { ExerciseLog, SessionLog } from '../lib/types'

const PAINS = ['Poignets', 'Coudes', 'Épaules', 'Bas du dos', 'Genoux', 'Doigts']
const TYPES: SessionLog['type'][] = ['skills', 'force', 'agilite', 'competition', 'mobilite', 'libre']

const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function LogSession() {
  const { id } = useParams()
  const s = useStore()
  const nav = useNavigate()
  const existing = s.sessions.find((x) => x.id === id)
  const [sess, setSess] = useState<SessionLog>(
    existing ?? { id: uid(), date: new Date().toISOString(), title: 'Séance', durationMin: 60, type: 'skills', exercises: [], rpe: 7, feeling: 4, energy: 3, sleepHours: 7.5, bodyweight: s.profile?.bodyweight, pain: [], notes: '', location: '' },
  )
  const [picker, setPicker] = useState(false)
  const [exQ, setExQ] = useState('')
  const set = <K extends keyof SessionLog>(k: K, v: SessionLog[K]) => setSess({ ...sess, [k]: v })
  const setEx = (i: number, ex: ExerciseLog) => set('exercises', sess.exercises.map((e, j) => (j === i ? ex : e)))
  const isHold = (ex: ExerciseLog) => (ex.skillId ? SKILL_BY_ID[ex.skillId]?.kind === 'hold' : EXERCISES.find((e) => e.id === ex.exerciseId)?.kind === 'hold')

  const save = () => {
    s.saveSession(sess)
    if (sess.bodyweight) s.patchProfile({ bodyweight: sess.bodyweight })
    nav('/history', { replace: true })
  }

  return (
    <Page>
      <Header title={existing ? 'Modifier la séance' : 'Noter une séance'} sub="Tout ce que tu as fait, dans le détail" back />
      <div className="card space-y-3">
        <div>
          <div className="label">Titre</div>
          <input className="input" value={sess.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="label">Date & heure</div>
            <input type="datetime-local" className="input" value={toLocalInput(sess.date)} onChange={(e) => set('date', new Date(e.target.value).toISOString())} />
          </div>
          <div>
            <div className="label">Lieu</div>
            <input className="input" placeholder="Parc, salle…" value={sess.location ?? ''} onChange={(e) => set('location', e.target.value)} />
          </div>
        </div>
        <div>
          <div className="label">Type</div>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button key={t} className={sess.type === t ? 'chip-on' : 'chip'} onClick={() => set('type', t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between"><span className="text-sm font-semibold">Durée</span><Stepper value={sess.durationMin} onChange={(v) => set('durationMin', v)} min={5} max={300} step={5} unit="min" /></div>
      </div>

      <Section title="Exercices & séries" className="mt-5">
        <div className="space-y-3">
          {sess.exercises.map((ex, i) => (
            <div key={i} className="card">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-bold">{ex.name}</div>
                <button className="text-xs text-white/40" onClick={() => set('exercises', sess.exercises.filter((_, j) => j !== i))}>Retirer</button>
              </div>
              <div className="space-y-1.5">
                {ex.sets.map((st, k) => (
                  <div key={k} className="grid grid-cols-[24px_1fr_1fr_1fr_20px] items-center gap-1.5 text-sm">
                    <span className="text-xs text-white/40">{k + 1}</span>
                    <input className="input !py-1.5" type="number" inputMode="decimal" placeholder={isHold(ex) ? 'sec' : 'reps'} value={(isHold(ex) ? st.seconds : st.reps) ?? ''} onChange={(e) => setEx(i, { ...ex, sets: ex.sets.map((x, j) => (j === k ? { ...x, [isHold(ex) ? 'seconds' : 'reps']: Number(e.target.value) } : x)) })} />
                    <input className="input !py-1.5" type="number" inputMode="decimal" placeholder="kg ±" value={st.load ?? ''} onChange={(e) => setEx(i, { ...ex, sets: ex.sets.map((x, j) => (j === k ? { ...x, load: e.target.value === '' ? undefined : Number(e.target.value) } : x)) })} />
                    <input className="input !py-1.5" type="number" placeholder="RPE" value={st.rpe ?? ''} onChange={(e) => setEx(i, { ...ex, sets: ex.sets.map((x, j) => (j === k ? { ...x, rpe: Number(e.target.value) } : x)) })} />
                    <button className="text-white/30" onClick={() => setEx(i, { ...ex, sets: ex.sets.filter((_, j) => j !== k) })}>✕</button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button className="chip" onClick={() => setEx(i, { ...ex, sets: [...ex.sets, { ...(ex.sets.at(-1) ?? {}), done: true }] })}>+ série</button>
                <input className="input !py-1 text-xs" placeholder="Note (prise, assistance, ressenti…)" value={ex.notes ?? ''} onChange={(e) => setEx(i, { ...ex, notes: e.target.value })} />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" onClick={() => setPicker(true)}>+ Figure</button>
            <details className="btn-ghost relative !block !p-0">
              <summary className="list-none px-4 py-3 text-center">+ Exercice</summary>
              <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-ink-900 p-2 text-left">
                <input className="input mb-2 !py-1.5 text-xs" placeholder="Filtrer…" value={exQ} onChange={(e) => setExQ(e.target.value)} />
                {EXERCISES.filter((e) => e.name.toLowerCase().includes(exQ.toLowerCase())).map((e) => (
                  <button key={e.id} className="block w-full rounded-lg px-2 py-2 text-left text-xs font-normal hover:bg-white/5" onClick={(ev) => {
                    set('exercises', [...sess.exercises, { name: e.name, exerciseId: e.id, sets: [{ done: true }] }])
                    ;(ev.currentTarget.closest('details') as HTMLDetailsElement).open = false
                  }}>
                    {e.name}
                  </button>
                ))}
                <button className="block w-full rounded-lg px-2 py-2 text-left text-xs text-volt" onClick={(ev) => {
                  const n = prompt('Nom de l\'exercice')
                  if (n) set('exercises', [...sess.exercises, { name: n, sets: [{ done: true }] }])
                  ;(ev.currentTarget.closest('details') as HTMLDetailsElement).open = false
                }}>+ Exercice personnalisé</button>
              </div>
            </details>
          </div>
        </div>
      </Section>

      <Section title="Récupération & ressenti">
        <div className="card space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Effort global (RPE)</span><Stepper value={sess.rpe} onChange={(v) => set('rpe', v)} min={1} max={10} /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Ressenti /5</span><Stepper value={sess.feeling} onChange={(v) => set('feeling', v)} min={1} max={5} /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Énergie /5</span><Stepper value={sess.energy ?? 3} onChange={(v) => set('energy', v)} min={1} max={5} /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Sommeil la veille</span><Stepper value={sess.sleepHours ?? 7} onChange={(v) => set('sleepHours', v)} min={0} max={14} step={0.5} unit="h" /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Poids de corps</span><Stepper value={sess.bodyweight ?? 70} onChange={(v) => set('bodyweight', v)} min={30} max={180} step={0.5} unit="kg" /></div>
          <div>
            <div className="label">Douleurs / gênes</div>
            <div className="flex flex-wrap gap-1.5">
              {PAINS.map((p) => (
                <button key={p} className={sess.pain?.includes(p) ? 'chip-on !border-ember/60 !bg-ember/15 !text-ember' : 'chip'} onClick={() => set('pain', sess.pain?.includes(p) ? sess.pain.filter((x) => x !== p) : [...(sess.pain ?? []), p])}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <textarea className="input h-24" placeholder="Notes : sensations, technique, météo, ce qui a marché…" value={sess.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </Section>

      <button className="btn-primary w-full !py-4" onClick={save}>Enregistrer</button>
      {existing && <button className="btn-danger mt-2 w-full" onClick={() => confirm('Supprimer cette séance ?') && (s.deleteSession(existing.id), nav('/history', { replace: true }))}>Supprimer</button>}

      <SkillPicker open={picker} onClose={() => setPicker(false)} onPick={(sk) => set('exercises', [...sess.exercises, { name: sk.name, skillId: sk.id, sets: [{ done: true }] }])} />
    </Page>
  )
}
