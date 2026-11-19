import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera, Stat } from '../components/ui'
import { IconoFlecha } from '../components/Iconos'
import Estado from '../components/Estado'
import { useApiList } from '../hooks/useApiList'
import { getSession, esAdministrador, normalizarProducto } from '../services/api'
import { cop } from '../utils'

export default function Panel({ ir }) {
  const admin = esAdministrador(getSession()?.usuario)
  const { items, loading, error, reload } = useApiList('/productos', ['productos'], { publico: !admin })
  const productos = items.map(normalizarProducto)
  const activos = productos.filter(p => p.activo)
  const alertas = activos.filter(p => p.stock <= p.minimo && p.minimo > 0)
  const agotados = alertas.filter(p => p.stock === 0)
  const bajos = alertas.filter(p => p.stock > 0)
  return <AppLayout pagina="panel" ir={ir}>
    <Cabecera eyebrow="PeakPerformers / Inventario en tiempo real" titulo={admin ? "Panel general" : "Consulta de existencias"}
      texto={admin ? "Resumen del inventario real, con alertas y acceso a reabastecimiento." : "Precios y existencias de los productos activos, sin acceso a compras ni costos administrativos."}>
      {admin && <button className="btn btn--primario" onClick={() => ir('reabastecimiento')}><IconoFlecha /> Ver reabastecimiento</button>}
    </Cabecera>
    <Estado loading={loading} error={error} onRetry={reload}>
      <div className="stats">
        <Stat etiqueta="Productos activos" valor={activos.length}><Badge>Catálogo actual</Badge></Stat>
        {admin && <Stat etiqueta="Bajo mínimo" valor={bajos.length}><Badge tono="ambar">Revisar existencias</Badge></Stat>}
        <Stat etiqueta="Agotados" valor={admin ? agotados.length : activos.filter(p => p.stock === 0).length}><Badge tono="rojo">Sin existencias</Badge></Stat>
        {admin && <Stat etiqueta="Referencias totales" valor={productos.length}><Badge>Incluye inactivos</Badge></Stat>}
      </div>
      <Tarjeta titulo={admin ? "Atención de inventario" : "Consultar precios y productos"} derecha={admin ? `${alertas.length} referencias` : `${activos.length} referencias`} sinPadding>
        <div className="tabla-wrap"><table className="tabla"><thead><tr><th>SKU</th><th>Producto</th><th>Stock actual</th><th>{admin ? 'Mínimo' : 'Precio de venta'}</th><th>Estado</th></tr></thead>
          <tbody>{(admin ? alertas : activos).length === 0 && <tr><td className="vacio" colSpan="5">{admin ? 'No hay alertas de inventario.' : 'No hay productos registrados.'}</td></tr>}
            {(admin ? alertas : activos).map(p => <tr key={p.id ?? p.sku}><td className="mono">{p.sku}</td><td>{p.nombre}</td><td>{p.stock} {p.unidad}</td><td>{admin ? p.minimo : cop(p.precio)}</td>
              <td><Badge tono={p.stock === 0 ? 'rojo' : admin && p.stock <= p.minimo && p.minimo > 0 ? 'ambar' : 'verde'}>{p.stock === 0 ? 'Agotado' : admin ? 'Bajo mínimo' : 'Disponible'}</Badge></td></tr>)}</tbody>
        </table></div>
      </Tarjeta>
    </Estado>
    {admin && <p style={{ color: 'var(--gris)', fontSize: 11, marginTop: 18 }}>
      Los indicadores financieros están disponibles en Reportes y ventas, exclusivamente para Administrador.
    </p>}
  </AppLayout>
}
