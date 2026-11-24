import { useState } from 'react'
import { Tarjeta } from './ui'
import Estado from './Estado'
import { useApiList } from '../hooks/useApiList'
import { api } from '../services/api'

export default function FichaTecnica({ producto, cerrar, soloLectura = false }) {
  const { items, loading, error, reload } = useApiList(`/productos/${producto.id}/especificaciones`, ['especificaciones'])
  const [campos, setCampos] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')
  const [ok, setOk] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const detalles = campos ?? items
  const guardar = async e => {
    e.preventDefault(); if (soloLectura) return; setErrorAccion(''); setOk(''); setOcupado(true)
    try {
      await api(`/productos/${producto.id}/especificaciones`, { method: 'PUT',
        body: { especificaciones: detalles.map(x => ({ atributo: x.atributo.trim(), valor: x.valor.trim() })) } })
      setOk('Ficha técnica actualizada en MariaDB.'); setCampos(null); await reload()
    } catch (ex) { setErrorAccion(ex.message) } finally { setOcupado(false) }
  }
  return <div style={{ marginTop: 18 }}><Tarjeta titulo={`Ficha técnica: ${producto.sku}`}>
    <p style={{ fontSize: 12, color: 'var(--gris)' }}>{soloLectura ? 'Consulta de características del producto. Solo el Administrador puede modificar la ficha técnica.' : 'Material, medidas, presentación y otras características del producto. Requiere la migración de especificaciones.'}</p>
    <Estado loading={loading} error={error} onRetry={reload}>
      <form onSubmit={guardar} className="api-form">
        {detalles.map((d, i) => <div key={i} className="filtros">
          <label className="crece">Atributo<input className="ctl" maxLength="60" disabled={soloLectura} required value={d.atributo} onChange={e => setCampos(ds => (ds ?? items).map((v,j) => j === i ? { ...v, atributo: e.target.value } : v))} /></label>
          <label className="crece">Valor<input className="ctl" maxLength="255" disabled={soloLectura} value={d.valor} onChange={e => setCampos(ds => (ds ?? items).map((v,j) => j === i ? { ...v, valor: e.target.value } : v))} /></label>
          {!soloLectura && <button type="button" className="btn" onClick={() => setCampos(ds => (ds ?? items).filter((_,j)=> j !== i))}>Quitar</button>}
        </div>)}
        <div className="acciones">
          {!soloLectura && <button type="button" className="btn" onClick={() => setCampos(ds => [...(ds ?? items), { atributo: '', valor: '' }])}>+ Especificación</button>}
          {!soloLectura && <button className="btn btn--primario" disabled={ocupado} type="submit">Guardar ficha técnica</button>}
          <button className="btn" type="button" onClick={cerrar}>Cerrar</button>
        </div>
        {ok && <p className="exito-app" role="status">{ok}</p>}{errorAccion && <p className="error-app" role="alert">{errorAccion}</p>}
      </form>
    </Estado>
  </Tarjeta></div>
}
