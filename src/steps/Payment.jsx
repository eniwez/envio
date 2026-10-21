import { useEffect, useState } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import { clp } from '../lib'
import { Alert, Card, CardTitle, Checkbox, Field, Skeleton } from '../ui'
import { Check, CircleAlert, CreditCard, House, MapPin, Store } from 'lucide-react'

export const METHODS = {
  WEBPAY: { title: 'Paga ahora con Webpay', text: 'Tarjeta de crédito, débito o prepago. Serás redirigido a Webpay para completar el pago.', icon: CreditCard, tag: 'Pagas ahora' },
  ORIG_AGENCY_PAY: { title: 'Yo pago en la sucursal de origen', text: 'Cuando lleves tu encomienda a la sucursal seleccionada como origen, paga con tarjeta de crédito o débito.', icon: Store, tag: 'Pagas en la sucursal' },
  DEST_AGENCY_PAY: { title: 'Envío por pagar en sucursal de destino', text: 'El destinatario deberá pagar con tarjeta de débito o crédito al retirar en la sucursal de destino.', icon: MapPin, tag: 'Paga el destinatario' },
  RECEIVER: { title: 'Envío por pagar en domicilio del destinatario', text: 'El destinatario deberá pagar en el domicilio cuando reciba el envío.', icon: House, tag: 'Paga el destinatario' },
}

export default function Payment({ errors }) {
  const { state, set } = useStore()
  const { payment, origin, destination, pkg: p } = state
  const [methods, setMethods] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    api.paymentMethods({ originAgencyId: origin.agency?.agency_id, destinyAgencyId: destination.mode === 'point' ? destination.agency?.agency_id : null })
      .then((r) => {
        if (!live) return
        const codes = r.paymentMethods.map((m) => m.code).filter((c) => METHODS[c])
        setMethods(codes)
        if (!codes.includes(payment.method)) set('payment', { method: '' })
      })
      .catch(() => live && setFailed(true))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle title="Contenido del envío" subtitle="Lo necesitamos para la declaración del envío" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contenido" required value={p.content} error={errors.content} onChange={(e) => set('pkg', { content: e.target.value })} hint="Ej: Libro" maxLength={60} />
          <Field label="Valor del contenido" required inputMode="numeric" value={p.value ? clp(p.value) : ''} error={errors.value} onChange={(e) => set('pkg', { value: e.target.value.replace(/\D/g, '').slice(0, 9) })} hint="Ej: $10.000" />
          <div className="sm:col-span-2">
            <Checkbox checked={p.accepted} error={errors.accepted} onChange={(accepted) => set('pkg', { accepted })}>
              Confirmo que mi envío no contiene productos prohibidos ni mercancías peligrosas.
            </Checkbox>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle title="Selecciona método de pago" />
        {failed && <Alert tone="error">No pudimos cargar los métodos de pago. Recarga la página.</Alert>}
        {!methods && !failed && <div className="grid gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-gls" />)}</div>}
        {methods && (
          <div role="radiogroup" aria-label="Método de pago" className="grid gap-3">
            {methods.map((code) => {
              const m = METHODS[code]
              const active = payment.method === code
              return (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set('payment', { method: code })}
                  className={`group flex items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition sm:p-5 ${active ? 'border-brand bg-brand-50/30 ring-2 ring-brand/25' : errors.method ? 'border-danger/60' : 'border-line-soft hover:border-brand/40 hover:shadow-md'}`}
                >
                  {code === 'WEBPAY' ? (
                    // Logo con los medios de pago aceptados; el fondo blanco de la imagen se funde con el recuadro
                    <span className="grid h-16 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-line-soft bg-white sm:w-40">
                      <img src="/webpay.jpg" alt="Webpay Plus: Visa, Mastercard, Magna, American Express, Diners Club y Redcompra" className="h-full w-full object-contain p-1" />
                    </span>
                  ) : (
                    <span className={`grid h-16 w-28 shrink-0 place-items-center rounded-xl transition sm:w-40 ${active ? 'bg-brand text-white' : 'bg-brand-50 text-brand group-hover:bg-brand-100'}`}>
                      <m.icon className="size-7" strokeWidth={1.75} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold leading-snug">{m.title}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${code === 'WEBPAY' ? 'bg-accent text-white' : 'bg-canvas text-muted'}`}>{m.tag}</span>
                    </span>
                    <span className="mt-1 block text-sm text-muted">{m.text}</span>
                  </span>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition ${active ? 'border-brand bg-brand text-white' : 'border-line'}`}>
                    {active && <Check className="size-4" strokeWidth={3.5} />}
                  </span>
                </button>
              )
            })}
          </div>
        )}
        {errors.method && <p className="mt-2 flex items-center gap-1 text-[13px] text-danger" data-error><CircleAlert className="size-4" />{errors.method}</p>}
        <div className="mt-6 border-t border-line-soft pt-5">
          <Checkbox checked={payment.terms} error={errors.terms} onChange={(terms) => set('payment', { terms })}>
            Acepto los términos y condiciones
          </Checkbox>
        </div>
      </Card>
    </div>
  )
}
