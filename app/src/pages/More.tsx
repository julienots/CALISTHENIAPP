import { Link } from 'react-router-dom'
import { Header, Page } from '../components/ui'

const ITEMS = [
  ['/coach', '🧠', 'Coach IA', 'Discute avec ton coach'],
  ['/programs', '📋', 'Programmes', 'Générateur illimité + tableur'],
  ['/analyzer', '🎥', 'Analyseur', 'Vidéo, photo, direct'],
  ['/timers', '⏱️', 'Timers', 'Hold, compét, EMOM, Tabata'],
  ['/combos', '🔗', 'Combos', 'Conception d\'enchaînements'],
  ['/competition', '⚔️', 'Prépa compét', 'Simulation & jury'],
  ['/map', '🗺️', 'Carte compét', 'France & monde en direct'],
  ['/challenges', '🏆', 'Défis', 'Quotidiens, hebdo, épreuves'],
  ['/ranks', '💠', 'Rangs', 'Jusqu\'à GRAVITAS ZÉRO'],
  ['/history', '📓', 'Journal', 'Toutes tes séances'],
  ['/coaches', '🧑‍🏫', 'Coachs', 'Annuaire & espace coach'],
  ['/profile', '👤', 'Profil', 'Niveau, objectifs, matériel'],
  ['/settings', '⚙️', 'Réglages', 'Voix, sauvegarde, en ligne'],
]

export default function More() {
  return (
    <Page>
      <Header title="Tout GRAVITAS" />
      <div className="grid grid-cols-2 gap-2">
        {ITEMS.map(([to, i, t, d]) => (
          <Link key={to} to={to} className="card active:scale-[0.98]">
            <div className="text-2xl">{i}</div>
            <div className="mt-1 font-bold">{t}</div>
            <div className="text-[11px] text-white/50">{d}</div>
          </Link>
        ))}
      </div>
    </Page>
  )
}
