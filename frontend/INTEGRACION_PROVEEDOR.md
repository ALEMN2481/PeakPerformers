# Integración del acceso de usuario Proveedor — PeakPerformers

Este paquete conserva el diseño de React y conecta los módulos de Administrador
/ Cajero con el contrato verificado en el backend adjuntado antes: `PeakPerformers_Backend_Listo_Jueves(1).zip`.

## Limitación real de fuentes

El backend de ese ZIP **no contiene** la migración `002_acceso_proveedor.sql`
ni las nuevas rutas/controladores del portal Proveedor desarrolladas después en
el chat «Verificar estado Git». Sabemos que se probó login JWT, perfil, órdenes
filtradas y confirmación sin alterar stock, pero **no están disponibles aquí las
rutas ni los formatos JSON exactos**. No los inventamos.

## Conexión del portal cuando esté el backend definitivo

Comprueba primero `backend/src/app.js`, `backend/src/routes/` y los controllers
del último trabajo del Proveedor. En `frontend/.env.local`, asigna SOLO las
rutas verificadas, relativas a `/api` (ejemplo sintáctico de ruta: `/segmento/ruta`,
NO representa un endpoint existente):

```env
VITE_PROVEEDOR_PERFIL_RUTA=
VITE_PROVEEDOR_ORDENES_RUTA=
VITE_PROVEEDOR_DETALLE_RUTA=
VITE_PROVEEDOR_CONFIRMAR_RUTA=
VITE_PROVEEDOR_CONFIRMAR_METODO=
```

Las rutas de detalle/confirmación deben incluir `:id` o `{id}` para el número de
orden y pertenecer al PORTAL, no al listado de compras global. Método de
confirmación: solo `POST`, `PUT` o `PATCH`, exactamente el que acepte el backend.
No se necesita incluir el usuario o id_proveedor: la API debe determinarlo desde
JWT. El frontend **no** modifica existencias al confirmar como Proveedor.

La conexión usa `GET` para perfil y órdenes. Los resultados pueden ser arrays o
objetos `{ordenes:[...]}`, `{data:{ordenes:[...]}}`, `{compras:[...]}`. El perfil
admite `{proveedor:{razon_social, nit_rut, correo}}` o directamente la entidad.
Si el contrato real es distinto hay que adaptar el mapeo a esos campos reales.

**Seguridad**: aunque el menú se filtra por rol, el servidor debe impedir
accesos a recursos de otro proveedor (403/404) y a módulos administrativos.
Nunca configurar estas variables con `/compras` global ni con URL externas.

## Roles

- Administrador: catálogo, compras, recepción, inventario, ventas, reportes.
- Cajero: consulta de productos (sin costos internos) y ventas.
- Proveedor: acceso limitado a su perfil, órdenes asignadas y confirmación SOLO
  cuando el backend ofrezca y verifique las rutas propias.

No se modificaron scripts ni archivos del backend y no se realizó Git push.
