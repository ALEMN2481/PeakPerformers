# Evolución de roles — PeakPerformers

Solo se reconocen **Administrador, Cajero y Proveedor** devueltos por
`GET /api/auth/me`. La interfaz no presupone roles por su número en MariaDB.

- Administrador: catálogo, inventario, proveedores, compras, recepción,
  reabastecimiento, ventas y reportes.
- Cajero: consulta pública de productos para evitar obtener costos internos,
  búsqueda avanzada por ficha técnica y registro de ventas.
- Proveedor: pantalla aislada y preparada para consultar perfil/órdenes
  filtradas desde el servidor y confirmar pedidos sin recibir mercancía.

**Entrega actual**: el backend del ZIP compartido previamente no incluye
las rutas del portal Proveedor desarrolladas después. El frontend no inventa
endpoints: requiere colocar el contrato real en `.env.local` después de
leer los archivos más recientes del backend. Ver `INTEGRACION_PROVEEDOR.md`.

El control final sobre la visibilidad de datos y los permisos siempre recae
en la API, no solo en los componentes React.
