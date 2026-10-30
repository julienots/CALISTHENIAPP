// Analyseur biomécanique : estimation de pose MediaPipe (33 points, 100 %
// local) puis calcul d'angles articulaires et critères par type de figure.
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { SKILL_BY_ID, type AnalyzerProfile, type Skill } from '../data/skills'
import type { Analysis } from './types'
import { uid } from './store'

export interface Pt { x: number; y: number; v: number }
export interface Frame { t: number; pts: Pt[] | null; m?: Metrics; ok?: boolean; fails?: string[] }

let landmarkers: Partial<Record<'VIDEO' | 'IMAGE', PoseLandmarker>> = {}

export async function getLandmarker(mode: 'VIDEO' | 'IMAGE') {
  if (landmarkers[mode]) return landmarkers[mode]!
  const base = new URL('./', window.location.href).href
  const fileset = await FilesetResolver.forVisionTasks(base + 'mediapipe')
  const make = (delegate: 'GPU' | 'CPU') =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: base + 'models/pose_landmarker_full.task', delegate },
      runningMode: mode,
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })
  let lm: PoseLandmarker
  try {
    lm = await make('GPU')
  } catch {
    lm = await make('CPU')
  }
  landmarkers = { ...landmarkers, [mode]: lm }
  return lm
}

// ---------- Géométrie ----------
const deg = (r: number) => (r * 180) / Math.PI
function angle(a: Pt, b: Pt, c: Pt) {
  const v1 = { x: a.x - b.x, y: a.y - b.y }
  const v2 = { x: c.x - b.x, y: c.y - b.y }
  const d = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y)
  if (d === 0) return 180
  return deg(Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / d))))
}
/** Inclinaison d'un segment par rapport à l'horizontale (0 = horizontal, 90 = vertical). */
const tiltH = (a: Pt, b: Pt) => deg(Math.atan2(Math.abs(b.y - a.y), Math.abs(b.x - a.x)))
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export interface Metrics {
  side: 'L' | 'R'
  elbow: number
  bodyLine: number
  hip: number
  knee: number
  bodyTilt: number
  torsoTilt: number
  legTilt: number
  shoulder: number
  lean: number
  hipHeight: number
  vertical: number
  inverted: boolean
  torso: number
  hipX: number
  hipY: number
  wristAboveHead: number
}

const IDX = { L: { s: 11, e: 13, w: 15, h: 23, k: 25, a: 27 }, R: { s: 12, e: 14, w: 16, h: 24, k: 26, a: 28 } }

export function metrics(pts: Pt[]): Metrics {
  const vis = (side: 'L' | 'R') => Object.values(IDX[side]).reduce((n, i) => n + (pts[i]?.v ?? 0), 0)
  const side = vis('L') >= vis('R') ? 'L' : 'R'
  const I = IDX[side]
  const S = pts[I.s], E = pts[I.e], W = pts[I.w], H = pts[I.h], K = pts[I.k], A = pts[I.a]
  const torso = dist(S, H) || 1
  const headDir = Math.sign(S.x - H.x) || 1
  return {
    side,
    elbow: angle(S, E, W),
    bodyLine: angle(S, H, A),
    hip: angle(S, H, K),
    knee: angle(H, K, A),
    bodyTilt: tiltH(S, A),
    torsoTilt: tiltH(S, H),
    legTilt: tiltH(H, A),
    shoulder: angle(E, S, H),
    lean: ((S.x - W.x) * headDir) / torso,
    hipHeight: (S.y - H.y) / torso,
    vertical: 90 - tiltH(W, A),
    inverted: A.y < W.y && H.y < S.y,
    torso,
    hipX: H.x / torso,
    hipY: H.y / torso,
    wristAboveHead: (pts[0].y - W.y) / torso,
  }
}

// ---------- Critères par profil ----------
interface Criterion {
  key: string
  label: string
  get: (m: Metrics) => number
  /** Score 10 à `good`, 0 à `bad` (interpolation linéaire). */
  good: number
  bad: number
  unit: string
  target: string
  tip: string
  critical?: number // seuil de validité du hold (valeur limite)
}

