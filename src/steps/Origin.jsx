import { useStore } from '../store'
import { formatRut } from '../lib'
import AgencyPicker from '../components/AgencyPicker'
import { AddressEntry } from '../components/Address'
import { Card, CardTitle, Field } from '../ui'

export default function Origin({ catalog, errors }) {
  const { state, set } = useStore()
  const o = state.origin
  const field = (key) => ({ value: o[key], error: errors[key], onChange: (e) => set('origin', { [key]: e.target.value }) })

  // Al confirmar la dirección del remitente se sugiere la misma comuna para el Punto de origen
  const suggestPoint = (prev, address) => (!prev.pointCommune && address.commune ? { pointRegion: address.region, pointCommune: address.commune } : {})
  const update = (fn) => set('origin', fn)
  const factura = o.docType === 'factura'

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle title="Datos del remitente" subtitle={factura ? 'Completa los datos de la empresa que envía' : 'Completa los datos de quien envía'} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={factura ? 'RUT empresa' : 'RUT'} required {...field('rut')} onChange={(e) => set('origin', { rut: formatRut(e.target.value) })} hint={factura ? 'Se emitirá la factura a este RUT' : 'Vinculamos este envío a tu RUT'} />
          <Field label={factura ? 'Razón social' : 'Nombre'} required autoComplete={factura ? 'organization' : 'given-name'} {...field('firstName')} />
          <Field label={factura ? 'Actividad (giro SII)' : 'Apellido'} required autoComplete={factura ? 'off' : 'family-name'} {...field('lastName')} />
          <Field label="Correo electrónico" required type="email" autoComplete="email" {...field('email')} />
          <Field label="Celular" required inputMode="tel" autoComplete="tel-national" {...field('phone')} onChange={(e) => set('origin', { phone: e.target.value.replace(/\D/g, '').slice(0, 11) })} hint="Ej: 912345678" />
        </div>

        <div className="mt-8 border-t border-line-soft pt-6">
          <h3 className="text-lg font-bold">Ingresa la dirección</h3>
          <p className="mt-1 text-sm text-muted">Escribe tu dirección y selecciónala de la lista. Si no la encuentras, la completas manualmente.</p>
          <div className="mt-5">
            <AddressEntry section={o} update={update} regions={catalog.regions} communes={catalog.communes} errors={errors} onAddress={suggestPoint} />
          </div>
        </div>
        <p className="mt-6 text-[13px] text-muted">( <span className="text-danger">*</span> ) Campo obligatorio</p>
      </Card>

      <Card>
        <CardTitle title="Punto Blue Express de origen" subtitle="Elige dónde dejarás tu paquete" />
        <AgencyPicker
          kind="origen"
          regions={catalog.regions}
          communes={catalog.communes}
          commune={o.pointCommune}
          point={o.pointLoc}
          searchText={o.pointSearch}
          agency={o.agency}
          error={errors.agency}
          onChange={({ region, commune, point, text, agency }) => set('origin', (p) => ({
            ...p,
            ...(region !== undefined && { pointRegion: region }),
            ...(commune !== undefined && { pointCommune: commune }),
            ...(point !== undefined && { pointLoc: point }),
            ...(text !== undefined && { pointSearch: text }),
            agency,
          }))}
        />
      </Card>
    </div>
  )
}
