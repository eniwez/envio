// "Backend" simulado 100% en el navegador: sin servidor, así se publica como sitio estático (Cloudflare Pages).
// Mantiene la forma de la antigua API de Mockoon; los datos reales viven en src/data/*.json.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const load = {
  sizes: () => import('./data/sizes.json').then((m) => m.default),
  regions: () => import('./data/regions.json').then((m) => m.default),
  communes: () => import('./data/communes.json').then((m) => m.default),
  'agencies-13123': () => import('./data/agencies-13123.json').then((m) => m.default),
  'agencies-8101': () => import('./data/agencies-8101.json').then((m) => m.default),
  'agencies-5109': () => import('./data/agencies-5109.json').then((m) => m.default),
}

// Aleatoriedad con semilla: las sucursales generadas y las coordenadas son estables entre recargas
const seeded = (str) => {
  let h = 1779033703
  for (const ch of str) {
    h = Math.imul(h ^ ch.charCodeAt(0), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const between = (rnd, min, max) => min + rnd() * (max - min)
const pick = (rnd, list) => list[Math.floor(rnd() * list.length)]

// Comunas con datos reales de sucursales; Antártica, Juan Fernández e Isla de Pascua no tienen cobertura
const REAL = new Set(['13123', '8101', '5109'])
const NO_COVERAGE = new Set(['12202', '5104', '5201'])
const HOURS = { monday: '09:00-19:00', tuesday: '09:00-19:00', wednesday: '09:00-19:00', thursday: '09:00-19:00', friday: '09:00-19:00', saturday: '10:00-14:00', sunday: null }
const STREETS = ['Av. Libertad', 'Los Aromos', 'Las Acacias', 'Pedro de Valdivia', 'Av. Central', 'O\'Higgins', 'Arturo Prat', 'Los Carrera', 'Manuel Montt', 'San Martín', 'Los Alerces', 'Baquedano']
const SERVICES = [['Impresión de etiqueta', 'Pago con tarjeta'], ['Pago con tarjeta'], ['Impresión de etiqueta']]

const syntheticAgencies = (c) => {
  const { latitude, longitude } = c.geolocation
  const rnd = seeded(`${c.code}:${latitude.toFixed(3)}:${longitude.toFixed(3)}`)
  const ids = new Set()
  return Array.from({ length: 3 + Math.floor(rnd() * 5) }, () => {
    let id
    do id = String(10000 + Math.floor(rnd() * 90000)); while (ids.has(id))
    ids.add(id)
    return {
      agency_id: id,
      agency_name: `Sucursal ${100 + Math.floor(rnd() * 900)}`,
      commune_code: c.code,
      point_type: 'Sucursal',
      is_24_hours: rnd() < 0.25,
      open_hours: HOURS,
      services: pick(rnd, SERVICES),
      location: {
        latitude: latitude + between(rnd, -0.015, 0.015),
        longitude: longitude + between(rnd, -0.015, 0.015),
        street_name: pick(rnd, STREETS),
        street_number: String(100 + Math.floor(rnd() * 3900)),
        city_name: c.name,
        state_name: '',
      },
    }
  })
}

// Cachea por comuna y coordenadas, así la selección sobrevive al volver atrás
const once = {}
const cached = (key, fn) => (once[key] ??= fn().catch((e) => { delete once[key]; throw e }))

// Comunas más usadas: sugerencias por defecto del autocompletado
const POPULAR = ['13123', '13101', '13114', '13110', '13119', '13120', '13201', '13132', '13105', '13401', '5101', '5109', '8101', '9101', '4101', '2101', '10101', '7101', '6101', '1101']

// Simula Google Places: reconoce la comuna escrita al final ("Los Alerces 123 vina") y, si no hay, ofrece comunas populares
async function places(q) {
  const [communes, regions] = await Promise.all([load.communes(), load.regions()])
  const text = q.trim()
  if (text.length < 3) return { suggestions: [] }
  const words = text.split(/\s+/)
  const regionName = (iso) => regions.find((r) => r.regionISO === iso)?.name ?? ''
  const rank = (c) => (POPULAR.includes(c.code) ? 0 : 1)

  let street = text
  let matches = []
  for (let n = Math.min(3, words.length - 1); n >= 1 && !matches.length; n--) {
    const tail = fold(words.slice(-n).join(' '))
    matches = communes.filter((c) => fold(c.name).startsWith(tail) && tail.length >= 3).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
    if (matches.length) street = words.slice(0, -n).join(' ')
  }
  if (!matches.length) matches = POPULAR.map((code) => communes.find((c) => c.code === code)).filter(Boolean)
  const rnd = seeded(fold(text))
  return {
    suggestions: matches.slice(0, 4).map((c) => ({
      placeId: `${c.code}-${Math.floor(rnd() * 1e9).toString(36)}`,
      text: `${street}, ${c.name}, ${regionName(c.region)}`,
      street,
      communeCode: c.code,
      communeName: c.name,
      regionISO: c.region,
      location: { lat: c.geolocation.latitude + between(rnd, -0.01, 0.01), lng: c.geolocation.longitude + between(rnd, -0.01, 0.01) },
    })),
  }
}

const BASE = { XS: 3290, S: 3990, M: 4800, L: 7990, XL: 12990 }
const quote = ({ origin, destination, originRegion, destinationRegion, package: size }) => {
  const base = BASE[size] ?? 0
  if (originRegion !== destinationRegion) return { sla: 3, slaTime: '48 a 72 hrs', total: base + 2200, discounts: [] }
  const same = origin === destination
  return { sla: 1, slaTime: '24 hrs', total: same ? base - 500 : base, discounts: same ? [{ label: 'Envío dentro de la misma comuna', amount: 500 }] : [] }
}

const int = (min, max) => Math.floor(min + Math.random() * (max - min + 1))

export const api = {
  sizes: () => cached('sizes', async () => (await sleep(150), load.sizes())),
  regions: () => cached('regions', async () => (await sleep(150), load.regions())),
  communes: () => cached('communes', async () => (await sleep(150), load.communes())),
  agencies: (c) =>
    cached(`agencies:${c.code}:${c.geolocation.latitude.toFixed(3)}:${c.geolocation.longitude.toFixed(3)}`, async () => {
      await sleep(350)
      if (NO_COVERAGE.has(c.code)) return []
      return REAL.has(c.code) ? load[`agencies-${c.code}`]() : syntheticAgencies(c)
    }),
  places: async (q) => (await sleep(250), places(q)),
  quote: async (body) => (await sleep(350), quote(body)),
  paymentMethods: async ({ destinyAgencyId }) => {
    await sleep(350)
    return { paymentMethods: [{ code: 'WEBPAY' }, { code: 'ORIG_AGENCY_PAY' }, { code: destinyAgencyId ? 'DEST_AGENCY_PAY' : 'RECEIVER' }] }
  },
  // Si el nombre del destinatario es "error" simula una falla del servidor
  emit: async (body) => {
    if (/^error$/i.test(body.destination?.firstName ?? '')) {
      await sleep(1200)
      throw new Error('Error al crear la emisión.')
    }
    await sleep(1500)
    return {
      transactionId: String(int(100000000, 999999999)),
      trackingNumber: String(int(1000000000, 9999999999)),
      paymentMethod: body.paymentMethod,
      createdAt: new Date().toISOString(),
      ...(body.paymentMethod === 'WEBPAY' && { paymentUrl: '/webpay' }),
    }
  },
  webpayCommit: async ({ approved, cardLast4 }) => {
    await sleep(1200)
    if (approved === false) throw new Error('Transacción rechazada por el emisor.')
    return { status: 'AUTHORIZED', authorizationCode: String(int(100000, 999999)), cardLast4 }
  },
}
