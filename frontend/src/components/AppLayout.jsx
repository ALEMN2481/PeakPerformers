import { getSession, logout } from '../services/api'
import { esAdministrador, puedeVender, esProveedor, nombreRol } from '../services/permisos'
import {
  IconoLogo, IconoPanel, IconoEscaner, IconoCaja, IconoCamion,
  IconoReloj, IconoEscudo, IconoAyuda, IconoTienda,
} from './Iconos'
import './AppLayout.css'

const MENU = [
  { id: 'panel', titulo: 'Panel general', icono: IconoPanel, permitir: usuario => !esProveedor(usuario) },
  { id: 'consulta', titulo: 'Consultar productos', icono: IconoCaja, permitir: puedeVender },
  { id: 'mostrador', titulo: 'Ventas / Mostrador', icono: IconoEscaner, permitir: puedeVender },
  { id: 'catalogo', titulo: 'Administrar catálogo', icono: IconoCaja, permitir: esAdministrador },
  { id: 'movimientos', titulo: 'Movimientos', icono: IconoReloj, permitir: esAdministrador },
  { id: 'reabastecimiento', titulo: 'Compras y proveedores', icono: IconoCamion, permitir: esAdministrador },
  { id: 'reportes', titulo: 'Reportes', icono: IconoPanel, permitir: esAdministrador },
  { id: 'proveedor', titulo: 'Mi espacio de proveedor', icono: IconoCamion, permitir: esProveedor },
]

const MIGAS = { orden: 'Compras y proveedores', usuarios: 'Usuarios (pendiente API)' }

export default function AppLayout({ pagina, ir, children }) {
  const usuario = getSession()?.usuario || {}
  const rol = nombreRol(usuario) || 'Rol no habilitado'
  const activa = pagina === 'orden' ? 'reabastecimiento' : pagina
  const nombre = MENU.find(item => item.id === activa)?.titulo || MIGAS[pagina] || 'Inicio'
  const menu = MENU.filter(item => item.permitir(usuario))

  return (
    <div className="app">
      <aside className="side">
        <div className="marca"><span className="marca__logo"><IconoLogo /></span>PeakPerformers</div>
        <div className="side__sede"><strong>Mi inventario</strong><small>Gestión de existencias</small></div>
        <p className="side__titulo">{esProveedor(usuario) ? 'Área de proveedor' : 'Operación'}</p>
        <nav className="side__nav" aria-label="Módulos autorizados">
          {menu.map(({ id, titulo, icono: Icono }) => (
            <button key={id} className={id === activa ? 'activo' : ''} onClick={() => ir(id)}>
              <Icono /> {titulo}
            </button>
          ))}
        </nav>
        <div className="side__rol"><IconoEscudo /><strong>{rol}</strong><p>Permisos asignados por el servidor.</p></div>
        <button className="side__ayuda" onClick={() => { logout(); ir('login') }}><IconoAyuda /> Cerrar sesión</button>
      </aside>
      <div className="app__col">
        <header className="topbar">
          <span className="topbar__miga"><IconoTienda /> PeakPerformers / {nombre}</span>
          <div className="topbar__der"><span className="badge badge--verde"><i />Sesión iniciada</span>
            <div className="topbar__usuario">
              <div><strong>{usuario.correo || `Usuario #${usuario.id_usuario || ''}`}</strong><small>{rol}</small></div>
              <span className="avatar">{rol.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
        </header>
        <main className="contenido">{children}</main>
      </div>
    </div>
  )
}
