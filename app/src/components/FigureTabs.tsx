import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

/** Onglets de la section Figures : le catalogue et les paliers au même endroit. */
export function FigureTabs() {
  const path = useLocation().pathname
  const tabs = [
    { to: '/skills', l: 'Toutes les figures' },
    { to: '/voies', l: 'Mes paliers' },
  ]
  return (
    <div className="mb-3 flex gap-1 rounded-2xl border border-white/10 bg-ink-900 p-1">
      {tabs.map((t) => {
        const on = path === t.to
        return (
          <Link key={t.to} to={t.to} replace className={`relative isolate flex-1 rounded-xl py-2.5 text-center text-[13px] font-extrabold ${on ? 'text-[#1a0b04]' : 'text-white/65'}`}>
            {on && <motion.span layoutId="fig-tab" className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-[#ffa13d] via-volt to-[#ff3d6e]" transition={{ type: 'spring', damping: 26, stiffness: 340 }} />}
            {t.l}
          </Link>
        )
      })}
    </div>
  )
}
