import { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import CampoPassword from '../components/CampoPassword'
import { IconoFlecha, IconoVolver } from '../components/Iconos'
import { api } from '../services/api'

const claveValida = (c) => c.length >= 8 && /[A-Z]/.test(c) && /\d/.test(c)

export default function Registro({ ir }) {
  const [datos, setDatos] = useState({ nombre: '', correo: '', clave: '', confirmar: '' })
  const [errores, setErrores] = useState({})
  const [ok, setOk] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [servidorError, setServidorError] = useState('')
  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    const nuevos = {}
    if (!datos.nombre.trim()) nuevos.nombre = 'Ingresa tu nombre completo'
    if (!/^\S+@\S+\.\S+$/.test(datos.correo)) nuevos.correo = 'Ingresa un correo válido'
    if (!claveValida(datos.clave)) nuevos.clave = 'Mínimo 8 caracteres, una mayúscula y un número'
    if (datos.confirmar !== datos.clave) nuevos.confirmar = 'Las contraseñas no coinciden'
    setErrores(nuevos)
    if (Object.keys(nuevos).length === 0) {
      setCargando(true); setServidorError('')
      try {
        await api('/auth/registro', { method: 'POST', auth: false,
          body: { nombre: datos.nombre.trim(), correo: datos.correo.trim(), contrasena: datos.clave } })
        setOk(true)
      } catch (error) { setServidorError(error.message) }
      finally { setCargando(false) }
    }
  }

  return (
    <AuthLayout>
      <h2 className="titulo">Activa tu cuenta</h2>
      <p className="subtitulo">El registro solo estará disponible si el backend autoriza la creación de cuentas. En caso contrario, solicita una al administrador.</p>
      {ok && <p className="exito">Registro confirmado por el servidor. Ya puedes iniciar sesión.</p>}

      {servidorError && <p className="error-app" role="alert">{servidorError}</p>}
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

        <button className="boton" type="submit" disabled={cargando} style={{ marginTop: 20 }}><IconoFlecha /> Activar mi cuenta</button>
      </form>

      <button type="button" className="volver" onClick={() => ir('login')}><IconoVolver /> Volver a iniciar sesión</button>
    </AuthLayout>
  )
}
