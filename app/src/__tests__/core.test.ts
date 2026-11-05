import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { EXERCISES, EX_BY_ID, LINE_DRILLS } from '../data/exercises'
import { RANKS } from '../data/ranks'
import { SKILLS, SKILL_BY_ID } from '../data/skills'
import { generateProgram } from '../lib/generator'
import { evaluate, type Pt } from '../lib/pose'
import { computeRank, skillStatuses } from '../lib/scoring'
import { dayKey, linReg, projection, streak } from '../lib/stats'
import type { GeneratorParams, SessionLog, SkillRecord } from '../lib/types'
import { VOIES, voieProgress } from '../lib/voies'

const rec = (skillId: string, value: number, daysAgo = 0): SkillRecord => ({ id: skillId + daysAgo, skillId, value, date: new Date(Date.now() - daysAgo * 864e5).toISOString(), source: 'test' })

describe('données', () => {
  it('ids de figures uniques et standards positifs', () => {
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length)
    for (const s of SKILLS) {
      expect(s.standard).toBeGreaterThan(0)
      expect(s.tier).toBeGreaterThanOrEqual(1)
      expect(s.tier).toBeLessThanOrEqual(10)
    }
  })
  it('les exercices d\'assistance référencés existent', () => {
    for (const ids of Object.values(LINE_DRILLS)) for (const id of ids) expect(EX_BY_ID[id], id).toBeDefined()
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length)
  })
  it('les rangs sont croissants', () => {
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].rp).toBeGreaterThan(RANKS[i - 1].rp)
  })
  it('les compétitions embarquées sont valides et sourcées', () => {
    const list = JSON.parse(readFileSync('public/competitions.json', 'utf8'))
    expect(list.length).toBeGreaterThan(10)
    const ids = new Set()
    for (const c of list) {
      expect(ids.has(c.id), c.id).toBe(false)
      ids.add(c.id)
      expect(c.start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      if (c.end) expect(c.end >= c.start, c.id).toBe(true)
      expect(Math.abs(c.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(c.lng)).toBeLessThanOrEqual(180)
      expect(c.url).toMatch(/^https:\/\//)
    }
  })
})

describe('générateur de programmes', () => {
  const base: GeneratorParams = { specialty: 'mixte', level: 3, goal: 'skills', goalSkills: ['straddle-planche', 'full-front-lever'], weeks: 6, daysPerWeek: 4, sessionMinutes: 75, equipment: ['barre', 'parallèles'] }
  const statuses = skillStatuses([rec('tuck-planche', 12), rec('adv-tuck-front-lever', 8)], [])

  it('produit toutes les séances, sans valeur invalide', () => {
    const p = generateProgram(base, statuses, 'test', 42)
    expect(p.days).toHaveLength(24)
    for (const d of p.days) {
      expect(d.items.length).toBeGreaterThan(3)
      expect(d.items.some((i) => i.block === 'Skill' || i.block === 'Agilité')).toBe(true)
      for (const it of d.items) {
        expect(Number.isFinite(it.sets) && it.sets > 0, it.name).toBe(true)
        expect(it.target).not.toMatch(/NaN|undefined/)
      }
    }
  })
  it('est déterministe pour une graine et varie avec la graine', () => {
    const a = JSON.stringify(generateProgram(base, statuses, 't', 7).days)
    const b = JSON.stringify(generateProgram(base, statuses, 't', 7).days)
    const c = JSON.stringify(generateProgram(base, statuses, 't', 8).days)
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
  it('respecte le matériel disponible', () => {
    const p = generateProgram({ ...base, equipment: [] }, statuses, 't', 3)
    // un exercice est faisable si au moins une de ses options de matériel est au sol (ou un élastique/bâton pour l'échauffement)
    for (const d of p.days) for (const it of d.items) if (it.exerciseId) expect(EX_BY_ID[it.exerciseId].equipment.some((e) => e === 'sol' || e === 'élastique'), `${it.name} : ${EX_BY_ID[it.exerciseId].equipment}`).toBe(true)
  })
  it('travaille la progression actuelle de la figure visée', () => {
    const p = generateProgram(base, statuses, 't', 11)
    const names = new Set(p.days.flatMap((d) => d.items.map((i) => i.skillId)))
    expect(names.has('tuck-planche') || names.has('adv-tuck-planche')).toBe(true)
  })
  it('inclut une semaine de décharge sur un cycle long', () => {
    const p = generateProgram({ ...base, weeks: 8 }, statuses, 't', 5)
    expect(p.phases.some((x) => x.name === 'Décharge')).toBe(true)
  })
})

describe('rangs', () => {
  it('rang 0 sans données', () => {
    expect(computeRank(skillStatuses([], []), [], 0).rank.id).toBe(0)
  })
  it('l\'assiduité seule ne fait pas monter haut', () => {
    const sessions: SessionLog[] = Array.from({ length: 400 }, (_, i) => ({ id: 's' + i, date: new Date().toISOString(), title: 'x', durationMin: 120, type: 'force', exercises: [], rpe: 9, feeling: 4 }))
    expect(computeRank(skillStatuses([], []), sessions, 100000).rank.id).toBeLessThanOrEqual(1)
  })
  it('une figure n\'est certifiée qu\'avec une analyse ≥ 8 au standard', () => {
    const an = { id: 'a', date: new Date().toISOString(), skillId: 'l-sit', mode: 'video' as const, score: 8.4, holdSeconds: 12, criteria: [], verdict: '', judge: { execution: 8.4, difficulty: 3, total: 25 } }
    expect(skillStatuses([], [an])['l-sit'].certified).toBe(true)
    expect(skillStatuses([], [{ ...an, score: 7.5 }])['l-sit'].certified).toBe(false)
    expect(skillStatuses([], [{ ...an, holdSeconds: 4 }])['l-sit'].certified).toBe(false)
  })
})

describe('séances', () => {
  it('une série assistée ne crée pas de record de figure', async () => {
    const { useStore } = await import('../lib/store')
    const st = useStore.getState()
    st.resetAll()
    const base = { date: new Date().toISOString(), title: 'x', durationMin: 60, type: 'skills' as const, rpe: 7, feeling: 3 }
    st.saveSession({ ...base, id: 'a', exercises: [{ name: 'Full planche', skillId: 'full-planche', sets: [{ seconds: 9 }], band: 'fort' }] })
    expect(useStore.getState().records.filter((r) => r.skillId === 'full-planche')).toHaveLength(0)
    st.saveSession({ ...base, id: 'b', exercises: [{ name: 'Tuck planche', skillId: 'tuck-planche', sets: [{ seconds: 9 }] }] })
    expect(useStore.getState().records.filter((r) => r.skillId === 'tuck-planche')).toHaveLength(1)
  })
})

describe('statistiques', () => {
  it('régression linéaire exacte', () => {
    const r = linReg([{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }])!
    expect(r.slope).toBeCloseTo(2)
    expect(r.intercept).toBeCloseTo(1)
    expect(r.r2).toBeCloseTo(1)
  })
  it('projection vers un objectif', () => {
    const p = projection([rec('l-sit', 4, 21), rec('l-sit', 6, 14), rec('l-sit', 8, 7)], 12)!
    expect(p.reached).toBe(false)
    // +2 s/semaine : de 8 s (il y a 7 j) à 12 s ≈ dans 1 semaine
    expect(p.perWeek).toBeCloseTo(2, 0)
    expect(p.weeks).toBeGreaterThan(0.5)
    expect(p.weeks).toBeLessThan(1.5)
  })
  it('clé de jour en heure locale', () => {
    const d = new Date(2026, 0, 2, 0, 30)
    expect(dayKey(d)).toBe('2026-01-02')
  })
  it('série de jours', () => {
    const s = (n: number): SessionLog => ({ id: 'x' + n, date: new Date(Date.now() - n * 864e5).toISOString(), title: '', durationMin: 60, type: 'force', exercises: [], rpe: 7, feeling: 3 })
    expect(streak([s(0), s(1), s(2)])).toBe(3)
    expect(streak([])).toBe(0)
  })
})

describe('analyseur de pose', () => {
  const pose = (o: Record<number, [number, number]>): Pt[] => {
    const pts: Pt[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, v: 0.1 }))
    for (const [k, [x, y]] of Object.entries(o)) pts[+k] = { x, y, v: 0.99 }
    return pts
  }
  const planche = (bend = 0) => pose({ 0: [95, 232], 11: [130, 240], 13: [145 + bend, 270], 15: [160, 300], 23: [230, 240], 25: [290, 240], 27: [350, 240] })
  const frames = (f: (i: number) => Pt[], n = 60) => Array.from({ length: n }, (_, i) => ({ t: i / 15, pts: f(i) }))

  it('une full planche propre est bien notée et chronométrée', () => {
    const r = evaluate('full-planche', frames(() => planche()), 'video')
    expect(r.score).toBeGreaterThan(9)
    expect(r.holdSeconds).toBeGreaterThan(3.5)
  })
  it('des coudes pliés invalident le hold et plafonnent la note', () => {
    const r = evaluate('full-planche', frames(() => planche(25)), 'video')
    expect(r.holdSeconds).toBe(0)
    expect(r.score).toBeLessThanOrEqual(5)
  })
  it('compte les pompes', () => {
    const pu = (down: boolean) => pose({ 0: [80, 200], 11: [100, 210], 13: down ? [140, 215] : [102, 250], 15: down ? [100, 290] : [104, 290], 23: [200, 230], 25: [260, 245], 27: [320, 260] })
    const r = evaluate('push-up', frames((i) => pu(Math.floor(i / 6) % 2 === 1), 96), 'video')
    // 8 descentes mais la dernière ne remonte pas : 7 répétitions complètes
    expect(r.reps).toBe(7)
  })
})

describe('paliers', () => {
  it('chaque voie a des paliers de 1 ou 2 figures, sans figure dangereuse', () => {
    const st = skillStatuses([], [])
    for (const v of VOIES) {
      const pr = voieProgress(v, st)
      expect(pr.total).toBeGreaterThan(3)
      for (const p of pr.paliers) {
        expect(p.options.length).toBeGreaterThanOrEqual(1)
        expect(p.options.length).toBeLessThanOrEqual(2)
        for (const o of p.options) expect(SKILL_BY_ID[o.id].danger).toBeFalsy()
      }
      expect(pr.ladder).toBe(0)
    }
  })
  it('un palier validé fait monter l\'échelle', () => {
    const v = VOIES[0]
    const first = voieProgress(v, skillStatuses([], [])).paliers[0].options[0]
    const pr = voieProgress(v, skillStatuses([rec(first.id, first.standard)], []))
    expect(pr.ladder).toBe(1)
  })
})

describe('validation rapide (widget)', () => {
  it('valide un jour une seule fois, sans record, et le repos ne remplace pas une séance', async () => {
    const { useStore } = await import('../lib/store')
    const { quickRest, quickValidate } = await import('../lib/quick')
    const { widgetPayload } = await import('../lib/widget')
    const k = dayKey(new Date(Date.now() - 3 * 864e5))
    const before = useStore.getState().records.length
    useStore.getState().toggleRest(k)
    const a = quickValidate(k)
    expect(a.created).toBe(true)
    expect(quickValidate(k)).toEqual({ id: a.id, created: false })
    const st = useStore.getState()
    expect(st.sessions.filter((x) => dayKey(x.date) === k)).toHaveLength(1)
    expect(st.restDays).not.toContain(k)
    expect(st.records.length).toBe(before)
    quickRest(k)
    expect(useStore.getState().restDays).not.toContain(k)
    const p = widgetPayload()
    expect(p.done).toContain(k)
    expect(p.rest).not.toContain(k)
  })
})

describe('fiches, bilan et séance express', () => {
  it('uniquement de la calisthenics : pas de cardio ni de fitness', () => {
    for (const id of ['jumping-jack', 'burpee', 'mountain-climber', 'jump-rope', 'lunge', 'wall-sit', 'calf-raise', 'box-jump']) expect(EX_BY_ID[id], id).toBeUndefined()
  })
  it('chaque exercice a une fiche et les liens de progression existent', async () => {
    const { HOWTO } = await import('../data/howto')
    for (const e of EXERCISES) expect(HOWTO[e.id], e.id).toBeDefined()
    for (const [id, h] of Object.entries(HOWTO)) {
      expect(EX_BY_ID[id], id).toBeDefined()
      for (const l of [h.easier, h.harder]) if (l) expect(EX_BY_ID[l] ?? SKILL_BY_ID[l], `${id} → ${l}`).toBeDefined()
      expect(h.how.length).toBeGreaterThan(0)
      expect(h.mistakes.length).toBeGreaterThan(0)
    }
  })
  it('le bilan note de façon cohérente et bascule sur les tests de remplacement', async () => {
    const { scoreBilan } = await import('../lib/bilan')
    const zero = scoreBilan({ pushups: 0, kneepushups: 10, pullups: 0, hang: 20, hollow: 15, lsit: 0, tucklsit: 5, wallhs: 0, pike: 35, shoulders: 15 })
    expect(zero.level).toBe(1)
    expect(zero.scores.push).toBeGreaterThan(0)
    expect(zero.scores.push).toBeLessThanOrEqual(30)
    const elite = scoreBilan({ pushups: 60, dips: 40, pullups: 28, hollow: 120, lsit: 45, wallhs: 120, pike: 100, shoulders: 100 })
    expect(elite.global).toBe(100)
    expect(elite.level).toBe(5)
    const mid = scoreBilan({ pushups: 25, pullups: 10, hollow: 45, lsit: 15 })
    expect(mid.scores.balance).toBe(-1)
    expect(mid.global).toBeGreaterThan(zero.global)
    expect(mid.global).toBeLessThan(elite.global)
  })
  it('la séance express respecte le matériel, le temps et le niveau', async () => {
    const { buildExpress } = await import('../lib/express')
    for (const focus of ['full', 'haut', 'statique', 'agilite', 'gainage', 'mobilite'] as const)
      for (const minutes of [10, 20, 30, 45]) {
        const p = buildExpress({ minutes, place: 'maison', focus, level: 1, equipment: [], seed: minutes * 7 })
        const items = p.days[0].items
        expect(items.length).toBeGreaterThan(2)
        for (const it of items) if (it.exerciseId) expect(EX_BY_ID[it.exerciseId].equipment.every((x) => x === 'sol'), `${focus} ${it.exerciseId}`).toBe(true)
        expect(p.days[0].estMinutes).toBeLessThanOrEqual(minutes + 8)
      }
    const st = buildExpress({ minutes: 30, place: 'parc', focus: 'statique', level: 3, equipment: [], seed: 5 })
    expect(st.days[0].items.filter((i) => i.block === 'Skill').length).toBeGreaterThan(2)
    const adv = buildExpress({ minutes: 30, place: 'parc', focus: 'haut', level: 4, equipment: [], seed: 3 })
    expect(adv.days[0].items.filter((i) => i.block === 'Force').every((i) => EX_BY_ID[i.exerciseId!].level >= 2)).toBe(true)
  })
})
