import AuthLayout from '../components/AuthLayout'
export default function Recuperar({ ir }) {
  return <AuthLayout><h2 className="titulo">Restablecimiento de contraseña</h2><p className="subtitulo">El backend actual no envía correos de recuperación. Contacta al administrador para que te asigne una contraseña nueva de manera segura.</p><button className="boton" onClick={() => ir('login')}>Volver al inicio de sesión</button></AuthLayout>
}
