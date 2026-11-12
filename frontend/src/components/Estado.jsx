export default function Estado({ loading, error, onRetry, children }) {
  if (loading) return <p className="api-estado" role="status">Consultando datos del servidor…</p>
  if (error) return <div className="api-error" role="alert"><strong>No se pudo cargar la información.</strong><p>{error}</p>{onRetry && <button className="btn" onClick={() => onRetry()}>Reintentar</button>}</div>
  return children
}
