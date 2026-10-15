import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'
import { titleCase } from '../lib'
import { Alert, Field, Select } from '../ui'
import { MapPin, Pencil, Search } from 'lucide-react'

// Formulario manual de dirección (Región, Comuna, Calle, Número / Sin número, Depto, Referencia)
export function AddressForm({ value, onChange, regions, communes, errors = {}, optionalLabels }) {
  const regionCommunes = useMemo(() => communes.filter((c) => c.region === value.region).sort((a, b) => a.name.localeCompare(b.name)), [communes, value.region])
  const set = (patch) => onChange({ ...value, ...patch })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select label="Región" required value={value.region} error={errors.region} options={regions.map((r) => ({ value: r.regionISO, label: r.name }))} onChange={(e) => set({ region: e.target.value, commune: '' })} />
      <Select label="Comuna" required value={value.commune} error={errors.commune} disabled={!value.region} options={regionCommunes.map((c) => ({ value: c.code, label: c.name }))} onChange={(e) => set({ commune: e.target.value })} />
      <Field label="Calle" required value={value.street} error={errors.street} autoComplete="address-line1" onChange={(e) => set({ street: e.target.value })} />
      <Field label="Número (opcional)" inputMode="numeric" value={value.number} error={errors.number} onChange={(e) => set({ number: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
      <Field label={`Departamento / Oficina${optionalLabels ? ' (opcional)' : ''}`} value={value.depto} onChange={(e) => set({ depto: e.target.value })} hint="Ej: 4B" />
      <Field label={`Referencia${optionalLabels ? ' (opcional)' : ' para encontrar la dirección'}`} value={value.reference} onChange={(e) => set({ reference: e.target.value })} hint="Ej: Casa con portón negro" />
    </div>
  )
}

export const splitStreet = (s) => {
  const m = s.match(/^(.*?)[\s,#]+(\d{1,6})\b(.*)$/)
  return m ? { street: titleCase(m[1].trim()), number: m[2] } : { street: titleCase(s.trim()), number: '' }
}

// Buscador de direcciones (simula Google Places)
export function AddressSearch({ value, onSelect, onType, onNotFound, onManual, error, label = 'Dirección exacta (calle, número y comuna)', hint = 'Ej: San Martín 342 Temuco' }) {
  const [q, setQ] = useState(value)
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const typed = useRef(false)

  // Si el padre cambia el texto (p. ej. sugiere una comuna), el campo lo refleja salvo que el usuario esté escribiendo
  useEffect(() => { if (!typed.current) setQ(value) }, [value])

  useEffect(() => {
    if (!typed.current) return
    if (q.trim().length < 3) return setItems([])
    setLoading(true)
    const t = setTimeout(() => {
      api.places(q.trim())
        .then((r) => { setItems(r.suggestions.slice(0, 3)); setOpen(true); setActive(-1); if (!r.suggestions.length) onNotFound?.(q.trim()) })
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const pick = (s) => {
    typed.current = false
    setQ(s.text)
    setOpen(false)
    onSelect({ text: s.text, region: s.regionISO, commune: s.communeCode, ...splitStreet(s.street) }, s.location)
  }

  // La última opción de la lista es "Ingresar manualmente" (índice items.length)
  const total = items.length + (onManual ? 1 : 0)
  const manual = () => { setOpen(false); onManual(q.trim()) }
  const onKeyDown = (e) => {
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % total) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? total - 1 : i - 1)) }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); if (active === items.length) manual(); else pick(items[active]) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative">
      <Field
        label={label}
        required
        value={q}
        error={error}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => items.length && setOpen(true)}
        onChange={(e) => { typed.current = true; setQ(e.target.value); onType?.(e.target.value) }}
        right={loading ? <span className="block size-4 animate-spin rounded-full border-2 border-brand border-r-transparent" /> : <Search className="size-5" />}
        hint={!error ? hint : undefined}
      />
      {open && items.length > 0 && (
        <ul role="listbox" className="absolute inset-x-0 top-[58px] z-[1000] overflow-hidden rounded-gls border border-line-soft bg-white shadow-lg">
          {items.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] ${i === active ? 'bg-brand-50' : 'hover:bg-canvas'}`}>
                <MapPin className="size-4 shrink-0 text-muted" />
                <span><span className="font-semibold">{titleCase(s.street)}</span><span className="text-muted">, {s.communeName}, {s.text.split(', ').at(-1)}</span></span>
              </button>
            </li>
          ))}
          {onManual && (
            <li role="option" aria-selected={active === items.length} className="border-t border-line-soft">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={manual} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-semibold text-brand ${active === items.length ? 'bg-brand-50' : 'hover:bg-canvas'}`}>
                <Pencil className="size-4 shrink-0" />No encuentro mi dirección, ingresar manualmente
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Autocompletado de comuna "Comuna, Región" sobre el catálogo local (sin tildes: "vina" encuentra Viña del Mar)
export function CommuneSearch({ communes, regions, value, onSelect, label = 'Comuna de destino', hint }) {
  const regionName = (iso) => regions.find((r) => r.regionISO === iso)?.name ?? ''
  const textOf = (c) => (c ? `${c.name}, ${regionName(c.region)}` : '')
  const [q, setQ] = useState(() => textOf(communes.find((c) => c.code === value)))
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const items = useMemo(() => {
    const t = fold(q.split(',')[0].trim())
    if (t.length < 2) return []
    return communes
      .filter((c) => fold(c.name).includes(t))
      .sort((a, b) => fold(b.name).startsWith(t) - fold(a.name).startsWith(t) || a.name.localeCompare(b.name))
      .slice(0, 6)
  }, [q, communes])

  const pick = (c) => {
    setQ(textOf(c))
    setOpen(false)
    onSelect(c)
  }

  const onKeyDown = (e) => {
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % items.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? items.length - 1 : i - 1)) }
    if (e.key === 'Enter') { e.preventDefault(); pick(items[active]) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative">
      <Field
        label={label}
        value={q}
        hint={hint}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-autocomplete="list"
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0) }}
        right={<MapPin className="size-5" />}
      />
      {open && items.length > 0 && (
        <ul role="listbox" className="absolute inset-x-0 top-[58px] z-[1000] overflow-hidden rounded-gls border border-line-soft bg-white shadow-lg">
          {items.map((c, i) => (
            <li key={c.code} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c)} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] ${i === active ? 'bg-brand-50' : 'hover:bg-canvas'}`}>
                <MapPin className="size-4 shrink-0 text-muted" />
                <span><span className="font-semibold">{c.name}</span><span className="text-muted">, {regionName(c.region)}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Dirección con búsqueda primero (3 sugerencias + "ingresar manualmente") y formulario manual como respaldo.
// `section` es { address, addressMode } y `update(fn)` modifica esa sección del store en un solo paso.
export function AddressEntry({ section, update, regions, communes, errors, optionalLabels, searchLabel, onAddress }) {
  const [notice, setNotice] = useState(false)
  const { address, addressMode } = section
  const setAddress = (next) => update((prev) => ({ ...prev, address: next, ...onAddress?.(prev, next) }))
  // Pasa al formulario manual conservando lo que el usuario alcanzó a escribir (calle y número)
  const goManual = (text) => {
    setNotice(true)
    update((prev) => ({ ...prev, addressMode: 'manual', address: { ...prev.address, ...(text && { text, ...splitStreet(text) }) } }))
  }

  if (addressMode === 'manual') {
    return (
      <div className="space-y-4">
        {notice && <Alert tone="warn">No encontramos la dirección exacta, por lo que debes completar manualmente el formulario.</Alert>}
        <AddressForm value={address} onChange={setAddress} regions={regions} communes={communes} errors={errors} optionalLabels={optionalLabels} />
        <button type="button" onClick={() => { setNotice(false); update((prev) => ({ ...prev, addressMode: 'search' })) }} className="text-sm font-semibold text-brand hover:underline">Volver a buscar la dirección</button>
      </div>
    )
  }
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="sm:col-span-2">
        <AddressSearch
          label={searchLabel}
          value={address.text}
          error={errors.search}
          onType={(text) => update((prev) => ({ ...prev, address: { ...prev.address, text, commune: '', street: '', number: '' } }))}
          onNotFound={goManual}
          onManual={goManual}
          onSelect={(a) => {
            setAddress({ ...address, ...a })
            if (!a.number) goManual()
          }}
        />
      </div>
      <Field label={`Departamento / Oficina${optionalLabels ? ' (opcional)' : ''}`} value={address.depto} onChange={(e) => update((prev) => ({ ...prev, address: { ...prev.address, depto: e.target.value } }))} hint="Ej: 93 A" />
    </div>
  )
}
