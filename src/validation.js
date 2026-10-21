import { isEmail, isPhone, isRut } from './lib'

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v))

const person = (p) => ({
  firstName: p.firstName.trim().length < 3 && 'Ingresa al menos 3 caracteres',
  lastName: p.lastName.trim().length < 3 && 'Ingresa al menos 3 caracteres',
  email: !isEmail(p.email) && 'Ingresa un correo válido',
  phone: !isPhone(p.phone) && 'Formato de número incorrecto ej: 981234567',
})

export const addressErrors = (a) => clean({
  region: !a.region && 'Selecciona una región',
  commune: !a.commune && 'Selecciona una comuna',
  street: a.street.trim().length < 3 && 'Ingresa una calle válida',
  number: a.number && !/^\d+$/.test(a.number) && 'Ingresa un número válido',
})

// Un objeto de errores por paso; vacío = paso válido
export const stepErrors = [
  ({ origin: o }) => {
    const addr = addressErrors(o.address)
    return clean({
      ...person(o),
      ...(o.docType === 'factura' && {
        firstName: o.firstName.trim().length < 3 && 'Ingresa la razón social',
        lastName: o.lastName.trim().length < 3 && 'Ingresa la actividad (giro) de la empresa',
      }),
      rut: !isRut(o.rut) && (o.docType === 'factura' ? 'Ingresa un RUT de empresa válido' : 'Por favor ingresa un RUT válido'),
      ...(o.addressMode === 'manual' ? addr : { search: Object.keys(addr).length > 0 && 'Ingresa la dirección exacta y selecciona una opción' }),
      agency: !o.agency && 'Debes seleccionar una sucursal de origen',
    })
  },
  ({ destination: d }) => {
    const addr = addressErrors(d.address)
    const home = d.addressMode === 'manual' ? addr : { search: Object.keys(addr).length > 0 && 'Ingresa la dirección exacta y selecciona una opción' }
    return clean({
      ...person(d),
      ...(d.mode === 'home' ? home : { agency: !d.agency && 'Debes seleccionar una sucursal de destino' }),
    })
  },
  ({ pkg: p, payment }) => {
    const value = Number(p.value)
    return clean({
      content: p.content.trim().length < 4 && 'Describe el contenido (mínimo 4 caracteres)',
      value: !(value >= 10 && value <= 2_000_000) && 'Ingresa un valor entre $10 y $2.000.000',
      accepted: !p.accepted && 'Debes confirmar que tu envío no contiene mercancías peligrosas',
      method: !payment.method && 'Selecciona un método de pago',
      terms: !payment.terms && 'Acepta los términos y condiciones.',
    })
  },
]
