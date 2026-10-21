import { navigate } from '../App'
import { useStore } from '../store'

// Vuelve a la pantalla de inicio sin recargar: se conservan los datos ya ingresados
function Logo() {
  const { setStarted } = useStore()
  const home = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    setStarted(false)
    navigate('/')
  }
  return (
    <a href="/" onClick={home} className="inline-block text-3xl font-black text-brand" aria-label="Envío, inicio">Envío</a>
  )
}

export default function Layout({ children }) {
  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6">
      <div className="mb-5"><Logo /></div>
      {children}
    </main>
  )
}
