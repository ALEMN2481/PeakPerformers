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
  const activa = pagina === 'orden' ? 'reabastecimiento' : pagina
  const nombre = MENU.find((m) => m[0] === activa)?.[1]

  return (
    <div className="app">
      <aside className="side">
        <div className="marca">
          <span className="marca__logo"><IconoLogo /></span>ControlStock
        </div>

        <div className="side__sede">
          <strong>Ferretería Central</strong>
          <small>Sede Cali · FC-01</small>
        </div>

        <p className="side__titulo">Operación</p>
        <nav className="side__nav">
          {MENU.map(([id, texto, Icono]) => (
            <button key={id} className={id === activa ? 'activo' : ''} onClick={() => ir(id)}>
              <Icono /> {texto}
            </button>
          ))}
        </nav>

        <div className="side__rol">
          <IconoEscudo />
          <strong>Administrador</strong>
          <p>Catálogo, finanzas y autorizaciones.</p>
        </div>

        <button className="side__ayuda" onClick={() => ir('login')}><IconoAyuda /> Ayuda operativa</button>
      </aside>

      <div className="app__col">
        <header className="topbar">
          <span className="topbar__miga">
            <IconoTienda /> FC-01 / {MIGAS[pagina] ?? nombre}
          </span>
          <div className="topbar__der">
            <span className="badge badge--verde"><i />En línea</span>
            <button className="topbar__campana" aria-label="Notificaciones"><IconoCampana /></button>
            <div className="topbar__usuario">
              <div><strong>Juan Pablo</strong><small>Administrador</small></div>
              <span className="avatar">JP</span>
            </div>
          </div>
        </header>
        <main className="contenido">{children}</main>
      </div>
    </div>
  )
}
