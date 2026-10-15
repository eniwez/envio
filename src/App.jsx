import { useEffect, useState } from 'react'
import Layout from './Layout'
import { StoreProvider } from './store'
import Wizard from './pages/Wizard'
import Webpay from './pages/Webpay'
import Confirmation from './pages/Confirmation'
import Label from './pages/Label'

export const navigate = (to) => {
  history.pushState(null, '', to)
  dispatchEvent(new PopStateEvent('popstate'))
  scrollTo(0, 0)
}

export default function App() {
  const [url, setUrl] = useState(() => new URL(location.href))
  useEffect(() => {
    const on = () => setUrl(new URL(location.href))
    addEventListener('popstate', on)
    return () => removeEventListener('popstate', on)
  }, [])

  const tx = url.searchParams.get('tx')
  if (url.pathname === '/etiqueta') return <Label tx={tx} />

  const page = { '/webpay': <Webpay tx={tx} />, '/confirmacion': <Confirmation tx={tx} /> }[url.pathname] ?? <Wizard />
  return (
    <StoreProvider>
      <Layout>{page}</Layout>
    </StoreProvider>
  )
}
