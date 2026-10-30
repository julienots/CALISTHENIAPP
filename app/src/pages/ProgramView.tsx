import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Header, Page, Section, Sheet } from '../components/ui'
import { generateProgram, GOAL_LABEL, programToCSV } from '../lib/generator'
import { skillStatuses } from '../lib/scoring'
import { encodeShare, exportFile, shareText } from '../lib/share'
import { useStore } from '../lib/store'
import type { ProgramItem } from '../lib/types'
import { Icon } from '../components/Icon'

const BLOCK_COLOR: Record<ProgramItem['block'], string> = {
  Échauffement: '#9a8a80',
  Skill: '#ff7a1a',
  Force: '#ff3d6e',
  Assistance: '#ffcf3f',
  Agilité: '#ff5ca8',
  Conditionnement: '#ff3b30',
  Mobilité: '#e08a3c',
  Compétition: '#ffb000',
}

export default function ProgramView() {
  const { id } = useParams()
  const nav = useNavigate()
  const s = useStore()
  const prog = s.programs.find((p) => p.id === id)
  const [week, setWeek] = useState(1)
  const [sheet, setSheet] = useState<'all' | null>(null)
  const [edit, setEdit] = useState<{ day: string; idx: number } | null>(null)
  const statuses = useMemo(() => skillStatuses(s.records, s.analyses), [s.records, s.analyses])
  if (!prog) return <Page><Header title="Programme introuvable" back /></Page>
  const done = s.completedDays[prog.id] ?? []
  const days = prog.days.filter((d) => d.week === week)
  const phase = prog.phases.find((p) => p.week === week)

  const updateItem = (dayKey: string, idx: number, patch: Partial<ProgramItem>) => {
    s.saveProgram({ ...prog, days: prog.days.map((d) => (d.key === dayKey ? { ...d, items: d.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) } : d)) })
  }
  const editing = edit ? prog.days.find((d) => d.key === edit.day)?.items[edit.idx] : null

  return (
    <Page>
      <Header title={prog.name} sub={`${GOAL_LABEL[prog.params.goal]} · ${prog.params.weeks} semaines · par ${prog.author}`} back />

      <div className="grid grid-cols-2 gap-2">
        {s.activeProgramId !== prog.id ? (
          <button className="btn-primary" onClick={() => s.setActiveProgram(prog.id)}>
            Activer
          </button>
        ) : (
          <div className="btn border border-volt/40 text-volt">✓ Programme actif</div>
        )}
        <button className="btn-ghost" onClick={() => setSheet('all')}>
          <Icon name="table" size={18} /> Tableur complet
        </button>
        <button className="btn-ghost" onClick={() => exportFile(`${prog.name.replace(/[^\w-]+/g, '_')}.csv`, programToCSV(prog), 'text/csv')}>
          Export CSV
        </button>
        <button className="btn-ghost" onClick={() => shareText(prog.name, encodeShare(prog))}>
          Partager (code)
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            const np = generateProgram(prog.params, statuses, prog.author)
            s.saveProgram(np)
            nav(`/program/${np.id}`, { replace: true })
          }}
        >
          <Icon name="refresh" size={18} /> Variante
        </button>
        <button className="btn-danger" onClick={() => confirm('Supprimer ce programme ?') && (s.deleteProgram(prog.id), nav('/programs'))}>
          Supprimer
        </button>
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4">
        {prog.phases.map((p) => (
          <button key={p.week} className={week === p.week ? 'chip-on' : 'chip'} onClick={() => setWeek(p.week)}>
            S{p.week} · {p.name}
          </button>
        ))}
      </div>
      {phase && <p className="mt-2 text-xs text-white/70">{phase.intent}</p>}

      {days.map((d) => (
        <Section key={d.key} className="mt-4" title={`J${d.day} · ${d.title}`} right={<span className="text-xs text-white/60">~{d.estMinutes} min {done.includes(d.key) && '· ✅'}</span>}>
          <div className="card overflow-x-auto !p-0">
            <table className="table-x">
              <thead>
                <tr>
                  <th>Bloc</th>
                  <th>Exercice</th>
                  <th>Séries</th>
                  <th>Cible</th>
                  <th>Repos</th>
                  <th>RPE</th>
                  <th>Tempo</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((it, i) => (
                  <tr key={i} onClick={() => setEdit({ day: d.key, idx: i })} className="active:bg-white/5">
                    <td>
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ color: BLOCK_COLOR[it.block], background: BLOCK_COLOR[it.block] + '1a' }}>
                        {it.block}
                      </span>
                    </td>
                    <td className="max-w-[160px] !whitespace-normal font-semibold">
                      {it.skillId ? <Link to={`/skill/${it.skillId}`} onClick={(e) => e.stopPropagation()} className="text-volt">{it.name}</Link> : it.name}
                      {it.note && <div className="mt-0.5 text-[10px] font-normal text-white/55">{it.note}</div>}
                    </td>
                    <td className="font-bold">{it.sets}</td>
                    <td className="font-bold text-white">{it.target}</td>
                    <td>{it.rest ? `${it.rest}s` : '—'}</td>
                    <td>{it.rpe ?? '—'}</td>
                    <td>{it.tempo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link to={`/workout/${prog.id}/${d.key}`} className="btn-primary">
              ▶ Séance guidée
            </Link>
            <button className="btn-ghost" onClick={() => s.markDay(prog.id, d.key)}>
              {done.includes(d.key) ? 'Faite ✓' : 'Marquer faite'}
            </button>
          </div>
        </Section>
      ))}

      <Sheet open={sheet === 'all'} onClose={() => setSheet(null)} title="Tableur complet">
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-white/10">
          <table className="table-x">
            <thead>
              <tr>
                <th>S</th>
                <th>J</th>
                <th>Séance</th>
                <th>Bloc</th>
                <th>Exercice</th>
                <th>Sér.</th>
                <th>Cible</th>
                <th>Repos</th>
                <th>RPE</th>
              </tr>
            </thead>
            <tbody>
              {prog.days.flatMap((d) =>
                d.items.map((it, i) => (
                  <tr key={d.key + i} className={done.includes(d.key) ? 'opacity-50' : ''}>
                    <td>{d.week}</td>
                    <td>{d.day}</td>
                    <td>{i === 0 ? d.title : ''}</td>
                    <td style={{ color: BLOCK_COLOR[it.block] }}>{it.block}</td>
                    <td className="font-semibold">{it.name}</td>
                    <td>{it.sets}</td>
                    <td className="font-bold">{it.target}</td>
                    <td>{it.rest}s</td>
                    <td>{it.rpe ?? ''}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEdit(null)} title="Modifier la ligne">
        {editing && edit && (
          <div className="space-y-3">
            <div>
              <div className="label">Exercice</div>
              <input className="input" value={editing.name} onChange={(e) => updateItem(edit.day, edit.idx, { name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="label">Séries</div>
                <input className="input" type="number" value={editing.sets} onChange={(e) => updateItem(edit.day, edit.idx, { sets: Number(e.target.value) })} />
              </div>
              <div>
                <div className="label">Cible</div>
                <input className="input" value={editing.target} onChange={(e) => updateItem(edit.day, edit.idx, { target: e.target.value })} />
              </div>
              <div>
                <div className="label">Repos (s)</div>
                <input className="input" type="number" value={editing.rest} onChange={(e) => updateItem(edit.day, edit.idx, { rest: Number(e.target.value) })} />
              </div>
              <div>
                <div className="label">RPE</div>
                <input className="input" type="number" value={editing.rpe ?? ''} onChange={(e) => updateItem(edit.day, edit.idx, { rpe: Number(e.target.value) || undefined })} />
              </div>
            </div>
            <div>
              <div className="label">Note</div>
              <input className="input" value={editing.note ?? ''} onChange={(e) => updateItem(edit.day, edit.idx, { note: e.target.value })} />
            </div>
            <button className="btn-primary w-full" onClick={() => setEdit(null)}>
              OK
            </button>
          </div>
        )}
      </Sheet>
    </Page>
  )
}
