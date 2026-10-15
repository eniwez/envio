import { useState } from 'react'
import { api } from '../api'
import { navigate } from '../App'
import { routeOf, useCatalog, useQuotes, useStore } from '../store'
import { stepErrors } from '../validation'
import { clp } from '../lib'
import Stepper, { STEPS } from '../components/Stepper'
import Summary from '../components/Summary'
import Origin from '../steps/Origin'
import Destination from '../steps/Destination'
import Payment from '../steps/Payment'
import Start from './Start'
import { Alert, Button } from '../ui'
import { ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react'

const scrollToFirstError = () => requestAnimationFrame(() => document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))

const buildEmission = (state, quote, route) => {
  const { origin: o, destination: d, pkg, payment } = state
  return {
    channel: 'PUBLIC_WEB',
    origin: { firstName: o.firstName, lastName: o.lastName, email: o.email, phone: o.phone, rut: o.rut, docType: o.docType, address: o.address, agencyId: o.agency.agency_id },
    destination: { firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone, ...(d.mode === 'home' ? { address: d.address } : { agencyId: d.agency.agency_id }) },
    package: { size: pkg.size, content: pkg.content, value: Number(pkg.value), measures: pkg.useMeasures ? pkg.measures : null },
    paymentMethod: payment.method,
    total: quote.total,
    route,
  }
}

export default function Wizard() {
  const { state, setStep, setStarted } = useStore()
  const catalog = useCatalog()
  const route = routeOf(state, catalog.communes)
  const quotes = useQuotes(route, catalog.sizes)
  const quote = quotes[state.pkg.size]
  const [tried, setTried] = useState([])
  const [sending, setSending] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [failure, setFailure] = useState(null)

  const step = state.step
  const errors = stepErrors[step](state)
  const shown = tried[step] ? errors : {}

  const go = (i) => { setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const submit = async () => {
    setSending(true)
    setFailure(null)
    try {
      const body = buildEmission(state, quote, route)
      const res = await api.emit(body)
      sessionStorage.setItem(`emission-${res.transactionId}`, JSON.stringify({ ...res, request: body, snapshot: state, quote }))
      navigate(res.paymentUrl ? `${res.paymentUrl}?tx=${res.transactionId}` : `/confirmacion?tx=${res.transactionId}`)
    } catch (e) {
      setFailure(e.message)
    } finally {
      setSending(false)
    }
  }

  const next = async () => {
    if (Object.keys(errors).length) {
      setTried((t) => Object.assign([...t], { [step]: true }))
      return scrollToFirstError()
    }
    if (step === STEPS.length - 1) return submit()
    // El botón se rellena como una carga antes de pasar al siguiente paso
    setAdvancing(true)
    await new Promise((r) => setTimeout(r, 700))
    setAdvancing(false)
    go(step + 1)
  }

  if (catalog.error) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <Alert tone="error" title="No pudimos cargar los datos">Recarga la página e intenta nuevamente.</Alert>
      </div>
    )
  }

  if (!state.started) return <Start catalog={catalog} onStart={() => { setStarted(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />

  const Step = [Origin, Destination, Payment][step]

  return (
    <>
      <div className="mx-auto max-w-xl"><Stepper step={step} onGo={go} /></div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {catalog.regions.length ? <Step key={step} catalog={catalog} errors={shown} quotes={quotes} /> : <div className="h-96 animate-pulse rounded-2xl bg-white" />}

          {tried[step] && Object.keys(errors).length > 0 && (
            <div className="mt-4"><Alert tone="error">Completa los campos obligatorios.</Alert></div>
          )}

          {/* En móvil el resumen va al final del formulario, sobre la barra */}
          <div className="mt-6 lg:hidden"><Summary state={state} sizes={catalog.sizes} communes={catalog.communes} quote={quote} /></div>

          {/* En móvil es una barra fija con los botones */}
          <div className="sticky bottom-0 z-[500] -mx-4 mt-6 flex items-center gap-3 border-t border-line-soft bg-white px-4 py-3 sm:static sm:mx-0 sm:justify-between sm:border-0 sm:bg-transparent sm:p-0">
            <Button variant="link" onClick={() => (step > 0 ? go(step - 1) : setStarted(false))} disabled={advancing || sending} aria-label="Volver atrás" className="!px-1 sm:!px-0"><ChevronLeft className="size-5" strokeWidth={3} /><span className="hidden sm:inline">Volver atrás</span></Button>
            <Button onClick={next} progress={advancing || sending} duration={sending ? 1700 : 700} className="flex-1 sm:min-w-64 sm:flex-none">
              {step === STEPS.length - 1 ? (state.payment.method === 'WEBPAY' ? 'Ir a pagar' : 'Finalizar pedido') : 'Siguiente'}
              <ChevronRight className="size-5" strokeWidth={3} />
            </Button>
          </div>
        </div>

        <div className="hidden lg:sticky lg:top-6 lg:block">
          <Summary state={state} sizes={catalog.sizes} communes={catalog.communes} quote={quote} />
        </div>
      </div>

      {failure && (
        <div className="fixed inset-0 z-[2000] grid place-items-center bg-navy/40 p-4 backdrop-blur-sm" role="alertdialog" aria-labelledby="fail-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger-50 text-danger"><CircleAlert className="size-8" /></span>
            <h2 id="fail-title" className="mt-4 text-2xl font-bold">¡Hubo un problema con tu envío!</h2>
            <p className="mt-2 text-muted">No pudimos confirmar tu envío. Por favor, revisa los datos e intenta nuevamente.</p>
            <p className="mt-1 text-sm text-danger">{failure}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={submit}>Volver a intentar</Button>
              <Button variant="secondary" onClick={() => setFailure(null)}>Revisar datos</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
