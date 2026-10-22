import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Header, Page, Section } from '../components/ui'
import { buzz, endBeep } from '../lib/feedback'
import { challengesFor, type Challenge } from '../lib/challenges'
import { useStore } from '../lib/store'

export default function Challenges() {
  const s = useStore()
  const list = useMemo(() => challengesFor(), [])
  const done = new Set(s.challenges.map((c) => c.id))
  const totalXp = s.challenges.reduce((n, c) => n + c.xp, 0)

  const complete = (c: Challenge) => {
    if (done.has(c.id)) return
    if (c.check && !c.check(useStore.getState())) return alert('Condition pas encore remplie : elle est vérifiée automatiquement à partir de tes données.')
    s.completeChallenge({ id: c.id, completedAt: new Date().toISOString(), xp: c.xp })
    endBeep()
    buzz(true)
  }

  const group = (scope: Challenge['scope'], title: string) => (
    <Section title={title}>
      <div className="space-y-2">
        {list.filter((c) => c.scope === scope).map((c) => {
          const isDone = done.has(c.id)
          const auto = !!c.check
          const ready = auto && !isDone && c.check!(s)
          return (
            <motion.div key={c.id} layout className={`card flex items-center gap-3 ${isDone ? 'opacity-50' : ready ? '!border-volt/60' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{c.title}</div>
                <div className="text-xs text-white/55">{c.text}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-white/35">{auto ? 'vérifié automatiquement' : 'sur l\'honneur'}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-black text-gold">+{c.xp}</span>
                <button className={isDone ? 'chip' : ready || !auto ? 'chip-on' : 'chip'} onClick={() => complete(c)}>
                  {isDone ? '✓ Fait' : auto ? (ready ? 'Réclamer' : 'En cours') : 'Valider'}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )

  return (
    <Page>
      <Header title="Défis" sub={`${s.challenges.length} relevés · ${totalXp.toLocaleString('fr-FR')} XP gagnés`} back />
      {group('jour', 'Aujourd\'hui')}
      {group('semaine', 'Cette semaine')}
      {group('épreuve', 'Épreuves de figures')}
      <p className="text-[11px] text-white/40">L'XP des défis compte dans tes points de rang, mais plafonnée : seules les figures validées permettent d'atteindre les rangs supérieurs.</p>
    </Page>
  )
}
