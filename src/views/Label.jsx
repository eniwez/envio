import { agencyAddress } from '../lib'
import { Button } from '../ui'
import { ChevronLeft, Printer } from 'lucide-react'

// ponytail: barras decorativas derivadas del número, no es un Code128 escaneable; usar una lib de barcode si se requiere lectura real
const Bars = ({ value }) => (
  <svg viewBox={`0 0 ${value.length * 11} 60`} className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
    {[...value].flatMap((d, i) => [0, 1, 2].map((j) => {
      const w = ((+d + j * 3) % 3) + 1
      return <rect key={`${i}-${j}`} x={i * 11 + j * 3.6} y="0" width={w * 0.9} height="60" fill="#000" />
    }))}
  </svg>
)

export default function Label({ tx }) {
  const e = JSON.parse(sessionStorage.getItem(`emission-${tx}`) || 'null')
  if (!e) return <p className="p-10">Etiqueta no encontrada.</p>
  const { origin, destination, pkg } = e.snapshot
  const dest = destination.mode === 'home'
    ? `${destination.address.street} ${destination.address.number || 'S/N'}${destination.address.depto ? `, ${destination.address.depto}` : ''}`
    : `${destination.agency.agency_name} · ${agencyAddress(destination.agency)}`

  return (
    <div className="min-h-screen bg-canvas py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[400px] justify-between print:hidden">
        <Button variant="link" onClick={() => window.close()}><ChevronLeft className="size-5" strokeWidth={3} />Cerrar</Button>
        <Button onClick={() => window.print()}><Printer className="size-5" />Imprimir</Button>
      </div>
      <article className="mx-auto w-[400px] border-2 border-black bg-white font-sans text-black">
        <header className="flex items-center justify-between border-b-2 border-black px-4 py-3">
          <span className="text-3xl font-black">Envío</span>
          <span className="border-2 border-black px-3 py-1 text-3xl font-black">{pkg.size}</span>
        </header>
        <section className="border-b-2 border-black px-4 py-3">
          <p className="text-[11px] font-bold uppercase">Destinatario</p>
          <p className="text-xl font-black uppercase leading-tight">{destination.firstName} {destination.lastName}</p>
          <p className="text-sm uppercase">{dest}</p>
          <p className="text-lg font-black uppercase">{e.request.route.destinationName}</p>
          <p className="text-sm">Tel: {destination.phone}</p>
        </section>
        <section className="grid grid-cols-2 border-b-2 border-black text-sm">
          <div className="border-r-2 border-black px-4 py-2">
            <p className="text-[11px] font-bold uppercase">Remitente</p>
            <p className="font-bold uppercase">{origin.firstName} {origin.lastName}</p>
            <p>RUT {origin.rut}</p>
          </div>
          <div className="px-4 py-2">
            <p className="text-[11px] font-bold uppercase">Origen</p>
            <p className="font-bold">{e.request.route.origin} → {e.request.route.destination}</p>
            <p>{e.paymentMethod === 'RECEIVER' || e.paymentMethod === 'DEST_AGENCY_PAY' ? 'POR PAGAR' : 'PAGADO'}</p>
          </div>
        </section>
        <section className="px-4 py-4 text-center">
          <Bars value={e.trackingNumber} />
          <p className="mt-1 font-mono text-lg font-bold tracking-[0.3em]">{e.trackingNumber}</p>
        </section>
        <footer className="border-t-2 border-black px-4 py-2 text-[11px]">Contenido: {pkg.content} · Valor declarado ${Number(pkg.value).toLocaleString('es-CL')}</footer>
      </article>
    </div>
  )
}
