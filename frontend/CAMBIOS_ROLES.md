# Evolución de roles — PeakPerformers

Solo se reconocen **Administrador, Cajero y Proveedor** devueltos por
`GET /api/auth/me`. La interfaz no presupone roles por su número en MariaDB.

- Administrador: catálogo, inventario, proveedores, compras, recepción,
  reabastecimiento, ventas y reportes.
- Cajero: consulta pública de productos para evitar obtener costos internos,
  búsqueda avanzada por ficha técnica y registro de ventas.
- Proveedor: consulta perfil y órdenes de su empresa, abre detalles y confirma
  pedidos pendientes sin recibir mercancía.

**Integración verificada 24/11/2026:** el portal Proveedor está conectado a las rutas
privadas reales del commit `6b2e660`, sin configuración adicional. Ver
`INTEGRACION_PROVEEDOR.md`.

El control final sobre la visibilidad de datos y los permisos siempre recae
en la API, no solo en los componentes React.


## Actualización 23/11/2026 — Permisos de Cajero

- El menú Operaciones permite a Administrador y Cajero entrar en **Gestión de productos**.
- El Cajero puede crear, modificar e inactivar mediante las rutas de productos existentes.
- Nueva categoría y modificación de ficha técnica: solo Administrador.
- Los botones de compras, proveedores y recepción de mercancía siguen solo en el menú del Administrador.
- Proveedor: permanece dentro de su portal de órdenes propias, sin acceso al módulo global.
- Se evita editar silenciosamente el costo de un producto si una respuesta de la API no lo incluye.
- No se ha modificado ninguna línea de backend ni se hicieron cambios de Git.
