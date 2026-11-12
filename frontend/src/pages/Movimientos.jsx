import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera } from '../components/ui'
import { IconoDescargar, IconoCaja } from '../components/Iconos'
import Estado from '../components/Estado'
import { useApiList } from '../hooks/useApiList'
import { api, exportCsv, normalizarProducto } from '../services/api'

export default function Movimientos({ ir }) {
  const movimientos = useApiList('/movimientos', ['movimientos'])
  const productos = useApiList('/productos', ['productos'])
  const prods = productos.items.map(normalizarProducto)
  const [tipo, setTipo] = useState('todos')
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ id_producto: '', tipo: 'Entrada', cantidad: '', motivo: '' })
  const [guardando, setGuardando] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')
  const [ok, setOk] = useState('')
  const formateados = movimientos.items.map(m => ({ id: m.id_movimiento ?? m.id, sku: m.sku ?? prods.find(p => String(p.id) === String(m.id_producto))?.sku ?? String(m.id_producto),
    tipo: m.tipo, cantidad: Number(m.cantidad), fecha: m.fecha_hora ?? m.fecha, motivo: m.motivo ?? '', usuario: m.nombre_usuario ?? m.id_usuario ?? '—' }))
  const visibles = formateados.filter(m => (tipo === 'todos' || m.tipo === tipo) && `${m.sku} ${m.motivo} ${m.id}`.toLowerCase().includes(q.toLowerCase()))
  const guardar = async e => {
    e.preventDefault(); setErrorAccion(''); setOk('')
    if (!form.id_producto || !(Number(form.cantidad) > 0) || !form.motivo.trim()) return setErrorAccion('Selecciona un producto, cantidad positiva y motivo.')
    setGuardando(true)
    try {
      await api('/movimientos', { method: 'POST', body: { ...form, id_producto: Number(form.id_producto), cantidad: Number(form.cantidad), motivo: form.motivo.trim() } })
      setForm({ id_producto: '', tipo: 'Entrada', cantidad: '', motivo: '' })
      setOk('Movimiento registrado en el servidor.'); await Promise.all([movimientos.reload(), productos.reload()])
    } catch (ex) { setErrorAccion(ex.message) } finally { setGuardando(false) }
  }
  return <AppLayout pagina="movimientos" ir={ir}>
    <Cabecera eyebrow="Inventario / Auditoría" titulo="Movimientos de inventario" texto="Entradas, salidas y ajustes según los registros de la API." />
    <Tarjeta titulo="Historial de movimientos" sinPadding>
      <div className="tarjeta__cuerpo"><div className="filtros"><input className="ctl crece" placeholder="Buscar producto o motivo" value={q} onChange={e => setQ(e.target.value)} />
        <select className="ctl" value={tipo} onChange={e => setTipo(e.target.value)}><option value="todos">Todos los tipos</option><option>Entrada</option><option>Salida</option><option>Ajuste</option></select>
        <button className="btn" onClick={() => exportCsv('movimientos.csv', ['ID', 'Fecha', 'Producto', 'Tipo', 'Cantidad', 'Motivo'], visibles.map(m => [m.id, m.fecha, m.sku, m.tipo, m.cantidad, m.motivo]))}><IconoDescargar /> Exportar CSV</button>
      </div></div>
      <Estado loading={movimientos.loading} error={movimientos.error} onRetry={movimientos.reload}>
        <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Evento</th><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Responsable</th><th>Motivo</th></tr></thead>
          <tbody>{visibles.length === 0 && <tr><td colSpan="7" className="vacio">Sin movimientos registrados.</td></tr>}
            {visibles.map(m => <tr key={m.id}><td className="mono">{m.id}</td><td>{m.fecha ? new Date(m.fecha).toLocaleString('es-CO') : '—'}</td><td>{m.sku}</td>
              <td><Badge tono={m.tipo === 'Entrada' ? 'verde' : m.tipo === 'Salida' ? 'azul' : 'ambar'}>{m.tipo}</Badge></td><td>{m.cantidad}</td><td>{m.usuario}</td><td>{m.motivo || '—'}</td></tr>)}</tbody>
        </table></div></Estado>
    </Tarjeta>
    <div style={{ marginTop: 18 }}><Tarjeta titulo="Registrar movimiento">
      <p style={{ color: 'var(--gris)', fontSize: 11 }}>El registro se enviará a la API. El backend debe identificar al usuario por el token, validar existencias y actualizar stock en transacción.</p>
      {ok && <p className="exito-app" role="status">{ok}</p>}
      {errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}
      <Estado loading={productos.loading} error={productos.error} onRetry={productos.reload}>
        <form onSubmit={guardar}><div className="api-form">
          <label>Producto *<select className="ctl" value={form.id_producto} onChange={e => setForm(f => ({ ...f, id_producto: e.target.value }))}><option value="">Selecciona un producto</option>{prods.filter(p => p.activo).map(p => <option key={p.id} value={p.id}>{p.sku} · {p.nombre} ({p.stock})</option>)}</select></label>
          <label>Tipo *<select className="ctl" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}><option>Entrada</option><option>Salida</option><option>Ajuste</option></select></label>
          <label>Cantidad *<input className="ctl" type="number" min="0.001" step="0.001" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} /></label>
          <label>Motivo *<input className="ctl" maxLength="255" value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} /></label>
          <div className="api-form-actions"><button className="btn btn--primario" disabled={guardando} type="submit"><IconoCaja /> {guardando ? 'Guardando…' : 'Guardar movimiento'}</button></div>
        </div></form>
      </Estado>
    </Tarjeta></div>
  </AppLayout>
}
