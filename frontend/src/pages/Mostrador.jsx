import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera } from '../components/ui'
import { IconoBuscar, IconoMas, IconoEnviar } from '../components/Iconos'
import Estado from '../components/Estado'
import { useApiList } from '../hooks/useApiList'
import { api, normalizarProducto } from '../services/api'
import { cop } from '../utils'

export default function Mostrador({ ir }) {
  const { items, loading, error, reload } = useApiList('/productos', ['productos'])
  const productos = items.map(normalizarProducto).filter(p => p.activo)
  const [consulta, setConsulta] = useState('')
  const [lineas, setLineas] = useState([])
  const [pago, setPago] = useState('Efectivo')
  const [cliente, setCliente] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [errorVenta, setErrorVenta] = useState('')
  const resultados = productos.filter(p => `${p.sku} ${p.nombre} ${p.codigo_barras}`.toLowerCase().includes(consulta.toLowerCase()))
  const agregar = p => {
    setErrorVenta(''); setMensaje('')
    setLineas(prev => {
      const actual = prev.find(l => l.id === p.id)
      if (actual && actual.cant >= p.stock) return prev
      return actual ? prev.map(l => l.id === p.id ? { ...l, cant: l.cant + 1 } : l)
        : [...prev, { id: p.id, sku: p.sku, nombre: p.nombre, cant: 1, precio: p.precio, stock: p.stock }]
    })
  }
  const cantidad = (id, n) => setLineas(ls => ls.map(l => l.id === id ? { ...l, cant: Math.min(l.stock, Math.max(1, Number(n) || 1)) } : l))
  const total = lineas.reduce((s, l) => s + l.cant * l.precio, 0)
  const guardarVenta = async () => {
    if (!lineas.length) return setErrorVenta('Agrega productos a la venta.')
    setGuardando(true); setErrorVenta(''); setMensaje('')
    try {
      await api('/ventas', { method: 'POST', body: {
        documento_cliente: cliente.trim() || null, metodo_pago: pago,
        detalles: lineas.map(l => ({ id_producto: l.id, cantidad: l.cant, precio_unitario: l.precio })),
      } })
      setLineas([]); setCliente(''); setMensaje('Venta registrada correctamente por la API.'); await reload()
    } catch (ex) { setErrorVenta(ex.message) } finally { setGuardando(false) }
  }
  return <AppLayout pagina="mostrador" ir={ir}>
    <Cabecera eyebrow="Ventas / Caja" titulo="Mostrador" texto="Consulta existencias y registra ventas en el backend.">
      <button className="btn btn--primario" onClick={() => { setLineas([]); setErrorVenta(''); setMensaje('') }}><IconoMas /> Nueva venta</button>
    </Cabecera>
    <div className="fila-lateral"><div className="col">
      <div style={{ position: 'relative' }}><input className="ctl" style={{ height: 44, paddingLeft: 38, fontSize: 13 }} placeholder="Buscar SKU, nombre o código de barras" value={consulta} onChange={e => setConsulta(e.target.value)} /><span style={{ position: 'absolute', top: 12, left: 12 }}><IconoBuscar /></span></div>
      <Tarjeta titulo="Productos disponibles" derecha={`${resultados.length} referencias`} sinPadding>
        <Estado loading={loading} error={error} onRetry={reload}><div className="tabla-wrap"><table className="tabla">
          <thead><tr><th>Producto</th><th>Ubicación</th><th>Stock</th><th>Precio</th><th>Acción</th></tr></thead>
          <tbody>{resultados.length === 0 && <tr><td colSpan="5" className="vacio">Sin productos para esta búsqueda.</td></tr>}
            {resultados.map(p => <tr key={p.id ?? p.sku}><td><span className="mono">{p.sku}</span> · {p.nombre}</td><td>{p.ub || '—'}</td><td>{p.stock} {p.unidad}</td><td>{cop(p.precio)}</td>
              <td>{p.stock <= 0 ? <Badge tono="rojo">Agotado</Badge> : <button className="enlace-fila" disabled={(lineas.find(l => l.id === p.id)?.cant || 0) >= p.stock} onClick={() => agregar(p)}>+ Agregar</button>}</td></tr>)}</tbody>
        </table></div></Estado>
      </Tarjeta>
    </div><div className="col">
      <Tarjeta titulo="Venta actual" derecha="COP">
        {lineas.length === 0 && <p className="vacio">No has agregado productos.</p>}
        {lineas.map(l => <div key={l.id} style={{ borderBottom: '1px solid #e7e9eb', padding: '9px 0' }}>
          <div className="mono">{l.sku}</div><strong>{l.nombre}</strong>
          <div className="acciones" style={{ marginTop: 8 }}><input aria-label={`Cantidad ${l.nombre}`} className="ctl ctl--num" type="number" min="1" max={l.stock} value={l.cant} onChange={e => cantidad(l.id, e.target.value)} />
            <span>{cop(l.precio)} × {l.cant} = <strong>{cop(l.precio * l.cant)}</strong></span>
            <button className="enlace-fila" onClick={() => setLineas(ls => ls.filter(p => p.id !== l.id))}>Quitar</button></div>
        </div>)}
        <div className="sub-total" style={{ margin: '15px 0' }}><span>Total a cobrar</span><strong>{cop(total)}</strong></div>
        <div className="campo-app"><label className="ctl-et">Documento del cliente (opcional)</label><input className="ctl" value={cliente} onChange={e => setCliente(e.target.value)} /></div>
        <div className="campo-app"><label className="ctl-et">Método de pago</label><select className="ctl" style={{ width: '100%' }} value={pago} onChange={e => setPago(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option></select></div>
        {mensaje && <p className="exito-app" role="status">{mensaje}</p>}
        {errorVenta && <p className="error-app" role="alert">{errorVenta}</p>}
        <button className="btn btn--primario btn--ancho" disabled={!lineas.length || guardando} onClick={guardarVenta}><IconoEnviar /> {guardando ? 'Guardando…' : 'Registrar venta'}</button>
      </Tarjeta>
      <Tarjeta titulo="Sobre el registro"><p>La venta solo se confirma cuando la API responde correctamente. El servidor debe validar el stock, guardar el detalle y descontar existencias dentro de una transacción.</p></Tarjeta>
    </div></div>
  </AppLayout>
}
