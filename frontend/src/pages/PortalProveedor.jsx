import { useCallback, useEffect, useRef, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Cabecera, Tarjeta, Badge, Stat } from '../components/ui'
import { getSession } from '../services/api'
import {
  cargarPortal, confirmarOrdenPropia, detalleOrdenPropia,
  estadoOrden, puedeConfirmarOrden, estaConfirmada,
} from '../services/portalProveedor'
import { cop } from '../utils'

const fecha = valor => {
  if (!valor) return '—'
  const f = new Date(valor)
  return Number.isNaN(f.getTime()) ? String(valor) : f.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}
const numero = valor => Number(valor ?? 0)

export default function PortalProveedor({ ir }) {
  const usuario = getSession()?.usuario || {}
  const [seccion, setSeccion] = useState('resumen')
  const [perfil, setPerfil] = useState(null)
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [ocupado, setOcupado] = useState(null)
  const version = useRef(0)

  const recargar = useCallback(async () => {
    const actual = ++version.current
    setLoading(true)
    setError('')
    try {
      const datos = await cargarPortal()
      if (version.current === actual) {
        setPerfil(datos.perfil)
        setOrdenes(datos.ordenes)
      }
    } catch (e) {
      if (version.current === actual) setError(e.message)
    } finally {
      if (version.current === actual) setLoading(false)
    }
  }, [])

  useEffect(() => {
    recargar()
    return () => { version.current += 1 }
  }, [recargar])

  const verDetalle = async id => {
    setCargandoDetalle(true)
    setDetalle(null)
    setMensaje('')
    setError('')
    setSeccion('ordenes')
    try {
      const respuesta = await detalleOrdenPropia(id)
      setDetalle(respuesta)
    } catch (e) { setError(e.message) }
    finally { setCargandoDetalle(false) }
  }

  const confirmar = async orden => {
    if (!puedeConfirmarOrden(orden) || ocupado !== null) return
    const id = orden.id_orden
    if (!window.confirm(`¿Confirmas la recepción de la solicitud #${id}? Esto NO indica recepción física ni modifica existencias.`)) return
    setOcupado(id)
    setMensaje('')
    setError('')
    try {
      await confirmarOrdenPropia(id)
      setMensaje(`Solicitud #${id} confirmada correctamente. La recepción física corresponde al Administrador.`)
      // Actualizar ambas vistas con respuestas actuales de la API, no con estados simulados.
      await recargar()
      if (detalle?.id_orden === id) {
        setDetalle(await detalleOrdenPropia(id))
      }
    } catch (e) { setError(e.message) }
    finally { setOcupado(null) }
  }

  const pendientes = ordenes.filter(puedeConfirmarOrden)
  const confirmadas = ordenes.filter(o => estaConfirmada(o) && String(o.estado).toLowerCase() === 'pendiente')
  const recibidas = ordenes.filter(o => String(o.estado).toLowerCase() === 'recibida')

  const acciones = (orden, esDetalle = false) => (
    <div className="acciones">
      {!esDetalle && <button className="enlace-fila" onClick={() => verDetalle(orden.id_orden)} disabled={cargandoDetalle || ocupado !== null}>Ver detalle</button>}
      {puedeConfirmarOrden(orden) && (
        <button className="btn btn--primario" onClick={() => confirmar(orden)} disabled={ocupado !== null || loading}>
          {ocupado === orden.id_orden ? 'Confirmando...' : 'Confirmar recepción de solicitud'}
        </button>
      )}
    </div>
  )

  return <AppLayout pagina="proveedor" ir={ir}>
    <Cabecera eyebrow="PeakPerformers / Área de proveedor" titulo="Mi portal de proveedor"
      texto="Consulta tu empresa y las solicitudes de compra que la ferretería te ha asignado." />

    <div className="proveedor__nav" role="group" aria-label="Secciones del proveedor">
      <button className={`btn ${seccion === 'resumen' ? 'btn--primario' : ''}`} onClick={() => setSeccion('resumen')}>Mi empresa</button>
      <button className={`btn ${seccion === 'ordenes' ? 'btn--primario' : ''}`} onClick={() => setSeccion('ordenes')}>Mis órdenes</button>
      <button className="btn" disabled={loading || ocupado !== null} onClick={() => { setMensaje(''); recargar() }}>Actualizar datos</button>
    </div>

    {error && <p className="error-app proveedor__mensaje" role="alert">{error}</p>}
    {mensaje && <p className="exito-app proveedor__mensaje" role="status">{mensaje}</p>}
    {loading && perfil === null && <Tarjeta><p className="vacio" role="status">Consultando los datos de tu empresa y sus órdenes...</p></Tarjeta>}

    {seccion === 'resumen' && perfil && <>
      <div className="stats stats--3 proveedor__stats">
        <Stat etiqueta="Mis órdenes" valor={ordenes.length} />
        <Stat etiqueta="Pendientes de confirmar" valor={pendientes.length} />
        <Stat etiqueta="Confirmadas / recibidas" valor={confirmadas.length + recibidas.length} />
      </div>
      <Tarjeta titulo="Datos de mi empresa">
        <div className="proveedor__empresa">
          <div><span>Razón social</span><strong>{perfil.razon_social || 'No registrada'}</strong></div>
          <div><span>NIT / RUT</span><strong>{perfil.nit_rut || '—'}</strong></div>
          <div><span>Correo de contacto</span><strong>{perfil.correo || '—'}</strong></div>
          <div><span>Teléfono</span><strong>{perfil.telefono || '—'}</strong></div>
          <div><span>Dirección</span><strong>{perfil.direccion || '—'}</strong></div>
        </div>
        <p className="proveedor__nota">Cuenta conectada: {usuario.correo || `Usuario #${usuario.id_usuario || '—'}`}. Estos datos provienen de tu perfil autenticado.</p>
      </Tarjeta>
      <div className="proveedor__acceso"><button className="btn btn--primario" onClick={() => setSeccion('ordenes')}>Ver mis órdenes ({ordenes.length})</button></div>
    </>}

    {seccion === 'ordenes' && <>
      <Tarjeta titulo="Mis órdenes de compra" sinPadding>
        {loading && <p className="vacio" role="status">Actualizando órdenes...</p>}
        {!loading && !error && ordenes.length === 0 && <p className="vacio">Tu empresa no tiene solicitudes de compra asignadas.</p>}
        {ordenes.length > 0 && <div className="tabla-wrap"><table className="tabla">
          <thead><tr><th>Orden</th><th>Fecha de creación</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead>
          <tbody>{ordenes.map(o => <tr key={o.id_orden}>
            <td className="mono">#{o.id_orden}</td>
            <td>{fecha(o.fecha_creacion)}</td>
            <td><Badge tono={estadoOrden(o).tono}>{estadoOrden(o).texto}</Badge></td>
            <td>{cop(numero(o.total))}</td>
            <td>{acciones(o)}</td>
          </tr>)}</tbody>
        </table></div>}
      </Tarjeta>
      {cargandoDetalle && <p className="proveedor__mensaje" role="status">Consultando el detalle de la orden...</p>}
      {detalle && <div className="proveedor__detalle"><Tarjeta titulo={`Detalle de orden #${detalle.id_orden}`} derecha={<button className="btn" onClick={() => setDetalle(null)}>Cerrar</button>}>
        <div className="proveedor__detalleMeta">
          <div><span>Proveedor</span><strong>{detalle.proveedor || perfil?.razon_social || '—'}</strong></div>
          <div><span>Fecha</span><strong>{fecha(detalle.fecha_creacion)}</strong></div>
          <div><span>Estado</span><Badge tono={estadoOrden(detalle).tono}>{estadoOrden(detalle).texto}</Badge></div>
          {detalle.fecha_confirmacion && <div><span>Confirmada el</span><strong>{fecha(detalle.fecha_confirmacion)}</strong></div>}
        </div>
        <div className="tabla-wrap"><table className="tabla">
          <thead><tr><th>SKU / Producto</th><th className="der">Cantidad</th><th className="der">Costo unitario</th><th className="der">Subtotal</th></tr></thead>
          <tbody>{detalle.detalles.map((p, i) => <tr key={`${p.id_producto}-${i}`}>
            <td><strong>{p.producto || 'Producto'}</strong><div className="mono">{p.sku || '—'}</div></td>
            <td className="der">{numero(p.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 3 })}</td>
            <td className="der">{cop(numero(p.costo_unitario))}</td>
            <td className="der">{cop(numero(p.subtotal))}</td>
          </tr>)}</tbody>
        </table></div>
        <div className="proveedor__total"><span>Total de la orden</span><strong>{cop(numero(detalle.total))}</strong></div>
        <div className="proveedor__detalleAccion">{acciones(detalle, true)}</div>
        <p className="proveedor__nota">Confirmar la solicitud no aumenta el inventario. La ferretería registrará posteriormente la recepción física.</p>
      </Tarjeta></div>}
    </>}
  </AppLayout>
}
