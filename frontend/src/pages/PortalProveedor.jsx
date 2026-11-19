import { useCallback, useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Cabecera, Tarjeta, Badge, Stat } from '../components/ui'
import { getSession } from '../services/api'
import { cargarPortal, configuracionPortal, confirmarOrdenPropia, detalleOrdenPropia } from '../services/portalProveedor'
import { cop } from '../utils'

const cfg = configuracionPortal()
const fecha = dato => {
  if (!dato) return '—'
  const d = new Date(dato)
  return Number.isNaN(d.getTime()) ? String(dato) : d.toLocaleDateString('es-CO')
}

export default function PortalProveedor({ ir }) {
  const usuario = getSession()?.usuario || {}
  const [perfil, setPerfil] = useState(null)
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(cfg.listo)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [ocupado, setOcupado] = useState(null)

  const recargar = useCallback(async () => {
    if (!cfg.listo) return
    setLoading(true); setError('')
    try {
      const r = await cargarPortal(cfg)
      setPerfil(r.perfil); setOrdenes(r.ordenes)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { recargar() }, [recargar])

  const verDetalle = async id => {
    setDetalle(null); setMensaje(''); setError(''); setOcupado(id)
    try { setDetalle(await detalleOrdenPropia(cfg, id)) }
    catch (e) { setError(e.message) }
    finally { setOcupado(null) }
  }
  const confirmar = async id => {
    if (!window.confirm(`¿Confirmas la orden #${id}? Esta acción NO recibe mercancía ni incrementa existencias.`)) return
    setError(''); setMensaje(''); setOcupado(id)
    try {
      await confirmarOrdenPropia(cfg, id)
      setMensaje(`Confirmación de orden #${id} registrada por el servidor.`)
      await recargar()
    } catch (e) { setError(e.message) }
    finally { setOcupado(null) }
  }

  const empresa = perfil?.proveedor ?? perfil?.empresa ?? perfil
  const pendientes = ordenes.filter(o => String(o.estado ?? '').toLowerCase() === 'pendiente')

  return <AppLayout pagina="proveedor" ir={ir}>
    <Cabecera eyebrow="PeakPerformers / Proveedor" titulo="Mi portal de proveedor"
      texto="Consulta tus órdenes asignadas. Tu perfil y pedidos deben filtrarse por tu sesión JWT desde el servidor." />
    {!cfg.listo ? <Tarjeta titulo="Integración del portal">
      <Badge tono="ambar">Pendiente de rutas verificadas</Badge>
      <p>Tu cuenta puede iniciar sesión como Proveedor. Para consultar pedidos sin exponer los de otras empresas, falta vincular este frontend a las rutas exactas del último backend.</p>
      <p>El backend compartido anteriormente no incluye todavía esas rutas. Por seguridad, <strong>no se consulta el listado global de compras</strong> ni se muestran órdenes inventadas.</p>
      <p>El archivo <code>INTEGRACION_PROVEEDOR.md</code> explica qué necesita configurar tu compañero cuando tenga los archivos definitivos de <code>backend/src/routes</code>.</p>
      <p>Sesión: <strong>{usuario.correo || `Usuario #${usuario.id_usuario || '—'}`}</strong></p>
    </Tarjeta> : <>
      <div className="stats stats--3">
        <Stat etiqueta="Mis órdenes" valor={ordenes.length} />
        <Stat etiqueta="Órdenes pendientes" valor={pendientes.length} />
        <Stat etiqueta="Perfil" valor={empresa?.razon_social || empresa?.nombre || 'Proveedor'} />
      </div>
      <div style={{ marginTop: 16 }}><Tarjeta titulo="Mi empresa">
        <p><strong>{empresa?.razon_social || empresa?.nombre || usuario.correo || 'Perfil autenticado'}</strong></p>
        {empresa?.nit_rut && <p>NIT / RUT: {empresa.nit_rut}</p>}
        {empresa?.correo && <p>Contacto: {empresa.correo}</p>}
        <p style={{ color: 'var(--gris)', fontSize: 12 }}>Solo se presenta la información asociada a tu identidad verificada por la API.</p>
      </Tarjeta></div>
      <div style={{ marginTop: 16 }}><Tarjeta titulo="Mis órdenes de compra" derecha={<button className="btn" disabled={loading} onClick={recargar}>Actualizar</button>} sinPadding>
        {loading && <p className="vacio">Consultando tus órdenes...</p>}
        {!loading && ordenes.length === 0 && <p className="vacio">No hay órdenes asignadas a esta cuenta.</p>}
        {!loading && ordenes.length > 0 && <div className="tabla-wrap"><table className="tabla">
          <thead><tr><th>Orden</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead>
          <tbody>{ordenes.map(o => <tr key={o.id_orden}>
            <td className="mono">#{o.id_orden}</td>
            <td>{fecha(o.fecha_creacion)}</td>
            <td><Badge tono={o.estado === 'Recibida' ? 'verde' : 'ambar'}>{o.estado || '—'}</Badge></td>
            <td>{cop(Number(o.total ?? 0))}</td>
            <td><div className="acciones">
              {cfg.detallePlantilla && <button className="enlace-fila" disabled={ocupado !== null} onClick={() => verDetalle(o.id_orden)}>Ver detalle</button>}
              {cfg.confirmarPlantilla && String(o.estado).toLowerCase() === 'pendiente' && <button className="enlace-fila" disabled={ocupado !== null} onClick={() => confirmar(o.id_orden)}>Confirmar orden</button>}
            </div></td>
          </tr>)}</tbody>
        </table></div>}
      </Tarjeta></div>
      {detalle && <div style={{ marginTop: 16 }}><Tarjeta titulo={`Detalle de orden #${detalle.id_orden || '—'}`}>
        <p>Estado: <strong>{detalle.estado || '—'}</strong> · Total: <strong>{cop(Number(detalle.total ?? 0))}</strong></p>
        {Array.isArray(detalle.detalles) && <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Producto</th><th>Cantidad</th><th>Costo unitario</th></tr></thead><tbody>
          {detalle.detalles.map((i, idx) => <tr key={`${i.id_producto}-${idx}`}><td>{i.producto || i.nombre || i.id_producto}</td><td>{i.cantidad}</td><td>{cop(Number(i.costo_unitario ?? 0))}</td></tr>)}
        </tbody></table></div>}
        <button className="btn" onClick={() => setDetalle(null)}>Cerrar detalle</button>
      </Tarjeta></div>}
    </>}
    {error && <p className="error-app" role="alert" style={{ marginTop: 16 }}>{error}</p>}
    {mensaje && <p className="exito-app" role="status" style={{ marginTop: 16 }}>{mensaje}</p>}
  </AppLayout>
}
