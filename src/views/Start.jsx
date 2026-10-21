import { useState } from 'react'
import { useStore } from '../store'
import { sizeFromMeasures } from '../lib'
import { CommuneSearch } from '../components/Address'
import { Button, Field } from '../ui'
import { ChevronDown, ChevronRight, CircleAlert, Info } from 'lucide-react'

// Caja isométrica como la ilustración de GLS, con las medidas de la talla
function BoxIllustration({ dims = [30, 30, 25] }) {
  const [l, w, h] = dims
  const c = Math.cos(Math.PI / 6), s = 0.5
  // Escala para que la caja proyectada (con sus etiquetas) siempre entre completa
  const k = Math.min(240 / ((l + w) * c), 180 / ((l + w) * s + h))
  const L = l * k, W = w * k, H = h * k
  // Centra la caja según su tamaño proyectado
  const ox = 160 - ((L - W) * c) / 2, oy = 130 - ((L + W) * s - H) / 2
  const p = (x, y, z) => `${ox + (x - y) * c},${oy + (x + y) * s - z}`
  const top = [p(0, 0, H), p(L, 0, H), p(L, W, H), p(0, W, H)].join(' ')
  const left = [p(0, W, 0), p(L, W, 0), p(L, W, H), p(0, W, H)].join(' ')
  const right = [p(L, 0, 0), p(L, W, 0), p(L, W, H), p(L, 0, H)].join(' ')
  const tag = (pt, label) => {
    const [x, y] = pt.split(',').map(Number)
    return (
      <g key={label + pt}>
        <rect x={x - 17} y={y - 13} width="34" height="26" rx="2" fill="#061AB1" />
        <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">{label}</text>
      </g>
    )
  }
  return (
    <svg viewBox="0 0 320 260" className="h-full w-full overflow-visible">
      <polygon points={left} fill="#b98550" stroke="#6b4423" strokeWidth="3.5" strokeLinejoin="round" />
      <polygon points={right} fill="#d4a574" stroke="#6b4423" strokeWidth="3.5" strokeLinejoin="round" />
      <polygon points={top} fill="#e8c9a0" stroke="#6b4423" strokeWidth="3.5" strokeLinejoin="round" />
      {tag(p(L / 2, W, 0), l)}
      {tag(p(L, W / 2, 0), w)}
      {tag(p(L, 0, H / 2), h)}
    </svg>
  )
}

