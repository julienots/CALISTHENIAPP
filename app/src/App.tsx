import { App as CapApp } from '@capacitor/app'
import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Icon, IconTile, type IconName } from './components/Icon'
import { RankUpOverlay } from './components/RankBadge'
import { RANKS } from './data/ranks'
import { computeRank, skillStatuses } from './lib/scoring'
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
    { t: 'Timers', d: 'Hold, intervalles, compétition 45/45, EMOM', p: '/timers', i: 'timer' as IconName, c: '#ffcf3f' },
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

  if (!profile && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  const hideNav = loc.pathname === '/onboarding' || loc.pathname.startsWith('/workout')

  return (
    <>
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>

      {!hideNav && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-ink-950/90 backdrop-blur-xl" style={{ paddingBottom: 'var(--safe-bottom)' }}>
          <div className="mx-auto flex max-w-xl items-end justify-around px-2 pt-2 pb-2">
            {NAV.map((n) =>
              n.to === '#train' ? (
                <button key={n.to} onClick={() => setTrain((v) => !v)} className="-mt-7 flex flex-col items-center" aria-label="Entraîner">
                  <motion.div whileTap={{ scale: 0.9 }} animate={{ rotate: train ? 45 : 0 }} className="grid h-[60px] w-[60px] place-items-center rounded-[20px] bg-gradient-to-br from-[#ffa13d] via-volt to-[#ff3d6e] text-[#1a0b04] shadow-[0_8px_30px_-4px_#ff7a1acc,inset_0_1px_0_#ffffff77]">
                    <Icon name="plus" size={30} strokeWidth={3} />
                  </motion.div>
                  <span className="mt-1 text-[10px] font-bold text-volt">{n.label}</span>
                </button>
              ) : (
                <NavLink key={n.to} to={n.to} end className={({ isActive }) => `flex w-14 flex-col items-center gap-1 py-1 text-[10px] font-semibold ${isActive ? 'text-volt' : 'text-white/60'}`}>
                  <Icon name={n.icon} size={25} />
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
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
