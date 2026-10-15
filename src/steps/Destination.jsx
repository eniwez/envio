import { useStore } from '../store'
import AgencyPicker from '../components/AgencyPicker'
import { AddressEntry } from '../components/Address'
import { Card, CardTitle, Field } from '../ui'
import { ChevronRight, House, Store } from 'lucide-react'

export default function Destination({ catalog, errors }) {
  const { state, set } = useStore()
  const d = state.destination
  const field = (key) => ({ value: d[key], error: errors[key], onChange: (e) => set('destination', { [key]: e.target.value }) })

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle title="Datos del destinatario" subtitle="Completa los datos de quien recibe" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" required {...field('firstName')} />
          <Field label="Apellido" required {...field('lastName')} />
          <Field label="Celular" required inputMode="tel" {...field('phone')} onChange={(e) => set('destination', { phone: e.target.value.replace(/\D/g, '').slice(0, 11) })} hint="Ej: 912345678" />
          <Field label="Correo electrónico" required type="email" {...field('email')} />
        </div>
      </Card>

      {d.mode === 'home' ? (
        <Card>
          <CardTitle title="Dirección de destino" subtitle="Entrega en el domicilio del destinatario" />
          <AddressEntry section={d} update={(fn) => set('destination', fn)} regions={catalog.regions} communes={catalog.communes} errors={errors} optionalLabels searchLabel="Dirección del destinatario (calle, número y comuna)" />
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-brand-50 px-4 py-3">
            <Store className="size-5 shrink-0 text-brand" />
            <p className="flex-1 text-sm text-ink">¿Prefieres que el destinatario retire en un Punto Blue Express?</p>
            <button type="button" onClick={() => set('destination', { mode: 'point' })} className="inline-flex items-center gap-0.5 text-sm font-bold text-brand hover:underline">
              Enviar a un Punto<ChevronRight className="size-4" strokeWidth={3} />
            </button>
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle title="Punto Blue Express de destino" subtitle="El destinatario retira su paquete en el Punto que elijas" />
          <AgencyPicker
            kind="destino"
            regions={catalog.regions}
            communes={catalog.communes}
            commune={d.pointCommune}
            point={d.pointLoc}
            searchText={d.pointSearch}
            agency={d.agency}
            error={errors.agency}
            onChange={({ region, commune, point, text, agency }) => set('destination', (p) => ({
              ...p,
              ...(region !== undefined && { pointRegion: region }),
              ...(commune !== undefined && { pointCommune: commune }),
              ...(point !== undefined && { pointLoc: point }),
              ...(text !== undefined && { pointSearch: text }),
              agency,
            }))}
          />
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-canvas px-4 py-3">
            <House className="size-5 shrink-0 text-muted" />
            <p className="flex-1 text-sm text-muted">¿El destinatario no puede retirar en un Punto?</p>
            <button type="button" onClick={() => set('destination', { mode: 'home' })} className="inline-flex items-center gap-0.5 text-sm font-semibold text-ink hover:text-brand">
              Enviar a domicilio<ChevronRight className="size-4" strokeWidth={3} />
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
