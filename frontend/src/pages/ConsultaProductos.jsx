import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Cabecera, Tarjeta, Badge } from '../components/ui'
import Estado from '../components/Estado'
import { useApiList } from '../hooks/useApiList'
import { api, normalizarProducto, listado } from '../services/api'
import { cop } from '../utils'

export default function ConsultaProductos({ ir }) {
  const { items, loading, error, reload } = useApiList('/productos', ['productos'], { publico: true })
  const [busqueda, setBusqueda] = useState('')
  const [ficha, setFicha] = useState('')
  const [resultadosApi, setResultadosApi] = useState(null)
  const [alternativas, setAlternativas] = useState(null)
  const [consultaError, setConsultaError] = useState('')
  const [consultando, setConsultando] = useState(false)
  const productos = (resultadosApi || items).map(normalizarProducto).filter(producto => producto.activo &&
    (resultadosApi || `${producto.sku} ${producto.nombre} ${producto.codigo_barras}`.toLowerCase().includes(busqueda.toLowerCase())))

  const buscarAvanzado = async e => {
    e.preventDefault()
    setConsultaError(''); setAlternativas(null)
    if (!busqueda.trim()) return setConsultaError('Escribe un término de búsqueda.')
    setConsultando(true)
    try {
      const params = new URLSearchParams({ q: busqueda.trim().slice(0, 100) })
      if (ficha.trim()) params.set('especificacion', ficha.trim().slice(0, 100))
      const respuesta = await api(`/productos/buscar?${params.toString()}`, { auth: false })
      setResultadosApi(listado(respuesta, ['productos']))
    } catch (ex) { setResultadosApi(null); setConsultaError(ex.message) }
    finally { setConsultando(false) }
  }
  const sugerir = async id => {
    setAlternativas(null); setConsultaError(''); setConsultando(true)
    try {
      const respuesta = await api(`/productos/${id}/alternativas`, { auth: false })
      setAlternativas({ id, advertencia: respuesta.advertencia, items: listado(respuesta, ['alternativas']) })
    } catch (ex) { setConsultaError(ex.message) }
    finally { setConsultando(false) }
  }
  return <AppLayout pagina="consulta" ir={ir}>
    <Cabecera eyebrow="Ventas / Consultas" titulo="Consultar productos"
      texto="Consulta SKU, precios y existencias. Si necesitas crear, editar o inactivar, entra a Gestión de productos." />
    <Tarjeta titulo="Precios y existencias" derecha={`${productos.length} productos`}>
      <form className="filtros" onSubmit={buscarAvanzado}>
        <input className="ctl crece" aria-label="Buscar producto" placeholder="SKU, nombre, código o descripción"
          value={busqueda} maxLength={100} onChange={e => { setBusqueda(e.target.value); setResultadosApi(null); setAlternativas(null) }} />
        <input className="ctl" aria-label="Característica técnica" placeholder="Especificación (opcional)"
          value={ficha} maxLength={100} onChange={e => setFicha(e.target.value)} />
        <button className="btn btn--primario" type="submit" disabled={consultando || !busqueda.trim()}>{consultando ? 'Consultando…' : 'Buscar en API'}</button>
        {(resultadosApi || ficha) && <button className="btn" type="button" onClick={() => { setResultadosApi(null); setAlternativas(null); setFicha(''); setBusqueda('') }}>Limpiar</button>}
      </form>
      {consultaError && <p className="error-app" role="alert">{consultaError}</p>}
      {resultadosApi && <p style={{ fontSize: 12 }}>Resultados del buscador del backend ({productos.length}).</p>}
      <Estado loading={loading} error={error} onRetry={reload}>
        <div className="tabla-wrap" style={{ marginTop: 12 }}><table className="tabla">
          <thead><tr><th>SKU</th><th>Producto</th><th>Precio de venta</th><th>Disponible</th><th>Estado</th><th>Opciones</th></tr></thead>
          <tbody>{productos.length === 0 && <tr><td colSpan="6" className="vacio">No encontramos productos para esta búsqueda.</td></tr>}
            {productos.map(p => <tr key={p.id}><td className="mono">{p.sku}</td><td>{p.nombre}</td><td>{cop(p.precio)}</td><td>{p.stock} {p.unidad}</td>
              <td><Badge tono={p.stock <= 0 ? 'rojo' : p.stock <= p.minimo && p.minimo > 0 ? 'ambar' : 'verde'}>
                {p.stock <= 0 ? 'Agotado' : p.stock <= p.minimo && p.minimo > 0 ? 'Bajo mínimo' : 'Disponible'}
              </Badge></td><td><button type="button" className="enlace-fila" onClick={() => sugerir(p.id)} disabled={consultando}>Alternativas</button></td></tr>)}
          </tbody>
        </table></div>
      </Estado>
    </Tarjeta>
    {alternativas && <div style={{ marginTop: 16 }}><Tarjeta titulo={`Alternativas para producto #${alternativas.id}`}>
      <p style={{ fontSize: 12 }}>{alternativas.advertencia || 'Comprobar compatibilidad antes de sustituir un artículo.'}</p>
      {alternativas.items.length === 0 ? <p className="vacio">No hay alternativas disponibles.</p> : <div className="tabla-wrap"><table className="tabla"><thead><tr><th>SKU</th><th>Producto</th><th>Stock</th><th>Precio</th></tr></thead><tbody>
        {alternativas.items.map(item => { const p = normalizarProducto(item); return <tr key={p.id}><td>{p.sku}</td><td>{p.nombre}</td><td>{p.stock}</td><td>{cop(p.precio)}</td></tr> })}
      </tbody></table></div>}
    </Tarjeta></div>}
    <div className="acciones" style={{ marginTop: 16 }}>
      <button className="btn btn--primario" onClick={() => ir('mostrador')}>Ir a registrar una venta</button>
      <button className="btn" onClick={() => ir('catalogo')}>Gestionar productos</button>
    </div>
  </AppLayout>
}
