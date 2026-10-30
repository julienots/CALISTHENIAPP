import { Link } from 'react-router-dom'
import { IconTile, type IconName } from '../components/Icon'
import { Header, Page } from '../components/ui'

const ITEMS: [string, IconName, string, string, string][] = [
  ['/calendar', 'calendar', 'Calendrier', 'Tous tes jours, à l\'infini', '#ff7a1a'],
  ['/stats', 'chart', 'Statistiques', 'Volume, radar, rang', '#ffcf3f'],
  ['/coach', 'chat', 'Coach IA', 'Discute avec ton coach', '#ff3d6e'],
  ['/programs', 'clipboard', 'Programmes', 'Générateur illimité + tableur', '#ffb000'],
  ['/analyzer', 'camera', 'Analyseur', 'Vidéo, photo, direct', '#ff6b4a'],
  ['/timers', 'timer', 'Timers', 'Hold, compét, EMOM, Tabata', '#ffcf3f'],
  ['/combos', 'link', 'Combos', 'Conception d\'enchaînements', '#ff4fa0'],
  ['/competition', 'swords', 'Prépa compét', 'Simulation & jury', '#ff3b30'],
  ['/map', 'map', 'Carte compét', 'France & monde en direct', '#ff3d6e'],
  ['/challenges', 'trophy', 'Défis', 'Quotidiens, hebdo, épreuves', '#ffb000'],
  ['/ranks', 'gem', 'Rangs', 'Jusqu\'à GRAVITAS ZÉRO', '#ff7a1a'],
  ['/records', 'crown', 'Records du monde', 'Les sommets, sourcés', '#ffcf3f'],
  ['/history', 'book', 'Journal', 'Toutes tes séances', '#ff6b4a'],
  ['/coaches', 'whistle', 'Coachs', 'Annuaire & espace coach', '#ff4fa0'],
  ['/profile', 'user', 'Profil', 'Niveau, objectifs, matériel', '#ff7a1a'],
  ['/settings', 'gear', 'Réglages', 'Voix, sauvegarde, en ligne', '#c9a27e'],
]

export default function More() {
  return (
    <Page>
      <Header title="Tout GRAVITAS" />
      <div className="grid grid-cols-2 gap-2.5">
        {ITEMS.map(([to, icon, t, d, c]) => (
          <Link key={to} to={to} className="card flex flex-col gap-2" style={{ background: `linear-gradient(160deg, ${c}1f, #21150f 70%)`, borderColor: c + '38' }}>
            <IconTile name={icon} color={c} size={44} />
            <div>
              <div className="font-extrabold">{t}</div>
              <div className="text-[11px] leading-tight text-white/65">{d}</div>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  )
}
