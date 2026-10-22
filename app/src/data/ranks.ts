// Rangs : chaque rang exige des Points de Rang (PR) ET des conditions de
// figures. Le rang max est volontairement quasi inaccessible.

export interface Rank {
  id: number
  name: string
  title: string
  rp: number
  color: string
  glow: string
  /** Nombre minimal de figures validées au tier indiqué ou plus. */
  requires?: { tier: number; count: number }[]
  /** Exige au moins une figure certifiée par l'analyseur. */
  certified?: number
}

export const RANKS: Rank[] = [
  { id: 0, name: 'ÉVEIL', title: 'Le premier pas vers la barre', rp: 0, color: '#7c8299', glow: '#7c829955' },
  { id: 1, name: 'RECRUE', title: 'Les fondations se posent', rp: 120, color: '#8fb3a8', glow: '#8fb3a855' },
  { id: 2, name: 'DISCIPLE', title: 'La barre devient ta seconde maison', rp: 400, color: '#5ec2a6', glow: '#5ec2a666', requires: [{ tier: 3, count: 2 }] },
  { id: 3, name: 'ACIER', title: 'Des tendons forgés au métal', rp: 1000, color: '#3dd6ff', glow: '#3dd6ff66', requires: [{ tier: 4, count: 3 }] },
  { id: 4, name: 'GLADIATEUR', title: 'Tu combats la gravité chaque jour', rp: 2200, color: '#5c8dff', glow: '#5c8dff77', requires: [{ tier: 5, count: 3 }] },
  { id: 5, name: 'SPARTIATE', title: 'Discipline de fer, corps d\'airain', rp: 4200, color: '#7c5cff', glow: '#7c5cff77', requires: [{ tier: 6, count: 3 }], certified: 1 },
  { id: 6, name: 'ÉLITE', title: 'Le haut du classement te regarde', rp: 7500, color: '#a35cff', glow: '#a35cff88', requires: [{ tier: 7, count: 3 }], certified: 2 },
  { id: 7, name: 'MAÎTRE DES LEVIERS', title: 'Planche et lever obéissent', rp: 12500, color: '#c65cff', glow: '#c65cff88', requires: [{ tier: 7, count: 6 }, { tier: 8, count: 1 }], certified: 3 },
  { id: 8, name: 'TITAN', title: 'Une force qui défie l\'anatomie', rp: 20000, color: '#ff5ca8', glow: '#ff5ca899', requires: [{ tier: 8, count: 4 }], certified: 5 },
  { id: 9, name: 'LÉGENDE', title: 'Ton nom circule dans les parcs', rp: 32000, color: '#ff5c39', glow: '#ff5c3999', requires: [{ tier: 9, count: 3 }], certified: 7 },
  { id: 10, name: 'IMMORTEL', title: 'Les juges se lèvent', rp: 50000, color: '#ffc83d', glow: '#ffc83daa', requires: [{ tier: 9, count: 6 }, { tier: 10, count: 2 }], certified: 10 },
  { id: 11, name: 'GRAVITAS ZÉRO', title: 'La gravité n\'a plus d\'emprise sur toi', rp: 80000, color: '#c6ff3d', glow: '#c6ff3dcc', requires: [{ tier: 10, count: 6 }, { tier: 9, count: 12 }], certified: 15 },
]
