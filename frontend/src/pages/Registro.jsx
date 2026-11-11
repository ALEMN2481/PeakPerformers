import { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import CampoPassword from '../components/CampoPassword'
import { IconoFlecha, IconoVolver } from '../components/Iconos'

const claveValida = (c) => c.length >= 8 && /[A-Z]/.test(c) && /\d/.test(c)

export default function Registro({ ir }) {
  const [datos, setDatos] = useState({ nombre: '', correo: '', clave: '', confirmar: '' })
  const [errores, setErrores] = useState({})
  const [ok, setOk] = useState(false)
  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value })

  const enviar = (e) => {
    e.preventDefault()
    const nuevos = {}
    if (!datos.nombre.trim()) nuevos.nombre = 'Ingresa tu nombre completo'
    if (!/^\S+@\S+\.\S+$/.test(datos.correo)) nuevos.correo = 'Ingresa un correo válido'
    if (!claveValida(datos.clave)) nuevos.clave = 'Mínimo 8 caracteres, una mayúscula y un número'
    if (datos.confirmar !== datos.clave) nuevos.confirmar = 'Las contraseñas no coinciden'
    setErrores(nuevos)
    if (Object.keys(nuevos).length === 0) {
      // TODO: conectar con el backend (POST /api/auth/registro)
      setOk(true)
    }
  }

  return (
    <AuthLayout>
      <h2 className="titulo">Activa tu cuenta</h2>
      <p className="subtitulo">Completa tus datos para empezar a usar ControlStock.</p>
      {ok && <p className="exito">Datos válidos. Falta conectar con el servidor para activar la cuenta.</p>}

      <form onSubmit={enviar} noValidate>
        <div className={`campo ${errores.nombre ? 'campo--error' : ''}`}>
          <label htmlFor="nombre">Nombre completo</label>
          <input id="nombre" type="text" placeholder="Ana Martínez" value={datos.nombre} onChange={cambiar('nombre')} />
          {errores.nombre && <p className="campo__error">{errores.nombre}</p>}
        </div>
        <div className={`campo ${errores.correo ? 'campo--error' : ''}`}>
          <label htmlFor="correo">Correo electrónico</label>
          <input id="correo" type="email" placeholder="ana.martinez@ferreteriacentral.com" value={datos.correo} onChange={cambiar('correo')} />
          {errores.correo && <p className="campo__error">{errores.correo}</p>}
        </div>
        <CampoPassword id="clave" etiqueta="Contraseña" value={datos.clave} onChange={cambiar('clave')}
          ayuda="Usa al menos 8 caracteres, una mayúscula y un número." error={errores.clave} />
        <CampoPassword id="confirmar" etiqueta="Confirmar contraseña" value={datos.confirmar}
          onChange={cambiar('confirmar')} error={errores.confirmar} />

        <button className="boton" type="submit" style={{ marginTop: 20 }}><IconoFlecha /> Activar mi cuenta</button>
      </form>

      <button type="button" className="volver" onClick={() => ir('login')}><IconoVolver /> Volver a iniciar sesión</button>
    </AuthLayout>
  )
}
