import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FigureArt } from '../components/FigureArt'
import { Header, Page, TierBadge } from '../components/ui'
import { CATEGORIES, SKILLS } from '../data/skills'

export default function Gallery() {
  const [cat, setCat] = useState<string>(CATEGORIES[1])
  return (
    <Page>
      <Header title="Galerie" sub="Toutes les figures, illustrées" back />
      <div className="no-scrollbar -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4">
        {CATEGORIES.map((c) => (
          <button key={c} className={cat === c ? 'chip-on' : 'chip'} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {SKILLS.filter((s) => s.category === cat).map((s) => (
          <Link key={s.id} to={`/skill/${s.id}`} className="card flex flex-col !p-2.5">
            <div className="grid h-32 place-items-center overflow-hidden rounded-xl" style={{ background: 'radial-gradient(ellipse at 50% 75%, #ff7a1a22, transparent 70%), #170f0b' }}>
              <FigureArt skill={s} fit detailed={false} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <TierBadge tier={s.tier} />
              <span className="text-[13px] font-bold leading-tight">{s.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  )
}
