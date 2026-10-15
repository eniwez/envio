import { useState } from 'react'
import { api } from '../api'
import { navigate } from '../App'
import { clp } from '../lib'
import { Alert, Button, Card, Field } from '../ui'
import { CreditCard, Lock } from 'lucide-react'

// Pasarela simulada. Tarjetas de prueba de Transbank:
// 4051 8856 0044 6623 → aprobada · 5186 0595 5959 0568 → rechazada
const TEST_CARDS = [
  { number: '4051 8856 0044 6623', label: 'VISA aprobada' },
  { number: '5186 0595 5959 0568', label: 'Mastercard rechazada' },
]

export default function Webpay({ tx }) {
  const emission = JSON.parse(sessionStorage.getItem(`emission-${tx}`) || 'null')
  const [card, setCard] = useState({ number: '', exp: '', cvv: '' })
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)

  if (!emission) return <div className="mx-auto max-w-xl py-16"><Alert tone="error" title="Transacción no encontrada">El enlace de pago expiró. <a className="underline" href="/">Vuelve a crear tu envío</a>.</Alert></div>

  const digits = card.number.replace(/\D/g, '')
  const valid = digits.length === 16 && /^\d{2}\/\d{2}$/.test(card.exp) && /^\d{3,4}$/.test(card.cvv)

  const pay = async () => {
    setPaying(true)
    setError('')
    try {
      const r = await api.webpayCommit({ tx, cardLast4: digits.slice(-4), approved: !digits.startsWith('5186') })
      sessionStorage.setItem(`emission-${tx}`, JSON.stringify({ ...emission, payment: r }))
      navigate(`/confirmacion?tx=${tx}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between bg-navy px-6 py-4 text-white">
          <span className="text-2xl font-black italic tracking-tight">web<span className="text-[#ff4fa3]">pay</span><span className="ml-1 align-top text-xs not-italic">plus</span></span>
          <span className="flex items-center gap-1 text-xs opacity-80"><Lock className="size-4" />Ambiente de prueba</span>
        </div>
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between rounded-gls bg-canvas p-4">
            <div>
              <p className="text-sm text-muted">Comercio</p>
              <p className="font-semibold">Blue Express · Orden {tx}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">Monto a pagar</p>
              <p className="text-2xl font-black text-brand">{clp(emission.request.total)}</p>
            </div>
          </div>

          <Field label="Número de tarjeta" inputMode="numeric" autoComplete="cc-number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })} right={<CreditCard className="size-5" />} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vencimiento (MM/AA)" inputMode="numeric" autoComplete="cc-exp" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2') })} />
            <Field label="CVV" inputMode="numeric" autoComplete="cc-csc" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
          </div>

          <div className="rounded-gls border border-dashed border-line p-3 text-sm">
            <p className="mb-2 font-semibold text-muted">Tarjetas de prueba</p>
            <div className="flex flex-wrap gap-2">
              {TEST_CARDS.map((c) => (
                <button key={c.number} type="button" onClick={() => setCard({ number: c.number, exp: '12/29', cvv: '123' })} className="rounded-full bg-brand-50 px-3 py-1 text-[13px] font-semibold text-brand hover:bg-brand-100">{c.label}</button>
              ))}
            </div>
          </div>

          {error && <Alert tone="error" title="Pago rechazado">{error} Intenta con otra tarjeta.</Alert>}

          <div className="flex flex-col gap-2">
            <Button onClick={pay} disabled={!valid} loading={paying}>Pagar {clp(emission.request.total)}</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Anular compra y volver</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