const C = {
  elbowLock: (critical = 158): Criterion => ({ key: 'elbow', label: 'Verrouillage des coudes', get: (m) => m.elbow, good: 174, bad: 145, unit: '°', target: '≥ 172°', tip: 'Verrouille les coudes : pousse le sol / la barre au maximum, rotation externe des bras.', critical }),
  line: (critical?: number): Criterion => ({ key: 'line', label: 'Alignement épaules-hanches-chevilles', get: (m) => m.bodyLine, good: 175, bad: 145, unit: '°', target: '≥ 172°', tip: 'Rétroversion du bassin + fessiers serrés pour ne pas casser à la hanche.', critical }),
  horizontal: (critical = 22): Criterion => ({ key: 'tilt', label: 'Horizontalité du corps', get: (m) => m.bodyTilt, good: 4, bad: 30, unit: '°', target: '≤ 5°', tip: 'Le corps doit être parallèle au sol : monte les hanches / pieds sans plier.', critical }),
  torsoHorizontal: (critical = 25): Criterion => ({ key: 'torso', label: 'Horizontalité du buste', get: (m) => m.torsoTilt, good: 5, bad: 35, unit: '°', target: '≤ 8°', tip: 'Dos parallèle au sol : plus de lean (planche) ou plus de dépression (lever).', critical }),
  hipLevel: (): Criterion => ({ key: 'hipLevel', label: 'Hanches à hauteur d\'épaules', get: (m) => Math.abs(m.hipHeight), good: 0.05, bad: 0.45, unit: '', target: 'écart ≤ 0.08', tip: 'Les hanches tombent ou montent : gainage hollow et contrôle du bassin.' }),
  knees: (): Criterion => ({ key: 'knee', label: 'Jambes tendues', get: (m) => m.knee, good: 175, bad: 140, unit: '°', target: '≥ 172°', tip: 'Tends les genoux et pointe les pieds.' }),
  lean: (): Criterion => ({ key: 'lean', label: 'Lean (épaules devant les mains)', get: (m) => m.lean, good: 0.45, bad: 0.05, unit: '×', target: '≥ 0.4 buste', tip: 'Avance les épaules au-delà des poignets : c\'est le levier qui rend la planche possible.' }),
}

const PROFILES: Record<AnalyzerProfile, Criterion[]> = {
  planche: [C.elbowLock(), C.line(150), C.horizontal(), C.hipLevel(), C.knees(), C.lean()],
  bentPlanche: [
    { key: 'elbow90', label: 'Coudes à 90°', get: (m) => Math.abs(m.elbow - 90), good: 8, bad: 40, unit: '° d\'écart', target: '90° ± 10', tip: 'Avant-bras verticaux, coudes fléchis à 90°.', critical: 35 },
    C.line(150), C.horizontal(), C.knees(),
  ],
  frontLever: [C.elbowLock(), C.line(150), C.horizontal(), C.hipLevel(), C.knees()],
  backLever: [C.elbowLock(), C.line(150), C.horizontal(), C.hipLevel(), C.knees()],
  handstand: [
    { key: 'vertical', label: 'Verticalité poignets-chevilles', get: (m) => Math.abs(m.vertical), good: 3, bad: 25, unit: '°', target: '≤ 4°', tip: 'Empile poignets, épaules, hanches et chevilles sur une même verticale.', critical: 20 },
    { key: 'shoulder', label: 'Ouverture des épaules', get: (m) => m.shoulder, good: 176, bad: 145, unit: '°', target: '≥ 172°', tip: 'Pousse le sol et ouvre les épaules (bras à côté des oreilles).' },
    C.line(150), C.elbowLock(150), C.knees(),
  ],
  lsit: [
    { key: 'hip90', label: 'Angle de hanche 90°', get: (m) => Math.abs(m.hip - 90), good: 8, bad: 40, unit: '° d\'écart', target: '90° ± 10', tip: 'Monte les jambes jusqu\'à l\'horizontale par la compression.', critical: 35 },
    { key: 'legs', label: 'Jambes horizontales', get: (m) => m.legTilt, good: 4, bad: 30, unit: '°', target: '≤ 5°', tip: 'Les pieds ne doivent pas descendre sous les hanches.' },
    C.knees(), C.elbowLock(150),
  ],
  vsit: [
    { key: 'compress', label: 'Compression (angle de hanche)', get: (m) => m.hip, good: 35, bad: 95, unit: '°', target: '≤ 40°', tip: 'Ferme l\'angle de hanche : pense « jambes vers le visage ».', critical: 85 },
    C.knees(), C.elbowLock(150),
  ],
  flag: [C.horizontal(), C.line(150), C.knees()],
  elbowLever: [
    { key: 'elbow90', label: 'Coudes ~90°', get: (m) => Math.abs(m.elbow - 90), good: 10, bad: 45, unit: '° d\'écart', target: '90° ± 15', tip: 'Coudes plantés dans les hanches.', critical: 40 },
    C.horizontal(), C.line(150),
  ],
  support: [C.elbowLock(), { key: 'upright', label: 'Corps vertical', get: (m) => 90 - m.bodyTilt, good: 5, bad: 30, unit: '°', target: '≤ 8°', tip: 'Reste droit, épaules basses.', critical: 30 }],
  pushReps: [C.line(), C.knees()],
  pullReps: [C.knees()],
  dipReps: [C.knees()],
  hspuReps: [C.line(), C.knees()],
  squatReps: [],
  generic: [C.line(), C.knees(), C.elbowLock()],
}

