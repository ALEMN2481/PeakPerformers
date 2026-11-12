import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Recuperar from './pages/Recuperar'
import Panel from './pages/Panel'
import Mostrador from './pages/Mostrador'
import Catalogo from './pages/Catalogo'
import Reabastecimiento from './pages/Reabastecimiento'
import Orden from './pages/Orden'
import Usuarios from './pages/Usuarios'
import Movimientos from './pages/Movimientos'
import { getSession } from './services/api'
import './App.css'

const PAGINAS = {
  login: Login, registro: Registro, recuperar: Recuperar,
  panel: Panel, mostrador: Mostrador, catalogo: Catalogo,
  reabastecimiento: Reabastecimiento, orden: Orden,
  usuarios: Usuarios, movimientos: Movimientos,
}
const PUBLICAS = new Set(['login', 'registro', 'recuperar'])
function leerHash() {
  const p = window.location.hash.replace('#/', '')
  return PAGINAS[p] ? p : 'login'
}
export default function App() {
  const [pagina, setPagina] = useState(leerHash)
  const [sesion, setSesion] = useState(getSession)
  useEffect(() => {
    const onRoute = () => { setPagina(leerHash()); window.scrollTo(0, 0) }
    const onSession = () => setSesion(getSession())
    window.addEventListener('hashchange', onRoute)
    window.addEventListener('controlstock:session', onSession)
    return () => { window.removeEventListener('hashchange', onRoute); window.removeEventListener('controlstock:session', onSession) }
  }, [])
  const ir = (destino) => { window.location.hash = `/${destino}` }
  useEffect(() => {
    if (!sesion && !PUBLICAS.has(pagina)) ir('login')
    if (sesion && PUBLICAS.has(pagina)) ir('panel')
  }, [pagina, sesion])
  if ((!sesion && !PUBLICAS.has(pagina)) || (sesion && PUBLICAS.has(pagina))) return null
  const Pagina = PAGINAS[pagina]
  return <Pagina ir={ir} />
}
