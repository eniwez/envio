import { navigate } from './App'
import { useStore } from './store'

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
    <a href="/" onClick={home} className="inline-block" aria-label="Blue Express, inicio">
      <img src="/logo.svg" alt="Blue Express" className="h-10 w-auto" />
    </a>
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
