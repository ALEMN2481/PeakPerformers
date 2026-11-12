import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera, Stat } from '../components/ui'
import { IconoFlecha } from '../components/Iconos'
import Estado from '../components/Estado'
import { useApiList } from '../hooks/useApiList'
import { normalizarProducto } from '../services/api'

export default function Panel({ ir }) {
  const { items, loading, error, reload } = useApiList('/productos', ['productos'])
  const productos = items.map(normalizarProducto)
  const activos = productos.filter(p => p.activo)
  const alertas = activos.filter(p => p.stock < p.minimo)
  const agotados = alertas.filter(p => p.stock === 0)
  const bajos = alertas.filter(p => p.stock > 0)
  return <AppLayout pagina="panel" ir={ir}>
    <Cabecera eyebrow="ControlStock / Inventario en tiempo real" titulo="Panel general"
      texto="Indicadores calculados con los productos recibidos de la API, sin datos de demostración.">
      <button className="btn btn--primario" onClick={() => ir('reabastecimiento')}><IconoFlecha /> Ver reabastecimiento</button>
    </Cabecera>
    <Estado loading={loading} error={error} onRetry={reload}>
      <div className="stats">
        <Stat etiqueta="Productos activos" valor={activos.length}><Badge>Catálogo actual</Badge></Stat>
        <Stat etiqueta="Bajo mínimo" valor={bajos.length}><Badge tono="ambar">Revisar existencias</Badge></Stat>
        <Stat etiqueta="Agotados" valor={agotados.length}><Badge tono="rojo">Atención prioritaria</Badge></Stat>
        <Stat etiqueta="Referencias totales" valor={productos.length}><Badge>Incluye inactivos</Badge></Stat>
      </div>
      <Tarjeta titulo="Atención de inventario" derecha={`${alertas.length} referencias`} sinPadding>
        <div className="tabla-wrap"><table className="tabla"><thead><tr><th>SKU</th><th>Producto</th><th>Stock actual</th><th>Mínimo</th><th>Estado</th></tr></thead>
          <tbody>{alertas.length === 0 && <tr><td className="vacio" colSpan="5">No hay alertas de inventario.</td></tr>}
            {alertas.map(p => <tr key={p.id ?? p.sku}><td className="mono">{p.sku}</td><td>{p.nombre}</td><td>{p.stock} {p.unidad}</td><td>{p.minimo}</td>
              <td><Badge tono={p.stock === 0 ? 'rojo' : 'ambar'}>{p.stock === 0 ? 'Agotado' : 'Bajo mínimo'}</Badge></td></tr>)}</tbody>
        </table></div>
      </Tarjeta>
    </Estado>
    <p style={{ color: 'var(--gris)', fontSize: 11, marginTop: 18 }}>
      Las cifras de ventas, compras y comandas aparecerán cuando sus módulos estén disponibles en el backend.
    </p>
  </AppLayout>
}
