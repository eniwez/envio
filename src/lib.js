// Reglas de validación copiadas del bundle
export const isEmail = (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)

export const isPhone = (v) => {
  const d = v.replace(/\D/g, '')
  return (d.length === 9 && d.startsWith('9')) || (d.length === 11 && d.startsWith('56') && d[2] === '9')
}

export const cleanRut = (v) => v.replace(/[^0-9kK]/g, '').toUpperCase()

export const formatRut = (v) => {
  const c = cleanRut(v).slice(0, 9)
  return c.length < 2 ? c : `${c.slice(0, -1)}-${c.slice(-1)}`
}

export const isRut = (v) => {
  const c = cleanRut(v)
  if (c.length < 8) return false
  const body = c.slice(0, -1)
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += +body[i] * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const dv = 11 - (sum % 11)
  return c.slice(-1) === (dv === 11 ? '0' : dv === 10 ? 'K' : String(dv))
}

export const clp = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n || 0)

export const titleCase = (s = '') => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())

// "Prefiero ingresar las medidas": la talla más chica donde caben medidas y peso (peso volumétrico /4000)
export const sizeFromMeasures = (sizes, { length, width, height, weight }) => {
  const dims = [+length, +width, +height].sort((a, b) => b - a)
  if (dims.some((d) => !(d > 0)) || !(+weight > 0)) return null
  const billable = Math.max(+weight, (dims[0] * dims[1] * dims[2]) / 4000)
  return sizes.find((s) => {
    const max = [...s.dims].sort((a, b) => b - a)
    return dims.every((d, i) => d <= max[i]) && billable <= s.maxKg
  })?.code ?? 'TOO_BIG'
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
export const todayHours = (agency) => (agency.is_24_hours ? 'Abierto 24/7' : agency.open_hours?.[DAYS[new Date().getDay()]] || 'Cerrado hoy')

export const agencyAddress = (a) => titleCase(`${a.location.street_name}${a.location.street_name.includes(a.location.street_number) ? '' : ` ${a.location.street_number}`}`)
