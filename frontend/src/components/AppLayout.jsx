import { getSession, logout } from '../services/api'
import {
  IconoLogo, IconoPanel, IconoEscaner, IconoCaja, IconoCamion, IconoUsuarios,
  IconoReloj, IconoEscudo, IconoAyuda, IconoCampana, IconoTienda,
} from './Iconos'
import './AppLayout.css'

const MENU = [
  ['panel', 'Panel general', IconoPanel],
  ['mostrador', 'Mostrador', IconoEscaner],
  ['catalogo', 'Catálogo', IconoCaja],
  ['reabastecimiento', 'Reabastecimiento', IconoCamion],
  ['usuarios', 'Usuarios y permisos', IconoUsuarios],
  ['movimientos', 'Movimientos y auditoría', IconoReloj],
]

// 'orden' pertenece al módulo de Reabastecimiento
const MIGAS = { orden: 'Reabastecimiento' }

export default function AppLayout({ pagina, ir, children }) {
  const user = getSession()?.usuario || {}
  const rol = String(user.rol || (Number(user.id_rol) === 1 ? 'Administrador' : Number(user.id_rol) === 2 ? 'Cajero' : Number(user.id_rol) === 3 ? 'Bodega' : 'Usuario'))
  const admin = rol.toLowerCase().includes('administrador') || Number(user.id_rol) === 1
  const activa = pagina === 'orden' ? 'reabastecimiento' : pagina
  const nombre = MENU.find((m) => m[0] === activa)?.[1]

  return (
    <div className="app">
      <aside className="side">
        <div className="marca">
          <span className="marca__logo"><IconoLogo /></span>ControlStock
        </div>

        <div className="side__sede">
          <strong>Mi inventario</strong>
          <small>Gestión de existencias</small>
        </div>

        <p className="side__titulo">Operación</p>
        <nav className="side__nav">
          {MENU.filter(([id]) => id !== 'usuarios' || admin).map(([id, texto, Icono]) => (
            <button key={id} className={id === activa ? 'activo' : ''} onClick={() => ir(id)}>
              <Icono /> {texto}
            </button>
          ))}
        </nav>

        <div className="side__rol">
          <IconoEscudo />
          <strong>{rol}</strong>
          <p>Permisos verificados por el servidor.</p>
        </div>

        <button className="side__ayuda" onClick={() => { logout(); ir('login') }}><IconoAyuda /> Cerrar sesión</button>
      </aside>

      <div className="app__col">
        <header className="topbar">
          <span className="topbar__miga">
            <IconoTienda /> ControlStock / {MIGAS[pagina] ?? nombre}
          </span>
          <div className="topbar__der">
            <span className="badge badge--verde"><i />Sesión iniciada</span>
            <button className="topbar__campana" aria-label="Notificaciones"><IconoCampana /></button>
            <div className="topbar__usuario">
              <div><strong>{user.nombre || user.correo || "Usuario"}</strong><small>{rol}</small></div>
              <span className="avatar">{String(user.nombre || "CS").split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase()}</span>
            </div>
          </div>
        </header>
        <main className="contenido">{children}</main>
      </div>
    </div>
  )
}
