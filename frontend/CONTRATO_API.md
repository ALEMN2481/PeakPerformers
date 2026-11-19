# Contrato comprobado contra `PeakPerformers_Backend_Listo_Jueves(1).zip`

**Autenticación:** `POST /api/auth/login` acepta `{correo, contrasena}` y devuelve `{token, tipo, vence_en}`. `GET /api/auth/me` con `Authorization: Bearer <token>` devuelve `{id_usuario, rol}`. El rol válido se determina por **nombre**, no por ID.

**Catálogo:** `GET /api/categorias`, `GET /api/productos` (públicos, se omiten costos internos). Con JWT de Administrador, `POST/PUT/DELETE /api/productos`, `POST/PUT/DELETE /api/categorias`. El `PUT`/`POST` de productos incluye `{id_categoria, sku, nombre, precio_costo, precio_venta, stock_minimo, unidad_medida, codigo_barras?, descripcion?, ubicacion_bodega?}`. El backend no cambia `stock_actual` desde ese formulario.

**Ventas:** `POST /api/ventas` requiere rol Administrador/Cajero y `{metodo_pago, documento_cliente, detalles:[{id_producto,cantidad}]}`. El backend calcula importes, descuenta el inventario y obtiene el cajero del JWT.

**Inventario:** `GET/POST /api/inventario/movimientos` exige Administrador; `POST` recibe `{id_producto,tipo,cantidad,motivo}`.

**Compras:** `GET /api/compras` con JWT; `POST /api/compras` solo Administrador con `{id_proveedor,detalles:[{id_producto,cantidad,costo_unitario}]}`; `POST /api/compras/:id/recibir` solo Administrador. Stock aumenta al recibir.

**Proveedores comerciales:** `GET /api/proveedores`, `POST/PUT/DELETE /api/proveedores` con permisos Admin para cambios; datos `{nit_rut,razon_social,telefono?,direccion?,correo?}`.

**Abastecimiento:** `GET /api/abastecimiento/faltantes`; `POST /api/abastecimiento/generar` y `POST /api/abastecimiento/vinculos` (mutaciones Admin) requieren migración del esquema.

**Reportes:** `GET /api/reportes/dashboard`, `GET /api/reportes/ventas-resumen?desde=AAAA-MM-DD&hasta=AAAA-MM-DD`: solo Administrador.

**No disponibles en el backend original:** `/api/usuarios`, endpoints de recuperación o registro público, y los pedidos filtrados por identidad del usuario Proveedor. El frontend no los simula.

**Revisión de seguridad:** aunque el frontend no enseña operaciones administrativas al Cajero/Proveedor, el backend debe restringir sus rutas GET globales (como compras/ventas/proveedores y GET productos autenticado). La seguridad efectiva corresponde al backend.

## Nuevos usos de rutas comprobadas

- Buscador: `GET /api/productos/buscar?q=<texto>&especificacion=<texto opcional>`.
- Alternativas no garantizadas: `GET /api/productos/:id/alternativas`.
- Detalle administrativo de compra: `GET /api/compras/:id`.

## Backend posterior — Proveedor

El chat «Verificar estado Git» documenta avances de portal con órdenes
filtradas por la cuenta y confirmación sin actualizar stock, pero aquí no
están disponibles los archivos actualizados de rutas ni respuestas exactas.
Por tanto se dejan las rutas del nuevo portal **sin configurar** hasta
verificar `backend/src/routes` del último commit. Ver
`INTEGRACION_PROVEEDOR.md`. No se debe implementar la consulta del proveedor
mediante `GET /api/compras` (lista global).
