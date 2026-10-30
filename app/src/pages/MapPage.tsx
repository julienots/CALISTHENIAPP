import L from 'leaflet'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Header, Page, Section, Segmented } from '../components/ui'
import { compStatus, loadCompetitions } from '../lib/cloud'
import { uid, useStore } from '../lib/store'
import type { Competition } from '../lib/types'
import { Icon } from '../components/Icon'

const COLORS = { live: '#ff3b30', upcoming: '#ff7a1a', past: '#7a665a' }
const icon = (st: keyof typeof COLORS) =>
  L.divIcon({
    className: '',
    html: `<div class="${st === 'live' ? 'pin-live' : ''}" style="width:18px;height:18px;border-radius:50%;background:${COLORS[st]};border:3px solid #100a07;box-shadow:0 0 12px ${COLORS[st]}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })

function Fly({ to }: { to: [number, number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (to) map.flyTo([to[0], to[1]], to[2], { duration: 0.8 })
  }, [to, map])
  return null
}

function PickPoint({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

const ago = (iso?: string) => {
  if (!iso) return 'jamais'
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  return m < 1 ? 'à l\'instant' : m < 60 ? `il y a ${m} min` : `il y a ${Math.round(m / 60)} h`
}

export default function MapPage() {
  const s = useStore()
  const [items, setItems] = useState<Competition[]>(s.feedCache?.items ?? [])
  const [status, setStatus] = useState<{ online: boolean; errors: string[]; loading: boolean }>({ online: false, errors: [], loading: true })
  const [zone, setZone] = useState<'france' | 'monde'>('france')
  const [when, setWhen] = useState<'avenir' | 'tout'>('avenir')
  const [fly, setFly] = useState<[number, number, number] | null>(null)
  const [adding, setAdding] = useState<Partial<Competition> | null>(null)
  const [, force] = useState(0)

  const refresh = useCallback(async () => {
    setStatus((x) => ({ ...x, loading: true }))
    const r = await loadCompetitions()
    setItems(r.items)
    setStatus({ online: r.online, errors: r.errors, loading: false })
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 10 * 60 * 1000) // actualisation auto toutes les 10 min
    const tick = setInterval(() => force((n) => n + 1), 30000)
    const onl = () => refresh()
    window.addEventListener('online', onl)
    return () => (clearInterval(t), clearInterval(tick), window.removeEventListener('online', onl))
  }, [refresh])

  const all = useMemo(() => {
    const m = new Map<string, Competition>()
    for (const c of [...items, ...s.userCompetitions]) m.set(c.id, c)
    return [...m.values()]
  }, [items, s.userCompetitions])

  const list = all
    .filter((c) => zone === 'monde' || c.country.toLowerCase() === 'france')
    .filter((c) => when === 'tout' || compStatus(c) !== 'past')
    .sort((a, b) => {
      const order = { live: 0, upcoming: 1, past: 2 }
      return order[compStatus(a)] - order[compStatus(b)] || (compStatus(a) === 'past' ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start))
    })

  const saveNew = () => {
    if (!adding?.name || !adding.start || adding.lat === undefined) return alert('Nom, date et position (touche la carte) requis.')
    const c: Competition = { id: uid(), name: adding.name, city: adding.city ?? '', country: adding.country ?? 'France', lat: adding.lat, lng: adding.lng!, start: adding.start, end: adding.end, disciplines: (adding.disciplines as string[]) ?? [], url: adding.url, userAdded: true }
    s.addCompetition(c)
    setAdding(null)
  }

  return (
    <Page>
      <Header title="Compétitions" sub={`${status.loading ? 'Actualisation…' : status.online ? '● En ligne' : '● Hors ligne (cache)'} · MAJ ${ago(s.feedCache?.at)}`} back right={<button className="chip" onClick={refresh}>↻</button>} />
      <div className="grid grid-cols-2 gap-2">
        <Segmented value={zone} onChange={(v) => (setZone(v), setFly(v === 'france' ? [46.6, 2.4, 5] : [30, 10, 2]))} options={[{ v: 'france', l: 'France' }, { v: 'monde', l: <span className="inline-flex items-center gap-1"><Icon name="globe" size={15} />Monde</span> }]} />
        <Segmented value={when} onChange={setWhen} options={[{ v: 'avenir', l: 'À venir' }, { v: 'tout', l: 'Tout' }]} />
      </div>

      <div className="mt-3 h-[46vh] overflow-hidden rounded-2xl border border-white/10">
        <MapContainer center={[46.6, 2.4]} zoom={5} className="h-full w-full" zoomControl={false} attributionControl>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri — Esri, HERE, Garmin, &copy; OpenStreetMap" maxZoom={16} />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" maxZoom={16} />
          <Fly to={fly} />
          {adding && <PickPoint onPick={(lat, lng) => setAdding({ ...adding, lat, lng })} />}
          {list.map((c) => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={icon(compStatus(c))}>
              <Popup>
                <b>{c.name}</b>
                <br />
                {c.city} · {new Date(c.start).toLocaleDateString('fr-FR')}
                {c.url && (
                  <>
                    <br />
                    <a href={c.url} target="_blank" rel="noreferrer">Site officiel</a>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
          {adding?.lat !== undefined && <Marker position={[adding.lat, adding.lng!]} icon={icon('live')} />}
        </MapContainer>
      </div>
      <div className="mt-2 flex gap-3 text-[11px] text-white/65">
        <span><span style={{ color: COLORS.live }}>●</span> En direct</span>
        <span><span style={{ color: COLORS.upcoming }}>●</span> À venir</span>
        <span><span style={{ color: COLORS.past }}>●</span> Passée</span>
      </div>
      
        {adding && (
          <div className="card-hi mt-3 space-y-2">
            <div className="flex items-center justify-between"><span className="h-display text-xl">Ajouter une compétition</span><button className="text-white/55" onClick={() => setAdding(null)}>✕</button></div>
            <p className="text-xs text-white/65">Touche la carte pour placer le point. Position : {adding.lat ? `${adding.lat.toFixed(3)}, ${adding.lng!.toFixed(3)}` : 'non définie'}</p>
            <input className="input" placeholder="Nom" value={adding.name ?? ''} onChange={(e) => setAdding({ ...adding, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Ville" value={adding.city ?? ''} onChange={(e) => setAdding({ ...adding, city: e.target.value })} />
              <input className="input" placeholder="Pays" value={adding.country ?? ''} onChange={(e) => setAdding({ ...adding, country: e.target.value })} />
              <input type="date" className="input" value={adding.start ?? ''} onChange={(e) => setAdding({ ...adding, start: e.target.value })} />
              <input type="date" className="input" value={adding.end ?? ''} onChange={(e) => setAdding({ ...adding, end: e.target.value })} />
            </div>
            <input className="input" placeholder="Disciplines (séparées par des virgules)" onChange={(e) => setAdding({ ...adding, disciplines: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
            <input className="input" placeholder="Lien (site, Instagram…)" value={adding.url ?? ''} onChange={(e) => setAdding({ ...adding, url: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => navigator.geolocation?.getCurrentPosition((p) => setAdding({ ...adding, lat: p.coords.latitude, lng: p.coords.longitude }))}><Icon name="pin" size={16} /> Ma position</button>
              <button className="btn-primary" onClick={saveNew}>Enregistrer</button>
            </div>
          </div>
        )}

      <Section title={`${list.length} compétition(s)`} className="mt-4" right={<button className="chip" onClick={() => setAdding({ country: 'France' })}>+ Ajouter</button>}>
        <div className="space-y-2">
          {list.map((c) => {
            const st = compStatus(c)
            const days = Math.ceil((new Date(c.start).getTime() - Date.now()) / 86400000)
            return (
              <button key={c.id} className="card block w-full text-left" onClick={() => setFly([c.lat, c.lng, 11])}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-white/70">
                      {c.city}, {c.country} · {new Date(c.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {c.end && c.end !== c.start ? ` → ${new Date(c.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.disciplines.map((d) => <span key={d} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60">{d}</span>)}
                      {c.verified && <span className="rounded bg-volt/10 px-1.5 py-0.5 text-[10px] text-volt">source vérifiée</span>}
                      {c.userAdded && <span className="rounded bg-plasma/15 px-1.5 py-0.5 text-[10px] text-plasma">ajout perso</span>}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: COLORS[st] + '22', color: COLORS[st] }}>
                    {st === 'live' ? 'EN DIRECT' : st === 'upcoming' ? `J-${days}` : 'PASSÉE'}
                  </span>
                </div>
                {c.url && <a href={c.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mt-2 inline-block text-xs font-bold text-volt">Site / inscriptions →</a>}
                {c.userAdded && <span className="ml-3 text-xs text-white/55" onClick={(e) => (e.stopPropagation(), confirm('Supprimer ?') && s.deleteCompetition(c.id))}>Supprimer</span>}
              </button>
            )
          })}
          {!list.length && <p className="text-sm text-white/55">Aucune compétition pour ce filtre.</p>}
        </div>
      </Section>

      <Section title="Calendriers officiels">
        <div className="card space-y-1.5 text-sm">
          {[
            ['Kallos-Sthenos (calendrier mondial)', 'https://www.kallos-sthenos.com/en/competitions/calendar'],
            ['Calisthenics France', 'https://calisthenicsfrance.com/competitions-street-workout-france/'],
            ['FNSL (street lifting France)', 'https://fnsl.fr/'],
            ['WSWCF (championnats du monde)', 'https://wswcf.org/'],
            ['Calisthenics Cup', 'https://calisthenics-cup.com/'],
          ].map(([l, u]) => (
            <a key={u} href={u} target="_blank" rel="noreferrer" className="block text-volt">{l} →</a>
          ))}
          {status.errors.length > 0 && <p className="pt-2 text-[11px] text-white/55">{status.errors.join(' · ')}</p>}
        </div>
      </Section>

    </Page>
  )
}
