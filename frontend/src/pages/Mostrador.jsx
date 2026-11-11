import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera } from '../components/ui'
import { IconoBuscar, IconoMas, IconoEnviar, IconoImpresora, IconoClip } from '../components/Iconos'
import { cop } from '../utils'

const PRODUCTOS = [
  { sku: 'TOR-3812-G', nombre: 'Tornillo galvanizado 3/8" × 1 1/2" · UNC 16', ub: 'A-02 / E-03', stock: 0, precio: 1400 },
  { sku: 'TOR-3812', nombre: 'Tornillo zincado 3/8" × 1 1/2" · UNC 16', ub: 'A-02 / E-03', stock: 240, precio: 1200 },
  { sku: 'TOR-3820', nombre: 'Tornillo zincado 3/8" × 2" · UNC 16', ub: 'A-02 / E-04', stock: 380, precio: 1600 },
  { sku: 'TOR-M1040', nombre: 'Tornillo métrico M10 × 40 mm · paso 1,5', ub: 'A-03 / E-01', stock: 180, precio: 1500 },
]
const LINEAS_INICIO = [
  { sku: 'TOR-3812', nombre: 'Tornillo zincado 3/8" × 1 1/2"', cant: 24, precio: 1200 },
  { sku: 'TUE-38', nombre: 'Tuerca hexagonal UNC 3/8"', cant: 24, precio: 450 },
  { sku: 'ARA-38', nombre: 'Arandela plana 3/8"', cant: 48, precio: 200 },
]

