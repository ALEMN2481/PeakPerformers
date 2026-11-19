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
import Reportes from './pages/Reportes'
import ConsultaProductos from './pages/ConsultaProductos'
import PortalProveedor from './pages/PortalProveedor'
import SinAcceso from './pages/SinAcceso'
import { api, getSession, saveSession, logout } from './services/api'
import { paginaInicial, puedeAcceder } from './services/permisos'
import './App.css'

const PAGINAS = {
  login: Login, registro: Registro, recuperar: Recuperar,
  panel: Panel, consulta: ConsultaProductos, mostrador: Mostrador,
  catalogo: Catalogo, reabastecimiento: Reabastecimiento, orden: Orden,
  usuarios: Usuarios, movimientos: Movimientos, reportes: Reportes,
  proveedor: PortalProveedor, 'sin-acceso': SinAcceso,
}
const PUBLICAS = new Set(['login', 'registro', 'recuperar'])
function leerHash() {
  const p = window.location.hash.replace('#/', '')
  return PAGINAS[p] ? p : 'login'
}
const ir = destino => { window.location.hash = `/${destino}` }

export default function App() {
  const [pagina, setPagina] = useState(leerHash)
  const [sesion, setSesion] = useState(getSession)
  const [validando, setValidando] = useState(Boolean(getSession()?.token))
  const [errorSesion, setErrorSesion] = useState('')

  useEffect(() => {
    const cambiarRuta = () => { setPagina(leerHash()); window.scrollTo(0, 0) }
    const cambiarSesion = () => setSesion(getSession())
    window.addEventListener('hashchange', cambiarRuta)
    window.addEventListener('controlstock:session', cambiarSesion)
    return () => {
      window.removeEventListener('hashchange', cambiarRuta)
      window.removeEventListener('controlstock:session', cambiarSesion)
    }
  }, [])

  // Nunca confiar en el rol de sessionStorage hasta que el servidor valide JWT y perfil.
  useEffect(() => {
    const actual = getSession()
    if (!actual?.token) { setValidando(false); return }
    let cancelado = false
    api('/auth/me').then(perfil => {
      if (!cancelado) saveSession({ ...actual, usuario: { ...perfil, correo: actual.usuario?.correo } })
    }).catch(error => {
      if (cancelado) return
      setErrorSesion(`No se pudo verificar la sesión: ${error.message}`)
      logout() // Incluye fallos de red: no se permite usar un rol guardado sin verificación.
    }).finally(() => { if (!cancelado) setValidando(false) })
    return () => { cancelado = true }
  }, [])

  useEffect(() => {
    if (validando) return
    if (!sesion && !PUBLICAS.has(pagina)) { ir('login'); return }
    if (!sesion) return
    const inicio = paginaInicial(sesion.usuario)
    if (PUBLICAS.has(pagina) || (pagina !== 'sin-acceso' && !puedeAcceder(sesion.usuario, pagina))) {
      ir(inicio)
    }
    if (pagina === 'sin-acceso' && inicio !== 'sin-acceso') ir(inicio)
  }, [pagina, sesion, validando])

  if (validando) return <div style={{ padding: 40 }}>Verificando sesión y permisos con PeakPerformers…</div>
  if ((!sesion && !PUBLICAS.has(pagina)) ||
      (sesion && (PUBLICAS.has(pagina) || (!puedeAcceder(sesion.usuario, pagina) &&
        !(pagina === 'sin-acceso' && paginaInicial(sesion.usuario) === 'sin-acceso'))))) return null

  const Pagina = PAGINAS[pagina]
  return <>{errorSesion && pagina === 'login' && <p className="api-error" role="alert">{errorSesion}</p>}<Pagina ir={ir} /></>
}
