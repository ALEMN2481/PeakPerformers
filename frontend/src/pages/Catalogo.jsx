import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera } from '../components/ui'
import { IconoBuscar, IconoMas, IconoDescargar } from '../components/Iconos'

const INICIO = [
  ['TOR-3812', 'Tornillo hexagonal zincado 3/8" × 1 1/2" · UNC 16', 'Fijaciones', 'A-02 / E-03', 'Unidad', 240, 100, true],
  ['TOR-3812-G', 'Tornillo hexagonal galvanizado 3/8" × 1 1/2" · UNC 16', 'Fijaciones', 'A-02 / E-03', 'Unidad', 0, 100, true],
  ['TUE-38', 'Tuerca hexagonal UNC 3/8"', 'Fijaciones', 'A-02 / E-04', 'Unidad', 480, 100, true],
  ['ARA-38', 'Arandela plana 3/8"', 'Fijaciones', 'A-02 / E-05', 'Unidad', 960, 200, true],
  ['BRO-HSS08', 'Broca HSS 8 mm', 'Herramientas', 'B-01 / E-02', 'Unidad', 12, 20, true],
  ['CAB-TH12', 'Cable THHN calibre 12', 'Electricidad', 'C-03 / E-01', 'Metro', 85, 100, true],
  ['LIJ-080', 'Lija al agua grano 80', 'Abrasivos', 'D-01 / E-02', 'Hoja', 0, 10, true],
  ['PIN-12-ANT', 'Pincel 1/2" · línea anterior', 'Pintura', 'D-02 / E-02', 'Unidad', 0, 0, false],
].map(([sku, nombre, categoria, ub, unidad, stock, minimo, activo]) =>
  ({ sku, nombre, categoria, ub, unidad, stock, minimo, activo }))

export default function Catalogo({ ir }) {
  const [productos, setProductos] = useState(INICIO)
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [stock, setStock] = useState('todos')
  const [aInactivar, setAInactivar] = useState('LIJ-080')
  const [motivo, setMotivo] = useState('Referencia descontinuada por el proveedor')
  const [error, setError] = useState('')

  const filtrados = productos.filter((p) => {
    const txt = `${p.sku} ${p.nombre}`.toLowerCase()
    if (q && !txt.includes(q.toLowerCase())) return false
    if (estado !== 'todos' && (estado === 'activo') !== p.activo) return false
    if (categoria !== 'todas' && p.categoria !== categoria) return false
    if (stock === 'agotado' && p.stock !== 0) return false
    if (stock === 'bajo' && !(p.stock > 0 && p.stock < p.minimo)) return false
    if (stock === 'ok' && p.stock < p.minimo) return false
    return true
  })
  const producto = productos.find((p) => p.sku === aInactivar)

  const confirmar = () => {
    if (!motivo.trim()) return setError('El motivo es obligatorio')
    // TODO: conectar con el backend (inactivación lógica del producto)
    setProductos((ps) => ps.map((p) => (p.sku === aInactivar ? { ...p, activo: false } : p)))
    setAInactivar(null); setError('')
  }
  const abrirInactivar = (sku) => { setAInactivar(sku); setMotivo(''); setError('') }

  return (
    <AppLayout pagina="catalogo" ir={ir}>
      <Cabecera eyebrow="Inventario / Productos" titulo="Catálogo de productos"
        texto="Administra referencias, parámetros de venta y ubicaciones sin perder trazabilidad.">
        <button className="btn btn--primario"><IconoMas /> Nuevo producto</button>
      </Cabecera>
      <div className="chips" style={{ marginTop: -8, marginBottom: 18 }}>
        <Badge tono="verde">1.248 activos</Badge><Badge>36 inactivos</Badge><Badge tono="azul">Alta exclusiva de administrador</Badge>
      </div>

      <Tarjeta sinPadding className="mb">
        <div className="tarjeta__cuerpo" style={{ paddingBottom: 0 }}>
          <div className="filtros">
            <div className="crece" style={{ position: 'relative' }}>
              <input className="ctl" placeholder="Buscar nombre, SKU o barras" value={q} onChange={(e) => setQ(e.target.value)} />
              <span style={{ position: 'absolute', right: 10, top: 9, color: '#6b7680', display: 'grid' }}><IconoBuscar /></span>
            </div>
            <select className="ctl" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="todos">Estado: todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
            </select>
            <select className="ctl" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="todas">Categoría: todas</option>
              {['Fijaciones', 'Herramientas', 'Electricidad', 'Abrasivos', 'Pintura'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="ctl" value={stock} onChange={(e) => setStock(e.target.value)}>
              <option value="todos">Stock: todos</option><option value="agotado">Agotado</option>
              <option value="bajo">Bajo mínimo</option><option value="ok">Normal</option>
            </select>
            <button className="btn"><IconoDescargar /> Exportar</button>
          </div>
        </div>

        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Pasillo / est.</th><th>Unidad</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Acción</th></tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && <tr><td colSpan="9" className="vacio">No hay productos con esos filtros.</td></tr>}
              {filtrados.map((p) => (
                <tr key={p.sku}>
                  <td className="mono">{p.sku}</td><td style={{ maxWidth: 220 }}>{p.nombre}</td>
                  <td>{p.categoria}</td><td>{p.ub}</td><td>{p.unidad}</td><td>{p.stock}</td><td>{p.minimo}</td>
                  <td><Badge tono={p.activo ? 'verde' : 'gris'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td>
                    {p.activo
                      ? (<><button className="enlace-fila">Editar →</button>
                          <button className="enlace-fila" onClick={() => abrirInactivar(p.sku)}>Inactivar ↓</button></>)
                      : <button className="enlace-fila">Ver historial</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pie-tabla">
          <span>Mostrando {filtrados.length} de 1.284 productos</span>
          <div className="acciones">
            <button className="btn" disabled>Anterior</button>
            <button className="btn">Página 1 de 161</button>
            <button className="btn">Siguiente</button>
          </div>
        </div>
      </Tarjeta>

      {producto && (
        <div style={{ marginTop: 16 }}>
          <Tarjeta titulo="¿Inactivar este producto?" derecha={`${producto.sku} · ${producto.nombre}`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
              <div>
                <div className="aviso" style={{ marginBottom: 10 }}>
                  <div>
                    <strong>Se conserva todo el historial</strong>
                    La baja es lógica: el producto deja de estar disponible para nuevas ventas, pero sus movimientos, compras y auditoría permanecen consultables.
                  </div>
                </div>
                <p style={{ fontSize: 10, color: 'var(--gris)' }}>
                  Stock actual: {producto.stock} {producto.unidad.toLowerCase()}s · La referencia no se elimina de la base de datos.
                </p>
              </div>
              <div>
                <label className="ctl-et">Motivo obligatorio</label>
                <input className="ctl" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                {error && <p className="error-app">{error}</p>}
                <div className="acciones" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => setAInactivar(null)}>Cancelar</button>
                  <button className="btn btn--peligro" onClick={confirmar}>Confirmar inactivación</button>
                </div>
              </div>
            </div>
          </Tarjeta>
        </div>
      )}
    </AppLayout>
  )
}
