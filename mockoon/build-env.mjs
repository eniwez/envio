// Genera mockoon/env.json (formato Mockoon) para la API simulada.
import fs from 'fs';
import { randomUUID as id } from 'crypto';

const json = (o) => JSON.stringify(o, null, 2);
const res = (o) => ({
  uuid: id(), body: '{}', latency: 0, statusCode: 200, label: '', headers: [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }],
  bodyType: 'INLINE', filePath: '', databucketID: '', sendFileAsBody: false, rules: [], rulesOperator: 'OR',
  disableTemplating: false, fallbackTo404: false, default: false, crudKey: 'id', callbacks: [], ...o,
});
const rule = (target, modifier, value, operator = 'equals', invert = false) => ({ target, modifier, value, invert, operator });
const route = (method, endpoint, documentation, responses) => ({
  uuid: id(), type: 'http', documentation, method, endpoint, responses, responseMode: null, streamingMode: null, streamingInterval: 0,
});

const hours = json({ monday: '09:00-19:00', tuesday: '09:00-19:00', wednesday: '09:00-19:00', thursday: '09:00-19:00', friday: '09:00-19:00', saturday: '10:00-14:00', sunday: null });

const syntheticAgencies = `[
{{#repeat 3 7 comma=true}}
  {
    "agency_id": "{{int 10000 99999}}",
    "agency_name": "Punto Blue Express {{oneOf (array 'Minimarket' 'Librería' 'Bazar' 'Ferretería' 'Copec' 'Almacén' 'Botillería' 'Farmacia')}} {{faker 'person.lastName'}}",
    "commune_code": "{{queryParam 'commune'}}",
    "point_type": "{{oneOf (array 'Punto Blue Express' 'Punto Blue Express' 'Punto Blue Express Copec')}}",
    "is_24_hours": {{oneOf (array 'false' 'false' 'false' 'true')}},
    "open_hours": ${hours},
    "services": {{{oneOf (array '["Impresión de etiqueta","Pago en Punto Blue Express"]' '["Pago en Punto Blue Express"]' '["Impresión de etiqueta"]')}}},
    "location": {
      "latitude": {{add (queryParam 'lat' '-33.45') (float -0.015 0.015)}},
      "longitude": {{add (queryParam 'lng' '-70.66') (float -0.015 0.015)}},
      "street_name": "{{faker 'location.street'}}",
      "street_number": "{{int 100 3999}}",
      "city_name": "{{queryParam 'name'}}",
      "state_name": ""
    }
  }
{{/repeat}}
]`;

const quote = `{{setVar 'base' 0}}
{{#switch (body 'package')}}
  {{#case 'XS'}}{{setVar 'base' 3290}}{{/case}}
  {{#case 'S'}}{{setVar 'base' 3990}}{{/case}}
  {{#case 'M'}}{{setVar 'base' 4800}}{{/case}}
  {{#case 'L'}}{{setVar 'base' 7990}}{{/case}}
  {{#case 'XL'}}{{setVar 'base' 12990}}{{/case}}
{{/switch}}
{{#if (eq (body 'originRegion') (body 'destinationRegion'))}}
{
  "sla": 1,
  "slaTime": "24 hrs",
  "total": {{#if (eq (body 'origin') (body 'destination'))}}{{subtract @base 500}}{{else}}{{@base}}{{/if}},
  "discounts": [{{#if (eq (body 'origin') (body 'destination'))}}{ "label": "Envío dentro de la misma comuna", "amount": 500 }{{/if}}]
}
{{else}}
{
  "sla": 3,
  "slaTime": "48 a 72 hrs",
  "total": {{add @base 2200}},
  "discounts": []
}
{{/if}}`;

const emission = `{
  "transactionId": "{{int 100000000 999999999}}",
  "trackingNumber": "{{int 1000000000 9999999999}}",
  "paymentMethod": "{{body 'paymentMethod'}}",
  "createdAt": "{{now}}"{{#if (eq (body 'paymentMethod') 'WEBPAY')}},
  "paymentUrl": "/webpay"{{/if}}
}`;

const places = `{{#if (gte (len (queryParamRaw 'q')) 3)}}
{ "suggestions": [
{{#repeat 4 comma=true}}
{{#with (oneOf (dataRaw 'places'))}}
  {
    "placeId": "{{faker 'string.alphanumeric' 20}}",
    "text": "{{queryParam 'q'}}, {{name}}, {{regionName}}",
    "street": "{{queryParam 'q'}}",
    "communeCode": "{{code}}",
    "communeName": "{{name}}",
    "regionISO": "{{region}}",
    "location": { "lat": {{add lat (float -0.01 0.01)}}, "lng": {{add lng (float -0.01 0.01)}} }
  }
{{/with}}
{{/repeat}}
] }
{{else}}{ "suggestions": [] }{{/if}}`;

const communes = JSON.parse(fs.readFileSync(new URL('./', import.meta.url).pathname + 'data/communes.json'));
const regions = JSON.parse(fs.readFileSync(new URL('./', import.meta.url).pathname + 'data/regions.json'));
const popular = ['13123', '13101', '13114', '13110', '13119', '13120', '13201', '13132', '13105', '13401', '5101', '5109', '8101', '9101', '4101', '2101', '10101', '7101', '6101', '1101'];
const placesBucket = popular.map((c) => communes.find((x) => x.code === c)).filter(Boolean).map((c) => ({
  code: c.code, name: c.name, region: c.region, regionName: regions.find((r) => r.regionISO === c.region).name,
  lat: c.geolocation.latitude, lng: c.geolocation.longitude,
}));
const bucketId = 'places';

