import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty, Header, Page, Section, Segmented, Sheet } from '../components/ui'
import { GOAL_LABEL } from '../lib/generator'
import { cloudEnabled, loadCloudCoaches, publishCoach } from '../lib/cloud'
import { decodeShare, encodeShare, shareText } from '../lib/share'
import { uid, useStore } from '../lib/store'
import type { CoachProfile, Program } from '../lib/types'
import { Icon } from '../components/Icon'

function CoachCard({ c, onRemove }: { c: CoachProfile; onRemove?: () => void }) {
  const s = useStore()
  const nav = useNavigate()
  const take = (p: Program) => {
    const copy = { ...p, id: uid(), createdAt: new Date().toISOString(), fromCoach: c.name }
    s.saveProgram(copy)
    nav(`/program/${copy.id}`)
  }
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-plasma/20 text-xl font-black text-plasma">{c.name[0]?.toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-bold">
            {c.name} {c.remote && <span className="rounded bg-ice/15 px-1.5 text-[10px] text-ice">en ligne</span>}
          </div>
          <div className="text-xs text-white/65">{[c.city, c.price, c.certifications].filter(Boolean).join(' · ')}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {c.specialties.map((x) => <span key={x} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">{x}</span>)}
          </div>
        </div>
        {onRemove && <button className="text-white/45" onClick={onRemove}>✕</button>}
      </div>
      {c.bio && <p className="mt-2 text-sm text-white/65">{c.bio}</p>}
      {c.contact && <a href={c.contact.startsWith('http') ? c.contact : c.contact.includes('@') ? `mailto:${c.contact}` : `tel:${c.contact}`} className="mt-2 inline-block text-xs font-bold text-volt">Contacter →</a>}
      {c.programs.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {c.programs.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{p.name}</div>
                <div className="text-[11px] text-white/60">{p.params.weeks} sem. · {p.params.daysPerWeek}×/sem · {GOAL_LABEL[p.params.goal]}</div>
              </div>
              <button className="chip-on" onClick={() => take(p)}>Suivre</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Coaches() {
  const s = useStore()
  const [tab, setTab] = useState<'annuaire' | 'espace'>('annuaire')
  const [cloud, setCloud] = useState<CoachProfile[]>([])
  const [cloudErr, setCloudErr] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [code, setCode] = useState('')
  const [me, setMe] = useState<CoachProfile>(s.myCoach ?? { id: uid(), name: s.profile?.name ?? '', bio: '', specialties: [], programs: [] })

  useEffect(() => {
    if (cloudEnabled()) loadCloudCoaches().then(setCloud).catch((e) => setCloudErr(e.message))
  }, [])

  const doImport = () => {
    try {
      const c = decodeShare<CoachProfile>(code)
      if (!c.name || !Array.isArray(c.programs)) throw new Error()
      s.importCoach(c)
      setImportOpen(false)
      setCode('')
    } catch {
      alert('Code coach invalide.')
    }
  }

  const saveMe = async (publish: boolean) => {
    s.setMyCoach(me)
    s.patchProfile({ isCoach: true })
    if (publish) {
      try {
        await publishCoach(me)
        alert('Profil publié en ligne.')
      } catch (e) {
        alert((e as Error).message)
      }
    } else alert('Profil coach enregistré.')
  }

  const directory = [...cloud, ...s.importedCoaches.filter((c) => !cloud.some((x) => x.id === c.id))]

  return (
    <Page>
      <Header title="Coachs" sub="Coachings de pros, programmes à suivre" back right={<button className="chip" onClick={() => setImportOpen(true)}>Importer</button>} />
      <Segmented value={tab} onChange={setTab} options={[{ v: 'annuaire', l: 'Annuaire' }, { v: 'espace', l: 'Espace coach' }]} />

      {tab === 'annuaire' ? (
        <div className="mt-4 space-y-2">
          {!cloudEnabled() && <p className="text-[11px] text-white/60">Mode local : importe un coach via son code. Active le backend (Réglages) pour l'annuaire en ligne partagé.</p>}
          {cloudErr && <p className="text-xs text-ember">{cloudErr}</p>}
          {!directory.length && <Empty icon="whistle" title="Aucun coach pour l'instant" text="Les coachs publient leur profil et leurs programmes depuis l'Espace coach. Reçois un code coach pour l'ajouter ici." action={<button className="btn-primary" onClick={() => setImportOpen(true)}>Importer un code coach</button>} />}
          {directory.map((c) => <CoachCard key={c.id} c={c} onRemove={c.remote ? undefined : () => s.removeCoach(c.id)} />)}
        </div>
      ) : (
        <div className="mt-4">
          <Section title="Mon profil coach">
            <div className="card space-y-2">
              <input className="input" placeholder="Nom / pseudo de coach" value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value })} />
              <textarea className="input h-24" placeholder="Bio : parcours, palmarès, approche…" value={me.bio} onChange={(e) => setMe({ ...me, bio: e.target.value })} />
              <input className="input" placeholder="Spécialités (virgules) : planche, freestyle, débutants…" value={me.specialties.join(', ')} onChange={(e) => setMe({ ...me, specialties: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Ville" value={me.city ?? ''} onChange={(e) => setMe({ ...me, city: e.target.value })} />
                <input className="input" placeholder="Tarif (ex : 50 €/mois)" value={me.price ?? ''} onChange={(e) => setMe({ ...me, price: e.target.value })} />
              </div>
              <input className="input" placeholder="Diplômes / certifications" value={me.certifications ?? ''} onChange={(e) => setMe({ ...me, certifications: e.target.value })} />
              <input className="input" placeholder="Contact (lien Instagram, e-mail, téléphone)" value={me.contact ?? ''} onChange={(e) => setMe({ ...me, contact: e.target.value })} />
            </div>
          </Section>
          <Section title="Programmes publiés">
            <div className="space-y-1.5">
              {s.programs.map((p) => {
                const on = me.programs.some((x) => x.id === p.id)
                return (
                  <button key={p.id} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${on ? 'border-volt/50 bg-volt/10' : 'border-white/5 bg-ink-800/70'}`} onClick={() => setMe({ ...me, programs: on ? me.programs.filter((x) => x.id !== p.id) : [...me.programs, { ...p, author: me.name || p.author }] })}>
                    <span className="truncate text-sm font-semibold">{p.name}</span>
                    <span className="text-xs">{on ? '✓ publié' : '+ publier'}</span>
                  </button>
                )
              })}
              {!s.programs.length && <p className="text-sm text-white/55">Crée d'abord des programmes (générateur + édition des lignes du tableur).</p>}
            </div>
          </Section>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" onClick={() => saveMe(false)}>Enregistrer</button>
            <button className="btn-ghost" onClick={() => (s.setMyCoach(me), shareText(`Coach ${me.name} sur GRAVITAS`, encodeShare(me)))}>Partager mon code</button>
            {cloudEnabled() && <button className="btn-ghost col-span-2" onClick={() => saveMe(true)}><Icon name="globe" size={18} /> Publier dans l'annuaire en ligne</button>}
          </div>
        </div>
      )}

      <Sheet open={importOpen} onClose={() => setImportOpen(false)} title="Importer un coach">
        <textarea className="input h-32 font-mono text-xs" placeholder="GRV1.…" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn-primary mt-3 w-full" onClick={doImport}>Importer</button>
      </Sheet>
    </Page>
  )
}
