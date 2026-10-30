// Rattache chaque écran à un onglet de la barre du bas, pour savoir où l'on est.
import type { IconName } from '../components/Icon'

export interface SectionInfo {
  tab: '/' | '/calendar' | '/skills' | '/more'
  name: string
  icon: IconName
  color: string
}

const S: Record<SectionInfo['tab'], SectionInfo> = {
  '/': { tab: '/', name: 'Accueil', icon: 'home', color: '#ff7a1a' },
  '/calendar': { tab: '/calendar', name: 'Calendrier', icon: 'calendar', color: '#ffcf3f' },
  '/skills': { tab: '/skills', name: 'Figures', icon: 'star', color: '#ff3d6e' },
  '/more': { tab: '/more', name: 'Plus', icon: 'menu', color: '#ffb000' },
}

export function sectionOf(path: string): SectionInfo {
  if (path === '/') return S['/']
  if (/^\/(calendar|log|history)/.test(path)) return S['/calendar']
  if (/^\/(skills|skill\/|gallery|voies|records|ranks)/.test(path)) return S['/skills']
  return S['/more']
}
