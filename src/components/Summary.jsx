import { agencyAddress, clp } from '../lib'
import { Skeleton } from '../ui'
import { Clock, House, Lock, MapPin, Package, Store } from 'lucide-react'

const Row = ({ icon: RowIcon, label, children }) => (
  <div className="flex gap-3 py-3">
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand"><RowIcon className="size-[18px]" /></span>
    <div className="min-w-0 flex-1">
      <p className="text-[13px] text-muted">{label}</p>
      <div className="text-[15px] font-semibold leading-snug">{children || <Skeleton className="mt-1.5 h-3.5 w-3/4" />}</div>
    </div>
  </div>
)

// Equivalente al "Warenkorb" de GLS / "Resumen de tu envío" de Blue
export default function Summary({ state, sizes, communes, quote }) {
  const { origin, destination, pkg } = state
  const communeName = (code) => communes.find((c) => c.code === code)?.name
  const size = sizes.find((s) => s.code === pkg.size)
  const dest = destination.mode === 'home'
    ? destination.address.commune && destination.address.street && `${destination.address.street}${destination.address.number ? ` ${destination.address.number}` : ' S/N'}, ${communeName(destination.address.commune)}`
    : destination.agency && `${destination.agency.agency_name}`
  const empty = !origin.agency && !dest && !size

  return (
    <aside className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-6" aria-label="Resumen de tu envío">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Resumen de tu envío</h2>
        <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-white">{destination.mode === 'home' ? 'Punto a domicilio' : 'Punto a punto'}</span>
      </div>

      {empty ? (
        <div className="py-8 text-center">
          <Package className="mx-auto size-12 text-ink" strokeWidth={1.3} />
          <p className="mt-3 text-lg font-bold">Aún no hay nada aquí...</p>
          <p className="text-sm text-muted">Completa los datos para ver el valor de tu envío.</p>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-line-soft">
          <Row icon={Store} label="Origen">{origin.agency && <>{origin.agency.agency_name}<span className="block text-[13px] font-normal text-muted">{agencyAddress(origin.agency)}, {origin.agency.location.city_name}</span></>}</Row>
          <Row icon={destination.mode === 'home' ? House : MapPin} label="Destino">{dest}</Row>
          <Row icon={Package} label="Talla">{size && <>{size.title}<span className="block text-[13px] font-normal text-muted">{size.description}</span></>}</Row>
          <Row icon={Clock} label="Entrega">{quote?.slaTime}</Row>
        </div>
      )}

      {quote?.discounts?.map((d) => (
        <div key={d.label} className="mt-2 flex justify-between gap-3 rounded-gls bg-ok-50 px-3 py-2 text-sm text-ok">
          <span>{d.label}</span><span className="font-bold">-{clp(d.amount)} dcto.</span>
        </div>
      ))}

      <div className="mt-4 flex items-center justify-between rounded-gls bg-brand px-4 py-4 text-white">
        <span className="text-lg font-bold">Total a pagar</span>
        <span className="text-2xl font-black">{clp(quote?.total)}</span>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted"><Lock className="size-3.5" />Pago seguro con cifrado SSL</p>
    </aside>
  )
}
