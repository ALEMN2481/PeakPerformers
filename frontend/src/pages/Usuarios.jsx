import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Tarjeta, Cabecera, Badge } from '../components/ui'
import Estado from '../components/Estado'
import { useApiList } from '../hooks/useApiList'
import { api, getSession } from '../services/api'

const ROLES = [{ id: 1, nombre: 'Administrador' }, { id: 2, nombre: 'Cajero' }, { id: 3, nombre: 'Bodega' }]
const VACIO = { nombre: '', correo: '', id_rol: '3', contrasena: '' }
export default function Usuarios({ ir }) {
  const usuario = getSession()?.usuario || {}
  const admin = Number(usuario.id_rol) === 1 || String(usuario.rol).toLowerCase().includes('administrador')
  const { items, loading, error, reload } = useApiList('/usuarios', ['usuarios'])
  const [q, setQ] = useState('')
  const [rolFiltro, setRolFiltro] = useState('todos')
  const [form, setForm] = useState(VACIO)
  const [errorAccion, setErrorAccion] = useState('')
  const [ok, setOk] = useState('')
  const [guardando, setGuardando] = useState(false)
  if (!admin) return <AppLayout pagina="usuarios" ir={ir}><Cabecera titulo="Usuarios y permisos" /><p className="api-error">Esta sección está reservada para administradores. El backend también debe validar estos permisos.</p></AppLayout>
  const usuarios = items.map(u => ({ id: u.id_usuario ?? u.id, nombre: u.nombre ?? '', correo: u.correo ?? '', rol: u.nombre_rol ?? ROLES.find(r => r.id === Number(u.id_rol))?.nombre ?? String(u.rol ?? '—'), activo: ![0, false, '0'].includes(u.estado ?? 1) }))
  const visibles = usuarios.filter(u => (rolFiltro === 'todos' || u.rol === rolFiltro) && `${u.nombre} ${u.correo}`.toLowerCase().includes(q.toLowerCase()))
  const crear = async e => {
    e.preventDefault(); setErrorAccion(''); setOk('')
    if (!form.nombre.trim() || !/^\S+@\S+\.\S+$/.test(form.correo)) return setErrorAccion('Introduce nombre y correo válidos.')
    if (form.contrasena.length < 8) return setErrorAccion('La contraseña inicial debe tener al menos 8 caracteres.')
    setGuardando(true)
    try {
      await api('/usuarios', { method: 'POST', body: { nombre: form.nombre.trim(), correo: form.correo.trim(),
        id_rol: Number(form.id_rol), contrasena: form.contrasena } })
      setForm(VACIO); setOk('Usuario creado en la base de datos. Comunica sus credenciales por un medio seguro.'); await reload()
    } catch (ex) { setErrorAccion(ex.message) } finally { setGuardando(false) }
  }
  return <AppLayout pagina="usuarios" ir={ir}>
    <Cabecera eyebrow="Administración / Seguridad" titulo="Usuarios y permisos" texto="Cuentas registradas en la base de datos y roles configurados en el proyecto." />
    <div className="fila-lateral" style={{ gridTemplateColumns: 'minmax(0,1fr) 340px' }}>
      <Tarjeta titulo="Usuarios del sistema">
        <div className="filtros"><input className="ctl crece" placeholder="Buscar nombre o correo" value={q} onChange={e => setQ(e.target.value)} />
          <select className="ctl" value={rolFiltro} onChange={e => setRolFiltro(e.target.value)}><option value="todos">Todos los roles</option>{ROLES.map(r => <option key={r.id}>{r.nombre}</option>)}</select></div>
        <Estado loading={loading} error={error} onRetry={reload}><div className="tabla-wrap"><table className="tabla"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th></tr></thead>
          <tbody>{visibles.length === 0 && <tr><td colSpan="3" className="vacio">No hay usuarios que coincidan.</td></tr>}
            {visibles.map(u => <tr key={u.id ?? u.correo}><td><strong>{u.nombre}</strong><div>{u.correo}</div></td><td>{u.rol}</td><td><Badge tono={u.activo ? 'verde' : 'gris'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge></td></tr>)}</tbody></table></div>
          <p style={{ fontSize: 11, marginTop: 12 }}>{usuarios.length} usuarios · {usuarios.filter(u => u.activo).length} activos</p></Estado>
      </Tarjeta>
      <Tarjeta titulo="Crear usuario">
        <p style={{ fontSize: 11, color: 'var(--gris)', marginBottom: 12 }}>El servidor debe comprobar que quien crea la cuenta es administrador y almacenar solo el hash de contraseña.</p>
        {ok && <p className="exito-app" role="status">{ok}</p>}{errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}
        <form onSubmit={crear}>
          <div className="campo-app"><label className="ctl-et">Nombre completo *</label><input className="ctl" required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
          <div className="campo-app"><label className="ctl-et">Correo electrónico *</label><input className="ctl" type="email" required value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} /></div>
          <div className="campo-app"><label className="ctl-et">Rol asignado *</label><select className="ctl" style={{ width: '100%' }} value={form.id_rol} onChange={e => setForm(f => ({ ...f, id_rol: e.target.value }))}>{ROLES.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}</select></div>
          <div className="campo-app"><label className="ctl-et">Contraseña inicial * (mínimo 8 caracteres)</label><input className="ctl" type="password" autoComplete="new-password" minLength="8" required value={form.contrasena} onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))} /></div>
          <button className="btn btn--primario btn--ancho" disabled={guardando} type="submit">{guardando ? 'Creando…' : 'Crear usuario'}</button>
          <button className="btn btn--ancho" type="button" style={{ marginTop: 9 }} onClick={() => { setForm(VACIO); setErrorAccion(''); setOk('') }}>Limpiar formulario</button>
        </form>
      </Tarjeta>
    </div>
    <p style={{ marginTop: 16, fontSize: 11, color: 'var(--gris)' }}>Roles definidos en la base actual: Administrador, Cajero y Bodega. No se envían correos automáticamente.</p>
  </AppLayout>
}
