import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { RankBadge } from '../components/RankBadge'
import { Bar, Header, Page } from '../components/ui'
import { RANKS } from '../data/ranks'
import { TIER_LABEL } from '../data/skills'
import { computeRank, skillStatuses } from '../lib/scoring'
import { useStore } from '../lib/store'

export default function Ranks() {
  const s = useStore()
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  const r = computeRank(statuses, s.sessions, s.bonusXp)
  return (
    <Page>
      <Header title="Rangs" sub="12 rangs. Le dernier est réservé aux légendes vivantes." back />
      <div className="flex flex-col items-center py-4">
        <RankBadge rank={r.rank} size={200} />
        <div className="h-display mt-3 text-5xl" style={{ color: r.rank.color, textShadow: `0 0 24px ${r.rank.glow}` }}>{r.rank.name}</div>
        <div className="text-sm text-white/60">{r.rank.title}</div>
        <div className="mt-1 text-xs text-white/60">{r.rp.toLocaleString('fr-FR')} PR · {r.validatedCount} figures validées · {r.certifiedCount} certifiées</div>
        {r.next && (
          <div className="mt-4 w-full">
            <div className="mb-1 flex justify-between text-xs"><span className="text-white/65">Vers {r.next.name}</span><span>{Math.round(r.progress * 100)} %</span></div>
            <Bar value={r.progress} color={r.next.color} h={8} />
            <ul className="mt-2 space-y-1 text-xs text-white/60">{r.missing.map((m) => <li key={m}>• {m}</li>)}</ul>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {RANKS.map((rk, i) => {
          const reached = rk.id <= r.rank.id
          return (
            <motion.div key={rk.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`card flex items-center gap-3 ${reached ? '' : 'opacity-60'}`} style={{ borderColor: rk.id === r.rank.id ? rk.color + '88' : undefined }}>
              <RankBadge rank={rk} size={64} still={!reached} />
              <div className="min-w-0 flex-1">
                <div className="h-display text-2xl leading-none" style={{ color: reached ? rk.color : '#ffffff80' }}>{rk.name}</div>
                <div className="text-[11px] text-white/65">{rk.title}</div>
                <div className="mt-1 text-[11px] text-white/60">
                  {rk.rp.toLocaleString('fr-FR')} PR
                  {rk.requires?.map((q) => ` · ${q.count}× tier ${TIER_LABEL[q.tier]}+`).join('')}
                  {rk.certified ? ` · ${rk.certified} certifiée(s)` : ''}
                </div>
              </div>
              {reached && <span className="text-volt">✓</span>}
            </motion.div>
          )
        })}
      </div>
      <div className="card mt-4 text-xs leading-relaxed text-white/70">
        <b className="text-white">Comment ça marche :</b> chaque figure validée rapporte des Points de Rang (PR) qui croissent de façon exponentielle avec la difficulté (tier F → SSS). Maîtriser une figure (2× le standard) ×1.4, la certifier via l'analyseur (note ≥ 8 et durée au standard) ×1.25. L'assiduité (séances, défis) compte mais est plafonnée à 20 % des points figures. Chaque rang exige aussi des figures d'un certain niveau : impossible de monter sans vraies performances.
      </div>
    </Page>
  )
}