// Pantalla de entrada como la de GLS: talla primero, luego invitado o sesión (no cuenta como paso)
export default function Start({ catalog, onStart }) {
  const { state, set } = useStore()
  const [tried, setTried] = useState(false)
  const p = state.pkg
  const { sizes, regions } = catalog
  const selected = sizes.find((s) => s.code === p.size)
  const error = tried && (p.size === 'TOO_BIG' ? 'Tu paquete excede la talla máxima permitida (25 kg o 100 x 100 x 100 cm)' : !selected && 'Selecciona una talla')
  const typed = [p.measures.length, p.measures.width, p.measures.height].map(Number)

  const setMeasure = (key, v) => {
    const measures = { ...p.measures, [key]: v.replace(/[^\d.,]/g, '').replace(',', '.') }
    set('pkg', { measures, useMeasures: true, size: sizeFromMeasures(sizes, measures) ?? p.size })
  }
  const [starting, setStarting] = useState(null) // 'guest' | 'login'
  const start = async (mode = 'guest') => {
    if (starting || !selected) return starting ? undefined : setTried(true)
    setStarting(mode)
    await new Promise((r) => setTimeout(r, mode === 'login' ? 3000 : 700))
    onStart()
  }

  if (!sizes.length) return <div className="h-[640px] animate-pulse rounded-2xl bg-white" />

  return (
    <div className="mx-auto max-w-[1184px]">
      <div className="rounded-t-2xl bg-white px-5 pb-6 pt-6 sm:px-8 sm:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-block rounded-md bg-accent px-2 py-1 text-sm font-bold text-white">Envíos a todo Chile</span>
          <div role="radiogroup" aria-label="Tipo de documento" className="inline-flex rounded-full border border-line bg-field p-1">
            {[['boleta', 'Boleta'], ['factura', 'Factura']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={state.origin.docType === value}
                onClick={() => set('origin', { docType: value })}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${state.origin.docType === value ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight sm:text-[38px]">
          ¿Qué tamaño tiene tu paquete?
          <span className="block text-sm font-normal tracking-normal sm:ml-1 sm:inline sm:text-lg">(todas las tallas hasta 25 kg)</span>
        </h1>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div>
            <CommuneSearch
              communes={catalog.communes}
              regions={regions}
              value={state.destination.pointCommune}
              onSelect={(c) => set('destination', { pointRegion: c.region, pointCommune: c.code, agency: null })}
            />

            <div role="radiogroup" aria-label="Talla" className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
              {sizes.map((s) => {
                const active = p.size === s.code
                return (
                  <button
                    key={s.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set('pkg', { size: s.code, useMeasures: false, measures: { length: '', width: '', height: '', weight: '' } })}
                    className={`flex aspect-square flex-col overflow-hidden rounded-gls border text-center transition ${active ? 'border-brand' : error ? 'border-danger' : 'border-line-soft hover:border-brand/50'}`}
                  >
                    <span className={`grid flex-1 place-items-center text-2xl font-black sm:text-[28px] ${active ? 'bg-brand text-white' : 'bg-white text-ink'}`}>{s.code}</span>
                    <span className={`block whitespace-nowrap px-0.5 py-1.5 text-xs sm:py-2 sm:text-sm ${active ? 'bg-brand-50 font-bold text-brand' : 'bg-canvas text-muted'}`}>
                      Hasta {String(s.maxKg).replace('.', ',')} kg
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Info className="size-4 shrink-0" />
              {selected ? selected.description : 'Selecciona la talla que corresponde a tu paquete.'}
            </p>
            {error && <p className="mt-1 flex items-center gap-1 text-[13px] text-danger" data-error><CircleAlert className="size-4" />{error}</p>}

            <details open={p.useMeasures} onToggle={(e) => set('pkg', { useMeasures: e.currentTarget.open })} className="group mt-5">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 py-2 font-semibold">
                <span>Talla personalizada <span className="font-normal text-muted">(ingresa tus medidas y peso)</span></span>
                <ChevronDown className="size-5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Largo (cm)" type="number" min="0" inputMode="decimal" value={p.measures.length} onChange={(e) => setMeasure('length', e.target.value)} />
                  <Field label="Ancho (cm)" type="number" min="0" inputMode="decimal" value={p.measures.width} onChange={(e) => setMeasure('width', e.target.value)} />
                  <Field label="Alto (cm)" type="number" min="0" inputMode="decimal" value={p.measures.height} onChange={(e) => setMeasure('height', e.target.value)} />
                  <Field label="Peso (kg)" type="number" min="0" inputMode="decimal" value={p.measures.weight} onChange={(e) => setMeasure('weight', e.target.value)} />
                </div>
              </div>
            </details>
          </div>

          <div className="hidden overflow-hidden rounded-gls border-2 border-brand bg-white lg:block">
            <BoxIllustration dims={typed.every((n) => n > 0) ? typed : selected?.dims} />
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-[640px] gap-3 sm:grid-cols-2 sm:gap-4">
          {/* Sin login todavía: igual que "Mi cuenta" del header */}
          <Button variant="secondary" onClick={() => start('login')} progress={starting === 'login'} duration={3000} className="!font-bold">{starting === 'login' ? 'Simulando inicio de sesión…' : <>Iniciar sesión <ChevronRight className="size-5" strokeWidth={3} /></>}</Button>
          <Button onClick={() => start('guest')} progress={starting === 'guest'} duration={700} className="!font-bold">Continuar como invitado <ChevronRight className="size-5" strokeWidth={3} /></Button>
        </div>
        <p className="mt-3 text-center text-sm text-muted">¿Aún no tienes cuenta? <a href="#" className="font-bold text-muted underline">Regístrate</a></p>
      </div>
      {/* Borde festoneado inferior, como el ticket de GLS */}
      <div aria-hidden="true" className="h-4 bg-[radial-gradient(circle_at_50%_0,white_15px,transparent_16px)] bg-[length:44px_16px] bg-repeat-x" />
    </div>
  )
}