// Les variantes groupées (tuck, straddle…) n'exigent pas certaines lignes.
function criteriaFor(skill: Skill) {
  let crit = PROFILES[skill.profile]
  const n = skill.id
  if (/tuck/.test(n)) crit = crit.filter((c) => !['line', 'knee', 'tilt'].includes(c.key)).concat(C.torsoHorizontal())
  if (/one-leg|straddle|half-lay/.test(n)) crit = crit.filter((c) => c.key !== 'knee')
  if (/lean/.test(n)) crit = [C.elbowLock(), C.line(150), C.lean()]
  return crit
}

const scoreOf = (c: Criterion, v: number) => {
  const lo = Math.min(c.good, c.bad)
  const hi = Math.max(c.good, c.bad)
  const clamped = Math.max(lo, Math.min(hi, v))
  return Math.round(((10 * (c.bad - clamped)) / (c.bad - c.good)) * 10) / 10
}
const isValid = (c: Criterion, v: number) => c.critical === undefined || (c.good > c.bad ? v >= c.critical : v <= c.critical)

// ---------- Répétitions ----------
interface RepCfg { signal: (m: Metrics) => number; low: number; high: number; depthTarget: number; lockTarget: number; depthLabel: string }
const REPS: Partial<Record<AnalyzerProfile, RepCfg>> = {
  pushReps: { signal: (m) => m.elbow, low: 105, high: 150, depthTarget: 85, lockTarget: 168, depthLabel: 'Amplitude basse (coude ≤ 90°)' },
  dipReps: { signal: (m) => m.elbow, low: 105, high: 150, depthTarget: 88, lockTarget: 168, depthLabel: 'Profondeur (coude ≤ 90°)' },
  hspuReps: { signal: (m) => m.elbow, low: 105, high: 150, depthTarget: 80, lockTarget: 168, depthLabel: 'Profondeur (coude ≤ 80°)' },
  pullReps: { signal: (m) => m.elbow, low: 95, high: 145, depthTarget: 55, lockTarget: 160, depthLabel: 'Hauteur (coude ≤ 55°, menton > barre)' },
  squatReps: { signal: (m) => m.knee, low: 110, high: 155, depthTarget: 60, lockTarget: 165, depthLabel: 'Profondeur (genou ≤ 60°)' },
}

function countReps(frames: Frame[], cfg: RepCfg) {
  const reps: { start: number; end: number; min: number; max: number }[] = []
  let state: 'up' | 'down' = 'up'
  let cur = { start: 0, min: 999, max: 0 }
  let lastMax = 0
  for (const f of frames) {
    if (!f.m) continue
    const v = cfg.signal(f.m)
    if (state === 'up') {
      lastMax = Math.max(lastMax, v)
      if (v < cfg.low) {
        state = 'down'
        cur = { start: f.t, min: v, max: lastMax }
      }
    } else {
      cur.min = Math.min(cur.min, v)
      if (v > cfg.high) {
        state = 'up'
        lastMax = v
        reps.push({ ...cur, end: f.t })
      }
    }
  }
  // complète le verrouillage final de chaque rep
  return reps
}

