import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const KEY = 'envio-invitado-v3'
const address = { region: '', commune: '', street: '', number: '', depto: '', reference: '', text: '' }

export const initialState = () => ({
  started: false,
  step: 0,
  origin: { docType: 'boleta', firstName: '', lastName: '', email: '', phone: '', rut: '', addressMode: 'search', address: { ...address }, pointRegion: '', pointCommune: '', pointSearch: '', pointLoc: null, agency: null },
  destination: { firstName: '', lastName: '', phone: '', email: '', mode: 'point', addressMode: 'search', pointSearch: '', pointLoc: null, address: { ...address }, pointRegion: '', pointCommune: '', agency: null },
  pkg: { size: 'XS', useMeasures: false, measures: { length: '', width: '', height: '', weight: '' }, content: '', value: '', accepted: false },
  payment: { method: '', terms: false },
})

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || initialState() } catch { return initialState() }
  })
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)) } catch { /* modo privado */ }
  }, [state])

  const set = (section, patch) => setState((s) => ({ ...s, [section]: typeof patch === 'function' ? patch(s[section]) : { ...s[section], ...patch } }))
  const setStep = (step) => setState((s) => ({ ...s, step }))
  const setStarted = (started) => setState((s) => ({ ...s, started, step: 0 }))
  const reset = () => setState(initialState())
  return <Ctx.Provider value={{ state, set, setStep, setStarted, reset }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

// Comunas de origen (sucursal) y destino (domicilio o sucursal) para cotizar
export const routeOf = (state, communes) => {
  const byCode = (code) => communes.find((c) => c.code === code)
  const o = byCode(state.origin.agency?.commune_code)
  const d = byCode(state.destination.mode === 'home' ? state.destination.address.commune : state.destination.agency?.commune_code)
  return o && d ? { origin: o.locationCode, destination: d.locationCode, originRegion: o.region, destinationRegion: d.region, destinationName: d.name } : null
}

// Cotiza todas las tallas para la ruta actual: { XS: {total, slaTime, discounts}, ... }
export function useQuotes(route, sizes) {
  const [quotes, setQuotes] = useState({})
  const key = route && `${route.origin}-${route.destination}`
  useEffect(() => {
    setQuotes({})
    if (!key || !sizes.length) return
    let live = true
    Promise.all(sizes.map((s) => api.quote({ ...route, package: s.code }).then((q) => [s.code, q])))
      .then((entries) => live && setQuotes(Object.fromEntries(entries)))
      .catch(() => live && setQuotes({ error: true }))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sizes])
  return quotes
}

// Catálogos (regiones, comunas, tallas) cargados una vez
export function useCatalog() {
  const [data, setData] = useState({ regions: [], communes: [], sizes: [], error: null })
  useEffect(() => {
    Promise.all([api.regions(), api.communes(), api.sizes()])
      .then(([regions, communes, sizes]) => setData({ regions, communes, sizes, error: null }))
      .catch((error) => setData((d) => ({ ...d, error })))
  }, [])
  return data
}
