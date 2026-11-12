import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera, Stat } from '../components/ui'
import { IconoClip } from '../components/Iconos'
import Estado from '../components/Estado'
import { useApiList } from '../hooks/useApiList'
import { normalizarProducto } from '../services/api'
import { cop, num } from '../utils'

const CLAVE_BORRADOR = 'controlstock_borrador_compra'
export default function Reabastecimiento({ ir }) {
  const { items, loading, error, reload } = useApiList('/productos', ['productos'])
  const proveedores = useApiList('/proveedores', ['proveedores'])
  const faltantes = items.map(normalizarProducto).filter(p => p.activo && p.stock < p.minimo)
  const [seleccion, setSeleccion] = useState({})
  const [proveedorId, setProveedorId] = useState('')
  const [q, setQ] = useState('')
  const [excepcion, setExcepcion] = useState('todas')
  const [errorAccion, setErrorAccion] = useState('')
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
        <p style={{ color: 'var(--gris)', fontSize: 11, marginBottom: 12 }}>La base actual no asocia automáticamente proveedores con productos. El proveedor se elige al crear cada orden.</p>
        <div className="api-form"><label>Proveedor *<select className="ctl" value={proveedorId} onChange={e => setProveedorId(e.target.value)}><option value="">Seleccionar proveedor</option>{proveedoresLista.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
          <div className="api-form-actions"><button className="btn btn--primario" onClick={preparar} disabled={!elegidos.length}><IconoClip /> Revisar orden ({elegidos.length})</button><button className="btn" onClick={() => setSeleccion({})}>Limpiar</button></div></div>
        {errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}
      </Tarjeta></div>
    </Estado>
  </AppLayout>
}