// ---------- Analyse globale ----------
export function evaluate(skillId: string, frames: Frame[], mode: 'video' | 'photo'): Omit<Analysis, 'id' | 'date' | 'thumbnail'> & { frames: Frame[] } {
  const skill = SKILL_BY_ID[skillId]
  const crit = criteriaFor(skill)
  const detected = frames.filter((f) => f.pts)
  for (const f of detected) {
    f.m = metrics(f.pts!)
    f.fails = crit.filter((c) => !isValid(c, c.get(f.m!))).map((c) => c.key)
    if (skill.profile === 'handstand' && !f.m.inverted) f.fails.push('inverted')
    f.ok = f.fails.length === 0
  }

  const repCfg = REPS[skill.profile]
  // Segment de hold valide le plus long (tolère 0.3 s de perte de détection).
  let best = { start: 0, end: 0 }
  let curStart: number | null = null
  let lastOk = -1
  for (const f of frames) {
    if (f.ok) {
      if (curStart === null || f.t - lastOk > 0.3) curStart = f.t
      lastOk = f.t
      if (lastOk - curStart > best.end - best.start) best = { start: curStart, end: lastOk }
    }
  }
  const holdSeconds = mode === 'photo' || repCfg ? 0 : Math.round((best.end - best.start) * 10) / 10
  const window = holdSeconds > 0.5 ? detected.filter((f) => f.t >= best.start && f.t <= best.end) : detected

  const criteria: Analysis['criteria'] = crit.map((c) => {
    const vals = window.map((f) => c.get(f.m!)).sort((a, b) => a - b)
    const med = vals.length ? vals[Math.floor(vals.length / 2)] : NaN
    const sc = Number.isFinite(med) ? scoreOf(c, med) : 0
    return { key: c.key, label: c.label, score: sc, value: Number.isFinite(med) ? `${c.unit === '' || c.unit === '×' ? med.toFixed(2) : Math.round(med)}${c.unit === '×' ? '' : c.unit.startsWith('°') ? '°' : ''}` : '—', target: c.target, tip: c.tip }
  })

  let reps: number | undefined
  if (repCfg) {
    const rs = countReps(detected, repCfg)
    reps = rs.length
    if (rs.length) {
      const depth = rs.map((r) => (r.min <= repCfg.depthTarget ? 10 : Math.max(0, 10 - (r.min - repCfg.depthTarget) / 4)))
      const lock = rs.map((r) => (r.max >= repCfg.lockTarget ? 10 : Math.max(0, 10 - (repCfg.lockTarget - r.max) / 3)))
      const durs = rs.map((r) => r.end - r.start)
      const meanDur = durs.reduce((a, b) => a + b, 0) / durs.length
      const cv = durs.length > 1 ? Math.sqrt(durs.reduce((a, d) => a + (d - meanDur) ** 2, 0) / durs.length) / meanDur : 0
      const avg = (a: number[]) => Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10
      criteria.unshift(
        { key: 'depth', label: repCfg.depthLabel, score: avg(depth), value: `${Math.round(Math.min(...rs.map((r) => r.min)))}° min`, target: `≤ ${repCfg.depthTarget}°`, tip: 'Va chercher l\'amplitude complète à chaque répétition.' },
        { key: 'lock', label: 'Verrouillage en haut', score: avg(lock), value: `${Math.round(avg(rs.map((r) => r.max)))}° moy.`, target: `≥ ${repCfg.lockTarget}°`, tip: 'Termine chaque rep bras complètement tendus.' },
        { key: 'tempo', label: 'Régularité du tempo', score: Math.round(Math.max(0, 10 - cv * 25) * 10) / 10, value: `${meanDur.toFixed(1)} s/rep`, target: 'variation < 15 %', tip: 'Garde un rythme constant : la fatigue se voit dans le tempo.' },
      )
    }
  }

  // Stabilité : oscillation des hanches pendant le hold
  if (!repCfg && mode === 'video' && window.length > 5) {
    const xs = window.map((f) => f.m!.hipX)
    const ys = window.map((f) => f.m!.hipY)
    const sd = (a: number[]) => {
      const mu = a.reduce((x, y) => x + y, 0) / a.length
      return Math.sqrt(a.reduce((x, y) => x + (y - mu) ** 2, 0) / a.length)
    }
    const wob = Math.hypot(sd(xs), sd(ys))
    criteria.push({ key: 'stability', label: 'Stabilité (oscillations)', score: Math.round(Math.max(0, Math.min(10, (10 * (0.12 - wob)) / 0.1)) * 10) / 10, value: `${(wob * 100).toFixed(1)} % buste`, target: '< 3 %', tip: 'Réduis les oscillations : gainage total, respiration courte et contrôlée.' })
  }
  if (repCfg && mode === 'video' && !reps) {
    criteria.unshift({ key: 'reps', label: 'Répétitions complètes détectées', score: 0, value: '0', target: `≥ ${skill.standard}`, tip: 'Aucune répétition complète : vérifie le cadrage de profil et va chercher toute l\'amplitude.' })
  }
  if (!repCfg && mode === 'video') {
    const ratio = Math.min(1, holdSeconds / skill.standard)
    criteria.push({ key: 'duration', label: 'Durée validée vs standard', score: Math.round(ratio * 100) / 10, value: `${holdSeconds} s`, target: `${skill.standard} s`, tip: 'Accumule du temps sous tension sur la progression actuelle pour allonger le hold.' })
  }

  const detRate = frames.length ? detected.length / frames.length : 0
  // Les critères éliminatoires (ceux qui invalident un hold) pèsent double.
  const criticalKeys = new Set(crit.filter((c) => c.critical !== undefined).map((c) => c.key))
  const weight = (k: string) => (criticalKeys.has(k) || k === 'duration' || k === 'depth' || k === 'reps' ? 2 : 1)
  const wSum = criteria.reduce((n, c) => n + weight(c.key), 0)
  let score = wSum ? Math.round((criteria.reduce((n, c) => n + c.score * weight(c.key), 0) / wSum) * 10) / 10 : 0
  // Forme non validée sur la vidéo : la note est plafonnée.
  if (mode === 'video' && !repCfg && holdSeconds < 0.5) score = Math.min(score, 5)
  if (mode === 'photo' && detected[0]?.ok === false) score = Math.min(score, 6)
  if (repCfg && mode === 'video' && !reps) score = Math.min(score, 4)
  const worst = [...criteria].sort((a, b) => a.score - b.score)[0]
  const verdict =
    detRate < 0.4
      ? 'Détection faible : filme de profil, corps entier dans le cadre, bonne lumière, fond dégagé.'
      : score >= 9
        ? 'Exécution de niveau compétition. Rien à redire, la forme est propre.'
        : score >= 8
          ? `Très propre. Dernier détail à polir : ${worst?.label.toLowerCase()}.`
          : score >= 6.5
            ? `Bonne base. Priorité : ${worst?.label.toLowerCase()} — ${worst?.tip}`
            : score >= 5
              ? `Forme approximative. Corrige d'abord : ${worst?.label.toLowerCase()}. Envisage la progression précédente pour gagner en qualité.`
              : 'Forme non validée. Reviens à la progression précédente et travaille la technique.'
  const difficulty = skill.tier
  return {
    skillId,
    mode,
    score,
    holdSeconds,
    reps,
    criteria,
    verdict,
    judge: { execution: score, difficulty, total: Math.round(difficulty * score * 10) / 10 },
    frames,
  }
}

