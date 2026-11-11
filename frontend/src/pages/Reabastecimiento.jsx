import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera, Stat } from '../components/ui'
import { IconoFlecha, IconoClip } from '../components/Iconos'
import { cop, num } from '../utils'

const INICIO = [
  ['TOR-3812-G', 'Tornillo galvanizado 3/8', 'Fijaciones Andinas', 0, 100, 'un.', 900, 300, true],
  ['TUE-12', 'Tuerca hexagonal 1/2', 'Fijaciones Andinas', 20, 100, 'un.', 400, 200, true],
  ['ARA-12', 'Arandela plana 1/2', 'Fijaciones Andinas', 40, 200, 'un.', 200, 400, true],
  ['BRO-HSS08', 'Broca HSS 8 mm', 'Herramientas Bogotá', 12, 20, 'un.', 4500, 20, false],
  ['CAB-TH12', 'Cable THHN calibre 12', 'Electroinsumos SAS', 85, 100, 'm', 3200, 100, false],
  ['LIJ-080', 'Lija al agua grano 80', 'Abrasivos del Centro', 0, 10, 'hojas', 600, 30, false],
].map(([sku, nombre, prov, stock, minimo, unidad, costo, pedir, sel]) =>
  ({ sku, nombre, prov, stock, minimo, unidad, costo, pedir, sel }))

export default function Reabastecimiento({ ir }) {
  const [items, setItems] = useState(INICIO)
  const [q, setQ] = useState('')
  const [excepcion, setExcepcion] = useState('todas')
  const [proveedor, setProveedor] = useState('todos')

  const cambiar = (sku, cambios) => setItems((is) => is.map((i) => (i.sku === sku ? { ...i, ...cambios } : i)))
  const visibles = items.filter((i) => {
    if (q && !`${i.sku} ${i.nombre}`.toLowerCase().includes(q.toLowerCase())) return false
    if (excepcion === 'agotado' && i.stock !== 0) return false
    if (excepcion === 'bajo' && i.stock === 0) return false
    if (proveedor !== 'todos' && i.prov !== proveedor) return false
    return true
  })

  const seleccion = items.filter((i) => i.sel)
  const grupos = Object.entries(
    seleccion.reduce((acc, i) => ({ ...acc, [i.prov]: [...(acc[i.prov] || []), i] }), {}),
  )
  const provs = [...new Set(items.map((i) => i.prov))]

  return (
    <AppLayout pagina="reabastecimiento" ir={ir}>
      <Cabecera eyebrow="Operación / 21 octubre 2026" titulo="Reabastecimiento"
        texto="Excepciones detectadas por stock mínimo y agotados. Revisa cantidades antes de consolidar." />

      <div className="stats stats--3">
        <Stat etiqueta="Productos con atención" valor="24"><small>18 bajo mínimo · 6 agotados</small></Stat>
        <Stat etiqueta="Compras por autorizar" valor="3"><small>Total contextual: $3.612.000 COP</small></Stat>
        <Stat etiqueta="Selección actual" valor={`${seleccion.length} referencias`}>
          <small>
            {grupos.length === 0 ? 'Nada seleccionado' : grupos.length === 1 ? `Un proveedor · ${grupos[0][0]}` : `${grupos.length} proveedores`}
          </small>
        </Stat>
      </div>

      <Tarjeta titulo="Existencias que requieren atención">
        <div className="filtros">
          <div className="crece">
            <label className="ctl-et">Buscar referencia</label>
            <input className="ctl" placeholder="SKU, nombre o medida ferretera" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="crece">
            <label className="ctl-et">Excepción</label>
            <select className="ctl" style={{ width: '100%' }} value={excepcion} onChange={(e) => setExcepcion(e.target.value)}>
              <option value="todas">Todas</option><option value="agotado">Agotados</option><option value="bajo">Bajo mínimo</option>
            </select>
          </div>
          <div className="crece">
            <label className="ctl-et">Proveedor</label>
            <select className="ctl" style={{ width: '100%' }} value={proveedor} onChange={(e) => setProveedor(e.target.value)}>
              <option value="todos">Todos</option>{provs.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="tabla-wrap">
          <table className="tabla">
            <thead><tr><th>Selección / referencia</th><th>Proveedor</th><th>Stock / mínimo</th><th>Faltante al mínimo</th><th>Cantidad a pedir</th><th>Estado</th></tr></thead>
            <tbody>
              {visibles.length === 0 && <tr><td colSpan="6" className="vacio">No hay referencias con esos filtros.</td></tr>}
              {visibles.map((i) => (
                <tr key={i.sku}>
                  <td>
                    <label style={{ display: 'flex', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={i.sel} onChange={(e) => cambiar(i.sku, { sel: e.target.checked })} style={{ accentColor: 'var(--naranja)' }} />
                      <span><strong className="mono" style={{ fontSize: 10 }}>{i.sku}</strong><br />{i.nombre}</span>
                    </label>
                  </td>
                  <td>{i.prov}</td>
                  <td>{i.stock} / {i.minimo} {i.unidad}</td>
                  <td>{i.minimo - i.stock} {i.unidad}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input className="ctl ctl--num" type="number" min="0" value={i.pedir}
                        onChange={(e) => cambiar(i.sku, { pedir: Math.max(0, Number(e.target.value)) })} />
                      <span style={{ fontSize: 10, color: 'var(--gris)' }}>{i.unidad}</span>
                    </div>
                  </td>
                  <td><Badge tono={i.stock === 0 ? 'rojo' : 'ambar'} punto={false}>{i.stock === 0 ? 'Agotado' : 'Bajo mínimo'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pie-tabla" style={{ padding: '14px 0 0' }}>
          <span>Mostrando {visibles.length} de 24 referencias · Ajusta la cantidad a pedir en cada campo.</span>
          <button className="btn">Siguiente <IconoFlecha /></button>
        </div>
      </Tarjeta>

      <div style={{ marginTop: 16 }}>
        <Tarjeta titulo="Consolidación por proveedor">
          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>Proveedor</th><th>Referencias</th><th>Unidades</th><th>Subtotal COP</th></tr></thead>
              <tbody>
                {grupos.length === 0 && <tr><td colSpan="4" className="vacio">Selecciona referencias para consolidar.</td></tr>}
                {grupos.map(([prov, lista]) => (
                  <tr key={prov}>
                    <td><strong>{prov}</strong></td>
                    <td>{lista.length} seleccionadas</td>
                    <td>{num(lista.reduce((s, i) => s + i.pedir, 0))}</td>
                    <td>{cop(lista.reduce((s, i) => s + i.pedir * i.costo, 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {grupos.map(([prov, lista]) => (
            <p key={prov} style={{ fontSize: 10, color: 'var(--gris)', marginTop: 12 }}>
              {lista.map((i) => `${num(i.pedir)} × ${cop(i.costo)}`).join(' + ')} = {cop(lista.reduce((s, i) => s + i.pedir * i.costo, 0))} COP
            </p>
          ))}
          <div className="acciones" style={{ marginTop: 16 }}>
            <button className="btn btn--primario" disabled={seleccion.length === 0} onClick={() => ir('orden')}>
              <IconoClip /> Consolidar en orden de compra
            </button>
            <button className="btn" onClick={() => setItems((is) => is.map((i) => ({ ...i, sel: false })))}>Limpiar selección</button>
          </div>
        </Tarjeta>
      </div>
    </AppLayout>
  )
}
