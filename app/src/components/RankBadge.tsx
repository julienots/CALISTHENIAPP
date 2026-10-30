import { AnimatePresence, motion } from 'framer-motion'
import type { Rank } from '../data/ranks'

/** Emblème de rang animé : plus le rang est haut, plus il y a d'anneaux, de pointes et de particules. */
export function RankBadge({ rank, size = 120, still = false }: { rank: Rank; size?: number; still?: boolean }) {
  const id = rank.id
  const spikes = 6 + Math.min(id, 8) * 2
  const c = 50
  const star = Array.from({ length: spikes * 2 }, (_, i) => {
    const r = i % 2 === 0 ? 46 : 38 - Math.min(id, 10) * 0.6
    const a = (Math.PI * i) / spikes - Math.PI / 2
    return `${c + Math.cos(a) * r},${c + Math.sin(a) * r}`
  }).join(' ')
  const chevrons = id === 0 ? 0 : ((id - 1) % 3) + 1
  const spin = still ? {} : { rotate: 360 }
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${rank.glow} 0%, transparent 65%)` }}
        animate={still ? {} : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.6, repeat: Infinity }}
      />
      <svg viewBox="0 0 100 100" className="absolute inset-0">
        <defs>
          <linearGradient id={`rg${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={rank.color} />
            <stop offset="1" stopColor={rank.color} stopOpacity={0.35} />
          </linearGradient>
        </defs>
        {id >= 3 && (
          <motion.g animate={spin} transition={{ duration: 24 - id, repeat: Infinity, ease: 'linear' }} style={{ originX: '50px', originY: '50px' }}>
            <polygon points={star} fill="none" stroke={rank.color} strokeOpacity={0.5} strokeWidth={0.8} />
          </motion.g>
        )}
        {id >= 6 && (
          <motion.circle cx={50} cy={50} r={44} fill="none" stroke={rank.color} strokeWidth={1} strokeDasharray="2 6" animate={still ? {} : { rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} style={{ originX: '50px', originY: '50px' }} />
        )}
        <polygon points="50,10 84,30 84,70 50,90 16,70 16,30" fill="#180f0b" stroke={`url(#rg${id})`} strokeWidth={3} />
        <polygon points="50,18 77,34 77,66 50,82 23,66 23,34" fill={rank.color + '18'} stroke={rank.color} strokeOpacity={0.35} strokeWidth={1} />
        {/* Symbole central : triangle ascendant = défier la gravité */}
        <path d="M50 30 L66 60 H34 Z" fill="none" stroke={rank.color} strokeWidth={3} strokeLinejoin="round" />
        <path d="M41 52 H59" stroke={rank.color} strokeWidth={3} strokeLinecap="round" />
        {Array.from({ length: chevrons }).map((_, i) => (
          <path key={i} d={`M40 ${68 + i * 4} L50 ${72 + i * 4} L60 ${68 + i * 4}`} fill="none" stroke={rank.color} strokeWidth={1.6} strokeLinecap="round" />
        ))}
        {id >= 9 && <circle cx={50} cy={22} r={2.2} fill={rank.color} />}
        {id >= 10 && (
          <>
            <circle cx={30} cy={26} r={1.6} fill={rank.color} />
            <circle cx={70} cy={26} r={1.6} fill={rank.color} />
          </>
        )}
      </svg>
      {!still && id >= 4 &&
        Array.from({ length: Math.min(12, id + 2) }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full"
            style={{ background: rank.color, left: '50%', top: '50%', boxShadow: `0 0 6px ${rank.color}` }}
            animate={{ x: [0, Math.cos(i) * size * 0.55], y: [0, Math.sin(i * 1.7) * size * 0.55], opacity: [0, 1, 0] }}
            transition={{ duration: 2.4 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
    </div>
  )
}

export function RankUpOverlay({ rank, onClose }: { rank: Rank | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {rank && (
        <motion.div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink-950/95 p-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ scale: 0.2, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, stiffness: 120 }}>
            <RankBadge rank={rank} size={220} />
          </motion.div>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="mt-6 text-xs font-bold uppercase tracking-[0.4em] text-white/65">Nouveau rang</div>
            <div className="h-display mt-2 text-6xl" style={{ color: rank.color, textShadow: `0 0 30px ${rank.glow}` }}>
              {rank.name}
            </div>
            <div className="mt-2 text-white/70">{rank.title}</div>
            <div className="mt-8 text-xs text-white/55">Touchez pour continuer</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
