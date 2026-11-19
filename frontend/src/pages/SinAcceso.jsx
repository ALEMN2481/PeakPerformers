import { logout, getSession } from '../services/api'
import AuthLayout from '../components/AuthLayout'
export default function SinAcceso({ ir }) {
  const rol = getSession()?.usuario?.rol || 'desconocido'
  return <AuthLayout>
    <h2 className="titulo">Rol sin acceso habilitado</h2>
    <p className="subtitulo">Tu cuenta está autenticada con el rol «{rol}», pero esta versión sólo contempla Administrador, Cajero y Proveedor.</p>
    <p>No asignamos permisos automáticamente: pide al administrador que revise tu rol en MariaDB.</p>
    <button className="boton" onClick={() => { logout(); ir('login') }}>Cerrar sesión</button>
  </AuthLayout>
}
