import AppLayout from '../components/AppLayout'
import { Cabecera, Tarjeta, Badge } from '../components/ui'

// Se conserva la pantalla original, pero no se conecta a rutas que el backend
// original de feature/proveedores-compras no implementa. No crear cuentas falsas.
export default function Usuarios({ ir }) {
  return <AppLayout pagina="usuarios" ir={ir}>
    <Cabecera eyebrow="Administración / Seguridad" titulo="Usuarios y permisos"
      texto="Módulo pendiente de soporte por parte del backend actual." />
    <Tarjeta titulo="Gestión de cuentas" derecha={<Badge tono="ambar">No habilitada</Badge>}>
      <p>La API entregada por tu compañero incluye <code>POST /api/auth/login</code> y <code>GET /api/auth/me</code>, pero no incluye rutas <code>/api/usuarios</code>.</p>
      <p>No es seguro mostrar un formulario que parezca crear usuarios sin guardarlos. Hasta que tu backend implemente consulta y administración de cuentas, no se permitirá modificar usuarios desde aquí.</p>
      <p>El tercer rol previsto es <strong>Proveedor</strong>. Antes de asignarlo, hay que verificar la tabla <code>rol</code> y agregar sus permisos reales en el backend. No debe confundirse con el antiguo rol de almacén.</p>
    </Tarjeta>
  </AppLayout>
}
