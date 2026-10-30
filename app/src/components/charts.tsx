// Graphiques SVG légers : une série = une couleur, traits fins, grille
// discrète, info-bulle au toucher.
import { motion } from 'framer-motion'
import { useState } from 'react'

const INK = { grid: '#ffffff12', axis: '#ffffff59', text: '#ffffffb3' }

export function LineChart({
  data,
  height = 170,
  color = '#ff7a1a',
  unit = '',
  target,
  trend,
  format = (v: number) => String(Math.round(v * 10) / 10),
}: {
  data: { x: number; y: number; label: string }[]
  height?: number
  color?: string
  unit?: string
  target?: number
  trend?: { slope: number; intercept: number; untilX?: number }
  format?: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 340
  const pad = { l: 30, r: 10, t: 12, b: 22 }
  if (data.length === 0) return <div className="grid h-24 place-items-center text-sm text-white/55">Pas encore de données</div>
  const xs = data.map((d) => d.x)
  const xMax = Math.max(...xs, trend?.untilX ?? -Infinity)
  const xMin = Math.min(...xs)
  const yVals = [...data.map((d) => d.y), target ?? 0, 0]
  if (trend?.untilX !== undefined) yVals.push(trend.slope * trend.untilX + trend.intercept)
  const yMax = Math.max(...yVals) * 1.12 || 1
  const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin || 1)) * (W - pad.l - pad.r)
  const sy = (y: number) => height - pad.b - (y / yMax) * (height - pad.t - pad.b)
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${sx(d.x)},${sy(d.y)}`).join('')
  const ticks = [0, yMax / 2, yMax].map((v) => Math.round(v))
  const h = hover !== null ? data[hover] : null
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full touch-none" onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - r.left) / r.width) * W
          let best = 0
          data.forEach((d, i) => (Math.abs(sx(d.x) - px) < Math.abs(sx(data[best].x) - px) ? (best = i) : 0))
          setHover(best)
        }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke={INK.grid} />
            <text x={pad.l - 6} y={sy(t) + 3} textAnchor="end" fontSize="9" fill={INK.axis}>{t}</text>
          </g>
        ))}
        {target !== undefined && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={sy(target)} y2={sy(target)} stroke="#ffb000" strokeDasharray="4 4" strokeWidth={1.5} />
            <text x={W - pad.r} y={sy(target) - 4} textAnchor="end" fontSize="9" fill="#ffb000">objectif {target}{unit}</text>
          </g>
        )}
        {trend && (
          <line x1={sx(xMin)} y1={sy(Math.max(0, trend.slope * xMin + trend.intercept))} x2={sx(trend.untilX ?? xMax)} y2={sy(Math.max(0, trend.slope * (trend.untilX ?? xMax) + trend.intercept))} stroke={color} strokeOpacity={0.45} strokeDasharray="2 5" strokeWidth={2} />
        )}
        <motion.path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
        {data.map((d, i) => (
          <circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={hover === i ? 5 : 3.5} fill={color} stroke="#21150f" strokeWidth={2} />
        ))}
        {h && <line x1={sx(h.x)} x2={sx(h.x)} y1={pad.t} y2={height - pad.b} stroke="#ffffff40" />}
        <text x={pad.l} y={height - 6} fontSize="9" fill={INK.axis}>{data[0].label}</text>
        <text x={W - pad.r} y={height - 6} textAnchor="end" fontSize="9" fill={INK.axis}>{data[data.length - 1].label}</text>
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-ink-950/95 px-2 py-1 text-xs" style={{ left: `${Math.min(70, (sx(h.x) / W) * 100)}%` }}>
          <div className="text-white/65">{h.label}</div>
          <div className="font-bold text-white">{format(h.y)}{unit}</div>
        </div>
      )}
    </div>
  )
}

export function BarChart({ data, height = 140, color = '#ff3d6e', unit = '' }: { data: { label: string; value: number }[]; height?: number; color?: string; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 340
  const pad = { l: 6, r: 6, t: 18, b: 20 }
  const max = Math.max(1, ...data.map((d) => d.value))
  const bw = (W - pad.l - pad.r) / data.length
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" onPointerLeave={() => setHover(null)}>
      <line x1={pad.l} x2={W - pad.r} y1={height - pad.b} y2={height - pad.b} stroke={INK.grid} />
      {data.map((d, i) => {
        const bh = (d.value / max) * (height - pad.t - pad.b)
        const x = pad.l + i * bw + 2
        const w = bw - 4
        const y = height - pad.b - bh
        return (
          <g key={i} onPointerEnter={() => setHover(i)} onClick={() => setHover(i)}>
            <rect x={pad.l + i * bw} y={pad.t} width={bw} height={height - pad.t - pad.b} fill="transparent" />
            <motion.path
              d={bh > 0 ? `M${x},${height - pad.b} V${y + Math.min(4, bh)} Q${x},${y} ${x + Math.min(4, w / 2)},${y} H${x + w - Math.min(4, w / 2)} Q${x + w},${y} ${x + w},${y + Math.min(4, bh)} V${height - pad.b} Z` : ''}
              fill={color}
              fillOpacity={hover === null || hover === i ? 1 : 0.45}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            />
            {(i === data.length - 1 || hover === i) && d.value > 0 && (
              <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={INK.text}>{Math.round(d.value)}{unit}</text>
            )}
            {i % Math.ceil(data.length / 6) === 0 && (
              <text x={x + w / 2} y={height - 6} textAnchor="middle" fontSize="9" fill={INK.axis}>{d.label}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function Radar({ axes, size = 260, color = '#ff7a1a' }: { axes: { label: string; value: number }[]; size?: number; color?: string }) {
  const c = size / 2
  const R = size / 2 - 42
  const n = axes.length
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v]
  }
  const poly = axes.map((a, i) => pt(i, Math.max(0.04, a.value)).join(',')).join(' ')
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[300px]">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={axes.map((_, i) => pt(i, r).join(',')).join(' ')} fill="none" stroke={INK.grid} />
      ))}
      {axes.map((a, i) => {
        const [x, y] = pt(i, 1)
        const [lx, ly] = pt(i, 1.2)
        return (
          <g key={a.label}>
            <line x1={c} y1={c} x2={x} y2={y} stroke={INK.grid} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill={INK.text}>{a.label}</text>
            <text x={lx} y={ly + 11} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill={INK.axis}>{Math.round(a.value * 100)}</text>
          </g>
        )
      })}
      <motion.polygon points={poly} fill={color + '33'} stroke={color} strokeWidth={2} initial={{ scale: 0, originX: '50%', originY: '50%' }} animate={{ scale: 1 }} transition={{ duration: 0.7 }} style={{ transformOrigin: `${c}px ${c}px` }} />
    </svg>
  )
}

export function Ring({ value, size = 64, stroke = 7, color = '#ff7a1a', children }: { value: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#ffffff14" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - Math.max(0, Math.min(1, value))) }} transition={{ duration: 1 }} style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
