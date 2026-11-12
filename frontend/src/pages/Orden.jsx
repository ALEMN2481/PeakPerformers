import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera } from '../components/ui'
import { IconoEnviar } from '../components/Iconos'
import { api } from '../services/api'
import { cop } from '../utils'

const CLAVE_BORRADOR = 'controlstock_borrador_compra'
function leerBorrador() {
  try { return JSON.parse(sessionStorage.getItem(CLAVE_BORRADOR) || 'null') }
  catch { return null }
}
export default function Orden({ ir }) {
  const [borrador] = useState(leerBorrador)
  const [motivo, setMotivo] = useState('Reposición de productos bajo mínimo')
  const [creada, setCreada] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const crear = async () => {
    if (!borrador || !motivo.trim()) return setError('La orden y su motivo son obligatorios.')
    setOcupado(true); setError('')
    try {
      const r = await api('/ordenes-compra', { method: 'POST', body: {
        id_proveedor: borrador.id_proveedor, total: borrador.total,
        motivo: motivo.trim(), detalles: borrador.detalles.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad, costo_unitario: i.costo_unitario })),
      } })
      setCreada(r?.data ?? r ?? {}); sessionStorage.removeItem(CLAVE_BORRADOR)
    } catch (ex) { setError(ex.message) } finally { setOcupado(false) }
  }
  return <AppLayout pagina="orden" ir={ir}>
    <Cabecera eyebrow="Compras / Revisión" titulo="Orden de compra" texto="El borrador es local hasta que confirmes y el backend guarde la orden." />
    {!borrador ? <Tarjeta titulo="No hay borrador"><p>Debes seleccionar referencias en reabastecimiento para crear una orden.</p><button className="btn" onClick={() => ir('reabastecimiento')}>Ir a reabastecimiento</button></Tarjeta> : <>
      <div className="chips" style={{ marginBottom: 18 }}><Badge tono={creada ? 'verde' : 'ambar'}>{creada ? 'Registrada en la API' : 'Pendiente de registrar'}</Badge></div>
      <Tarjeta titulo="Proveedor y detalle" derecha={borrador.proveedor || `Proveedor ${borrador.id_proveedor}`} sinPadding>
        <div className="tabla-wrap"><table className="tabla"><thead><tr><th>SKU</th><th>Producto</th><th>Cantidad</th><th>Costo unitario</th><th>Subtotal</th></tr></thead>
          <tbody>{borrador.detalles.map(i => <tr key={i.id_producto}><td className="mono">{i.sku}</td><td>{i.nombre}</td><td>{i.cantidad}</td><td>{cop(i.costo_unitario)}</td><td>{cop(i.cantidad * i.costo_unitario)}</td></tr>)}</tbody>
        </table></div><div className="pie-tabla"><strong>Total estimado: {cop(borrador.total)}</strong></div>
      </Tarjeta>
      <div style={{ marginTop: 16 }}><Tarjeta titulo="Registro de compra">
        {creada ? <p className="exito-app" role="status">Orden guardada por el servidor. {creada.id_orden ? `Identificador: ${creada.id_orden}.` : ''} El envío al proveedor o la autorización posterior requieren funciones adicionales del backend.</p> : <>
          <label className="ctl-et">Motivo / observaciones *</label><input className="ctl" value={motivo} maxLength="255" onChange={e => setMotivo(e.target.value)} />
          {error && <p className="error-app" role="alert">{error}</p>}
          <div className="acciones" style={{ marginTop: 14 }}><button className="btn btn--primario" disabled={ocupado} onClick={crear}><IconoEnviar /> {ocupado ? 'Registrando…' : 'Registrar orden en el servidor'}</button><button className="btn" onClick={() => ir('reabastecimiento')}>Volver a editar</button></div>
        </>}
      </Tarjeta></div>
    </>}
  </AppLayout>
}
