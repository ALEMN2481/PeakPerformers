import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera } from '../components/ui'
import { IconoDescargar, IconoAlerta, IconoCaja } from '../components/Iconos'

const MOVS = [
  { id: 'MOV-00842', hora: '09:10', tipo: 'Entrada', doc: 'OC-2026-0186', producto: 'BRO-HSS08', cant: '+10 unidades', resp: 'Andrés López · BOD-003',
    docDetalle: 'OC-2026-0186 / REM-5780', fecha: '21 oct 2026 · 09:10:08', disp: 'BOD-MOB-01', motivo: 'Recepción física de 10 brocas HSS 8 mm.' },
  { id: 'MOV-00841', hora: '08:52', tipo: 'Salida', doc: 'CMD-1041', producto: 'CAB-TH12', cant: '−15 metros', resp: 'Andrés López · BOD-003',
    docDetalle: 'CMD-1041', fecha: '21 oct 2026 · 08:52:31', disp: 'BOD-MOB-01', motivo: 'Despacho de comanda a mostrador.' },
  { id: 'MOV-00840', hora: '08:35', tipo: 'Entrada', doc: 'OC-2026-0185', producto: 'ARA-38', cant: '+500 unidades', resp: 'Andrés López · BOD-003',
    docDetalle: 'OC-2026-0185 / REM-5771', fecha: '21 oct 2026 · 08:35:44', disp: 'BOD-MOB-01', motivo: 'Recepción física de 500 arandelas planas 3/8".' },
]
const ESPERADO = [['TOR-3812', 'A-02 / E-03', 300], ['TUE-38', 'A-02 / E-04', 200], ['ARA-38', 'A-02 / E-05', 400]]