const routes = [
  route('get', 'sizes', 'Tallas disponibles para el canal web público', [res({
    default: true, body: json([
      { code: 'XS', title: 'Talla XS', description: 'Sobres acolchados o cajas chicas hasta 0,5 Kg', maxKg: 0.5, dims: [25, 20, 5] },
      { code: 'S', title: 'Talla S', description: 'Hasta 3 Kg o 20 x 20 x 30 cms', maxKg: 3, dims: [20, 20, 30] },
      { code: 'M', title: 'Talla M', description: 'Hasta 6 Kg o 30 x 30 x 25 cms', maxKg: 6, dims: [30, 30, 25] },
      { code: 'L', title: 'Talla L', description: 'Hasta 20 Kg o 70 x 70 x 70 cms', maxKg: 20, dims: [70, 70, 70] },
      { code: 'XL', title: 'Talla XL', description: 'Hasta 25 Kg o 100 x 100 x 100 cms', maxKg: 25, dims: [100, 100, 100] },
    ]),
  })]),
  route('get', 'regions', 'Regiones de Chile', [res({ default: true, bodyType: 'FILE', filePath: './data/regions.json' })]),
  route('get', 'communes', 'Comunas de Chile', [res({ default: true, bodyType: 'FILE', filePath: './data/communes.json' })]),
  route('get', 'agencies', 'Puntos Blue Express por comuna. ?commune=CODE&lat=&lng=&name=  (datos reales para Providencia, Concepción y Viña del Mar; resto generado)', [
    ...['13123', '8101', '5109'].map((c) => res({ label: `Comuna ${c} (datos reales)`, bodyType: 'FILE', filePath: `./data/agencies-${c}.json`, rules: [rule('query', 'commune', c)] })),
    res({ label: 'Sin cobertura (Antártica, Juan Fernández, Isla de Pascua)', body: '[]', rules: [rule('query', 'commune', '^(12202|5104|5201)$', 'regex')] }),
    res({ label: 'Generado', default: true, body: syntheticAgencies }),
  ]),
  route('post', 'quote', 'Cotiza envío. body: {origin, destination, originRegion, destinationRegion, package}', [res({ default: true, body: quote })]),
  route('post', 'payment-methods', 'Métodos de pago según destino', [
    res({ label: 'Destino es un Punto', body: json({ paymentMethods: [{ code: 'WEBPAY' }, { code: 'ORIG_AGENCY_PAY' }, { code: 'DEST_AGENCY_PAY' }] }), rules: [rule('body', 'destinyAgencyId', '.+', 'regex')] }),
    res({ label: 'Destino es domicilio', default: true, body: json({ paymentMethods: [{ code: 'WEBPAY' }, { code: 'ORIG_AGENCY_PAY' }, { code: 'RECEIVER' }] }) }),
  ]),
  route('post', 'emissions', 'Crea la emisión. Si el nombre del destinatario es "error" responde 500', [
    res({ label: 'Error simulado', statusCode: 500, latency: 1200, body: json({ message: 'Error al crear la emisión.' }), rules: [rule('body', 'destination.firstName', '^error$', 'regex_i')] }),
    res({ label: 'OK', default: true, latency: 1500, body: emission }),
  ]),
  route('post', 'webpay/commit', 'Confirma pago simulado', [
    res({ label: 'Rechazado', statusCode: 402, body: json({ status: 'REJECTED', message: 'Transacción rechazada por el emisor.' }), rules: [rule('body', 'approved', 'false')] }),
    res({ label: 'Aprobado', default: true, latency: 1200, body: '{ "status": "AUTHORIZED", "authorizationCode": "{{int 100000 999999}}", "cardLast4": "{{body \'cardLast4\'}}" }' }),
  ]),
  route('get', 'places/autocomplete', 'Autocompletado de direcciones (simula Google Places). ?q=', [res({ default: true, latency: 250, body: places })]),
];

const env = {
  uuid: id(), lastMigration: 33, name: 'Envío público (Blue flow)', endpointPrefix: 'api', latency: 350, port: 3001, hostname: '',
  folders: [], routes, rootChildren: routes.map((r) => ({ type: 'route', uuid: r.uuid })),
  proxyMode: false, proxyHost: '', proxyRemovePrefix: false,
  tlsOptions: { enabled: false, type: 'CERT', pfxPath: '', certPath: '', keyPath: '', caPath: '', passphrase: '' },
  cors: true, headers: [{ key: 'Content-Type', value: 'application/json' }], proxyReqHeaders: [], proxyResHeaders: [],
  data: [{ uuid: id(), id: bucketId, name: 'places', documentation: 'Comunas usadas por el autocompletado', value: json(placesBucket) }],
  callbacks: [],
};
fs.writeFileSync(new URL('./', import.meta.url).pathname + 'env.json', json(env));
console.log('ok', routes.length);
