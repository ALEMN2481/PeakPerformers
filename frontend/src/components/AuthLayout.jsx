import { IconoLogo, IconoCaja, IconoEscudo, IconoLista } from './Iconos'

const FEATURES = {
  historial: [[IconoCaja, 'Stock preciso'], [IconoLista, 'Historial completo'], [IconoEscudo, 'Acceso por rol']],
}

export default function AuthLayout({ variante = 'historial', children }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <div className="marca">
          <span className="marca__logo"><IconoLogo /></span>
          PeakPerformers
        </div>

        <div className="panel__centro">
          <p className="eyebrow">
            Control de inventario para tu negocio
          </p>
          <h1 className="panel__titulo">
            Cada pieza cuenta.<br />Cada movimiento,<br />bajo control.
          </h1>
          <p className="panel__texto">
            La operación de tu inventario, desde el mostrador hasta el último estante.
          </p>
          <div className="features">
            {FEATURES[variante].map(([Icono, texto]) => (
              <div className="feature" key={texto}><Icono />{texto}</div>
            ))}
          </div>
        </div>

        <p className="panel__pie">PeakPerformers · Gestión de inventarios</p>
      </aside>

      <main className="auth__main">
        <div className="auth__caja">{children}</div>
      </main>
    </div>
  )
}
