// Accueil épuré : 1) ta grille d'entraînement, 2) la séance du jour,
// 3) ton rang, 4) deux conseils du coach. Le reste est dans « Plus ».
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CoachTour } from '../components/CoachTour'
import { DailyReward } from '../components/DailyReward'
import { Icon } from '../components/Icon'
import { RankBadge } from '../components/RankBadge'
import { TrainingGrid } from '../components/TrainingGrid'
import { Bar, Page, toneColor } from '../components/ui'
import { coachInsights, nextProgramDay } from '../lib/coach'
import { computeRank, skillStatuses } from '../lib/scoring'
import { dayKey } from '../lib/stats'
import { quickRest, quickValidate } from '../lib/quick'
import { useStore } from '../lib/store'
import { toast } from '../lib/toast'

export default function Home() {
  const s = useStore()
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  const rank = useMemo(() => computeRank(statuses, s.sessions, s.bonusXp), [statuses, s.sessions, s.bonusXp])
  const np = nextProgramDay(s)
  const tips = useMemo(() => coachInsights(s).filter((i) => !i.title.startsWith('Séance du jour') && i.title !== 'Aucun programme actif' && !i.title.startsWith('Programme terminé')).slice(0, 2), [s])
  const today = dayKey(new Date())
  const doneToday = s.sessions.some((x) => dayKey(x.date) === today)
  const restToday = s.restDays.includes(today)

  const hour = new Date().getHours()
  const hello = hour < 6 ? 'Nuit blanche' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <Page>
      <div className="flex items-center justify-between pb-3" style={{ paddingTop: 'calc(var(--safe-top) + 14px)' }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55">{hello}</div>
          <div className="h-display text-4xl leading-none">{s.profile?.name}</div>
        </div>
        <Link to="/profile" className="grid h-11 w-11 place-items-center rounded-2xl text-lg font-black text-ink-950" style={{ background: `hsl(${s.profile?.avatarHue ?? 20} 90% 65%)` }}>
          {s.profile?.name?.[0]?.toUpperCase()}
        </Link>
      </div>

      {/* 1. Grille d'entraînement */}
      <div className="card-hi">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="h-display text-2xl leading-none">Ton entraînement</h2>
          <Link to="/calendar" className="flex items-center gap-1 text-xs font-bold text-volt">
            Calendrier <Icon name="play" size={10} />
          </Link>
        </div>
        <TrainingGrid weeks={15} />
        <div className="mt-3">
          {doneToday ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-volt/15 py-3 text-sm font-bold text-volt">
              <Icon name="check" size={18} strokeWidth={3} /> Séance du jour enregistrée
            </div>
          ) : restToday ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#ffcf3f1f] py-3 text-sm font-bold text-gold">
              <Icon name="moon" size={18} /> Jour de repos
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <button
                className="btn-primary !px-2 !py-3.5"
                onClick={() => {
                  const r = quickValidate()
                  toast('Séance du jour validée', { label: 'Détailler', to: `/log/${r.id}` })
                }}
              >
                <Icon name="check" size={18} strokeWidth={3} /> Séance faite
              </button>
              <Link to={`/log?date=${today}`} className="btn-ghost !px-2 !py-3.5">
                <Icon name="pencil" size={16} /> En détail
              </Link>
              <button className="btn-ghost !px-3 !py-3.5" aria-label="Jour de repos" onClick={() => (quickRest(), toast('Jour de repos noté'))}>
                <Icon name="moon" size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Séance du jour */}
      <div className="card mt-3">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Séance du jour</div>
        {np?.day ? (
          <>
            <div className="mt-1 text-lg font-extrabold">{np.day.title}</div>
            <div className="text-[12px] text-white/65">
              {np.program.name} · semaine {np.day.week} · ~{np.day.estMinutes} min
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Bar value={np.done / np.total} />
              <span className="shrink-0 text-[11px] text-white/55">
                {np.done}/{np.total}
              </span>
            </div>
            <Link to={`/workout/${np.program.id}/${np.day.key}`} className="btn-ghost mt-3 w-full">
              <Icon name="play" size={16} /> Lancer la séance guidée
            </Link>
          </>
        ) : (
          <>
            <div className="mt-1 text-[13px] text-white/70">{np ? 'Programme terminé, bravo ! Génère le cycle suivant.' : 'Aucun programme actif.'}</div>
            <Link to="/programs" className="btn-ghost mt-3 w-full">
              <Icon name="sparkle" size={16} /> Générer mon programme
            </Link>
          </>
        )}
      </div>

      {/* 3. Rang */}
      <Link to="/voies" className="card mt-3 flex items-center gap-3" style={{ borderColor: rank.rank.color + '55' }}>
        <RankBadge rank={rank.rank} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="h-display text-2xl leading-none" style={{ color: rank.rank.color }}>
              {rank.rank.name}
            </span>
            <span className="text-[11px] text-white/55">{rank.rp.toLocaleString('fr-FR')} PR</span>
          </div>
          <div className="mt-1.5">
            <Bar value={rank.progress} color={rank.next?.color ?? rank.rank.color} />
          </div>
          <div className="mt-1 text-[11px] text-white/60">{rank.next ? `Prochain : ${rank.next.name} · voir mes paliers` : 'Rang maximal atteint'}</div>
        </div>
      </Link>

      {/* 4. Coach */}
      {tips.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="h-display text-xl tracking-wider">Ton coach</h2>
            <Link to="/coach" className="text-xs font-bold text-volt">
              Lui poser une question →
            </Link>
          </div>
          <div className="space-y-2">
            {tips.map((i, k) => (
              <div key={k} className="card relative overflow-hidden !pl-5">
                <div className="absolute inset-y-0 left-0 w-1" style={{ background: toneColor[i.tone] }} />
                <div className="text-sm font-bold">{i.title}</div>
                <div className="mt-0.5 text-[13px] leading-snug text-white/70">{i.text}</div>
                {i.to && (
                  <Link to={i.to} className="mt-2 inline-block text-xs font-bold" style={{ color: toneColor[i.tone] }}>
                    {i.cta} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <DailyReward />
      <CoachTour
        id="home2"
        steps={[
          `Salut ${s.profile?.name ?? 'champion'} ! Je suis ton coach GRAVITAS.`,
          'En haut, ta grille : une case par jour. Orange = entraîné, jaune = repos, rouge = rien. Touche une case pour voir le jour.',
          'Le gros bouton + en bas lance tout : séance guidée, chrono, analyse vidéo. Le reste est rangé dans « Plus ».',
        ]}
      />
    </Page>
  )
}
