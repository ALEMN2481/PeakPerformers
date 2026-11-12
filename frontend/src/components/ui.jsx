// Piezas pequeñas reutilizadas en todas las pantallas
export const Badge = ({ tono = 'gris', punto = true, children }) => (
  <span className={`badge badge--${tono}`}>{punto && <i />}{children}</span>
)

export const Tarjeta = ({ titulo, derecha, className = '', children, sinPadding }) => (
  <section className={`tarjeta ${className}`}>
    {titulo && (
      <header className="tarjeta__cab">
        <h2>{titulo}</h2>
        {derecha && <span className="tarjeta__der">{derecha}</span>}
      </header>
    )}
    <div className={sinPadding ? '' : 'tarjeta__cuerpo'}>{children}</div>
  </section>
)

export const Cabecera = ({ eyebrow, titulo, texto, children }) => (
  <div className="cabecera">
    <div>
      {eyebrow && <p className="eyebrow-app">{eyebrow}</p>}
      <h1>{titulo}</h1>
      {texto && <p className="cabecera__texto">{texto}</p>}
    </div>
    {children}
  </div>
)

export const Stat = ({ etiqueta, valor, children }) => (
  <div className="tarjeta stat">
    <span>{etiqueta}</span>
    <strong>{valor}</strong>
    {children}
  </div>
)
