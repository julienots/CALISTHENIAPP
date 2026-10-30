import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header, Page, Section } from '../components/ui'
import { say } from '../lib/feedback'
import { exportFile, pickFile } from '../lib/share'
import { useStore } from '../lib/store'
import { Icon } from '../components/Icon'

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button className="flex w-full items-center justify-between py-2" onClick={() => onChange(!on)}>
      <span className="text-sm font-semibold">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-volt' : 'bg-white/15'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

export default function Settings() {
  const s = useStore()
  const nav = useNavigate()
  const [key, setKey] = useState(s.settings.anthropicKey)

  const backup = () => {
    const { profile, records, sessions, analyses, programs, activeProgramId, completedDays, combos, userCompetitions, myCoach, importedCoaches, challenges, bonusXp } = useStore.getState()
    const data = { app: 'GRAVITAS', version: 1, exportedAt: new Date().toISOString(), profile, records, sessions, analyses, programs, activeProgramId, completedDays, combos, userCompetitions, myCoach, importedCoaches, challenges, bonusXp }
    exportFile(`gravitas-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data), 'application/json')
  }
  const restore = async () => {
    const f = await pickFile('application/json,.json')
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      if (data.app !== 'GRAVITAS') throw new Error()
      if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return
      delete data.app
      delete data.version
      delete data.exportedAt
      s.importAll(data)
      alert('Sauvegarde restaurée.')
    } catch {
      alert('Fichier de sauvegarde invalide.')
    }
  }
  const sessionsCsv = () => {
    const rows = [['Date', 'Séance', 'Type', 'Durée', 'RPE', 'Ressenti', 'Sommeil', 'Poids', 'Exercice', 'Série', 'Reps', 'Secondes', 'Charge', 'RPE série', 'Douleurs', 'Notes']]
    for (const x of s.sessions)
      for (const e of x.exercises)
        e.sets.forEach((st, i) => rows.push([x.date.slice(0, 16), x.title, x.type, String(x.durationMin), String(x.rpe), String(x.feeling), String(x.sleepHours ?? ''), String(x.bodyweight ?? ''), e.name, String(i + 1), String(st.reps ?? ''), String(st.seconds ?? ''), String(st.load ?? ''), String(st.rpe ?? ''), (x.pain ?? []).join(' '), x.notes ?? '']))
    exportFile('gravitas-seances.csv', rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv')
  }

  return (
    <Page>
      <Header title="Réglages" back />
      <Section title="Coach en séance">
        <div className="card">
          <Toggle label="Voix du coach" on={s.settings.voice} onChange={(v) => (s.setSettings({ voice: v }), v && say('Voix activée'))} />
          <Toggle label="Bips des timers" on={s.settings.beeps} onChange={(v) => s.setSettings({ beeps: v })} />
          <Toggle label="Vibrations" on={s.settings.haptics} onChange={(v) => s.setSettings({ haptics: v })} />
        </div>
      </Section>

      <Section title="Coach IA (en ligne)">
        <div className="card space-y-2">
          <p className="text-xs text-white/70">Ajoute ta clé API Anthropic pour discuter avec un coach Claude qui connaît toutes tes données. Sans clé, le coach fonctionne hors ligne avec son moteur d'analyse.</p>
          <input className="input font-mono text-xs" type="password" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} />
          <button className="btn-primary w-full" onClick={() => (s.setSettings({ anthropicKey: key.trim() }), alert('Clé enregistrée sur cet appareil.'))}>Enregistrer la clé</button>
          <p className="text-[11px] text-white/55">La clé reste stockée localement sur ton téléphone et n'est envoyée qu'à l'API Anthropic.</p>
        </div>
      </Section>

      <Section title="Données en ligne">
        <div className="card space-y-2">
          <div className="label">Flux des compétitions (JSON)</div>
          <input className="input text-xs" value={s.settings.feedUrl} onChange={(e) => s.setSettings({ feedUrl: e.target.value })} />
          <p className="text-[11px] text-white/55">Simple lecture d'un fichier public hébergé gratuitement sur GitHub. L'appli n'utilise aucun serveur : toutes tes données restent sur ton téléphone.</p>
        </div>
      </Section>

      <Section title="Sauvegarde & export">
        <p className="mb-2 text-[12px] text-white/65">Sauvegarde automatique active : tes données sont aussi copiées dans le stockage privé de l'appli à chaque changement. Pour changer de téléphone, utilise « Sauvegarder » et garde le fichier.</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={backup}><Icon name="save" size={18} /> Sauvegarder</button>
          <button className="btn-ghost" onClick={restore}><Icon name="folder" size={18} /> Restaurer</button>
          <button className="btn-ghost col-span-2" onClick={sessionsCsv}><Icon name="table" size={18} /> Exporter toutes les séances (CSV / tableur)</button>
        </div>
      </Section>

      <Section title="Zone sensible">
        <button className="btn-danger w-full" onClick={() => confirm('Effacer TOUTES les données ? Action irréversible.') && (s.resetAll(), nav('/onboarding', { replace: true }))}>Réinitialiser l'application</button>
      </Section>
      <p className="text-center text-[11px] text-white/45">GRAVITAS v1.2 · 100 % hors ligne · Défie la gravité</p>
    </Page>
  )
}
