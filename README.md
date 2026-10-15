# Envío invitado — flujo Blue Express con UI estilo GLS

Clon del flujo de [envio-publico.blue.cl](https://envio-publico.blue.cl) (Talla → Origen → Destino → Pago → Confirmación) con el lenguaje visual de [gls-pakete.de](https://www.gls-pakete.de). React + Vite + Tailwind v4, con el backend simulado en el navegador (sin servidor).

## Correr

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # validaciones (RUT, celular, talla por medidas)
npm run build      # genera dist/ (sitio estático)
```

## Publicar en Cloudflare Pages

No hay backend: todo se simula en el navegador. En Pages: *Build command* `npm run build`, *Build output directory* `dist`. Sin `404.html`, Pages sirve `index.html` en cualquier ruta, así que `/webpay`, `/confirmacion` y `/etiqueta` funcionan.

## API simulada (`src/api.js`)

Misma forma que tenía la API de Mockoon, pero en el cliente. Los datos reales están en `src/data/*.json`.

| Función | Qué hace |
|---|---|
| `regions()`, `communes()` | Datos reales de Blue (16 regiones, 344 comunas) |
| `sizes()` | Tallas XS–XL |
| `agencies(comuna)` | Puntos reales para Providencia (13123), Concepción (8101) y Viña del Mar (5109); el resto se genera alrededor de la coordenada (estable entre recargas) |
| `quote()` | $ según talla; +$2.200 entre regiones (48 a 72 hrs); -$500 dentro de la misma comuna |
| `paymentMethods()` | Webpay + pago en origen + pago en destino (Punto) o al recibir (domicilio) |
| `emit()` | Crea el envío; con Webpay devuelve `paymentUrl` |
| `webpayCommit()` | Pago simulado |
| `places()` | Simula Google Places: reconoce la comuna escrita al final de la dirección |

### Escenarios para probar

- **Error al emitir:** el destinatario se llama `error` → 500 y modal "¡Hubo un problema con tu envío!".
- **Sin cobertura:** comuna Antártica, Juan Fernández o Isla de Pascua → "¡Lo sentimos!…".
- **Webpay:** tarjeta `4051 8856 0044 6623` aprobada, `5186 0595 5959 0568` rechazada (hay botones de atajo en la página de pago).
- **Dirección sin número:** al elegir una sugerencia sin número se pasa a "Ingresar manual".
- RUT válido de prueba: `11.111.111-1`.

El progreso se guarda en `sessionStorage`, así que recargar no lo borra.

No incluido: escaneo OCR de etiquetas, Cloudflare Turnstile y analítica (GTM).
