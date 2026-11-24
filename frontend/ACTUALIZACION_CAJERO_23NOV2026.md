# Actualización Cajero — PeakPerformers

Este paquete contiene únicamente `frontend/`. No modificar `backend/`, `.git`,
MariaDB ni `.env`. Conservar el frontend del compañero como base: no se recrearon
pantallas ni estilos.

## Roles en el menú

| Rol | Gestión de productos | Ventas | Categorías | Compras / proveedores / recepción | Reportes |
|---|---|---|---|---|---|
| Administrador | Sí | Sí | Sí | Sí | Sí |
| Cajero | **Crear, editar, inactivar** | Sí | Solo lectura | **No** | No |
| Proveedor | No | No | No | No (usa únicamente su portal de órdenes asignadas) | No |

## API que usa el catálogo (sin rutas inventadas)

- `GET /api/productos` con JWT para cargar datos completos autorizados.
- `GET /api/categorias` para llenar el selector del producto.
- `POST /api/productos` para crear.
- `PUT /api/productos/:id` para editar.
- `DELETE /api/productos/:id` para inactivar (baja lógica).
- `GET /api/productos/:id/especificaciones` para ver la ficha.
- `PUT /api/productos/:id/especificaciones` solo para Administrador, porque
  no hay constancia de permiso nuevo para el Cajero en esa ruta.

**Importante:** La API previa adjuntada en este chat aún contiene
`soloAdministrador` para las mutaciones de productos. La versión posterior del
backend que el usuario menciona (26 pruebas) no está adjunta aquí. El frontend
está adaptado al nuevo permiso, pero no puede otorgarlo si el servidor aún
responde 403. Revisar `backend/src/routes/productos.routes.js` de la versión
que corre en el PC para confirmar autorización Admin/Cajero.

## Proveedor (actualizado 24/11/2026)

Se verificaron las rutas del portal en el commit `6b2e660`, posteriores a
esta nota del Cajero. El portal ya usa las rutas privadas `/api/proveedor/mi-perfil`,
`/api/proveedor/mis-ordenes` y sus endpoints de detalle y confirmación.
No requiere variables `VITE_PROVEEDOR_*`. Consultar `INTEGRACION_PROVEEDOR.md`.

## Comprobación con backend y MariaDB locales

```powershell
cd C:\Users\juanc\Proyectos\PeakPerformers\frontend
npm ci
npm run test:unit
npm run build
npm run dev
```

Abrir Vite, iniciar sesión como Cajero y verificar el menú. Probar con un
producto de prueba (no datos de producción): crear, editar e inactivar. Repetir
el login como Admin para verificar que compras, proveedores y recepción siguen
disponibles. Proveedor solo debe ver sus órdenes. Un HTTP 403 es una restricción
del **backend en ejecución**; no cambiar la interfaz para saltarla.

No se han hecho commits ni pushes. La prueba directa con la MariaDB Windows
quedó pendiente porque aquí no existe conexión a esa instalación.
