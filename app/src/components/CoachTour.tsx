// Tutoriel guidé : le coach (notre athlète illustré) explique l'écran en
// quelques bulles. Chaque tutoriel ne s'affiche qu'une fois.
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '../lib/store'
import { COACH_POSE, FigureArt } from './FigureArt'

export function CoachTour({ id, steps }: { id: string; steps: string[] }) {
  const seen = useStore((s) => s.toursSeen.includes(id))
  const skin = useStore((s) => s.skin)
  const markTour = useStore((s) => s.markTour)
  const [i, setI] = useState(0)
  const close = () => markTour(id)
  return (
    <AnimatePresence>
      {!seen && (
        <motion.div className="fixed inset-0 z-[70] flex items-end bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="mx-auto flex w-full max-w-xl items-end gap-1 px-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 100px)' }}>
            <motion.div className="w-[118px] shrink-0" initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', damping: 16 }}>
              <FigureArt pose={COACH_POSE} size={118} skin={skin} cues={false} backdrop={false} />
            </motion.div>
            <motion.div
              key={i}
              className="relative mb-10 flex-1 rounded-2xl border-2 border-volt bg-[#fff7ef] p-3.5 text-[#1a0b04] shadow-[0_10px_40px_-10px_#ff7a1a]"
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            >
              <span className="absolute -left-2 bottom-6 h-4 w-4 rotate-45 border-b-2 border-l-2 border-volt bg-[#fff7ef]" />
              <p className="text-[14px] font-semibold leading-snug">{steps[i]}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex gap-1">
                  {steps.map((_, k) => (
                    <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-4 bg-volt' : 'w-1.5 bg-[#1a0b04]/25'}`} />
                  ))}
                </div>
                <button className="ml-auto text-[12px] font-bold text-[#1a0b04]/55 underline" onClick={close}>
                  Passer
                </button>
                <button className="btn-primary !rounded-xl !px-4 !py-2 text-[13px]" onClick={() => (i < steps.length - 1 ? setI(i + 1) : close())}>
                  {i < steps.length - 1 ? 'Suivant' : 'Compris !'}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
