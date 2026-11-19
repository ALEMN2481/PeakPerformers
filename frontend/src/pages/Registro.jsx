import AuthLayout from '../components/AuthLayout'
export default function Registro({ ir }) {
  return <AuthLayout><h2 className="titulo">Creación de cuentas</h2><p className="subtitulo">PeakPerformers no permite registro público. Solicita una cuenta al responsable del sistema. No existe registro público de usuarios.</p><button className="boton" onClick={() => ir('login')}>Volver al inicio de sesión</button></AuthLayout>
}
