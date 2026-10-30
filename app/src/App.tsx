import { App as CapApp } from '@capacitor/app'
import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Icon, IconTile, type IconName } from './components/Icon'
import { RankUpOverlay } from './components/RankBadge'
import { RANKS } from './data/ranks'
import { computeRank, skillStatuses } from './lib/scoring'
import { readAutoBackup, restore, scheduleAutoBackup } from './lib/backup'
import { sectionOf } from './lib/sections'
import { useStore } from './lib/store'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'

const Skills = lazy(() => import('./pages/Skills'))
const SkillDetail = lazy(() => import('./pages/SkillDetail'))
const Programs = lazy(() => import('./pages/Programs'))
const ProgramView = lazy(() => import('./pages/ProgramView'))
const Workout = lazy(() => import('./pages/Workout'))
const LogSession = lazy(() => import('./pages/LogSession'))
const History = lazy(() => import('./pages/History'))
const Stats = lazy(() => import('./pages/Stats'))
const Timers = lazy(() => import('./pages/Timers'))
const Combos = lazy(() => import('./pages/Combos'))
const CompetitionPrep = lazy(() => import('./pages/CompetitionPrep'))
const MapPage = lazy(() => import('./pages/MapPage'))
const Analyzer = lazy(() => import('./pages/Analyzer'))
const Coaches = lazy(() => import('./pages/Coaches'))
const Challenges = lazy(() => import('./pages/Challenges'))
const Ranks = lazy(() => import('./pages/Ranks'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const CoachChat = lazy(() => import('./pages/CoachChat'))
const More = lazy(() => import('./pages/More'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Records = lazy(() => import('./pages/Records'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Voies = lazy(() => import('./pages/Voies'))

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Accueil', icon: 'home' },
  { to: '/calendar', label: 'Calendrier', icon: 'calendar' },
  { to: '#train', label: 'Entraîner', icon: 'plus' },
  { to: '/skills', label: 'Figures', icon: 'star' },
  { to: '/more', label: 'Plus', icon: 'menu' },
]

function TrainSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const go = (p: string) => (onClose(), nav(p))
  const items = [
    { t: 'Séance du programme', d: 'Guidée pas à pas avec voix et timers', p: '/programs', i: 'target' as IconName, c: '#ff7a1a' },
    { t: 'Séance libre guidée', d: 'Choisis tes figures, le coach te suit', p: '/workout/free/free', i: 'bolt' as IconName, c: '#ffb000' },
    { t: 'Noter une séance', d: 'Tout enregistrer : séries, RPE, sommeil…', p: '/log', i: 'pencil' as IconName, c: '#ff3d6e' },
    { t: 'Chrono & minuteur', d: 'Chrono, minuteur, holds, 45/45, EMOM', p: '/timers', i: 'timer' as IconName, c: '#ffcf3f' },
    { t: 'Analyser une figure', d: 'Vidéo, photo ou caméra en direct', p: '/analyzer', i: 'camera' as IconName, c: '#ff6b4a' },
    { t: 'Combos', d: 'Concevoir et répéter tes enchaînements', p: '/combos', i: 'link' as IconName, c: '#ff4fa0' },
  ]
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="absolute inset-x-0 bottom-0 mx-auto max-w-xl rounded-t-3xl border-t border-volt/20 bg-ink-900 p-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 100px)' }} initial={{ y: 500 }} animate={{ y: 0 }} exit={{ y: 500 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
            <div className="h-display mb-3 text-2xl">S'entraîner</div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((x) => (
                <button key={x.t} onClick={() => go(x.p)} className="card text-left active:scale-[0.98]">
                  <IconTile name={x.i} color={x.c} size={42} />
                  <div className="mt-1 text-sm font-bold">{x.t}</div>
                  <div className="text-[11px] leading-tight text-white/65">{x.d}</div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Vrai quand les données du téléphone sont chargées (IndexedDB est asynchrone). */
function useHydrated() {
  const [ok, setOk] = useState(useStore.persist.hasHydrated())
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setOk(true))
    setOk(useStore.persist.hasHydrated())
    return unsub
  }, [])
  return ok
}

function Splash() {
  return (
    <div className="grid h-screen place-items-center">
      <svg viewBox="0 0 64 64" width="72" height="72" className="animate-pulse">
        <path d="M32 6 58 54H6Z" fill="none" stroke="#ff7a1a" strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M19 40h26" stroke="#ff3d6e" strokeWidth="4.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function Shell() {
  const loc = useLocation()
  const nav = useNavigate()
  const [train, setTrain] = useState(false)
  const profile = useStore((s) => s.profile)
  const records = useStore((s) => s.records)
  const analyses = useStore((s) => s.analyses)
  const sessions = useStore((s) => s.sessions)
  const bonusXp = useStore((s) => s.bonusXp)
  const lastRankSeen = useStore((s) => s.lastRankSeen)
  const setLastRankSeen = useStore((s) => s.setLastRankSeen)
  const rank = useMemo(() => computeRank(skillStatuses(records, analyses), sessions, bonusXp).rank, [records, analyses, sessions, bonusXp])
  const [celebrate, setCelebrate] = useState<number | null>(null)
  const hydrated = useHydrated()
  const [backup, setBackup] = useState<Record<string, unknown> | null>(null)
  const [backupDismissed, setBackupDismissed] = useState(false)

  // Sauvegarde automatique à chaque changement ; proposition de restauration si les données ont disparu.
  useEffect(() => useStore.subscribe(() => scheduleAutoBackup()), [])
  useEffect(() => {
    if (hydrated && !profile) readAutoBackup().then(setBackup)
  }, [hydrated, profile])

  useEffect(() => {
    if (rank.id > lastRankSeen) setCelebrate(rank.id)
    else if (rank.id < lastRankSeen) setLastRankSeen(rank.id)
  }, [rank.id, lastRankSeen, setLastRankSeen])

  useEffect(() => {
    const h = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && loc.pathname !== '/') nav(-1)
      else CapApp.exitApp()
    })
    return () => void h.then((x) => x.remove())
  }, [loc.pathname, nav])

  if (!hydrated) return <Splash />
  if (!profile && backup && !backupDismissed)
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 text-center">
        <div className="h-display text-4xl">Sauvegarde trouvée</div>
        <p className="text-sm text-white/70">
          Une sauvegarde automatique de {String((backup.profile as { name?: string })?.name ?? 'ton profil')} du {new Date(String(backup.exportedAt)).toLocaleString('fr-FR')} existe sur ce téléphone.
        </p>
        <button className="btn-primary !py-4" onClick={() => restore(backup)}>Restaurer mes données</button>
        <button className="btn-ghost" onClick={() => setBackupDismissed(true)}>Repartir de zéro</button>
      </div>
    )
  if (!profile && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  if (profile && loc.pathname === '/onboarding') return <Navigate to="/" replace />
  const hideNav = loc.pathname === '/onboarding' || loc.pathname.startsWith('/workout')
  const section = sectionOf(loc.pathname)

  return (
    <>
      <div className="ambient" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <Suspense fallback={<div className="grid h-screen place-items-center text-white/55">…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/skill/:id" element={<SkillDetail />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/program/:id" element={<ProgramView />} />
          <Route path="/workout/:pid/:day" element={<Workout />} />
          <Route path="/log" element={<LogSession />} />
          <Route path="/log/:id" element={<LogSession />} />
          <Route path="/history" element={<History />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/timers" element={<Timers />} />
          <Route path="/combos" element={<Combos />} />
          <Route path="/competition" element={<CompetitionPrep />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/analyzer" element={<Analyzer />} />
          <Route path="/coaches" element={<Coaches />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/ranks" element={<Ranks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/coach" element={<CoachChat />} />
          <Route path="/more" element={<More />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/records" element={<Records />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/voies" element={<Voies />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>

      {!hideNav && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-ink-950/90 backdrop-blur-xl" style={{ paddingBottom: 'var(--safe-bottom)' }}>
          <div className="mx-auto flex max-w-xl items-end justify-around px-2 pt-2 pb-2">
            {NAV.map((n) =>
              n.to === '#train' ? (
                <button key={n.to} onClick={() => setTrain((v) => !v)} className="-mt-7 flex flex-col items-center" aria-label="Entraîner">
                  <motion.div whileTap={{ scale: 0.9 }} className="relative grid h-[66px] w-[66px] place-items-center rounded-full bg-[#100a07] p-[3px] shadow-[0_8px_30px_-4px_#ff7a1acc]" style={{ background: 'conic-gradient(from 200deg, #ffcf3f, #ff7a1a, #ff3d6e, #ffcf3f)' }}>
                    <motion.div animate={{ rotate: train ? 45 : 0 }} className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[#2e1d15] to-[#100a07] text-volt">
                      <Icon name="plus" size={30} strokeWidth={3} />
                    </motion.div>
                  </motion.div>
                  <span className="mt-1 text-[10px] font-bold text-volt">{n.label}</span>
                </button>
              ) : (
                <NavLink key={n.to} to={n.to} end className={`relative flex w-16 flex-col items-center gap-1 py-1 text-[10px] font-bold transition-colors ${section.tab === n.to ? 'text-volt' : 'text-white/60'}`}>
                  {section.tab === n.to && (
                    <motion.span layoutId="nav-pill" className="absolute inset-x-1 -top-1 bottom-0 -z-10 rounded-2xl bg-volt/15 shadow-[inset_0_0_0_1px_#ff7a1a55]" transition={{ type: 'spring', damping: 26, stiffness: 340 }} />
                  )}
                  <motion.span animate={section.tab === n.to ? { y: [0, -4, 0], scale: [1, 1.15, 1] } : { y: 0, scale: 1 }} transition={{ duration: 0.4 }}>
                    <Icon name={n.icon} size={25} />
                  </motion.span>
                  {n.label}
                </NavLink>
              ),
            )}
          </div>
        </nav>
      )}
      <TrainSheet open={train} onClose={() => setTrain(false)} />
      <RankUpOverlay
        rank={celebrate !== null ? RANKS[celebrate] : null}
        onClose={() => {
          setLastRankSeen(celebrate ?? 0)
          setCelebrate(null)
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Shell />
      </HashRouter>
    </ErrorBoundary>
  )
}