export async function analyzeVideo(file: File | string, skillId: string, onProgress: (p: number) => void, fps = 15) {
  const lm = await getLandmarker('VIDEO')
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = typeof file === 'string' ? file : URL.createObjectURL(file)
  await new Promise<void>((res, rej) => {
    video.onloadeddata = () => res()
    video.onerror = () => rej(new Error('Vidéo illisible'))
  })
  const duration = Math.min(video.duration || 0, 90)
  const step = 1 / fps
  const frames: Frame[] = []
  const seek = (t: number) => new Promise<void>((res) => {
    video.onseeked = () => res()
    video.currentTime = t
  })
  let ts = 0
  for (let t = 0; t <= duration; t += step) {
    await seek(t)
    ts += 1000 / fps
    const res = lm.detectForVideo(video, ts)
    const l = res.landmarks[0]
    frames.push({ t, pts: l ? l.map((p) => ({ x: p.x * video.videoWidth, y: p.y * video.videoHeight, v: p.visibility ?? 1 })) : null })
    onProgress(t / duration)
  }
  const result = evaluate(skillId, frames, 'video')
  // vignette au milieu du meilleur passage
  const mid = frames.find((f) => f.ok)?.t ?? duration / 2
  await seek(mid)
  const thumbnail = snapshot(video, 220)
  return { ...result, id: uid(), date: new Date().toISOString(), thumbnail, videoUrl: video.src, size: { w: video.videoWidth, h: video.videoHeight } }
}

