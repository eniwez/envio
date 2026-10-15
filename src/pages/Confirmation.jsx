import { useEffect } from 'react'
import { navigate } from '../App'
import { useStore } from '../store'
import { agencyAddress, clp } from '../lib'
import { METHODS } from '../steps/Payment'
import { Alert, Button, Card } from '../ui'
import { Check, ChevronRight, MapPin, Printer } from 'lucide-react'

const Step = ({ n, title, children }) => (
  <li className="flex gap-4">
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-lg font-black text-white">{n}</span>
    <div className="flex-1 pb-8">
      <h3 className="text-lg font-bold">{title}</h3>
      <div className="mt-2 space-y-3 text-[15px] text-ink/80">{children}</div>
    </div>
  </li>
)

const dropText = {
  WEBPAY: 'Tu envío ya está pagado. Deja tu encomienda en el Punto Blue Express de origen.',
  ORIG_AGENCY_PAY: 'Paga el envío con tarjeta y deja tu encomienda en el Punto Blue Express de origen.',
  DEST_AGENCY_PAY: 'Deja tu encomienda en el Punto Blue Express de origen. El destinatario pagará al retirarla.',
  RECEIVER: 'Deja tu encomienda en el Punto Blue Express de origen. El destinatario pagará al recibirla.',
}

export default function Confirmation({ tx }) {
  const { reset } = useStore()
  const e = JSON.parse(sessionStorage.getItem(`emission-${tx}`) || 'null')
  useEffect(() => { if (e) reset() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!e) return <div className="mx-auto max-w-xl py-16"><Alert tone="error" title="No encontramos tu envío">Revisa el enlace o <a className="underline" href="/">crea un nuevo envío</a>.</Alert></div>

  const origin = e.snapshot.origin.agency
  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
        <span className="absolute -right-10 -top-10 size-40 rounded-full bg-accent/90" aria-hidden="true" />
        <span className="grid size-14 place-items-center rounded-full bg-white text-brand"><Check className="size-8" strokeWidth={3} /></span>
        <h1 className="mt-4 text-4xl font-bold">Envío confirmado</h1>
        <p className="mt-2 text-lg text-white/85">Te enviamos el detalle a <b>{e.request.origin.email}</b>.</p>
        <p className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-gls bg-white/10 px-4 py-3">
          <span className="text-sm text-white/80">N° de seguimiento</span>
          <span className="font-mono text-2xl font-bold tracking-wider">{e.trackingNumber}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <h2 className="mb-6 text-xl font-bold">Sigue las instrucciones a continuación:</h2>
          <ol>
            <Step n={1} title="Imprime tu etiqueta">
              <div className="rounded-gls bg-canvas p-4">
                <p className="font-semibold text-ink">A) Desde casa:</p>
                <p>Descarga e imprime tu etiqueta.</p>
                <Button className="mt-3 !h-10 !px-5" onClick={() => window.open(`/etiqueta?tx=${tx}`, '_blank')}><Printer className="size-5" />Descargar etiqueta</Button>
              </div>
              <div className="rounded-gls bg-canvas p-4">
                <p className="font-semibold text-ink">B) En un Punto Blue Express:</p>
                <p>Dirígete a un punto habilitado e imprime con tu número de seguimiento.</p>
                <a href="https://mapa-pickup.blue.cl/" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-brand hover:underline">Encuentra tu Punto con impresora <ChevronRight className="size-4" strokeWidth={3} /></a>
              </div>
            </Step>
            <Step n={2} title="Embala tu encomienda">
              <p>Envuelve tu encomienda y pega la etiqueta en un lugar visible. Considera que nuestros Puntos no venden material de embalaje.</p>
              <a href="https://www.blue.cl/nosotros/centro-de-ayuda/embalaje" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">Ver guía de embalaje <ChevronRight className="size-4" strokeWidth={3} /></a>
            </Step>
            <Step n={3} title="Deja tu paquete en el Punto Blue Express">
              <p>{dropText[e.paymentMethod]}</p>
              {origin && (
                <p className="flex gap-2 rounded-gls border border-line-soft p-3 text-sm"><MapPin className="size-5 shrink-0 text-brand" /><span><b className="block">{origin.agency_name}</b>{agencyAddress(origin)}, {origin.location.city_name}</span></p>
              )}
              <Alert>Recuerda: el tiempo de entrega comienza a contar una vez recibimos tu envío.</Alert>
            </Step>
          </ol>
          <div className="flex flex-col gap-3 border-t border-line-soft pt-6 sm:flex-row">
            <Button onClick={() => navigate('/')}>Haz otro envío</Button>
            <Button variant="secondary">Crear cuenta</Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold">Pago</h2>
            <dl className="mt-3 space-y-2 text-[15px]">
              <div className="flex justify-between gap-2"><dt className="text-muted">Monto</dt><dd className="font-bold">{clp(e.request.total)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">N° de transacción</dt><dd className="font-mono">{e.transactionId}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Medio de pago</dt><dd className="text-right">{e.payment ? `Webpay •••• ${e.payment.cardLast4}` : METHODS[e.paymentMethod].title}</dd></div>
              {e.payment && <div className="flex justify-between gap-2"><dt className="text-muted">Autorización</dt><dd className="font-mono">{e.payment.authorizationCode}</dd></div>}
            </dl>
          </Card>
          <Card className="!bg-sky">
            <h2 className="text-lg font-bold">¡Mucho más que un seguimiento!</h2>
            <p className="mt-1 text-sm">Conoce cómo garantizamos la entrega de tus paquetes. El destinatario podrá gestionar su entrega desde el tracking:</p>
            <ul className="mt-3 space-y-2 text-sm">
              {['Configurar un destino de entrega alternativo.', 'Corregir la dirección de entrega o pedir que quede en un Punto Blue Express.', 'Alertas y notificaciones para resolver cualquier problema en el camino.'].map((t) => (
                <li key={t} className="flex gap-2"><Check className="size-4 shrink-0 text-brand" strokeWidth={3} />{t}</li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4 w-full !h-10">Hacer seguimiento</Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
