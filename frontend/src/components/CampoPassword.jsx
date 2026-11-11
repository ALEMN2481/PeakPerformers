import { useState } from 'react'
import { IconoOjo } from './Iconos'

export default function CampoPassword({ id, etiqueta, ayuda, error, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={`campo ${error ? 'campo--error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="campo__input">
        <input id={id} type={visible ? 'text' : 'password'} {...props} />
        <button type="button" className="ojo" onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          <IconoOjo tachado={!visible} />
        </button>
      </div>
      {error ? <p className="campo__error">{error}</p> : ayuda && <p className="campo__ayuda">{ayuda}</p>}
    </div>
  )
}
