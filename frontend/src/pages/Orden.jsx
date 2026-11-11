import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Badge, Tarjeta, Cabecera } from '../components/ui'
import { IconoEnviar, IconoAlerta } from '../components/Iconos'

const DETALLE = [
  ['TOR-3812-G', 'Tornillo galvanizado 3/8', 300, 900],
  ['TUE-12', 'Tuerca hexagonal 1/2', 200, 400],
  ['ARA-12', 'Arandela plana 1/2', 400, 200],
]
const fmt = (n) => '$' + n.toLocaleString('es-CO')

export default function Orden({ ir }) {
  const [autorizada, setAutorizada] = useState(false)
  const [motivo, setMotivo] = useState('Reposición de referencias bajo mínimo.')
  const [error, setError] = useState('')
  const [traza, setTraza] = useState([
    ['21 oct 2026 · 09:45', 'Laura Méndez · ADM-001\nWEB-ADM-01', 'Borrador creado desde 3 excepciones'],
    ['21 oct 2026 · 09:46', 'Laura Méndez · ADM-001\nWEB-ADM-01', 'En revisión · motivo: reposición de mínimos'],
  ])
  const total = DETALLE.reduce((s, d) => s + d[2] * d[3], 0)

  const autorizar = () => {
    if (!motivo.trim()) return setError('El motivo de aprobación es obligatorio')
    // TODO: conectar con el backend (autorizar orden de compra)
    setError(''); setAutorizada(true)
    setTraza((t) => [...t, ['21 oct 2026 · 09:50', 'Laura Méndez · ADM-001\nWEB-ADM-01', `Autorizada · motivo: ${motivo.toLowerCase()}`]])
  }

  return (
    <AppLayout pagina="orden" ir={ir}>
      <Cabecera eyebrow="Operación / 21 octubre 2026" titulo="Orden de compra OC-2026-0188"
        texto="Compra consolidada de ejemplo · Fijaciones Andinas · Creada el 21 oct 2026 a las 09:45.">
      </Cabecera>
      <div className="chips" style={{ marginTop: -8, marginBottom: 18 }}>
        <Badge tono="verde" punto={false}>1 · Borrador consolidado</Badge>
        <Badge tono={autorizada ? 'verde' : 'ambar'} punto={false}>2 · {autorizada ? 'Autorizada' : 'Pendiente de autorización'}</Badge>
        <Badge tono={autorizada ? 'azul' : 'gris'} punto={false}>3 · Autorizada y enviada{autorizada ? '' : ' · sin completar'}</Badge>
      </div>

      <div className="fila-lateral">
        <div className="col">
          <Tarjeta titulo="Proveedor y entrega">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['Razón social', 'Fijaciones Andinas SAS'], ['Correo de pedidos', 'pedidos@fijacionesandinas.co'],
                ['Entregar en', 'Ferretería Central · Sede Cali · FC-01'], ['Fecha solicitada', '23 oct 2026']].map(([k, v]) => (
                <div key={k}><label className="ctl-et">{k}</label><input className="ctl" defaultValue={v} /></div>
              ))}
            </div>
            <p style={{ fontSize: 9, color: 'var(--gris)', marginTop: 12 }}>Recepción: Andrés López · Bodega FC-01 · 08:00–16:00</p>
          </Tarjeta>

          <Tarjeta titulo="Detalle de compra" sinPadding>
            <table className="tabla">
              <thead><tr><th>SKU / producto</th><th>Cantidad</th><th>Costo unitario</th><th>Subtotal COP</th></tr></thead>
              <tbody>
                {DETALLE.map(([sku, nombre, cant, costo]) => (
                  <tr key={sku}>
                    <td><strong className="mono" style={{ fontSize: 10 }}>{sku}</strong><br /><strong>{nombre}</strong></td>
                    <td>{cant} un.</td><td>{fmt(costo)}</td><td>{fmt(cant * costo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px 6px' }}>
              <strong style={{ fontSize: 11 }}>3 referencias · 900 unidades</strong>
              <strong style={{ fontSize: 18 }}>{fmt(total)} COP</strong>
            </div>
            <p style={{ fontSize: 9, color: 'var(--gris)', padding: '0 18px 16px' }}>Total de cantidades × costo. Sin impuestos adicionales en este ejemplo.</p>
          </Tarjeta>

          <Tarjeta titulo="Trazabilidad de la orden" sinPadding>
            <table className="tabla">
              <thead><tr><th>Fecha / hora</th><th>Actor / dispositivo</th><th>Evento</th></tr></thead>
              <tbody>
                {traza.map(([f, a, e]) => (
                  <tr key={f + e}>
                    <td><strong>{f}</strong></td>
                    <td style={{ whiteSpace: 'pre-line', color: 'var(--gris)' }}>{a}</td>
                    <td style={{ color: 'var(--gris)' }}>{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>
        </div>

        <div className="col">
          <Tarjeta titulo="Autorización administrativa">
            <Badge tono={autorizada ? 'verde' : 'ambar'} punto={false}>{autorizada ? 'Autorizada' : 'Aún no autorizada'}</Badge>
            <div className="campo-app" style={{ marginTop: 14 }}>
              <label className="ctl-et">Motivo de aprobación *</label>
              <input className="ctl" value={motivo} disabled={autorizada} onChange={(e) => setMotivo(e.target.value)} />
              {error && <p className="error-app">{error}</p>}
            </div>
            <div className="aviso" style={{ marginBottom: 14 }}>
              <IconoAlerta />
              <div>
                <strong>Sin envío al proveedor</strong>
                Autorizar registra el evento y habilita el envío formal. Esta orden todavía no admite recepción.
              </div>
            </div>
            <button className="btn btn--primario" disabled={autorizada} onClick={autorizar}><IconoEnviar /> Autorizar y enviar orden</button>
            <button className="btn btn--ancho" style={{ marginTop: 10 }} onClick={() => ir('reabastecimiento')}>Volver al borrador</button>
          </Tarjeta>

          <Tarjeta titulo="Vista previa de notificación">
            <p style={{ fontSize: 10, color: 'var(--gris)', marginBottom: 12 }}>PARA: pedidos@fijacionesandinas.co</p>
            <strong style={{ fontSize: 11 }}>Solicitud de compra · OC-2026-0188</strong>
            <p style={{ fontSize: 10, color: '#4b5560', lineHeight: 1.6, margin: '12px 0' }}>
              Ferretería Central solicita 3 referencias por {fmt(total)} COP. Entrega requerida: 23 oct 2026, bodega FC-01.
            </p>
            <p style={{ fontSize: 10, color: '#4b5560', marginBottom: 12 }}>Adjunto: OC-2026-0188.pdf</p>
            <Badge>Vista previa · No enviada</Badge>
          </Tarjeta>
        </div>
      </div>
    </AppLayout>
  )
}
