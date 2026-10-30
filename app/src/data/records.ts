// Records du monde (sources publiques consultées en octobre 2026).
// Les records évoluent : chaque entrée garde sa source pour vérification.

export interface WorldRecord {
  id: string
  title: string
  value: number
  unit: string
  holder: string
  country: string
  date: string
  source: string
  sourceUrl: string
  /** Figure de l'appli à comparer avec le record (meilleure performance). */
  skillId?: string
  note?: string
}

export const WORLD_RECORDS: WorldRecord[] = [
  {
    id: 'mu-consecutive',
    title: 'Muscle-ups consécutifs',
    value: 26,
    unit: 'reps',
    holder: 'Maksim Trukhonovets',
    country: 'Biélorussie',
    date: '2018-03-17',
    source: 'Guinness World Records (via Starr Cards)',
    sourceUrl: 'https://starrcards.com/watch-all-26-consecutive-reps-from-maksim-trukhonovets-muscle-up-world-record/',
    skillId: 'muscle-up',
  },
  {
    id: 'mu-1min-20lb',
    title: 'Muscle-ups en 1 min avec sac de 20 lb (9 kg)',
    value: 15,
    unit: 'reps',
    holder: 'Ildar Yagyayev',
    country: 'Kazakhstan',
    date: '2024-09-15',
    source: 'Guinness World Records',
    sourceUrl: 'https://www.guinnessworldrecords.com/world-records/660449-most-muscle-ups-in-one-minute-carrying-a-20-lb-pack',
  },
  {
    id: 'mu-24h',
    title: 'Muscle-ups en 24 h',
    value: 2002,
    unit: 'reps',
    holder: 'David Lloyd George',
    country: 'États-Unis',
    date: '2025-04-14',
    source: 'The Duke Chronicle',
    sourceUrl: 'https://dukechronicle.com/article/duke-university-guinness-world-record-24-hours-muscle-ups-first-year-doctoral-physics-student-gary-sinise-foundation-triangle-rock-club-durham-april-13-20250331',
    note: 'Record annoncé dans la presse ; l\'ancien record était de 1 726.',
  },
  {
    id: 'pu-1min',
    title: 'Tractions en 1 min (hommes)',
    value: 90,
    unit: 'reps',
    holder: 'Yutaro Matsuta',
    country: 'Japon',
    date: '2026-04-10',
    source: 'Guinness World Records',
    sourceUrl: 'https://www.guinnessworldrecords.com/world-records/most-pull-ups-in-one-minute',
  },
  {
    id: 'pu-consecutive',
    title: 'Tractions consécutives',
    value: 1224,
    unit: 'reps',
    holder: 'Kenta Adachi',
    country: 'Japon',
    date: '2024',
    source: 'Wikipédia (Pull-up)',
    sourceUrl: 'https://en.wikipedia.org/wiki/Pull-up',
    skillId: 'pull-up',
    note: 'Les sources divergent sur ce record : à vérifier.',
  },
  {
    id: 'pu-24h-m',
    title: 'Tractions en 24 h (hommes)',
    value: 12345,
    unit: 'reps',
    holder: 'Enrique Zapata',
    country: 'Mexique',
    date: '2026-01-31',
    source: 'Guinness World Records',
    sourceUrl: 'https://www.guinnessworldrecords.com/world-records/most-pull-ups-in-24-hours',
  },
  {
    id: 'pu-24h-f',
    title: 'Tractions en 24 h (femmes)',
    value: 7079,
    unit: 'reps',
    holder: 'Olivia Vinson',
    country: 'Australie',
    date: '2025',
    source: 'Wikipédia (Pull-up)',
    sourceUrl: 'https://en.wikipedia.org/wiki/Pull-up',
  },
]
