import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Cabecera, Tarjeta, Stat } from '../components/ui'
import Estado from '../components/Estado'
import { api, exportCsv } from '../services/api'
import { cop } from '../utils'

function mesActual() {
  const hoy = new Date()
  const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return { desde: `${local.slice(0, 7)}-01`, hasta: local }
}

export default function Reportes({ ir }) {
  const [fechas, setFechas] = useState(mesActual)
  const [periodo, setPeriodo] = useState(mesActual)
  const [datos, setDatos] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setCargando(true); setError('')
    Promise.all([
      api('/reportes/dashboard', { signal: controller.signal }),
      api(`/reportes/ventas-resumen?desde=${periodo.desde}&hasta=${periodo.hasta}`, { signal: controller.signal }),
    ]).then(([panel, resumen]) => { if (!controller.signal.aborted) { setDashboard(panel); setDatos(resumen) } })
      .catch(e => { if (e.name !== 'AbortError' && !controller.signal.aborted) setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setCargando(false) })
    return () => controller.abort()
  }, [version, periodo.desde, periodo.hasta])
  const buscar = e => {
    e.preventDefault()
    if (fechas.desde > fechas.hasta) return setError('La fecha de inicio no puede superar la fecha final.')
    setPeriodo({ ...fechas })
    setVersion(v => v + 1)
  }
  const r = datos?.resumen || {}
  const d = dashboard?.inventario || {}
  return <AppLayout pagina="reportes" ir={ir}>
    <Cabecera eyebrow="Administración / Reportes" titulo="Reportes y ventas"
      texto="Ventas y valoraciones consultadas directamente al backend. Los importes provienen de MariaDB." />
    <Tarjeta titulo="Seleccionar periodo de ventas">
      <form className="filtros" onSubmit={buscar}>
        <label>Desde <input type="date" className="ctl" value={fechas.desde} onChange={e => setFechas(f => ({ ...f, desde: e.target.value }))} required /></label>
        <label>Hasta <input type="date" className="ctl" value={fechas.hasta} onChange={e => setFechas(f => ({ ...f, hasta: e.target.value }))} required /></label>
        <button type="submit" className="btn btn--primario">Consultar</button>
      </form>
    </Tarjeta>
    <Estado loading={cargando} error={error} onRetry={() => setVersion(v => v + 1)}>
      {datos && dashboard && <>
        <div className="stats" style={{ marginTop: 18 }}>
          <Stat etiqueta="Ventas del periodo" valor={r.cantidad_ventas ?? 0} />
          <Stat etiqueta="Ingresos del periodo" valor={cop(r.total_ingresos || 0)} />
          <Stat etiqueta="Ticket promedio" valor={cop(r.ticket_promedio || 0)} />
          <Stat etiqueta="Valor de costo del inventario" valor={cop(d.valor_costo_inventario || 0)} />
        </div>
        <Tarjeta titulo="Ventas por método de pago" derecha={<button className="btn" onClick={() => exportCsv('ventas-por-pago.csv', ['Método','Cantidad','Ingresos'], (datos.por_metodo_pago || []).map(x => [x.metodo_pago, x.cantidad, x.total]))}>Exportar CSV</button>} sinPadding>
          <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Método</th><th>Ventas</th><th>Ingresos</th></tr></thead><tbody>
            {(datos.por_metodo_pago || []).length === 0 && <tr><td className="vacio" colSpan="3">Sin ventas en este periodo.</td></tr>}
            {(datos.por_metodo_pago || []).map(m => <tr key={m.metodo_pago}><td>{m.metodo_pago}</td><td>{m.cantidad}</td><td>{cop(m.total)}</td></tr>)}
          </tbody></table></div>
        </Tarjeta>
        <div style={{ marginTop: 18 }}><Tarjeta titulo="Productos más vendidos" sinPadding>
          <div className="tabla-wrap"><table className="tabla"><thead><tr><th>SKU</th><th>Producto</th><th>Unidades</th><th>Importe</th></tr></thead><tbody>
            {(datos.top_productos || []).length === 0 && <tr><td className="vacio" colSpan="4">No hay productos vendidos en este periodo.</td></tr>}
            {(datos.top_productos || []).map(p => <tr key={p.id_producto}><td className="mono">{p.sku}</td><td>{p.nombre}</td><td>{p.unidades_vendidas}</td><td>{cop(p.importe)}</td></tr>)}
          </tbody></table></div>
        </Tarjeta></div>
      </>}
    </Estado>
  </AppLayout>
}
