// Carte « story » 1080×1920 : athlète, rang, voies et figures phares, en PNG.
import { renderToStaticMarkup } from 'react-dom/server'
import { FigureArt, HERO_POSE } from '../components/FigureArt'
import type { Rank } from '../data/ranks'

export interface StoryData {
  name: string
  rank: Rank
  rp: number
  skin: string
  voies: { name: string; color: string; palier: string }[]
  phares: string[]
  validated: number
  streak: number
}

function cardSvg(d: StoryData) {
  const hero = renderToStaticMarkup(<FigureArt pose={HERO_POSE} size={640} skin={d.skin} cues={false} />)
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const voies = d.voies
    .map(
      (v, i) => `<g transform="translate(${70 + i * 240},1330)">
        <rect width="220" height="150" rx="26" fill="#21150f" stroke="${v.color}" stroke-opacity="0.7" stroke-width="3"/>
        <text x="110" y="52" text-anchor="middle" font-size="30" font-weight="900" fill="${v.color}" font-family="Arial Black, Arial">${esc(v.name.toUpperCase())}</text>
        <text x="110" y="108" text-anchor="middle" font-size="38" font-weight="900" fill="#fff" font-family="Impact, Arial Black">${esc(v.palier)}</text>
      </g>`,
    )
    .join('')
  const phares = d.phares
    .slice(0, 3)
    .map((p, i) => `<g transform="translate(70,${1540 + i * 84})"><rect width="940" height="68" rx="34" fill="#ffffff10" stroke="#ff7a1a55" stroke-width="2"/><text x="40" y="45" font-size="32" font-weight="700" fill="#ffcf3f" font-family="Arial">★</text><text x="90" y="45" font-size="32" font-weight="700" fill="#fff" font-family="Arial">${esc(p)}</text></g>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs>
      <radialGradient id="bg" cx="0.5" cy="0.35" r="0.8"><stop offset="0" stop-color="#5c2a12"/><stop offset="0.55" stop-color="#1c100b"/><stop offset="1" stop-color="#0c0705"/></radialGradient>
      <linearGradient id="spot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf3f" stop-opacity="0.35"/><stop offset="1" stop-color="#ffcf3f" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    <path d="M380 0 L700 0 L900 1150 L180 1150 Z" fill="url(#spot)"/>
    <g fill="#ffffff08">${[90, 270, 810, 990].map((x) => `<rect x="${x - 40}" y="250" width="80" height="900" rx="10"/>`).join('')}</g>
    <text x="70" y="130" font-size="64" font-weight="900" fill="#fff" font-family="Impact, Arial Black" letter-spacing="6">GRAVITAS</text>
    <text x="70" y="180" font-size="28" font-weight="700" fill="#ff7a1a" font-family="Arial" letter-spacing="8">DÉFIE LA GRAVITÉ</text>
    ${hero.replace(/^<svg([^>]*)>/, (_m, attrs: string) => `<svg x="200" y="230" ${attrs.replace(/\s(width|height|style)="[^"]*"/g, '')} width="680" height="960">`)}
    <text x="540" y="1200" text-anchor="middle" font-size="96" font-weight="900" fill="#fff" font-family="Impact, Arial Black">${esc(d.name.toUpperCase())}</text>
    <text x="540" y="1270" text-anchor="middle" font-size="46" font-weight="900" fill="${d.rank.color}" font-family="Impact, Arial Black" letter-spacing="4">${esc(d.rank.name)} · ${d.rp.toLocaleString('fr-FR')} PR</text>
    ${voies}
    <text x="70" y="1520" font-size="28" font-weight="900" fill="#ffffff99" font-family="Arial" letter-spacing="6">FIGURES PHARES</text>
    ${phares}
    <text x="70" y="1860" font-size="30" font-weight="700" fill="#ffffffaa" font-family="Arial">${d.validated} figures validées · série ${d.streak} j</text>
  </svg>`
}

export async function renderStoryPng(d: StoryData): Promise<string> {
  const svg = cardSvg(d)
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await img.decode()
  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1920
  c.getContext('2d')!.drawImage(img, 0, 0)
  return c.toDataURL('image/png')
}
