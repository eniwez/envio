import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../api'
import { agencyAddress } from '../lib'
import { AddressSearch } from './Address'
import { Alert, Badge, Skeleton } from '../ui'
import { Check, CircleAlert, CreditCard, MapPin, Printer, Store } from 'lucide-react'

const pin = (active) =>
  L.divIcon({
    className: 'pin',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    html: `<svg viewBox="0 0 34 42" width="34" height="42"><path d="M17 41C17 41 32 26.5 32 16A15 15 0 0 0 2 16C2 26.5 17 41 17 41Z" fill="${active ? '#EF8552' : '#061AB1'}" stroke="#fff" stroke-width="2"/><text x="17" y="21" text-anchor="middle" font-family="Figtree,Arial" font-weight="900" font-size="13" fill="#fff">S</text></svg>`,
  })

function FitTo({ agencies, selected }) {
  const map = useMap()
  useEffect(() => {
    if (!agencies.length) return
    map.fitBounds(L.latLngBounds(agencies.map((a) => [a.location.latitude, a.location.longitude])), { padding: [30, 30], maxZoom: 15 })
  }, [agencies, map])
  useEffect(() => {
    if (selected) map.panTo([selected.location.latitude, selected.location.longitude])
  }, [selected, map])
  return null
}

const km = (a, b) => {
  const r = (d) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const fmtKm = (d) => (d < 1 ? `${Math.round(d * 10) * 100} m` : `${d.toFixed(1).replace('.', ',')} km`)

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
// Estado de atención ahora mismo: { open, text }
const openState = (a) => {
  if (a.is_24_hours) return { open: true, text: 'Las 24 horas' }
  const range = a.open_hours?.[DAYS[new Date().getDay()]]
  if (!range) return { open: false, text: 'Hoy no atiende' }
  const [from, to] = range.split('-')
  const now = new Date().toTimeString().slice(0, 5)
  if (now >= from && now < to) return { open: true, text: `hasta las ${to}` }
  return { open: false, text: now < from ? `abre a las ${from}` : `horario de hoy ${from} - ${to}` }
}

// Las sucursales se buscan por la dirección escrita (latitud/longitud) y se ordenan de la más cercana a la más lejana
export default function AgencyPicker({ kind, regions, communes, commune, point, searchText, agency, onChange, error }) {
  const [list, setList] = useState({ status: 'idle', items: [] })
  const listRef = useRef(null)
  const communeObj = communes.find((c) => c.code === commune)
  const regionName = (iso) => regions.find((r) => r.regionISO === iso)?.name ?? ''
  const initialText = searchText || (communeObj ? `${communeObj.name}, ${regionName(communeObj.region)}` : '')
  const origin = communeObj && (point ?? { lat: communeObj.geolocation.latitude, lng: communeObj.geolocation.longitude })

  useEffect(() => {
    if (!communeObj) return setList({ status: 'idle', items: [] })
    let live = true
    setList({ status: 'loading', items: [] })
    api.agencies(point ? { ...communeObj, geolocation: { latitude: point.lat, longitude: point.lng } } : communeObj)
      .then((found) => {
        if (!live) return
        const items = [...found].sort((x, y) => km(origin, { lat: x.location.latitude, lng: x.location.longitude }) - km(origin, { lat: y.location.latitude, lng: y.location.longitude }))
        // Tras recargar, las sucursales generadas pueden cambiar: se conserva la ya elegida de esa comuna
        const kept = agency?.commune_code === communeObj.code && !items.some((a) => a.agency_id === agency.agency_id)
        setList({ status: 'ready', items: kept ? [agency, ...items] : items })
        // Se preselecciona la primera sucursal si no hay una válida elegida
        if (!kept && !items.some((a) => a.agency_id === agency?.agency_id)) onChange({ agency: items[0] ?? null })
      })
      .catch(() => live && setList({ status: 'error', items: [] }))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communeObj?.code, point?.lat, point?.lng])

  const choose = (a) => {
    onChange({ agency: a })
    listRef.current?.querySelector(`[data-id="${a.agency_id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  return (
    <div>
      <AddressSearch
        label={`Busca la dirección de ${kind} para ver las sucursales más cercanas`}
        hint="Ej: San Martín 342 Temuco"
        value={initialText}
        onSelect={(a, loc) => onChange({ region: a.region, commune: a.commune, point: loc ? { lat: loc.lat, lng: loc.lng } : null, text: a.text, agency: null })}
      />

      {error && <p className="mt-3 flex items-center gap-1 text-[13px] text-danger" data-error><CircleAlert className="size-4" />{error}</p>}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="isolate h-72 overflow-hidden rounded-gls border border-line-soft lg:h-[440px]">
          <MapContainer center={[-33.45, -70.66]} zoom={11} scrollWheelZoom={false} className="size-full">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {list.items.map((a) => (
              <Marker
                key={a.agency_id}
                position={[a.location.latitude, a.location.longitude]}
                icon={pin(a.agency_id === agency?.agency_id)}
                zIndexOffset={a.agency_id === agency?.agency_id ? 1000 : 0}
                eventHandlers={{ click: () => choose(a) }}
                title={a.agency_name}
              />
            ))}
            <FitTo agencies={list.items} selected={agency} />
          </MapContainer>
        </div>

        <div className="flex max-h-[440px] flex-col rounded-gls bg-canvas p-3 lg:h-[440px]">
          {list.status === 'idle' && (
            <div className="grid flex-1 place-items-center px-6 py-10 text-center text-muted">
              <div>
                <MapPin className="mx-auto mb-3 size-10 text-brand" strokeWidth={1.5} />
                Escribe una dirección para ver las sucursales más cercanas.
              </div>
            </div>
          )}
          {list.status === 'loading' && (
            <div className="space-y-3 p-1" aria-busy="true">
              <p className="text-sm text-muted">Buscando sucursales cercanas...</p>
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-gls bg-white" />)}
            </div>
          )}
          {list.status === 'error' && <Alert tone="error">No pudimos cargar las sucursales. Intenta nuevamente.</Alert>}
          {list.status === 'ready' && list.items.length === 0 && (
            <Alert tone="warn" title="¡Lo sentimos!">Por el momento no tenemos una sucursal disponible en esta zona. Te invitamos a buscar una comuna cercana.</Alert>
          )}
          {list.status === 'ready' && list.items.length > 0 && (
            <>
              <p className="px-1 pb-3 font-bold">{list.items.length} sucursales cercanas</p>
              <ul ref={listRef} className="-mr-1 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1" role="radiogroup" aria-label={`Sucursal de ${kind}`}>
                {list.items.map((a, i) => {
                  const active = a.agency_id === agency?.agency_id
                  const dist = origin && km(origin, { lat: a.location.latitude, lng: a.location.longitude })
                  const hours = openState(a)
                  return (
                    <li key={a.agency_id} data-id={a.agency_id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => choose(a)}
                        className={`group w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${active ? 'border-brand ring-2 ring-brand/25' : 'border-line-soft hover:border-brand/40 hover:shadow-md'}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`grid size-11 shrink-0 place-items-center rounded-xl transition ${active ? 'bg-brand text-white' : 'bg-brand-50 text-brand group-hover:bg-brand-100'}`}>
                            {active ? <Check className="size-5" strokeWidth={3} /> : <Store className="size-5" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-bold leading-snug">{a.agency_name}</p>
                              {dist != null && <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand">{fmtKm(dist)}</span>}
                            </div>
                            {i === 0 && <div className="mt-1.5"><Badge className="bg-accent text-white">Más cercana</Badge></div>}
                            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted"><MapPin className="mt-0.5 size-4 shrink-0" />{agencyAddress(a)}, {a.location.city_name}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-sm">
                              <span className={`size-2 shrink-0 rounded-full ${hours.open ? 'bg-ok' : 'bg-line'}`} />
                              <span className={`font-semibold ${hours.open ? 'text-ok' : 'text-muted'}`}>{hours.open ? 'Abierto' : 'Cerrado'}</span>
                              <span className="text-muted">· {hours.text}</span>
                            </p>
                            {a.services.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {a.services.map((sv) => (
                                  <span key={sv} className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink">
                                    {sv.startsWith('Impresión') ? <Printer className="size-3.5 text-brand" /> : <CreditCard className="size-3.5 text-brand" />}
                                    {sv}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
