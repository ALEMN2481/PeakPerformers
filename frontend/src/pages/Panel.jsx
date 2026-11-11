import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera, Stat } from '../components/ui'
import { IconoFlecha, IconoCalendario, IconoDescargar } from '../components/Iconos'

const ALERTAS = [
  ['TOR-3812-G', 'Tornillo galv. 3/8" × 1 1/2"', '0 / 100', 'Agotado', 'rojo'],
  ['BRO-HSS08', 'Broca HSS 8 mm', '12 / 20', 'Bajo mínimo', 'ambar'],
  ['CAB-TH12', 'Cable THHN calibre 12', '85 m / 100 m', 'Bajo mínimo', 'ambar'],
  ['CIN-TEF12', 'Cinta teflón 1/2" × 10 m', '0 / 24', 'Agotado', 'rojo'],
]
const COMANDAS = [['Pendiente', 8, '#a16207'], ['En preparación', 5, '#1d4ed8'], ['Despachado', 27, '#15803d']]
const PAGOS = [
  ['Efectivo', 94, '$4.218.000', 'Cobrado'],
  ['Transferencia', 58, '$2.736.000', 'Cobrado'],
  ['Tarjeta', 26, '$1.560.000', 'Cobrado'],
  ['Crédito mayorista', 8, '$432.000', 'Pendiente'],
]

export default function Panel({ ir }) {
  const [estadoPago, setEstadoPago] = useState('todos')
  const pagos = PAGOS.filter((p) => estadoPago === 'todos' || p[3].toLowerCase() === estadoPago)

  return (
    <AppLayout pagina="panel" ir={ir}>
      <Cabecera eyebrow="Operación / 21 octubre 2026" titulo="Panel general"
        texto="Buenos días, Laura. Hay 24 productos que requieren atención.">
        <button className="btn btn--primario" onClick={() => ir('reabastecimiento')}>
          <IconoFlecha /> Ver reabastecimiento
        </button>
      </Cabecera>

      <div className="stats">
        <Stat etiqueta="Productos activos" valor="1.248"><Badge>12 categorías</Badge></Stat>
        <Stat etiqueta="Bajo mínimo / agotados" valor="18 / 6"><Badge tono="rojo">Revisar existencias</Badge></Stat>
        <Stat etiqueta="Comandas abiertas" valor="13"><Badge tono="azul">8 pendientes · 5 en preparación</Badge></Stat>
        <Stat etiqueta="Compras por autorizar" valor="3"><Badge tono="ambar">$3.612.000 COP</Badge></Stat>
      </div>

      <div className="fila-2">
        <Tarjeta titulo="Atención de inventario" derecha="24 alertas · Ver todas" sinPadding>
          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>SKU</th><th>Producto</th><th>Stock / mín.</th><th>Estado</th></tr></thead>
              <tbody>
                {ALERTAS.map(([sku, prod, stock, estado, tono]) => (
                  <tr key={sku}>
                    <td className="mono">{sku}</td><td>{prod}</td><td>{stock}</td>
                    <td><Badge tono={tono}>{estado}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Comandas de hoy" derecha="40 en total">
          <div className="barras">
            {COMANDAS.map(([nombre, n, color]) => (
              <div key={nombre}>
                <div className="barra__fila"><span>{nombre}</span><strong>{n}</strong></div>
                <div className="barra"><i style={{ width: `${(n / 40) * 100}%`, background: color }} /></div>
              </div>
            ))}
          </div>
          <hr className="separador" style={{ margin: '18px 0 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 11 }}>CMD-1048 · Carlos Ruiz</strong>
              <p style={{ fontSize: 10, color: 'var(--gris)', marginTop: 4 }}>09:42 · 3 líneas · 96 unidades</p>
            </div>
            <Badge tono="ambar">Pendiente</Badge>
          </div>
        </Tarjeta>
      </div>

      <Tarjeta titulo="Reporte de ventas y pagos" derecha="Corte de consulta · 09:42" sinPadding>
        <div className="tarjeta__cuerpo">
          <div className="filtros" style={{ justifyContent: 'space-between' }}>
            <div className="acciones">
              <button className="btn"><span>15 oct 2026 → 21 oct 2026</span> <IconoCalendario /></button>
              <select className="ctl" value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
                <option value="todos">Pagos: todos</option>
                <option value="cobrado">Pagos: cobrados</option>
                <option value="pendiente">Pagos: pendientes</option>
              </select>
              <select className="ctl"><option>Sede: Cali</option></select>
            </div>
            <button className="btn"><IconoDescargar /> Exportar reporte</button>
          </div>

          <div className="fila-lateral" style={{ gridTemplateColumns: '240px 1fr', marginTop: 20 }}>
            <div className="tarjeta" style={{ background: '#f7f8fa', padding: 18 }}>
              <p style={{ fontSize: 10, color: '#5b6670', marginBottom: 10 }}>Ventas del periodo</p>
              <strong className="mono" style={{ fontSize: 26 }}>$8.946.000</strong>
              <p style={{ fontSize: 10, color: 'var(--gris)', margin: '8px 0 16px' }}>COP · 186 ventas registradas</p>
              <div className="sub-total"><span>Cobrado</span><strong>$8.514.000</strong></div>
              <div className="sub-total"><span>Crédito pendiente</span><strong>$432.000</strong></div>
            </div>
            <div className="tabla-wrap">
              <table className="tabla">
                <thead><tr><th>Medio de pago</th><th>Ventas</th><th>Total COP</th><th>Estado</th></tr></thead>
                <tbody>
                  {pagos.map(([medio, ventas, total, estado]) => (
                    <tr key={medio}>
                      <td className="mono">{medio}</td><td>{ventas}</td><td>{total}</td>
                      <td><Badge tono={estado === 'Cobrado' ? 'verde' : 'ambar'} punto={false}>{estado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Tarjeta>
    </AppLayout>
  )
}
