import { useMemo, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera } from '../components/ui'
import { IconoBuscar, IconoMas, IconoDescargar } from '../components/Iconos'
import Estado from '../components/Estado'
import { useApiList } from '../hooks/useApiList'
import { api, exportCsv, normalizarCategoria, normalizarProducto } from '../services/api'

const VACIO = { sku: '', nombre: '', id_categoria: '', codigo_barras: '', descripcion: '', precio_costo: '', precio_venta: '', stock_actual: '0', stock_minimo: '0', unidad_medida: 'Unidad', ubicacion_bodega: '', estado: 1 }
export default function Catalogo({ ir }) {
  const prod = useApiList('/productos', ['productos'])
  const cat = useApiList('/categorias', ['categorias'])
  const productos = useMemo(() => prod.items.map(normalizarProducto), [prod.items])
  const categorias = useMemo(() => cat.items.map(normalizarCategoria), [cat.items])
  const nombres = Object.fromEntries(categorias.map(c => [c.id, c.nombre]))
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [stock, setStock] = useState('todos')
  const [form, setForm] = useState(null)
  const [editId, setEditId] = useState(null)
  const [inactivar, setInactivar] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [errorAccion, setErrorAccion] = useState('')
  const [ok, setOk] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [crearCat, setCrearCat] = useState(false)
  const [pagina, setPagina] = useState(1)

  const filtrados = productos.filter(p => {
    if (q && !`${p.sku} ${p.nombre} ${p.codigo_barras}`.toLowerCase().includes(q.toLowerCase())) return false
    if (estado !== 'todos' && (estado === 'activo') !== p.activo) return false
    if (categoria !== 'todas' && String(p.id_categoria) !== categoria) return false
    if (stock === 'agotado' && p.stock !== 0) return false
    if (stock === 'bajo' && !(p.stock > 0 && p.stock < p.minimo)) return false
    if (stock === 'ok' && p.stock < p.minimo) return false
    return true
  })
  const totalPag = Math.max(1, Math.ceil(filtrados.length / 20))
  const actuales = filtrados.slice((Math.min(pagina, totalPag) - 1) * 20, Math.min(pagina, totalPag) * 20)
  const nuevo = () => { setCrearCat(false); setEditId(null); setForm({ ...VACIO }); setInactivar(null); setErrorAccion(''); setOk('') }
  const editar = p => { setCrearCat(false); setEditId(p.id); setInactivar(null); setErrorAccion(''); setForm({
    sku: p.sku, nombre: p.nombre, id_categoria: p.id_categoria ?? '', codigo_barras: p.codigo_barras,
    descripcion: p.descripcion, precio_costo: p.costo, precio_venta: p.precio,
    stock_actual: p.stock, stock_minimo: p.minimo, unidad_medida: p.unidad,
    ubicacion_bodega: p.ub, estado: p.activo ? 1 : 0,
  }) }
  const guardar = async e => {
    e.preventDefault(); setErrorAccion(''); setOk('')
    if (!form.nombre.trim() || !form.sku.trim() || !form.id_categoria) return setErrorAccion('SKU, nombre y categoría son obligatorios.')
    if (['precio_costo', 'precio_venta', 'stock_actual', 'stock_minimo'].some(k => !Number.isFinite(Number(form[k])) || Number(form[k]) < 0)) return setErrorAccion('Los precios y existencias deben ser números positivos o cero.')
    setOcupado(true)
    try {
      await api(editId ? `/productos/${editId}` : '/productos', {
        method: editId ? 'PUT' : 'POST', body: { ...form, id_categoria: Number(form.id_categoria),
          precio_costo: Number(form.precio_costo), precio_venta: Number(form.precio_venta),
          stock_actual: Number(form.stock_actual), stock_minimo: Number(form.stock_minimo),
          codigo_barras: form.codigo_barras || null },
      })
      setForm(null); setOk(editId ? 'Producto actualizado en el servidor.' : 'Producto creado en el servidor.'); await prod.reload()
    } catch (ex) { setErrorAccion(ex.message) } finally { setOcupado(false) }
  }
  const confirmarInactivo = async () => {
    if (!motivo.trim()) return setErrorAccion('El motivo es obligatorio.')
    setOcupado(true); setErrorAccion('')
    try {
      await api(`/productos/${inactivar.id}`, { method: 'PUT', body: { estado: 0, motivo_inactivacion: motivo.trim() } })
      setInactivar(null); setOk('Producto inactivado en el servidor.'); await prod.reload()
    } catch (ex) { setErrorAccion(ex.message) } finally { setOcupado(false) }
  }
  const guardarCategoria = async e => {
    e.preventDefault(); setErrorAccion(''); setOk('')
    if (!nuevaCategoria.trim()) return setErrorAccion('Escribe el nombre de la categoría.')
    setOcupado(true)
    try {
      await api('/categorias', { method: 'POST', body: { nombre_categoria: nuevaCategoria.trim() } })
      setNuevaCategoria(''); setCrearCat(false); setOk('Categoría registrada en la API.'); await cat.reload()
    } catch (ex) { setErrorAccion(ex.message) } finally { setOcupado(false) }
  }
  const filtro = setter => e => { setter(e.target.value); setPagina(1) }

  return <AppLayout pagina="catalogo" ir={ir}>
    <Cabecera eyebrow="Inventario / Productos" titulo="Catálogo de productos" texto="Referencias y existencias obtenidas de la base de datos.">
      <div className="acciones"><button className="btn" onClick={() => { setCrearCat(true); setForm(null); setInactivar(null); setErrorAccion('') }}>Nueva categoría</button><button className="btn btn--primario" onClick={nuevo}><IconoMas /> Nuevo producto</button></div>
    </Cabecera>
    <div className="chips" style={{ marginBottom: 18 }}><Badge tono="verde">{productos.filter(p => p.activo).length} activos</Badge><Badge>{productos.filter(p => !p.activo).length} inactivos</Badge></div>
    {ok && <p className="exito-app" role="status">{ok}</p>}
    <Estado loading={prod.loading || cat.loading} error={prod.error || cat.error} onRetry={() => { prod.reload(); cat.reload() }}>
      <Tarjeta sinPadding className="mb">
        <div className="tarjeta__cuerpo" style={{ paddingBottom: 0 }}><div className="filtros">
          <div className="crece" style={{ position: 'relative' }}><input className="ctl" value={q} onChange={filtro(setQ)} placeholder="Buscar nombre, SKU o barras" /><span style={{ position: 'absolute', right: 10, top: 9 }}><IconoBuscar /></span></div>
          <select className="ctl" value={estado} onChange={filtro(setEstado)}><option value="todos">Todos los estados</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option></select>
          <select className="ctl" value={categoria} onChange={filtro(setCategoria)}><option value="todas">Todas las categorías</option>{categorias.map(c => <option value={c.id} key={c.id}>{c.nombre}</option>)}</select>
          <select className="ctl" value={stock} onChange={filtro(setStock)}><option value="todos">Todo el stock</option><option value="agotado">Agotado</option><option value="bajo">Bajo mínimo</option><option value="ok">Normal</option></select>
          <button className="btn" onClick={() => exportCsv('controlstock-productos.csv', ['SKU', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Precio'], filtrados.map(p => [p.sku, p.nombre, nombres[p.id_categoria] || p.categoria, p.stock, p.minimo, p.precio]))}><IconoDescargar /> Exportar CSV</button>
        </div></div>
        <div className="tabla-wrap"><table className="tabla"><thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Ubicación</th><th>Unidad</th><th>Stock</th><th>Mín.</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>{actuales.length === 0 && <tr><td colSpan="9" className="vacio">No hay productos con estos filtros.</td></tr>}{actuales.map(p => <tr key={p.id ?? p.sku}>
            <td className="mono">{p.sku}</td><td>{p.nombre}</td><td>{nombres[p.id_categoria] || p.categoria || '—'}</td><td>{p.ub || '—'}</td><td>{p.unidad}</td><td>{p.stock}</td><td>{p.minimo}</td>
            <td><Badge tono={p.activo ? 'verde' : 'gris'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge></td>
            <td><button className="enlace-fila" onClick={() => editar(p)}>Editar</button>{p.activo && <button className="enlace-fila" onClick={() => { setInactivar(p); setForm(null); setErrorAccion(''); setMotivo('') }}>Inactivar</button>}</td>
          </tr>)}</tbody></table></div>
        <div className="pie-tabla"><span>Mostrando {actuales.length} de {filtrados.length} productos</span><div className="acciones"><button className="btn" disabled={pagina <= 1} onClick={() => setPagina(n => n - 1)}>Anterior</button><span>Página {Math.min(pagina, totalPag)} de {totalPag}</span><button className="btn" disabled={pagina >= totalPag} onClick={() => setPagina(n => n + 1)}>Siguiente</button></div></div>
      </Tarjeta>
    </Estado>
    {crearCat && <Tarjeta titulo="Nueva categoría">
      <form onSubmit={guardarCategoria} className="api-form">
        <label>Nombre de categoría *<input className="ctl" maxLength="100" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} /></label>
        <div className="api-form-actions"><button className="btn btn--primario" type="submit" disabled={ocupado}>Guardar categoría</button><button className="btn" type="button" onClick={() => { setCrearCat(false); setErrorAccion('') }}>Cancelar</button></div>
      </form>{errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}
    </Tarjeta>}
    {form && <Tarjeta titulo={editId ? 'Editar producto' : 'Registrar producto'}>
      <form onSubmit={guardar}><div className="api-form">
        {[
          ['sku', 'SKU *'], ['nombre', 'Nombre *'], ['codigo_barras', 'Código de barras'],
          ['precio_costo', 'Costo COP *', 'number'], ['precio_venta', 'Venta COP *', 'number'],
          ['stock_actual', 'Stock actual *', 'number'], ['stock_minimo', 'Stock mínimo *', 'number'],
          ['unidad_medida', 'Unidad de medida *'], ['ubicacion_bodega', 'Ubicación'], ['descripcion', 'Descripción'],
        ].map(([k, label, type]) => <label key={k}>{label}<input className="ctl" type={type || 'text'} min={type ? 0 : undefined} step={type ? '0.001' : undefined} value={form[k] ?? ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} /></label>)}
        <label>Categoría *<select className="ctl" value={form.id_categoria} onChange={e => setForm(f => ({ ...f, id_categoria: e.target.value }))}><option value="">Seleccionar categoría</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
        <div className="api-form-actions"><button className="btn btn--primario" type="submit" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar producto'}</button><button type="button" className="btn" onClick={() => { setForm(null); setErrorAccion('') }}>Cancelar</button></div>
      </div>{errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}</form>
    </Tarjeta>}
    {inactivar && <Tarjeta titulo={`Inactivar ${inactivar.sku}`}><p>Se solicita una baja lógica: el historial debe conservarse en el backend.</p>
      <label className="ctl-et">Motivo obligatorio</label><input className="ctl" value={motivo} onChange={e => setMotivo(e.target.value)} />
      {errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}
      <div className="acciones" style={{ marginTop: 12 }}><button className="btn btn--peligro" disabled={ocupado} onClick={confirmarInactivo}>Confirmar inactivación</button><button className="btn" onClick={() => { setInactivar(null); setErrorAccion('') }}>Cancelar</button></div>
    </Tarjeta>}
  </AppLayout>
}