export default function Movimientos({ ir }) {
  const [tipo, setTipo] = useState('todos')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(MOVS[0].id)
  const [recibido, setRecibido] = useState({ 'TOR-3812': 200, 'TUE-38': 200, 'ARA-38': 400 })
  const [doc, setDoc] = useState('REM-FA-5821')
  const [motivo, setMotivo] = useState('Entrega parcial; 100 tornillos pendientes por completar.')
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')

  const visibles = MOVS.filter((m) =>
    (tipo === 'todos' || m.tipo === tipo) &&
    `${m.id} ${m.doc} ${m.producto}`.toLowerCase().includes(q.toLowerCase()))
  const detalle = MOVS.find((m) => m.id === sel) ?? MOVS[0]

  const pendientes = ESPERADO.filter(([sku, , esp]) => esp - (recibido[sku] ?? 0) > 0)
  const resumen = ESPERADO.map(([sku]) => `${recibido[sku] ?? 0} ${sku}`).join(', ')
  const total = ESPERADO.reduce((s, [sku]) => s + (recibido[sku] ?? 0), 0)

  const guardar = () => {
    if (!doc.trim() || !motivo.trim()) return setError('El documento de entrega y el motivo son obligatorios')
    // TODO: conectar con el backend (registrar entrada de stock, movimiento inmutable)
    setError(''); setGuardado(true)
  }

  return (
    <AppLayout pagina="movimientos" ir={ir}>
      <Cabecera eyebrow="Operación / 21 octubre 2026" titulo="Movimientos y recepción de compra"
        texto="Consulta entradas y salidas; registra únicamente mercancía recibida físicamente." />

      <Tarjeta sinPadding>
        <div className="tarjeta__cuerpo" style={{ paddingBottom: 12 }}>
          <div className="filtros" style={{ marginBottom: 0 }}>
            <div className="crece"><label className="ctl-et">Periodo</label><input className="ctl" defaultValue="21 oct 2026 – 21 oct 2026" /></div>
            <div className="crece"><label className="ctl-et">Tipo de movimiento</label>
              <select className="ctl" style={{ width: '100%' }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="todos">Todos</option><option>Entrada</option><option>Salida</option>
              </select></div>
            <div className="crece"><label className="ctl-et">Buscar</label>
              <input className="ctl" placeholder="SKU, documento o evento" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <button className="btn"><IconoDescargar /> Exportar</button>
          </div>
        </div>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead><tr><th>Evento / hora</th><th>Tipo / documento</th><th>Producto</th><th>Cantidad base</th><th>Responsable</th></tr></thead>
            <tbody>
              {visibles.length === 0 && <tr><td colSpan="5" className="vacio">Sin movimientos para ese filtro.</td></tr>}
              {visibles.map((m) => (
                <tr key={m.id} className={`click ${m.id === sel ? 'sel' : ''}`} onClick={() => setSel(m.id)}>
                  <td><strong className="mono">{m.id} · {m.hora}</strong></td>
                  <td>{m.tipo} · {m.doc}</td><td className="mono">{m.producto}</td><td>{m.cant}</td><td>{m.resp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      <div className="fila-lateral" style={{ marginTop: 16, gridTemplateColumns: '1fr 280px' }}>
        <Tarjeta titulo="Recibir OC-2026-0187">
          <p style={{ fontSize: 10, color: 'var(--gris)', marginBottom: 10 }}>Fijaciones Andinas · Autorizada y enviada el 20 oct 2026</p>
          <div className="chips" style={{ marginTop: 0, marginBottom: 16 }}>
            <Badge tono="ambar" punto={false}>Pendiente de recepción</Badge>
            <Badge punto={false}>{guardado ? 'Entrada guardada' : 'Entrada aún no guardada'}</Badge>
          </div>
          {guardado && <p className="exito-app">Entrada registrada: {total} unidades sumadas al stock.</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div><label className="ctl-et">Documento de entrega *</label><input className="ctl" value={doc} onChange={(e) => setDoc(e.target.value)} /></div>
            <div><label className="ctl-et">Fecha de recepción *</label><input className="ctl" defaultValue="21 oct 2026 · 10:10" /></div>
          </div>

          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>SKU / ubicación</th><th>Esperado</th><th>Recibido hoy</th><th>Pendiente</th></tr></thead>
              <tbody>
                {ESPERADO.map(([sku, ub, esp]) => (
                  <tr key={sku}>
                    <td><strong className="mono">{sku} · {ub}</strong></td>
                    <td>{esp} un.</td>
                    <td>
                      <input className="ctl ctl--num" type="number" min="0" max={esp} disabled={guardado} value={recibido[sku]}
                        onChange={(e) => setRecibido({ ...recibido, [sku]: Math.min(esp, Math.max(0, Number(e.target.value))) })} />
                    </td>
                    <td>{esp - (recibido[sku] ?? 0)} un.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 9, color: 'var(--gris)', margin: '12px 0 14px' }}>
            Cantidades recibidas editables en unidades base · {total} de 900 unidades.
          </p>

          <label className="ctl-et">Motivo / observación *</label>
          <input className="ctl" value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={guardado} />
          {error && <p className="error-app">{error}</p>}

          <div className="aviso" style={{ margin: '16px 0' }}>
            <IconoAlerta />
            <div>
              <strong>{pendientes.length ? 'La orden quedará parcialmente recibida' : 'La orden quedará completamente recibida'}</strong>
              {pendientes.length
                ? `Guardar suma solo ${resumen} al stock. El saldo de ${pendientes.map(([sku, , esp]) => `${esp - recibido[sku]} ${sku}`).join(', ')} seguirá abierto.`
                : `Guardar suma ${resumen} al stock y cierra la orden.`}
            </div>
          </div>
          <div className="acciones">
            <button className="btn btn--primario" disabled={guardado} onClick={guardar}><IconoCaja /> Guardar entrada de stock</button>
            <button className="btn" onClick={() => { setGuardado(false); setError('') }}>Cancelar</button>
          </div>
        </Tarjeta>

        <Tarjeta titulo={`Detalle de ${detalle.id}`}>
          <Badge tono={detalle.tipo === 'Entrada' ? 'verde' : 'azul'} punto={false}>{detalle.tipo} registrada</Badge>
          <p style={{ fontSize: 11, margin: '14px 0 10px' }}><strong>{detalle.producto} · {detalle.cant}</strong></p>
          <div className="kv">
            Documento: {detalle.docDetalle}<br />
            Actor: {detalle.resp}<br />
            Fecha: {detalle.fecha}<br />
            Dispositivo: {detalle.disp}<br />
            Motivo: {detalle.motivo}
          </div>
          <p style={{ fontSize: 9, color: 'var(--gris)', marginTop: 14 }}>
            Registro inmutable · Las correcciones requieren un nuevo movimiento con motivo.
          </p>
        </Tarjeta>
      </div>
    </AppLayout>
  )
}
