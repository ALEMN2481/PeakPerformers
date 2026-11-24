# PeakPerformers — Frontend React / Vite

Entrega para el compañero de frontend. **Este archivo ZIP contiene solo `frontend/`**.
Conserva los componentes, estilos, imágenes y estructura original. No cambia `backend/`,
SQL, `.git`, ni credenciales. No se realizaron commits ni pushes.

## Inicio en el computador (Windows)

1. Conserva una copia de `PeakPerformers/frontend` antes de mezclar los cambios.
2. Extrae esta carpeta en `PeakPerformers/frontend` sin tocar `backend/`.
3. Inicia el backend **actual** con su `.env` y la base de datos MariaDB local en el
   puerto 3307; verifica `http://localhost:3000/api/test-db`.
4. Desde una terminal en `PeakPerformers/frontend`, ejecuta:

```powershell
npm ci
npm run dev
```

5. Abre la URL de Vite (normalmente `http://localhost:5173`). En otra terminal
   ejecuta `npm run test:unit` y `npm run build`.

Vite redirige `/api` a `http://localhost:3000`. **Nunca** pongas la contraseña
MariaDB, `JWT_SECRET` ni claves personales en `.env` del frontend.

## Roles y funciones

| Rol según `GET /api/auth/me` | Pantallas autorizadas |
|---|---|
| Administrador | Panel, catálogo, movimientos, compras, recepción, proveedores, ventas, reportes, consulta avanzada |
| Cajero | Panel, consulta de precios y existencias, ventas y **Gestión de productos (crear, editar, inactivar)**. Sin compras ni pedidos a proveedores. |
| Proveedor | Portal propio con perfil, órdenes asignadas, detalle y confirmación mediante rutas privadas verificadas |

La identidad se valida a través de JWT y consulta de perfil. No se asume que el
rol con `id_rol = 3` sea Proveedor y no se permite acceder a módulos ajenos
cambiando la URL. Los permisos **verdaderos** también deben aplicarse en el
backend; ocultar botones en React no sustituye control de acceso del servidor.

## Operaciones integradas contra la API verificada

- Login JWT: `POST /api/auth/login`, `GET /api/auth/me`.
- Productos/categorías: lectura y CRUD autorizado; ficha técnica.
- Búsqueda avanzada: `GET /api/productos/buscar?q=...&especificacion=...`;
  alternativas: `GET /api/productos/:id/alternativas`. Ambas lecturas sin token.
- Movimientos: `GET/POST /api/inventario/movimientos`.
- Ventas: `POST /api/ventas` (el servidor valida existencias y descuenta stock).
- Proveedores: `GET/POST /api/proveedores`.
- Compras: `GET/POST /api/compras`, detalle `GET /api/compras/:id`, recepción
  `POST /api/compras/:id/recibir` (aumenta stock después de recibir).
- Abastecimiento y reportes: rutas documentadas en `CONTRATO_API.md`.

## Cambio de permisos informado el 23 de noviembre de 2026

El usuario confirmó que el backend actual (26 pruebas automatizadas aprobadas en su
entorno) **autoriza al Cajero a crear, editar e inactivar productos**. En React, el
menú Operaciones y las rutas se actualizaron para permitir acceso a `catalogo`
para Administrador y Cajero. El formulario utiliza exclusivamente los endpoints
ya documentados de productos: `POST /api/productos`, `PUT /api/productos/:id`
y `DELETE /api/productos/:id` (baja lógica). El backend sigue siendo la fuente de
verdad del permiso: si la API aún devuelve HTTP 403, no se debe intentar
saltarse el permiso desde el cliente.

Se reserva al Administrador: gestión de categorías, modificación de la ficha
técnica, compras y proveedores, recepción, movimientos y reportes. El Cajero
puede leer las fichas técnicas, pero no guardar cambios por un endpoint que no
se ha verificado como suyo. El Proveedor no accede al catálogo ni a compras
globales; su portal usa exclusivamente las rutas privadas verificadas en 6b2e660.

**Limitación de verificación:** el ZIP de backend disponible en esta conversación
es anterior al cambio del Cajero. Ese código exigía Administrador en
`POST/PUT/DELETE /api/productos`. El portal Proveedor fue verificado después en el commit 6b2e660. Este ZIP no
modifica backend y las pruebas unitarias **no equivalen** a una prueba HTTP contra MariaDB.

## Portal de usuario Proveedor — integrado con backend 6b2e660

Se verificaron directamente `backend/src/routes/portal-proveedor.routes.js`,
`controllers/portal-proveedor.controller.js` y `services/portal-proveedor.service.js`.
La pantalla `src/pages/PortalProveedor.jsx` llama de manera real a
`GET /api/proveedor/mi-perfil`, `GET /api/proveedor/mis-ordenes`,
`GET /api/proveedor/mis-ordenes/:id` y `POST /api/proveedor/mis-ordenes/:id/confirmar`.

El acceso JWT se administra por `src/services/api.js`. Las órdenes se filtran en
backend según `usuario_proveedor`, no desde React. No hay datos simulados;
se presentan los estados Pendiente / Confirmada por el proveedor / Recibida
por la ferretería. Confirmar NO aumenta existencias. No se usa `/api/compras`
en el portal, ni se permite confirmar de nuevo una orden ya confirmada o recibida.

No se necesitan variables `VITE_PROVEEDOR_*` de una integración anterior.
Consultar `INTEGRACION_PROVEEDOR.md` para contrato completo y casos de prueba.

El backend anterior también carece de API de administración de usuarios. La
pantalla `Usuarios` no crea cuentas ficticias ni intenta registrar usuarios.

## Prueba manual de demostración

1. Login Administrador; crear producto, confirmar stock inicial = 0.
2. Registrar entrada y verificar que aumenta inventario.
3. Login Cajero; comprobar que puede crear/editar/inactivar productos y que **no** aparece Compras y proveedores; vender unidades disponibles,
   volver a consultar y verificar que el backend redujo stock.
4. Login Administrador; crear proveedor, registrar una orden de compra,
   confirmar que el stock **no cambia antes de recibir**; recibir compra y
   comprobar nuevo stock; revisar detalle de la orden.
5. Consultar indicadores y ventas por fechas en Reportes.
6. Login Proveedor: consultar sus pedidos con JWT, abrir detalle y confirmar
   uno pendiente sin alterar existencias; verificar recibido tras recepción administrativa.

## Validación de esta entrega

- Los tests `npm run test:unit` cubren rutas privadas, JWT, 3 estados,
  detalles y confirmación (con respuestas HTTP simuladas), además del resto
  de pruebas previas.
- Comprobar también `npm run build` y, en el PC con el servidor MariaDB,
  completar la prueba manual descrita en `INTEGRACION_PROVEEDOR.md`.
- Backend y repositorio Git **no modificados**.
