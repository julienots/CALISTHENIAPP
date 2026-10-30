import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconTile, type IconName } from './Icon'
import { CATEGORIES, SKILLS, TIER_COLOR, TIER_LABEL, type Skill } from '../data/skills'

export function Header({ title, sub, back, right }: { title: string; sub?: string; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 bg-ink-950/80 px-4 pb-3 backdrop-blur-xl" style={{ paddingTop: 'calc(var(--safe-top) + 12px)' }}>
      {back && (
        <button onClick={() => nav(-1)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-lg" aria-label="Retour">
          ‹
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="h-display truncate text-3xl leading-none text-white">{title}</h1>
        {sub && <p className="mt-0.5 truncate text-xs text-white/65">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto w-full max-w-xl px-4"
      style={{ paddingBottom: 'calc(var(--safe-bottom) + 96px)' }}
    >
      {children}
    </motion.main>
  )
}

export function Section({ title, right, children, className = '' }: { title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mb-5 ${className}`}>
      <div className="mb-2 flex items-end justify-between">
        <h2 className="h-display text-xl tracking-wider text-white/90">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Stat({ label, value, sub, accent = '#ff7a1a' }: { label: string; value: ReactNode; sub?: ReactNode; accent?: string }) {
  return (
    <div className="card !p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">{label}</div>
      <div className="h-display mt-1 text-3xl leading-none" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-white/65">{sub}</div>}
    </div>
  )
}

export function TierBadge({ tier, size = 'sm' }: { tier: number; size?: 'sm' | 'lg' }) {
  const c = TIER_COLOR[tier]
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-lg font-display ${size === 'lg' ? 'h-12 min-w-12 px-2 text-2xl' : 'h-7 min-w-7 px-1.5 text-base'}`}
      style={{ color: c, background: c + '1f', border: `1px solid ${c}55`, textShadow: tier >= 8 ? `0 0 10px ${c}` : undefined }}
    >
      {TIER_LABEL[tier]}
    </span>
  )
}

export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; l: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 rounded-xl border border-white/10 bg-ink-900 p-1">
      {options.map((o) => (
        <button key={String(o.v)} onClick={() => onChange(o.v)} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition ${value === o.v ? 'bg-volt text-ink-950' : 'text-white/60'}`}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, unit }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button className="btn-ghost !h-10 !w-10 !p-0 text-lg" onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}>
        −
      </button>
      <div className="min-w-14 text-center">
        <span className="h-display text-2xl">{value}</span>
        {unit && <span className="ml-1 text-xs text-white/65">{unit}</span>}
      </div>
      <button className="btn-ghost !h-10 !w-10 !p-0 text-lg" onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}>
        +
      </button>
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-900 p-4"
            style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}
            initial={{ y: 400 }}
            animate={{ y: 0 }}
            exit={{ y: 400 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <h3 className="h-display mb-3 text-2xl">{title}</h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center py-8 text-center">
      <div className="mb-3"><IconTile name={icon} color="#ff7a1a" size={60} /></div>
      <div className="font-bold">{title}</div>
      <p className="mt-1 max-w-xs text-sm text-white/70">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SkillPicker({ open, onClose, onPick, filter, title = 'Choisir une figure' }: { open: boolean; onClose: () => void; onPick: (s: Skill) => void; filter?: (s: Skill) => boolean; title?: string }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('Toutes')
  const list = useMemo(
    () =>
      SKILLS.filter((s) => (filter ? filter(s) : true))
        .filter((s) => cat === 'Toutes' || s.category === cat)
        .filter((s) => !q || (s.name + ' ' + (s.aka ?? '')).toLowerCase().includes(q.toLowerCase())),
    [q, cat, filter],
  )
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <input className="input mb-2" placeholder="Rechercher (planche, lever, 360…)" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
        {['Toutes', ...CATEGORIES].map((c) => (
          <button key={c} className={cat === c ? 'chip-on' : 'chip'} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {list.map((s) => (
          <button key={s.id} className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-left active:bg-white/10" onClick={() => (onPick(s), onClose())}>
            <TierBadge tier={s.tier} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{s.name}</div>
              <div className="text-[11px] text-white/60">{s.category}</div>
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  )
}

export function Bar({ value, color = '#ff7a1a', h = 6 }: { value: number; color?: string; h?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-white/[0.07]" style={{ height: h }}>
      <motion.div className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}88` }} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
    </div>
  )
}

export const toneColor = { good: '#ff7a1a', warn: '#ffb000', info: '#ffcf3f', alert: '#ff3b30' } as const
