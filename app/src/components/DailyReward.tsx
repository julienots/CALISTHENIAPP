// Récompense quotidienne : série J1 → J7, de l'XP qui grimpe chaque jour d'affilée.
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { buzz, endBeep } from '../lib/feedback'
import { DAY, dayKey } from '../lib/stats'
import { useStore } from '../lib/store'
import { Icon } from './Icon'

export const DAILY_XP = [15, 20, 25, 30, 40, 50, 80]

export function dailyState(claims: string[]) {
  const today = dayKey(new Date())
  const set = new Set(claims)
  let streak = 0
  for (let i = 1; i < 400; i++) {
    if (set.has(dayKey(new Date(Date.now() - i * DAY)))) streak++
    else break
  }
  const claimedToday = set.has(today)
  const dayIndex = (claimedToday ? streak : streak) % 7 // 0 → J1
  return { today, claimedToday, streak, dayIndex, xp: DAILY_XP[dayIndex] }
}

export function DailyReward() {
  const claims = useStore((s) => s.dailyClaims)
  const claimDaily = useStore((s) => s.claimDaily)
  const tourDone = useStore((s) => s.toursSeen.includes('home'))
  const [closed, setClosed] = useState(false)
  const st = dailyState(claims)
  const open = tourDone && !st.claimedToday && !closed

  const claim = () => {
    claimDaily(st.today, st.xp)
    endBeep()
    buzz(true)
    setTimeout(() => setClosed(true), 900)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[65] grid place-items-center bg-black/65 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-sm rounded-3xl border border-volt/40 bg-gradient-to-b from-[#3a1f12] to-ink-900 p-5 text-center shadow-[0_20px_60px_-15px_#ff7a1a]" initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 16 }}>
            <motion.div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#ffa13d] to-[#ff3d6e] text-[#1a0b04]" animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}>
              <Icon name="flame" size={34} strokeWidth={2.4} />
            </motion.div>
            <div className="h-display text-3xl">Récompense du jour</div>
            <p className="mt-1 text-sm text-white/70">Reviens chaque jour : ta série fait grimper la récompense.</p>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {DAILY_XP.map((xp, k) => {
                const past = k < st.dayIndex
                const now = k === st.dayIndex
                return (
                  <div key={k} className={`rounded-lg py-1.5 text-center ${now ? 'bg-gradient-to-b from-[#ffa13d] to-[#ff3d6e] text-[#1a0b04] shadow-[0_0_18px_-4px_#ff7a1a]' : past ? 'bg-volt/20 text-volt' : 'bg-white/[0.06] text-white/55'}`}>
                    <div className="text-[13px] font-black">{past ? <Icon name="check" size={14} /> : xp}</div>
                    <div className="text-[9px] font-bold">J{k + 1}</div>
                  </div>
                )
              })}
            </div>
            <button className="btn-primary mt-5 w-full !py-4 text-base" onClick={claim}>
              Récupérer +{st.xp} XP
            </button>
            <button className="mt-2 text-xs text-white/50" onClick={() => setClosed(true)}>
              Plus tard
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
