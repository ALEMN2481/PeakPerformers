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
import './App.css'

const PAGINAS = {
  login: Login, registro: Registro, recuperar: Recuperar,
  panel: Panel, mostrador: Mostrador, catalogo: Catalogo,
  reabastecimiento: Reabastecimiento, orden: Orden,
  usuarios: Usuarios, movimientos: Movimientos,
}
const leerHash = () => {
  const p = window.location.hash.replace('#/', '')
  return PAGINAS[p] ? p : 'login'
}

// Navegación simple por hash (#/login, #/panel, #/catalogo...), sin librerías extra
function App() {
  const [pagina, setPagina] = useState(leerHash)

  useEffect(() => {
    const alCambiar = () => { setPagina(leerHash()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  const ir = (destino) => { window.location.hash = `/${destino}` }
  const Pagina = PAGINAS[pagina]
  return <Pagina ir={ir} />
}

export default App
