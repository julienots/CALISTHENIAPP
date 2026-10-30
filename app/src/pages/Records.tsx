import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Bar, Header, Page } from '../components/ui'
import { WORLD_RECORDS } from '../data/records'
import { SKILL_BY_ID } from '../data/skills'
import { skillStatuses } from '../lib/scoring'
import { useStore } from '../lib/store'
import { Icon } from '../components/Icon'

export default function Records() {
  const records = useStore((s) => s.records)
  const analyses = useStore((s) => s.analyses)
  const statuses = useMemo(() => skillStatuses(records, analyses), [records, analyses])
  return (
    <Page>
      <Header title="Records du monde" sub="Les sommets de la discipline, sourcés" back />
      <div className="space-y-2">
        {WORLD_RECORDS.map((r, i) => {
          const mine = r.skillId ? statuses[r.skillId]?.best ?? 0 : 0
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">{r.title}</div>
                  <div className="h-display text-5xl leading-none text-gold" style={{ textShadow: '0 0 20px #ffb00055' }}>
                    {r.value.toLocaleString('fr-FR')} <span className="text-xl text-white/65">{r.unit}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold">{r.holder} <span className="font-normal text-white/65">· {r.country} · {r.date.length > 4 ? new Date(r.date).toLocaleDateString('fr-FR') : r.date}</span></div>
                </div>
                <span className="text-gold"><Icon name="trophy" size={34} /></span>
              </div>
              {r.skillId && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] text-white/70">
                    <span>Toi ({SKILL_BY_ID[r.skillId]?.name}) : {mine}</span>
                    <span>{((mine / r.value) * 100).toFixed(1)} % du record</span>
                  </div>
                  <Bar value={mine / r.value} color="#ffb000" />
                </div>
              )}
              {r.note && <p className="mt-2 text-[11px] text-white/60">{r.note}</p>}
              <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] font-bold text-volt">Source : {r.source} →</a>
            </motion.div>
          )
        })}
      </div>
      <p className="mt-4 text-[11px] text-white/55">Les records évoluent souvent : vérifie la source avant de citer un chiffre. Les holds statiques (planche, front lever, human flag) n'ont pas de record officiel homologué trouvé à ce jour.</p>
    </Page>
  )
}
