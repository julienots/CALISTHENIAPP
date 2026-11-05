import { SKILLS } from '../data/skills'
import { rng } from './generator'
import { skillStatuses } from './scoring'
import { dayKey, DAY } from './stats'
import { useStore } from './store'

export interface Challenge {
  id: string
  scope: 'jour' | 'semaine' | 'épreuve'
  title: string
  text: string
  xp: number
  check?: (s: ReturnType<typeof useStore.getState>) => boolean
}

const DAILY_POOL: ((r: () => number, lvl: number) => Omit<Challenge, 'id' | 'scope'>)[] = [
  (_, l) => ({ title: 'Hollow d\'acier', text: `${3 + l} × ${20 + l * 5} s de hollow body hold, 45 s de repos.`, xp: 40 }),
  (_, l) => ({ title: 'Mur de tractions', text: `${20 + l * 10} tractions strictes au total, en un minimum de séries.`, xp: 60 }),
  (_, l) => ({ title: 'Dips infernaux', text: `${30 + l * 15} dips au total, chaque série jusqu'à RPE 8.`, xp: 50 }),
  (_, l) => ({ title: 'Handstand quotidien', text: `${5 + l * 2} min cumulées de handstand (mur autorisé).`, xp: 45 }),
  (_, l) => ({ title: 'Compression totale', text: `${3 + l} × 15 s de L-sit (ou tuck) + 3 × 10 pulses de compression.`, xp: 45 }),
  () => ({ title: 'Poignets blindés', text: '10 min de préparation des poignets : rotations, appuis doigts, pompes dos de main.', xp: 25 }),
  (_, l) => ({ title: 'EMOM du guerrier', text: `EMOM ${8 + l * 2} min : 3 tractions + 5 dips + 5 pompes.`, xp: 70 }),
  (_, l) => ({ title: 'Explosion', text: `${3 + l} × 5 tractions poitrine à la barre (ou transitions de muscle-up).`, xp: 60 }),
  () => ({ title: 'Mobilité épaules', text: '3 × 20 dislocations + 3 × 30 s de german hang ou étirement au mur.', xp: 30 }),
  (_, l) => ({ title: 'Lean extrême', text: `${4 + l} × 15 s de planche lean, épaules au maximum devant les mains.`, xp: 45 }),
  (_, l) => ({ title: 'Pistol power', text: `${5 + l * 2} pistol squats par jambe (assistés si besoin).`, xp: 40 }),
  (_, l) => ({ title: 'Tirage horizontal', text: `${4 + l} × 8 tuck front lever raises ou rows aux anneaux.`, xp: 55 }),
]

export function challengesFor(date = new Date()): Challenge[] {
  const s = useStore.getState()
  const lvl = s.profile?.level ?? 1
  const today = dayKey(date)
  const r = rng(Number(today.replace(/-/g, '')))
  const pool = [...DAILY_POOL].sort(() => r() - 0.5)
  const daily: Challenge[] = pool.slice(0, 3).map((f, i) => ({ ...f(r, lvl), id: `d-${today}-${i}`, scope: 'jour' }))
  daily.push({
    id: `d-${today}-log`,
    scope: 'jour',
    title: 'Trace tout',
    text: 'Enregistre une séance complète aujourd\'hui.',
    xp: 30,
    check: (st) => st.sessions.some((x) => dayKey(x.date) === today),
  })

  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7))
  const wk = dayKey(monday)
  const inWeek = (d: string) => new Date(d).getTime() >= monday.getTime() && new Date(d).getTime() < monday.getTime() + 7 * DAY
  const weekly: Challenge[] = [
    { id: `w-${wk}-3`, scope: 'semaine', title: 'Constance', text: '4 séances enregistrées cette semaine.', xp: 150, check: (st) => st.sessions.filter((x) => inWeek(x.date)).length >= 4 },
    { id: `w-${wk}-an`, scope: 'semaine', title: 'Œil du juge', text: '2 analyses vidéo cette semaine.', xp: 120, check: (st) => st.analyses.filter((x) => inWeek(x.date)).length >= 2 },
    { id: `w-${wk}-pr`, scope: 'semaine', title: 'Record battu', text: 'Bats ton record sur n\'importe quelle figure.', xp: 200, check: (st) => {
      return st.records.some((rec) => inWeek(rec.date) && rec.value > Math.max(0, ...st.records.filter((o) => o.skillId === rec.skillId && !inWeek(o.date)).map((o) => o.value)) && st.records.some((o) => o.skillId === rec.skillId && !inWeek(o.date)))
    } },
  ]

  // Épreuves : prochaine figure de chaque ligne populaire
  const statuses = skillStatuses(s.records, s.analyses)
  const trials: Challenge[] = ['planche', 'front-lever', 'handstand', 'back-lever', 'lsit', 'swing', 'mu']
    .map((line) => SKILLS.filter((x) => x.line === line).sort((a, b) => a.tier - b.tier).find((x) => statuses[x.id].mastery < 2))
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((sk) => ({
      id: `t-${sk.id}`,
      scope: 'épreuve' as const,
      title: `Épreuve : ${sk.name}`,
      text: `Valide ${sk.standard}${sk.kind === 'hold' ? ' s' : sk.kind === 'reps' ? ' reps' : ' réussites'} (record enregistré ou analyse vidéo).`,
      xp: 80 * sk.tier,
      check: (st: ReturnType<typeof useStore.getState>) => skillStatuses(st.records, st.analyses)[sk.id].mastery >= 2,
    }))
  return [...daily, ...weekly, ...trials]
}