export default function Mostrador({ ir }) {
  const [consulta, setConsulta] = useState('tornillo')
  const [lineas, setLineas] = useState(LINEAS_INICIO)

  const palabras = consulta.toLowerCase().split(/\s+/).filter(Boolean)
  const resultados = PRODUCTOS.filter((p) => {
    const texto = `${p.sku} ${p.nombre}`.toLowerCase()
    return palabras.every((w) => texto.includes(w))
  })

  const agregar = (p) =>
    setLineas((ls) => {
      const existe = ls.find((l) => l.sku === p.sku)
      if (existe) return ls.map((l) => (l.sku === p.sku ? { ...l, cant: l.cant + 1 } : l))
      return [...ls, { sku: p.sku, nombre: p.nombre.split(' · ')[0], cant: 1, precio: p.precio }]
    })

  const total = lineas.reduce((s, l) => s + l.cant * l.precio, 0)
  const unidades = lineas.reduce((s, l) => s + l.cant, 0)

  return (
    <AppLayout pagina="mostrador" ir={ir}>
      <Cabecera eyebrow="Venta y despacho / Caja 02" titulo="Mostrador"
        texto="Consulta técnica, existencias y comandas de bodega.">
        <button className="btn btn--primario"><IconoMas /> Nueva comanda</button>
      </Cabecera>

      <div className="fila-lateral">
        <div className="col">
          <div>
            <div style={{ position: 'relative' }}>
              <input className="ctl" style={{ height: 44, paddingLeft: 40, fontSize: 13 }} value={consulta}
                onChange={(e) => setConsulta(e.target.value)} placeholder="Buscar por SKU, barras o medida" />
              <span style={{ position: 'absolute', left: 14, top: 14, color: '#6b7680', display: 'grid' }}>
                <IconoBuscar />
              </span>
              <span className="badge badge--gris" style={{ position: 'absolute', right: 12, top: 13 }}>F2</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--gris)', margin: '8px 0 12px' }}>
              SKU, barras, fracciones de pulgada, milímetros o calibre. Ej.: 3/8" · 8 mm · cal. 12
            </p>
            <div className="acciones" style={{ alignItems: 'center' }}>
              <select className="ctl"><option>Fijaciones</option></select>
              <select className="ctl"><option>Todas las ubicaciones</option></select>
              <Badge tono="gris">{resultados.length} resultados</Badge>
            </div>
          </div>

          <Tarjeta titulo="Resultados" derecha="Precio de venta · COP / unidad" sinPadding>
            <div className="tabla-wrap">
              <table className="tabla">
                <thead><tr><th>Producto</th><th>Ubicación</th><th>Stock</th><th>Precio</th><th>Acción</th></tr></thead>
                <tbody>
                  {resultados.length === 0 && <tr><td colSpan="5" className="vacio">Sin resultados para esa búsqueda.</td></tr>}
                  {resultados.map((p) => (
                    <tr key={p.sku}>
                      <td><span className="mono">{p.sku}</span> · {p.nombre}</td>
                      <td>{p.ub}</td><td>{p.stock}</td><td>{cop(p.precio)}</td>
                      <td>
                        {p.stock === 0
                          ? <Badge tono="rojo">Agotado</Badge>
                          : <button className="enlace-fila" onClick={() => agregar(p)}>+ Agregar</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>

          <Tarjeta titulo="Equivalencia técnica del producto agotado" derecha="TOR-3812-G">
            <div className="aviso aviso--azul" style={{ marginBottom: 14 }}>
              <IconoClip />
              <div>
                <strong>Compatibilidad dimensional verificada</strong>
                Mismo diámetro, largo y rosca. El acabado cambia de galvanizado a zincado; confirma el uso interior con el cliente.
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              {[['Diámetro', '3/8" · 9,53 mm'], ['Largo', '1 1/2" · 38,1 mm'], ['Rosca', 'UNC · 16 hilos/pulg.']].map(([k, v]) => (
                <div key={k} style={{ background: '#f4f5f7', borderRadius: 4, padding: '10px 12px' }}>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', color: '#6b7680', marginBottom: 6 }}>{k}</p>
                  <strong style={{ fontSize: 12 }}>{v}</strong>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 12 }}>TOR-3812 · Tornillo hexagonal zincado</strong>
                <p style={{ fontSize: 10, color: 'var(--gris)', marginTop: 4 }}>240 un. · A-02 / E-03 · $1.200 / un</p>
              </div>
              <button className="btn" onClick={() => agregar(PRODUCTOS[1])}><IconoMas /> Agregar equivalente</button>
            </div>
            <p style={{ fontSize: 9, color: 'var(--gris)', marginTop: 12 }}>
              M10 no es equivalente: su paso métrico no sustituye la rosca UNC 16.
            </p>
          </Tarjeta>
        </div>

        <div className="col">
          <Tarjeta titulo="CMD-1048" derecha="Caja 02">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Badge tono="ambar">Pendiente</Badge><span style={{ fontSize: 10, color: 'var(--gris)' }}>21 oct · 09:42</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--gris)', marginBottom: 14 }}>Cliente: Constructora Rivera · Vendedor: Carlos Ruiz · U-014</p>
            {lineas.map((l) => (
              <div key={l.sku} style={{ borderTop: '1px solid #eef0f2', padding: '10px 0' }}>
                <span className="mono" style={{ fontSize: 9, color: 'var(--gris)' }}>{l.sku}</span>
                <p style={{ fontSize: 11, fontWeight: 600, margin: '3px 0' }}>{l.nombre}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gris)' }}>
                  <span>{l.cant} un × {cop(l.precio)}</span>
                  <strong className="mono" style={{ color: 'var(--texto)' }}>{cop(l.cant * l.precio)}</strong>
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #eef0f2', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gris)' }}>
              <span>{lineas.length} líneas · {unidades} unidades</span><span>COP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 16px' }}>
              <strong style={{ fontSize: 13 }}>Total</strong>
              <strong className="mono" style={{ fontSize: 20 }}>{cop(total)}</strong>
            </div>
            <div className="aviso aviso--verde" style={{ marginBottom: 12 }}>
              <IconoEnviar />
              <div><strong>Enviada a bodega · 09:42</strong>En espera de que un auxiliar inicie el alistamiento.</div>
            </div>
            <button className="btn btn--ancho" disabled style={{ marginBottom: 8 }}><IconoEnviar /> Enviar a bodega</button>
            <button className="btn btn--ancho"><IconoImpresora /> Reimprimir comanda</button>
          </Tarjeta>

          <Tarjeta titulo="Seguimiento de bodega">
            <ul className="lista-pasos">
              <li className="on"><span>1</span>Pendiente · 09:42</li>
              <li><span>2</span>En preparación</li>
              <li><span>3</span>Despachado</li>
            </ul>
          </Tarjeta>
        </div>
      </div>
    </AppLayout>
  )
}
