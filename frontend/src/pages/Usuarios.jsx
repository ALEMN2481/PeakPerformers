import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Tarjeta, Cabecera } from '../components/ui'
import { IconoAlerta } from '../components/Iconos'

const ROLES = ['Administrador', 'Cajero / Vendedor', 'Auxiliar de Bodega', 'Proveedor']
const INICIO = [
  ['Laura Méndez', 'laura@ferreteriacentral.co', 'Administrador', 'Activo · Hoy 09:30'],
  ['Carlos Ruiz', 'carlos@ferreteriacentral.co', 'Cajero / Vendedor', 'Activo · Hoy 09:42'],
  ['Andrés López', 'andres@ferreteriacentral.co', 'Auxiliar de Bodega', 'Activo · Hoy 09:46'],
  ['Diego Torres', 'pedidos@fijacionesandinas.co', 'Proveedor', 'Activo · Hoy 08:12'],
  ['Marta Rojas', 'marta@ferreteriacentral.co', 'Cajero / Vendedor', 'Suspendido · 19 oct 17:20'],
].map(([nombre, correo, rol, estado]) => ({ nombre, correo, rol, estado }))

const PERMISOS = [
  ['Consultar stock / equivalentes', 'Sí', 'Sí', 'Stock local', 'No'],
  ['Productos, costos y precios', 'Exclusivo', 'No', 'No', 'No'],
  ['Comandas', 'Todos los estados', 'Crear / consultar', 'Preparar / despachar', 'No'],
  ['Recepción / escaneo / etiquetas', 'Sí', 'No', 'Sí', 'No'],
  ['Autorizar compras / usuarios', 'Exclusivo', 'No', 'No', 'No'],
  ['Órdenes de proveedor', 'Todas', 'No', 'Recepción asignada', 'Solo propias'],
]

export default function Usuarios({ ir }) {
  const [usuarios, setUsuarios] = useState(INICIO)
  const [q, setQ] = useState('')
  const [rolFiltro, setRolFiltro] = useState('todos')
  const vacio = { nombre: '', correo: '', rol: 'Auxiliar de Bodega', sede: 'Cali · FC-01' }
  const [form, setForm] = useState(vacio)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const visibles = usuarios.filter((u) =>
    (rolFiltro === 'todos' || u.rol === rolFiltro) &&
    `${u.nombre} ${u.correo}`.toLowerCase().includes(q.toLowerCase()))
  const activos = usuarios.filter((u) => u.estado.startsWith('Activo')).length

  const cambiar = (c) => (e) => setForm({ ...form, [c]: e.target.value })
  const crear = (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !/^\S+@\S+\.\S+$/.test(form.correo)) {
      setOk(''); return setError('Ingresa el nombre y un correo válido')
    }
    // TODO: conectar con el backend (crear usuario y enviar credencial temporal)
    setUsuarios([...usuarios, { nombre: form.nombre, correo: form.correo, rol: form.rol, estado: 'Pendiente · Sin ingresar' }])
    setOk(`Credenciales enviadas a ${form.correo}`); setError(''); setForm(vacio)
  }

  return (
    <AppLayout pagina="usuarios" ir={ir}>
      <Cabecera eyebrow="Operación / 21 octubre 2026" titulo="Usuarios y permisos"
        texto="Administra el acceso de tu equipo y asigna credenciales por rol." />

      <div className="fila-lateral" style={{ gridTemplateColumns: '1fr 340px' }}>
        <Tarjeta titulo="Usuarios de la sede">
          <div className="filtros">
            <div className="crece">
              <label className="ctl-et">Buscar usuario</label>
              <input className="ctl" placeholder="Nombre o correo electrónico" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="ctl" value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value)}>
              <option value="todos">Todos los roles</option>{ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>Usuario / correo</th><th>Rol</th><th>Estado / último acceso</th></tr></thead>
              <tbody>
                {visibles.length === 0 && <tr><td colSpan="3" className="vacio">No hay usuarios con ese filtro.</td></tr>}
                {visibles.map((u) => (
                  <tr key={u.correo}>
                    <td><strong>{u.nombre}</strong><br /><span style={{ color: 'var(--gris)' }}>{u.correo}</span></td>
                    <td>{u.rol}</td><td>{u.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 10, color: 'var(--gris)', marginTop: 14 }}>
            {usuarios.length} usuarios · {activos} activos · {usuarios.filter((u) => u.estado.startsWith('Suspendido')).length} suspendido
          </p>
        </Tarjeta>

        <Tarjeta titulo="Registrar usuario" derecha={null}>
          <p style={{ fontSize: 10, color: 'var(--gris)', marginBottom: 14 }}>Nueva cuenta · Administrador autorizado</p>
          {ok && <p className="exito-app">{ok}</p>}
          <form onSubmit={crear} noValidate>
            <div className="campo-app"><label className="ctl-et">Nombre completo *</label>
              <input className="ctl" value={form.nombre} onChange={cambiar('nombre')} placeholder="Sofía Vargas" /></div>
            <div className="campo-app"><label className="ctl-et">Correo electrónico *</label>
              <input className="ctl" type="email" value={form.correo} onChange={cambiar('correo')} placeholder="sofia@ferreteriacentral.co" /></div>
            <div className="campo-app"><label className="ctl-et">Rol asignado *</label>
              <select className="ctl" style={{ width: '100%' }} value={form.rol} onChange={cambiar('rol')}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
            <div className="campo-app"><label className="ctl-et">Sede *</label>
              <select className="ctl" style={{ width: '100%' }} value={form.sede} onChange={cambiar('sede')}><option>Cali · FC-01</option></select></div>
            <div className="campo-app"><label className="ctl-et">Credencial temporal</label>
              <input className="ctl" value="Generar contraseña segura" readOnly />
              <p style={{ fontSize: 9, color: 'var(--gris)', marginTop: 6 }}>Se envía al correo registrado. No se muestra en pantalla.</p></div>
            <div className="aviso" style={{ marginBottom: 14 }}>
              <IconoAlerta />
              <div><strong>Cambio de contraseña obligatorio</strong>En el primer acceso deberá crear una contraseña personal.</div>
            </div>
            {error && <p className="error-app" style={{ marginBottom: 10 }}>{error}</p>}
            <button className="btn btn--primario" type="submit">Crear y enviar credenciales</button>
            <button className="btn btn--ancho" type="button" style={{ marginTop: 10 }}
              onClick={() => { setForm(vacio); setError(''); setOk('') }}>Cancelar</button>
          </form>
        </Tarjeta>
      </div>

      <div style={{ marginTop: 16 }}>
        <Tarjeta titulo="Permisos por rol" sinPadding>
          <p style={{ fontSize: 10, color: 'var(--gris)', padding: '0 18px 12px' }}>
            La autorización se valida en cada operación; ocultar una opción no concede acceso.
          </p>
          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>Operación</th>{ROLES.map((r) => <th key={r}>{r}</th>)}</tr></thead>
              <tbody>
                {PERMISOS.map(([op, ...vals]) => (
                  <tr key={op}><td><strong>{op}</strong></td>{vals.map((v, i) => <td key={i} style={{ color: 'var(--gris)' }}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      </div>
    </AppLayout>
  )
}
