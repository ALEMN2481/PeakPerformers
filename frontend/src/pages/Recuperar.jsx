import { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import { IconoFlecha, IconoVolver, IconoInfo } from '../components/Iconos'
import { api } from '../services/api'

export default function Recuperar({ ir }) {
  const [correo, setCorreo] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const enviar = async (e) => {
    e.preventDefault(); setCargando(true); setError('')
    try { await api('/auth/recuperar', { method: 'POST', auth: false, body: { correo: correo.trim() } }); setEnviado(true) }
    catch (ex) { setError(ex.message) }
    finally { setCargando(false) }
  }

  return (
    <AuthLayout>
      <h2 className="titulo">Recupera tu contraseña</h2>
      <p className="subtitulo">
        Ingresa el correo asociado a tu cuenta y te enviaremos las instrucciones para restablecer tu contraseña.
      </p>
      {enviado && <p className="exito">Solicitud aceptada por el servidor. Si la cuenta existe, recibirás las instrucciones.</p>}

      {error && <p className="error-app" role="alert">{error}</p>}
      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="correo">Correo electrónico</label>
          <input id="correo" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>
        <button className="boton" type="submit" disabled={cargando}><IconoFlecha /> Enviar instrucciones</button>
      </form>

      <p className="nota">
        <IconoInfo />
        Si el correo está registrado, recibirás un enlace para crear una nueva contraseña. Revisa también tu carpeta de correo no deseado.
      </p>

      <button type="button" className="volver" onClick={() => ir('login')}><IconoVolver /> Volver a iniciar sesión</button>

      <hr className="separador" />

      <div className="bloque">
        <h3>Un acceso, el respaldo que tu operación necesita.</h3>
        <p>El sistema reconoce tu rol. Tus permisos son definidos y autorizados por el administrador.</p>
        <small>Aviso de privacidad · Términos de uso</small>
      </div>

      <div className="caja-gris">
        <strong>¿Aún no tienes credenciales?</strong>
        <p>Solicita tu invitación al administrador del sistema. No hay registro público ni autoasignación de roles.</p>
      </div>


    </AuthLayout>
  )
}
