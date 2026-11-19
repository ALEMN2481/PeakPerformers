import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera, Stat } from '../components/ui'
import { IconoClip } from '../components/Iconos'
import Estado from '../components/Estado'
import { useApiList } from '../hooks/useApiList'
import { api, normalizarProducto } from '../services/api'
import { cop, num } from '../utils'

const CLAVE_BORRADOR = 'controlstock_borrador_compra'
export default function Reabastecimiento({ ir }) {
  const { items, loading, error, reload } = useApiList('/productos', ['productos'])
  const proveedores = useApiList('/proveedores', ['proveedores'])
  const faltantes = items.map(normalizarProducto).filter(p => p.activo && p.stock <= p.minimo && p.minimo > 0)
  const [seleccion, setSeleccion] = useState({})
  const [proveedorId, setProveedorId] = useState('')
  const [q, setQ] = useState('')
  const [excepcion, setExcepcion] = useState('todas')
  const [errorAccion, setErrorAccion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [nuevoProveedor, setNuevoProveedor] = useState({ nit_rut: '', razon_social: '', telefono: '', direccion: '', correo: '' })
  const [mostrarProveedor, setMostrarProveedor] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [recibirId, setRecibirId] = useState(null)
  const [detalleOrden, setDetalleOrden] = useState(null)
  const [detalleCargando, setDetalleCargando] = useState(false)
  const [vinculo, setVinculo] = useState({ id_producto: '', id_proveedor: '', costo_referencia: '', es_principal: true })
  const [sugerencias, setSugerencias] = useState(null)
  const [automatico, setAutomatico] = useState(false)
  const cargarSugerencias = async () => {
    setErrorAccion('')
    try { setSugerencias(await api('/abastecimiento/faltantes')) }
    catch (ex) { setErrorAccion(ex.message) }
  }
  const guardarVinculo = async e => {
    e.preventDefault(); setOcupado(true); setErrorAccion(''); setMensaje('')
    try {
      await api('/abastecimiento/vinculos', { method: 'POST', body: {
        id_producto: Number(vinculo.id_producto), id_proveedor: Number(vinculo.id_proveedor),
        costo_referencia: vinculo.costo_referencia === '' ? null : Number(vinculo.costo_referencia),
        es_principal: vinculo.es_principal,
      } })
      setMensaje('Proveedor vinculado al producto en MariaDB.')
      await cargarSugerencias()
    } catch (ex) { setErrorAccion(ex.message) } finally { setOcupado(false) }
  }
  const generarAutomaticas = async () => {
    if (!window.confirm('¿Crear órdenes pendientes automáticamente para los faltantes vinculados con proveedores?')) return
    setAutomatico(true); setErrorAccion(''); setMensaje('')
    try {
      const r = await api('/abastecimiento/generar', { method: 'POST', body: {} })
      setMensaje(`Se crearon ${r.ordenes_creadas?.length || 0} órdenes nuevas. No se duplican los pedidos pendientes.`)
      await Promise.all([ordenes.reload(), cargarSugerencias()])
    } catch (ex) { setErrorAccion(ex.message) } finally { setAutomatico(false) }
  }
  const ordenes = useApiList('/compras', ['compras'])
  const crearProveedor = async e => {
    e.preventDefault(); setErrorAccion(''); setOcupado(true)
    try {
      const r = await api('/proveedores', { method: 'POST', body: nuevoProveedor })
      setProveedorId(String(r.id_proveedor)); setMostrarProveedor(false)
      setNuevoProveedor({ nit_rut: '', razon_social: '', telefono: '', direccion: '', correo: '' })
      await proveedores.reload(); setMensaje('Proveedor registrado en MariaDB.')
    } catch (ex) { setErrorAccion(ex.message) } finally { setOcupado(false) }
  }
  const recibirOrden = async id => {
    if (!window.confirm('¿Recibiste físicamente esta compra? Confirmar aumentará el stock una sola vez.')) return
    setRecibirId(id); setErrorAccion(''); setMensaje('')
    try {
      const r = await api(`/compras/${id}/recibir`, { method: 'POST', body: {} })
      setMensaje(`Orden #${r.id_orden} recibida; inventario actualizado.`)
      await Promise.all([ordenes.reload(), reload()])
    } catch (ex) { setErrorAccion(ex.message) } finally { setRecibirId(null) }
  }
  const consultarOrden = async id => {
    setErrorAccion(''); setDetalleCargando(true); setDetalleOrden(null)
    try { setDetalleOrden(await api(`/compras/${id}`)) }
    catch (ex) { setErrorAccion(ex.message) } finally { setDetalleCargando(false) }
  }
  const proveedoresLista = proveedores.items.map(p => ({ id: p.id_proveedor ?? p.id, nombre: p.razon_social ?? p.nombre ?? 'Proveedor' }))
  const visibles = faltantes.filter(p => `${p.sku} ${p.nombre}`.toLowerCase().includes(q.toLowerCase()) && (excepcion === 'todas' || (excepcion === 'agotado' ? p.stock === 0 : p.stock > 0)))
  const elegidos = faltantes.filter(p => Number(seleccion[p.id]) > 0).map(p => ({
    id_producto: p.id, sku: p.sku, nombre: p.nombre, cantidad: Number(seleccion[p.id]), costo_unitario: p.costo,
  }))
  const total = elegidos.reduce((s, p) => s + p.cantidad * p.costo_unitario, 0)
  const preparar = () => {
    if (!proveedorId) return setErrorAccion('Selecciona el proveedor al que se le realizará la compra.')
    if (!elegidos.length) return setErrorAccion('Selecciona una cantidad mayor que cero en al menos un producto.')
    if (elegidos.some(i => !i.costo_unitario || i.costo_unitario < 0)) return setErrorAccion('Cada producto seleccionado necesita un costo mayor que cero para crear la orden.')
    sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ id_proveedor: Number(proveedorId), proveedor: proveedoresLista.find(p => String(p.id) === proveedorId)?.nombre,
      detalles: elegidos, total }))
    ir('orden')
  }
  return <AppLayout pagina="reabastecimiento" ir={ir}>
    <Cabecera eyebrow="Inventario / Compras" titulo="Reabastecimiento" texto="Los productos bajo mínimo se calculan sobre el inventario real. Selecciona un proveedor y prepara una orden." />
    <Estado loading={loading || proveedores.loading} error={error || proveedores.error} onRetry={() => { reload(); proveedores.reload() }}>
      <div className="stats stats--3">
        <Stat etiqueta="Referencias con atención" valor={faltantes.length}><small>{faltantes.filter(p => p.stock === 0).length} agotadas</small></Stat>
        <Stat etiqueta="Seleccionadas" valor={elegidos.length}><small>{num(elegidos.reduce((s, p) => s + p.cantidad, 0))} unidades</small></Stat>
        <Stat etiqueta="Valor estimado" valor={cop(total)}><small>Costos registrados en el catálogo</small></Stat>
      </div>
      <Tarjeta titulo="Productos para reponer">
        <div className="filtros"><input className="ctl crece" value={q} onChange={e => setQ(e.target.value)} placeholder="SKU o nombre" />
          <select className="ctl" value={excepcion} onChange={e => setExcepcion(e.target.value)}><option value="todas">Todas las alertas</option><option value="agotado">Agotados</option><option value="bajo">Bajo mínimo</option></select></div>
        <div className="tabla-wrap"><table className="tabla"><thead><tr><th>SKU / producto</th><th>Stock</th><th>Mínimo</th><th>Faltante</th><th>Costo unidad</th><th>Cantidad a pedir</th></tr></thead>
          <tbody>{visibles.length === 0 && <tr><td colSpan="6" className="vacio">No hay referencias que cumplan estos filtros.</td></tr>}
            {visibles.map(p => <tr key={p.id ?? p.sku}><td><strong className="mono">{p.sku}</strong><div>{p.nombre}</div></td><td>{p.stock}</td><td>{p.minimo}</td>
              <td><Badge tono={p.stock === 0 ? 'rojo' : 'ambar'}>{num(p.minimo - p.stock)}</Badge></td><td>{cop(p.costo)}</td>
              <td><input type="number" className="ctl ctl--num" min="0" step="0.001" aria-label={`Cantidad a pedir de ${p.sku}`} value={seleccion[p.id] ?? 0}
                onChange={e => setSeleccion(s => ({ ...s, [p.id]: Math.max(0, Number(e.target.value) || 0) }))} /></td></tr>)}</tbody></table></div>
      </Tarjeta>
      <div style={{ marginTop: 16 }}><Tarjeta titulo="Preparar orden de compra">
        <p style={{ color: 'var(--gris)', fontSize: 11, marginBottom: 12 }}>Selecciona un proveedor para una compra manual. Los vínculos automáticos se gestionan en el módulo de abastecimiento de la API.</p>
        <div className="api-form"><label>Proveedor *<select className="ctl" value={proveedorId} onChange={e => setProveedorId(e.target.value)}><option value="">Seleccionar proveedor</option>{proveedoresLista.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
          <div className="api-form-actions"><button className="btn" onClick={() => setMostrarProveedor(v => !v)}>+ Registrar proveedor</button><button className="btn btn--primario" onClick={preparar} disabled={!elegidos.length}><IconoClip /> Revisar orden ({elegidos.length})</button><button className="btn" onClick={() => setSeleccion({})}>Limpiar</button></div></div>
        {mostrarProveedor && <form className="api-form" onSubmit={crearProveedor} style={{ marginTop: 14 }}>
          {Object.keys(nuevoProveedor).map(k => <label key={k}>{({nit_rut:'NIT/RUT *',razon_social:'Razón social *',telefono:'Teléfono',direccion:'Dirección',correo:'Correo'})[k]}<input className="ctl" required={k === 'nit_rut' || k === 'razon_social'} type={k === 'correo' ? 'email' : 'text'} value={nuevoProveedor[k]} onChange={e => setNuevoProveedor(v => ({ ...v, [k]: e.target.value }))} /></label>)}
          <button className="btn btn--primario" type="submit" disabled={ocupado}>Guardar proveedor</button>
        </form>}
        {mensaje && <p className="exito-app" role="status">{mensaje}</p>}
        {errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}
      </Tarjeta></div>
      <div style={{ marginTop: 16 }}><Tarjeta titulo="Abastecimiento automático y vínculos">
        <p style={{ fontSize: 11, color: 'var(--gris)' }}>Asocia los productos a sus proveedores. Esta función requiere haber aplicado la migración <code>001_producto_proveedor.sql</code> del backend.</p>
        <form className="api-form" onSubmit={guardarVinculo}>
          <label>Producto *<select className="ctl" required value={vinculo.id_producto} onChange={e => setVinculo(v => ({...v, id_producto:e.target.value}))}><option value="">Elegir producto</option>{items.map(normalizarProducto).filter(p => p.activo).map(p => <option key={p.id} value={p.id}>{p.sku} · {p.nombre}</option>)}</select></label>
          <label>Proveedor *<select className="ctl" required value={vinculo.id_proveedor} onChange={e => setVinculo(v => ({...v, id_proveedor:e.target.value}))}><option value="">Elegir proveedor</option>{proveedoresLista.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
          <label>Costo de referencia (COP)<input className="ctl" type="number" min="0" step="0.01" value={vinculo.costo_referencia} onChange={e => setVinculo(v => ({...v, costo_referencia:e.target.value}))} /></label>
          <label><input type="checkbox" checked={vinculo.es_principal} onChange={e => setVinculo(v=>({...v,es_principal:e.target.checked}))} /> Proveedor principal</label>
          <div className="api-form-actions"><button type="submit" className="btn" disabled={ocupado}>Guardar vínculo</button></div>
        </form>
        <div className="acciones" style={{ marginTop: 14 }}>
          <button className="btn" type="button" onClick={cargarSugerencias}>Consultar faltantes por proveedor</button>
          <button className="btn btn--primario" type="button" disabled={automatico} onClick={generarAutomaticas}>Generar órdenes sugeridas</button>
        </div>
        {sugerencias && <p style={{ marginTop: 12 }}>Proveedores con faltantes: {sugerencias.grupos?.length || 0} · Productos sin proveedor vinculado: {sugerencias.sin_proveedor?.length || 0}</p>}
        {mensaje && <p className="exito-app" role="status">{mensaje}</p>}
        {errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}
      </Tarjeta></div>
      <div style={{ marginTop: 16 }}><Tarjeta titulo="Órdenes registradas" sinPadding>
        <Estado loading={ordenes.loading} error={ordenes.error} onRetry={ordenes.reload}>
          <div className="tabla-wrap"><table className="tabla"><thead><tr><th>N.º</th><th>Proveedor</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>{ordenes.items.length === 0 && <tr><td colSpan="6" className="vacio">No hay compras registradas.</td></tr>}
            {ordenes.items.map(o => <tr key={o.id_orden}><td>{o.id_orden}</td><td>{o.proveedor}</td><td>{o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleDateString('es-CO') : '—'}</td><td>{cop(Number(o.total))}</td><td><Badge tono={o.estado === 'Recibida' ? 'verde' : 'ambar'}>{o.estado}</Badge></td><td><button className="enlace-fila" disabled={detalleCargando} onClick={() => consultarOrden(o.id_orden)}>Ver detalle</button>{o.estado === 'Pendiente' && <button className="enlace-fila" disabled={recibirId === o.id_orden} onClick={() => recibirOrden(o.id_orden)}>Recibir compra</button>}</td></tr>)}</tbody>
          </table></div>
        </Estado>
      </Tarjeta></div>
    </Estado>
    {errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}
    {detalleCargando && <p>Consultando detalle de compra…</p>}
    {detalleOrden && <div style={{ marginTop: 16 }}><Tarjeta titulo={`Detalle de compra #${detalleOrden.id_orden}`}>
      <p><strong>Proveedor:</strong> {detalleOrden.proveedor || detalleOrden.id_proveedor} · <strong>Estado:</strong> {detalleOrden.estado} · <strong>Total:</strong> {cop(Number(detalleOrden.total || 0))}</p>
      <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Producto</th><th>Cantidad</th><th>Costo unitario</th><th>Subtotal</th></tr></thead><tbody>
        {(detalleOrden.detalles || []).map((d, i) => <tr key={d.id_detalle_orden ?? i}><td>{d.producto || d.id_producto}</td><td>{d.cantidad}</td><td>{cop(Number(d.costo_unitario || 0))}</td><td>{cop(Number(d.subtotal || 0))}</td></tr>)}
      </tbody></table></div>
      <button className="btn" onClick={() => setDetalleOrden(null)}>Cerrar detalle</button>
    </Tarjeta></div>}
  </AppLayout>
}
