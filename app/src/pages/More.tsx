import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Icon, IconTile, type IconName } from '../components/Icon'
import { Header, Page } from '../components/ui'

type Item = [to: string, icon: IconName, title: string, desc: string, color: string]

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "S'entraîner",
    items: [
      ['/programs', 'clipboard', 'Programmes', 'Générer et suivre', '#ff7a1a'],
      ['/timers', 'timer', 'Timers', 'Hold, compét, EMOM', '#ffcf3f'],
      ['/analyzer', 'camera', 'Analyseur', 'Note tes figures', '#ff6b4a'],
      ['/combos', 'link', 'Combos', 'Tes enchaînements', '#ff4fa0'],
      ['/competition', 'swords', 'Prépa compét', 'Simulation & jury', '#ff3b30'],
      ['/coach', 'chat', 'Coach IA', 'Pose une question', '#ff3d6e'],
    ],
  },
  {
    title: 'Progresser',
    items: [
      ['/voies', 'chart', 'Mes paliers', 'Push, Pull, Équilibre…', '#ff3b30'],
      ['/ranks', 'gem', 'Rangs', "Jusqu'au sommet", '#ff7a1a'],
      ['/stats', 'chart', 'Statistiques', 'Volume et profil', '#ffcf3f'],
      ['/challenges', 'trophy', 'Défis', 'Jour, semaine', '#ffb000'],
      ['/records', 'crown', 'Records', 'Du monde', '#ffcf3f'],
      ['/gallery', 'sparkle', 'Galerie', 'Toutes les figures', '#ff3d6e'],
    ],
  },
  {
    title: 'Sortir & partager',
    items: [
      ['/map', 'map', 'Compétitions', 'Carte France & monde', '#ff3d6e'],
      ['/coaches', 'whistle', 'Coachs', 'Programmes de coachs', '#ff4fa0'],
    ],
  },
  {
    title: 'Mon compte',
    items: [
      ['/profile', 'user', 'Profil', 'Arène, skins, succès', '#ff7a1a'],
      ['/history', 'book', 'Journal', 'Liste des séances', '#ff6b4a'],
      ['/settings', 'gear', 'Réglages', 'Voix, sauvegarde', '#c9a27e'],
    ],
  },
]

export default function More() {
  return (
    <Page>
      <Header title="Plus" sub="Tout GRAVITAS, rangé par thème" />
      {GROUPS.map((g, gi) => (
        <section key={g.title} className="mb-5">
          <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/55">{g.title}</h2>
          <div className="overflow-hidden rounded-2xl border border-[#ffb4801a] bg-ink-800/80">
            {g.items.map(([to, icon, t, d, c], i) => (
              <motion.div key={to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: gi * 0.05 + i * 0.03 }}>
                <Link to={to} className={`flex items-center gap-3 px-3 py-2.5 active:bg-white/[0.06] ${i ? 'border-t border-white/[0.05]' : ''}`}>
                  <IconTile name={icon} color={c} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold">{t}</div>
                    <div className="truncate text-[12px] text-white/60">{d}</div>
                  </div>
                  <Icon name="play" size={12} className="text-white/30" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </Page>
  )
}
