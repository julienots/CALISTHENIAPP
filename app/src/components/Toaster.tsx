import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onToast, type ToastMsg } from '../lib/toast'
import { Icon } from './Icon'

export function Toaster() {
  const [t, setT] = useState<ToastMsg | null>(null)
  const nav = useNavigate()
  useEffect(() => onToast((m) => setT(m)), [])
  useEffect(() => {
    if (!t) return
    const h = setTimeout(() => setT(null), 4500)
    return () => clearTimeout(h)
  }, [t])
  return (
    <AnimatePresence>
      {t && (
        <motion.div key={t.id} className="fixed inset-x-0 z-[75] px-4" style={{ bottom: 'calc(var(--safe-bottom) + 96px)' }} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
          <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-volt/40 bg-[#2a170e] px-4 py-3 shadow-[0_12px_40px_-10px_#ff7a1a]">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-volt text-[#1a0b04]">
              <Icon name="check" size={18} strokeWidth={3} />
            </span>
            <span className="flex-1 text-sm font-bold">{t.text}</span>
            {t.action && (
              <button className="text-sm font-extrabold text-volt" onClick={() => (nav(t.action!.to), setT(null))}>
                {t.action.label}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
