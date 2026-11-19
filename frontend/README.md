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
| Cajero | Panel de consulta, precios, existencias y mostrador de ventas |
| Proveedor | Portal propio; requiere rutas de perfil y órdenes del backend más reciente |

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

## Importante: portal de usuario Proveedor

Los avances más recientes del chat «Verificar estado Git» incluyen una migración
`002_acceso_proveedor.sql` y una prueba HTTP exitosa del acceso del Proveedor,
órdenes propias y confirmación sin alterar stock. **Pero los archivos exactos de
esas nuevas rutas no vienen en el último ZIP de backend que tenemos en este chat**.
Por esa razón no se han supuesto endpoints nuevos ni se ha usado la consulta
administrativa global de compras desde el Proveedor.

Se añadió `src/services/portalProveedor.js` y se completó la vista de perfil,
órdenes, detalle y confirmación. Las consultas solo se activan después de
configurar en `.env.local` las rutas **reales y revisadas** del backend más
reciente. Ver `INTEGRACION_PROVEEDOR.md`.

El backend anterior también carece de API de administración de usuarios. La
pantalla `Usuarios` no crea cuentas ficticias ni intenta registrar usuarios.

## Prueba manual de demostración

1. Login Administrador; crear producto, confirmar stock inicial = 0.
2. Registrar entrada y verificar que aumenta inventario.
3. Login Cajero; comprobar menú restringido; vender unidades disponibles,
   volver a consultar y verificar que el backend redujo stock.
4. Login Administrador; crear proveedor, registrar una orden de compra,
   confirmar que el stock **no cambia antes de recibir**; recibir compra y
   comprobar nuevo stock; revisar detalle de la orden.
5. Consultar indicadores y ventas por fechas en Reportes.
6. Login Proveedor: después de configurar rutas exactas de la nueva API,
   consultar solo sus pedidos y confirmar uno sin alterar existencias.

## Validación de esta entrega

- Pruebas locales: **21/21** con `npm run test:unit`.
- Sintaxis: **32 archivos** JS/JSX/MJS parseados sin errores con TypeScript.
- `npm run build` y llamadas reales al MariaDB de tu PC: **pendientes** porque
  no se dispone aquí de la dependencia npm completa ni de tu servidor Windows.
- Backend: **no modificado**.
