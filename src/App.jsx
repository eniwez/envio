import { useEffect, useState } from 'react'
import Layout from './views/Layout'
import { StoreProvider } from './store'
import Wizard from './views/Wizard'
import Webpay from './views/Webpay'
import Confirmation from './views/Confirmation'
import Label from './views/Label'

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