export async function analyzePhoto(file: File, skillId: string) {
  const lm = await getLandmarker('IMAGE')
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await img.decode()
  const res = lm.detect(img)
  const l = res.landmarks[0]
  const frames: Frame[] = [{ t: 0, pts: l ? l.map((p) => ({ x: p.x * img.naturalWidth, y: p.y * img.naturalHeight, v: p.visibility ?? 1 })) : null }]
  const result = evaluate(skillId, frames, 'photo')
  return { ...result, id: uid(), date: new Date().toISOString(), thumbnail: snapshot(img, 220), imageUrl: img.src, size: { w: img.naturalWidth, h: img.naturalHeight } }
}

function snapshot(src: HTMLVideoElement | HTMLImageElement, w: number) {
  const sw = src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth
  const sh = src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight
  const c = document.createElement('canvas')
  c.width = w
  c.height = Math.round((sh / sw) * w) || w
  c.getContext('2d')!.drawImage(src, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.6)
}

export const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [15, 19], [16, 20],
]

export function drawSkeleton(ctx: CanvasRenderingContext2D, f: Frame, scale: number) {
  if (!f.pts) return
  const color = f.ok ? '#ff7a1a' : '#ff3b30'
  ctx.lineWidth = Math.max(3, 4 * scale)
  ctx.lineCap = 'round'
  ctx.strokeStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 12
  for (const [a, b] of BONES) {
    const p = f.pts[a], q = f.pts[b]
    if (!p || !q || p.v < 0.3 || q.v < 0.3) continue
    ctx.beginPath()
    ctx.moveTo(p.x * scale, p.y * scale)
    ctx.lineTo(q.x * scale, q.y * scale)
    ctx.stroke()
  }
  ctx.shadowBlur = 0
  ctx.fillStyle = '#fff'
  for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    const p = f.pts[i]
    if (!p || p.v < 0.3) continue
    ctx.beginPath()
    ctx.arc(p.x * scale, p.y * scale, Math.max(3, 5 * scale), 0, Math.PI * 2)
    ctx.fill()
  }
  if (f.m) {
    const I = IDX[f.m.side]
    const label = (i: number, txt: string) => {
      const p = f.pts![i]
      ctx.font = `bold ${Math.max(12, 15 * scale)}px Inter, sans-serif`
      ctx.fillStyle = '#100a07cc'
      const w = ctx.measureText(txt).width
      ctx.fillRect(p.x * scale + 8, p.y * scale - 18, w + 10, 22)
      ctx.fillStyle = '#fff'
      ctx.fillText(txt, p.x * scale + 13, p.y * scale - 2)
    }
    label(I.e, `${Math.round(f.m.elbow)}°`)
    label(I.h, `${Math.round(f.m.bodyLine)}°`)
    label(I.k, `${Math.round(f.m.knee)}°`)
  }
}

export function liveCheck(skillId: string, pts: Pt[]) {
  const skill = SKILL_BY_ID[skillId]
  const crit = criteriaFor(skill)
  const m = metrics(pts)
  const fails = crit.filter((c) => !isValid(c, c.get(m)))
  const scores = crit.map((c) => ({ label: c.label, score: scoreOf(c, c.get(m)), tip: c.tip }))
  const inverted = skill.profile !== 'handstand' || m.inverted
  return { ok: fails.length === 0 && inverted, m, fails: fails.map((f) => f.label), scores }
}
