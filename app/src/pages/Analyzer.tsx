import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CoachTour } from '../components/CoachTour'
import { Ring } from '../components/charts'
import { Bar, Header, Page, Section, Segmented, SkillPicker, TierBadge } from '../components/ui'
import { SKILL_BY_ID, unitOf } from '../data/skills'
import { buzz, endBeep, keepAwake, say } from '../lib/feedback'
import { analyzePhoto, analyzeVideo, drawSkeleton, getLandmarker, liveCheck, type Frame } from '../lib/pose'
import { fmtDate } from '../lib/stats'
import { useStore } from '../lib/store'
import type { Analysis } from '../lib/types'
import { Icon } from '../components/Icon'

type Result = Analysis & { frames: Frame[]; videoUrl?: string; imageUrl?: string; size: { w: number; h: number } }

function scoreColor(v: number) {
  return v >= 8 ? '#ff7a1a' : v >= 6 ? '#ffb000' : '#ff3b30'
}

function ResultView({ r, onSave, saved }: { r: Result; onSave: () => void; saved: boolean }) {
  const vid = useRef<HTMLVideoElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const [overlay, setOverlay] = useState(true)
  const skill = SKILL_BY_ID[r.skillId]

  useEffect(() => {
    const canvas = cv.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const draw = () => {
      const w = canvas.clientWidth
      const scale = w / r.size.w
      canvas.width = w * devicePixelRatio
      canvas.height = r.size.h * scale * devicePixelRatio
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (overlay) {
        const t = vid.current?.currentTime ?? 0
        let f = r.frames[0]
        for (const x of r.frames) if (Math.abs(x.t - t) < Math.abs(f.t - t)) f = x
        if (f) drawSkeleton(ctx, f, scale)
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [r, overlay])

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        {r.videoUrl ? <video ref={vid} src={r.videoUrl} className="block w-full" controls playsInline loop muted /> : <img src={r.imageUrl} className="block w-full" />}
        <canvas ref={cv} className="pointer-events-none absolute left-0 top-0 w-full" />
      </div>
      <button className="chip mt-2" onClick={() => setOverlay(!overlay)}>{overlay ? 'Masquer' : 'Afficher'} le squelette</button>

      <div className="card-hi mt-3 flex items-center gap-4">
        <Ring value={r.score / 10} size={96} stroke={9} color={scoreColor(r.score)}>
          <div className="text-center">
            <div className="h-display text-4xl leading-none">{r.score}</div>
            <div className="text-[9px] text-white/65">/10</div>
          </div>
        </Ring>
        <div className="flex-1 text-sm">
          <div className="flex items-center gap-2"><TierBadge tier={skill.tier} /><b>{skill.name}</b></div>
          {r.mode === 'video' && r.reps === undefined && <div className="mt-1">Hold valide : <b className="text-volt">{r.holdSeconds} s</b> / {skill.standard} s</div>}
          {r.reps !== undefined && <div className="mt-1">Répétitions détectées : <b className="text-volt">{r.reps}</b></div>}
          <div className="mt-1 text-xs text-white/70">Jury : difficulté {r.judge.difficulty} × exécution {r.judge.execution} = <b className="text-gold">{r.judge.total}</b></div>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-white/[0.04] p-3 text-sm text-white/80">{r.verdict}</p>

      <Section title="Notes détaillées" className="mt-4">
        <div className="card space-y-3">
          {r.criteria.map((c) => (
            <div key={c.key}>
              <div className="flex justify-between text-sm">
                <span>{c.label}</span>
                <b style={{ color: scoreColor(c.score) }}>{c.score}/10</b>
              </div>
              <div className="my-1"><Bar value={c.score / 10} color={scoreColor(c.score)} /></div>
              <div className="flex justify-between text-[11px] text-white/60"><span>mesuré : {c.value}</span><span>cible : {c.target}</span></div>
              {c.score < 8 && <div className="mt-1 flex gap-1.5 text-[11px] text-white/75"><Icon name="bulb" size={14} className="mt-px text-gold" /><span>{c.tip}</span></div>}
            </div>
          ))}
        </div>
      </Section>
      <button className="btn-primary w-full !py-4" disabled={saved} onClick={onSave}>{saved ? '✓ Enregistrée dans ton profil' : 'Enregistrer l\'analyse'}</button>
    </div>
  )
}

function Live({ skillId }: { skillId: string }) {
  const vid = useRef<HTMLVideoElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const [on, setOn] = useState(false)
  const [err, setErr] = useState('')
  const [hold, setHold] = useState(0)
  const [best, setBest] = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; fails: string[]; scores: { label: string; score: number }[] } | null>(null)
  const addRecord = useStore((s) => s.addRecord)
  const skill = SKILL_BY_ID[skillId]

  useEffect(() => {
    if (!on) return
    let stream: MediaStream | null = null
    let raf = 0
    let alive = true
    let okSince: number | null = null
    let lastOk = 0
    let lastSay = 0
    let bestLocal = 0
    ;(async () => {
      try {
        keepAwake(true)
        const lm = await getLandmarker('VIDEO')
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
        const v = vid.current!
        v.srcObject = stream
        await v.play()
        const loop = () => {
          if (!alive) return
          const now = performance.now()
          const res = lm.detectForVideo(v, now)
          const l = res.landmarks[0]
          const canvas = cv.current!
          const ctx = canvas.getContext('2d')!
          const w = canvas.clientWidth
          const scale = w / v.videoWidth
          canvas.width = w
          canvas.height = v.videoHeight * scale
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          if (l) {
            const pts = l.map((p) => ({ x: p.x * v.videoWidth, y: p.y * v.videoHeight, v: p.visibility ?? 1 }))
            const chk = liveCheck(skillId, pts)
            drawSkeleton(ctx, { t: 0, pts, ok: chk.ok, m: chk.m }, scale)
            setFeedback(chk)
            if (chk.ok) {
              lastOk = now
              if (okSince === null) {
                okSince = now
                buzz()
              }
            } else if (okSince !== null && now - lastOk > 350) {
              const dur = (lastOk - okSince) / 1000
              if (dur > bestLocal) {
                bestLocal = dur
                setBest(Math.round(dur * 10) / 10)
              }
              if (dur > 1 && now - lastSay > 2500) {
                say(`${dur.toFixed(1)} secondes. ${chk.fails[0] ?? ''}`)
                lastSay = now
              }
              okSince = null
            }
            if (okSince !== null) {
              const d = (now - okSince) / 1000
              setHold(d)
              if (Math.floor(d) === skill.standard && d - skill.standard < 0.05) endBeep()
            } else setHold(0)
          }
          raf = requestAnimationFrame(loop)
        }
        loop()
      } catch (e) {
        setErr((e as Error).message || 'Caméra indisponible')
        setOn(false)
      }
    })()
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      keepAwake(false)
    }
  }, [on, skillId, skill.standard])

  return (
    <div>
      <p className="mb-2 text-xs text-white/70">Pose le téléphone au sol, de profil, corps entier visible. Le chrono démarre seul quand ta forme est valide et s'arrête quand elle casse.</p>
      <div className="relative min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video ref={vid} className="block w-full" playsInline muted />
        <canvas ref={cv} className="pointer-events-none absolute left-0 top-0 w-full" />
        {on && (
          <div className="absolute right-2 top-2 rounded-xl bg-ink-950/80 px-3 py-2 text-center">
            <div className="h-display text-4xl leading-none" style={{ color: feedback?.ok ? '#ff7a1a' : '#ff3b30' }}>{hold.toFixed(1)}</div>
            <div className="text-[10px] text-white/65">record séance {best} s</div>
          </div>
        )}
      </div>
      {err && <p className="mt-2 text-sm text-ember">{err}</p>}
      {feedback && on && (
        <div className="card mt-2 space-y-1.5 !p-3">
          {feedback.scores.map((x) => (
            <div key={x.label} className="flex items-center gap-2 text-xs">
              <span className="w-40 truncate text-white/70">{x.label}</span>
              <div className="flex-1"><Bar value={x.score / 10} color={scoreColor(x.score)} h={5} /></div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={() => setOn(!on)}>{on ? '■ Arrêter' : '▶ Caméra en direct'}</button>
        <button className="btn-ghost" disabled={!best} onClick={() => (addRecord({ skillId, value: best, date: new Date().toISOString(), source: 'analyse' }), alert('Record enregistré'))}><Icon name="save" size={18} /> Enregistrer {best || ''} s</button>
      </div>
    </div>
  )
}

export default function Analyzer() {
  const [params] = useSearchParams()
  const s = useStore()
  const [skillId, setSkillId] = useState(params.get('skill') ?? s.profile?.goalSkills[0]?.skillId ?? 'full-planche')
  const [mode, setMode] = useState<'video' | 'photo' | 'live'>('video')
  const [picker, setPicker] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const skill = SKILL_BY_ID[skillId]
  const fileRef = useRef<HTMLInputElement>(null)

  const run = async (file: File) => {
    setError('')
    setResult(null)
    setSaved(false)
    setBusy(0)
    try {
      const r = mode === 'video' ? await analyzeVideo(file, skillId, (p) => setBusy(p)) : await analyzePhoto(file, skillId)
      setResult(r as Result)
      say(`Analyse terminée. Note ${String(r.score).replace('.', ',')} sur 10.`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const save = () => {
    if (!result) return
    const { id, date, skillId: sid, mode: m, score, holdSeconds, reps, criteria, verdict, judge, thumbnail } = result
    s.addAnalysis({ id, date, skillId: sid, mode: m, score, holdSeconds, reps, criteria, verdict, judge, thumbnail })
    setSaved(true)
  }

  const history = [...s.analyses].reverse()

  return (
    <Page>
      <Header title="Analyseur" sub="Biomécanique par IA, 100 % sur ton téléphone" back />
      <button className="card flex w-full items-center gap-3 text-left" onClick={() => setPicker(true)}>
        <TierBadge tier={skill.tier} size="lg" />
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">Figure analysée</div>
          <div className="font-bold">{skill.name}</div>
          <div className="text-xs text-white/60">Standard : {skill.standard} {unitOf(skill)}</div>
        </div>
        <span className="text-white/55">›</span>
      </button>

      <div className="mt-3">
        <Segmented value={mode} onChange={(m) => (setMode(m), setResult(null))} options={[{ v: 'video', l: <span className="inline-flex items-center gap-1.5"><Icon name="film" size={16} />Vidéo</span> }, { v: 'photo', l: <span className="inline-flex items-center gap-1.5"><Icon name="photo" size={16} />Photo</span> }, { v: 'live', l: <span className="inline-flex items-center gap-1.5"><Icon name="live" size={16} />Direct</span> }]} />
      </div>

      <div className="mt-3">
        {mode === 'live' ? (
          <Live skillId={skillId} key={skillId} />
        ) : (
          <>
            <div className="card text-xs text-white/60">
              <b className="text-white">Pour une précision maximale :</b> filme de profil (perpendiculaire), téléphone fixe à hauteur de hanche, corps entier dans le cadre, bonne lumière, vêtements près du corps. {mode === 'video' ? 'Jusqu\'à 90 s analysées à 15 images/s.' : ''}
            </div>
            <input ref={fileRef} type="file" accept={mode === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} />
            <button className="btn-primary mt-3 w-full !py-4" disabled={busy !== null} onClick={() => fileRef.current?.click()}>
              {busy !== null ? `Analyse en cours… ${Math.round(busy * 100)} %` : mode === 'video' ? 'Choisir / filmer une vidéo' : 'Choisir / prendre une photo'}
            </button>
            {busy !== null && <div className="mt-2"><Bar value={busy} /></div>}
            {error && <p className="mt-2 text-sm text-ember">{error}</p>}
          </>
        )}
      </div>

      {result && (
        <div className="mt-5">
          <ResultView r={result} onSave={save} saved={saved} />
        </div>
      )}

      {history.length > 0 && (
        <Section title="Historique des analyses" className="mt-6">
          <div className="space-y-2">
            {history.slice(0, 30).map((a) => (
              <div key={a.id} className="card flex items-center gap-3 !p-2.5">
                {a.thumbnail ? <img src={a.thumbnail} className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-white/5" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{SKILL_BY_ID[a.skillId]?.name}</div>
                  <div className="text-[11px] text-white/60">{fmtDate(a.date)} · {a.mode} {a.holdSeconds ? `· ${a.holdSeconds} s` : ''} {a.reps !== undefined ? `· ${a.reps} reps` : ''}</div>
                </div>
                <div className="h-display text-3xl" style={{ color: scoreColor(a.score) }}>{a.score}</div>
                <button className="text-white/45" onClick={() => confirm('Supprimer ?') && s.deleteAnalysis(a.id)}>✕</button>
              </div>
            ))}
          </div>
        </Section>
      )}
      <CoachTour id="analyzer" steps={[`L'analyseur mesure tes angles en direct grâce à l'IA, sans internet.`, `Filme-toi de profil, corps entier. Je note chaque critère sur 10 et je chronomètre ton hold valide.`, `Une note de 8 ou plus au standard = figure certifiée. Ça booste tes points de rang !`]} />
      <SkillPicker open={picker} onClose={() => setPicker(false)} onPick={(x) => (setSkillId(x.id), setResult(null))} />
    </Page>
  )
}
