import { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import { IconoFlecha } from '../components/Iconos'
import { api, saveSession, rememberUser, lastUser } from '../services/api'

export default function Login({ ir }) {
  const [usuario, setUsuario] = useState(lastUser)
  const [clave, setClave] = useState('')
  const [recordar, setRecordar] = useState(false)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const enviar = async (e) => {
    e.preventDefault(); setError(''); setCargando(true)
    try {
      const r = await api('/auth/login', { method: 'POST', auth: false,
        body: { correo: usuario.trim(), contrasena: clave } })
      const data = r?.data ?? r
      const token = data?.token ?? data?.accessToken ?? data?.access_token
      if (!token) throw Error('La API no devolvió un token de sesión. Hay que revisar la respuesta de /api/auth/login.')
      const u = data?.usuario ?? data?.user ?? {}
      saveSession({ token, usuario: { nombre: u.nombre ?? usuario, correo: u.correo ?? usuario,
        id_rol: u.id_rol ?? u.rol?.id_rol, rol: u.nombre_rol ?? u.rol?.nombre_rol ?? u.rol ?? '' } })
      rememberUser(recordar ? usuario.trim() : '')
      ir('panel')
    } catch (ex) { setError(ex.message) }
    finally { setCargando(false) }
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

        {error && <p className="error-app" role="alert">{error}</p>}
        <button className="boton" type="submit" disabled={cargando}><IconoFlecha /> {cargando ? "Validando..." : "Ingresar a mi espacio"}</button>
      </form>

      <hr className="separador" />

      <div className="bloque">
        <h3>Un acceso, el espacio que te corresponde</h3>
        <p>El sistema reconoce tu rol. No necesitas seleccionarlo ni solicitar permisos al ingresar.</p>
        <div className="roles">
          <small>Administrador · Cajero / Vendedor</small>
          <small>Auxiliar de Bodega</small>
        </div>
      </div>

      <div className="caja-gris">
        <strong>¿Aún no tienes cuenta?</strong>
        <p>
          Solicita al administrador tu cuenta de acceso.{' '}
          <button type="button" className="enlace enlace--naranja" onClick={() => ir('registro')}>Aquí</button>
        </p>
      </div>
    </AuthLayout>
  )
}
