import { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import { IconoFlecha } from '../components/Iconos'

export default function Login({ ir }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [recordar, setRecordar] = useState(false)

  const enviar = (e) => {
    e.preventDefault()
    // TODO: conectar con el backend (POST /api/auth/login)
    ir('panel')
    console.log('Login', { usuario, recordar })
  }

  return (
    <AuthLayout variante="bodega">
      <h2 className="titulo">Bienvenido a ControlStock</h2>
      <p className="subtitulo">Ingresa con las credenciales asignadas por tu administrador.</p>

      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="usuario">Correo o nombre de usuario</label>
          <input id="usuario" type="text" value={usuario} required autoComplete="username"
            onChange={(e) => setUsuario(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" value={clave} required autoComplete="current-password"
            onChange={(e) => setClave(e.target.value)} />
        </div>

        <div className="fila">
          <label className="check">
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
            Recordar usuario
          </label>
          <button type="button" className="enlace" onClick={() => ir('recuperar')}>Recuperar contraseña</button>
        </div>

        <button className="boton" type="submit"><IconoFlecha /> Ingresar a mi espacio</button>
      </form>

      <hr className="separador" />

      <div className="bloque">
        <h3>Un acceso, el espacio que te corresponde</h3>
        <p>El sistema reconoce tu rol. No necesitas seleccionarlo ni solicitar permisos al ingresar.</p>
        <div className="roles">
          <small>Administrador · Cajero / Vendedor</small>
          <small>Proveedor</small>
        </div>
      </div>

      <div className="caja-gris">
        <strong>¿Aún no tienes cuenta?</strong>
        <p>
          Realiza tu registro al administrador de Ferretería Central.{' '}
          <button type="button" className="enlace enlace--naranja" onClick={() => ir('registro')}>Aquí</button>
        </p>
      </div>
    </AuthLayout>
  )
}
