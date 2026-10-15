// Primitivas visuales con el lenguaje de gls-pakete.de
import { useId } from 'react'
import { Check, ChevronsUpDown, CircleAlert, Info, X } from 'lucide-react'

// `progress` rellena el botón de izquierda a derecha durante `duration` ms (simula una carga) y bloquea los clics
export function Button({ variant = 'primary', loading, progress, duration = 800, className = '', children, ...props }) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-brand/40',
    secondary: 'bg-canvas text-ink hover:bg-line-soft disabled:text-muted',
    outline: 'border border-brand text-brand bg-white hover:bg-brand-50 rounded-full',
    link: 'text-brand hover:underline px-0',
  }
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      aria-busy={progress || undefined}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-gls px-8 h-12 font-medium transition-colors disabled:cursor-not-allowed ${progress ? 'pointer-events-none' : ''} ${styles[variant]} ${className}`}
      {...props}
    >
      {progress && <span aria-hidden="true" className={`btn-progress absolute inset-y-0 left-0 ${variant === 'secondary' ? 'bg-ink/10' : 'bg-white/25'}`} style={{ '--btn-ms': `${duration}ms` }} />}
      {loading && <span className="size-4 rounded-full border-2 border-current border-r-transparent animate-spin" />}
      <span className="relative inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}

export const Card = ({ className = '', children, ...props }) => (
  <section className={`bg-white rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(16,24,40,0.06)] ${className}`} {...props}>{children}</section>
)

export const CardTitle = ({ title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-4 mb-5">
    <div>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
    </div>
    {right}
  </div>
)

const fieldBox = (error, disabled) =>
  `relative block rounded-gls border bg-field transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 ${
    error ? 'border-danger bg-danger-50/40' : 'border-line'
  } ${disabled ? 'opacity-60' : ''}`

const ErrorText = ({ id, error, hint }) =>
  error ? (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-[13px] text-danger" data-error>
      <CircleAlert className="size-4 shrink-0" /> {error}
    </p>
  ) : hint ? <p id={id} className="mt-1.5 text-[13px] text-muted">{hint}</p> : null

// Input con label flotante (como "Paketnummer oder Track-ID" en GLS)
export function Field({ label, required, error, hint, className = '', right, ...props }) {
  const id = useId()
  return (
    <div className={className}>
      <div className={fieldBox(error, props.disabled)}>
        <input
          id={id}
          placeholder=" "
          required={required}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className="peer w-full h-[54px] bg-transparent px-3 pt-5 pb-1.5 text-base outline-none placeholder-transparent disabled:cursor-not-allowed"
          {...props}
        />
        <label htmlFor={id} className="pointer-events-none absolute left-3 top-1.5 text-xs text-muted transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs">
          {label}{required && <span className="text-danger" aria-hidden="true"> *</span>}
        </label>
        {right && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{right}</span>}
      </div>
      <ErrorText id={`${id}-msg`} error={error} hint={hint} />
    </div>
  )
}

// Select nativo con label flotante y chevrons ⇕ (como "Zielland" en GLS)
export function Select({ label, required, error, options, placeholder = 'Seleccionar', className = '', ...props }) {
  const id = useId()
  return (
    <div className={className}>
      <div className={fieldBox(error, props.disabled)}>
        <select id={id} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-msg` : undefined} className="w-full h-[54px] appearance-none bg-transparent px-3 pt-5 pb-1.5 pr-10 text-base outline-none disabled:cursor-not-allowed" {...props}>
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label htmlFor={id} className="pointer-events-none absolute left-3 top-1.5 text-xs text-muted">
          {label}{required && <span className="text-danger" aria-hidden="true"> *</span>}
        </label>
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-5 text-ink" />
      </div>
      <ErrorText id={`${id}-msg`} error={error} />
    </div>
  )
}

// Switch tipo "An Firma senden"
export const Toggle = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-3 cursor-pointer select-none">
    <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="relative h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    <span className="text-[15px]">{label}</span>
  </label>
)

export const Checkbox = ({ checked, onChange, error, children }) => (
  <div>
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 text-white transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 ${error ? 'border-danger' : 'border-line'}`}>
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="text-[15px] leading-snug">{children}</span>
    </label>
    <ErrorText error={error} />
  </div>
)

// Segmentado tipo "Lieferoptionen": tarjeta blanca activa sobre fondo gris
export const Segmented = ({ value, onChange, options }) => (
  <div className="grid grid-cols-2 gap-1 rounded-gls bg-canvas p-1" role="tablist">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="tab"
        aria-selected={value === o.value}
        onClick={() => onChange(o.value)}
        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${value === o.value ? 'bg-white shadow-sm text-ink font-semibold' : 'text-muted hover:text-ink'}`}
      >
        {o.icon && <o.icon className="size-6 shrink-0" />}
        <span>
          <span className="block text-[15px]">{o.label}</span>
          {o.detail && <span className="block text-sm font-normal text-muted">{o.detail}</span>}
        </span>
      </button>
    ))}
  </div>
)

export const Alert = ({ tone = 'info', title, children, onClose }) => {
  const tones = {
    info: 'bg-canvas text-ink border-line-soft',
    warn: 'bg-warn-50 text-warn border-[#fec84b]',
    error: 'bg-danger-50 text-danger border-[#fda29b]',
    ok: 'bg-ok-50 text-ok border-[#abefc6]',
  }
  return (
    <div className={`flex gap-3 rounded-gls border p-4 text-sm ${tones[tone]}`} role={tone === 'error' ? 'alert' : undefined}>
      {tone === 'info' ? <Info className="size-5 shrink-0" /> : <CircleAlert className="size-5 shrink-0" />}
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
      {onClose && <button type="button" onClick={onClose} aria-label="Cerrar"><X className="size-4" /></button>}
    </div>
  )
}

export const Badge = ({ className = '', children }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${className}`}>{children}</span>
)

export const Skeleton = ({ className = '' }) => <span className={`block animate-pulse rounded bg-line-soft ${className}`} />
