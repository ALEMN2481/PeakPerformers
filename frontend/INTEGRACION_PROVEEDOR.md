# Integración final del portal Proveedor — PeakPerformers

## Contrato de backend verificado

Código fuente: rama `feature/proveedores-compras`, commit `6b2e660` de
`ALEMN2481/PeakPerformers` (revisados los archivos de rutas, controlador y servicio).
El frontend **NO** solicita datos desde `/api/compras` ni usa `id_proveedor` proporcionado
por el navegador. Las consultas privadas usan el JWT, en `Authorization: Bearer TOKEN`.

| Acción | Método | Ruta | Respuesta real |
|---|---|---|---|
| Iniciar sesión | POST | `/api/auth/login` | `{ token, tipo, vence_en, mensaje }` |
| Consultar rol | GET | `/api/auth/me` | `{ id_usuario, rol }` |
| Perfil | GET | `/api/proveedor/mi-perfil` | `{ id_proveedor, nit_rut, razon_social, telefono, direccion, correo }` |
| Órdenes | GET | `/api/proveedor/mis-ordenes` | Array de `{ id_orden, id_proveedor, fecha_creacion, estado, total, fecha_confirmacion, confirmada_proveedor }` |
| Detalle | GET | `/api/proveedor/mis-ordenes/:id` | Orden con `{ proveedor, detalles: [{ id_producto, sku, producto, cantidad, costo_unitario, subtotal }] }` |
| Confirmar | POST | `/api/proveedor/mis-ordenes/:id/confirmar` | `{ mensaje, id_orden, confirmada_proveedor, fecha_confirmacion, estado }` |

`confirmada_proveedor` llega como 0/1 en consultas MariaDB y como `true` en
la respuesta de confirmación. **Una confirmación NO cambia el estado físico** de
la orden; si la compra continúa en `Pendiente` pero `confirmada_proveedor=1`,
React muestra `Confirmada por el proveedor`. Solo muestra `Recibida por la
ferretería` cuando el backend devuelve estado `Recibida`.

El botón de confirmar se muestra únicamente cuando `estado === 'Pendiente'`
y `confirmada_proveedor === 0`. En caso de 403, 404, 409, 500 o 503 muestra
el mensaje HTTP del backend. Las órdenes pertenecen al proveedor por el vínculo
`usuario_proveedor` del JWT; no se puede elegir otro proveedor desde la URL.

La recepción física de mercancía la hace el Administrador mediante su módulo
de compras; este frontend no llama `/api/compras/:id/recibir` desde Proveedor.

## Para probar con la cuenta del Proveedor

1. Tener MariaDB encendido y backend del commit `6b2e660` o posterior en puerto 3000.
   Es necesario haber aplicado la migración del acceso al Proveedor.
2. Desde `frontend/` ejecutar `npm ci`, `npm run dev` y abrir la URL de Vite.
3. Ingresar con `proveedor.1.test@controlstock.invalid` y la contraseña de prueba
   configurada localmente (no está en este ZIP).
4. Verificar que aparezca **Mi empresa** desde la API, abrir **Mis órdenes** y
   visualizar productos/cantidad/costo/subtotal de una solicitud asignada.
5. Confirmar una orden pendiente no confirmada y verificar el estado
   `Confirmada por el proveedor`. El stock **no debe aumentar**.
6. Ingresar como Administrador y registrar recepción física; comprobar que el
   portal ahora muestra `Recibida por la ferretería` al actualizar.
7. Probar una orden ajena o inexistente: el backend debe devolver 404.

## Límites de verificación

Las pruebas automáticas del frontend son locales con respuestas HTTP simuladas.
No hay acceso a la instancia MariaDB del equipo del usuario, por lo que la
prueba integral real debe ejecutarse en ese computador. No se ha modificado
`backend/`, SQL, `.env` personal ni se ha subido código a GitHub.
