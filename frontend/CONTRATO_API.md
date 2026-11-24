# Contrato comprobado contra `PeakPerformers_Backend_Listo_Jueves(1).zip`

**Autenticación:** `POST /api/auth/login` acepta `{correo, contrasena}` y devuelve `{token, tipo, vence_en}`. `GET /api/auth/me` con `Authorization: Bearer <token>` devuelve `{id_usuario, rol}`. El rol válido se determina por **nombre**, no por ID.

**Catálogo:** `GET /api/categorias`, `GET /api/productos` (públicos, se omiten costos internos). Con JWT de Administrador o Cajero en **el backend actualizado del usuario**, `POST/PUT/DELETE /api/productos`; categorías `POST/PUT/DELETE /api/categorias` solo Administrador. El backend adjuntado el 19/11 tenía una política anterior que aún restringía productos a Administrador: este cambio de permisos requiere la versión nueva en el equipo del usuario. El `PUT`/`POST` de productos incluye `{id_categoria, sku, nombre, precio_costo, precio_venta, stock_minimo, unidad_medida, codigo_barras?, descripcion?, ubicacion_bodega?}`. El backend no cambia `stock_actual` desde ese formulario.

**Ventas:** `POST /api/ventas` requiere rol Administrador/Cajero y `{metodo_pago, documento_cliente, detalles:[{id_producto,cantidad}]}`. El backend calcula importes, descuenta el inventario y obtiene el cajero del JWT.

**Inventario:** `GET/POST /api/inventario/movimientos` exige Administrador; `POST` recibe `{id_producto,tipo,cantidad,motivo}`.

**Compras:** `GET /api/compras` con JWT; `POST /api/compras` solo Administrador con `{id_proveedor,detalles:[{id_producto,cantidad,costo_unitario}]}`; `POST /api/compras/:id/recibir` solo Administrador. Stock aumenta al recibir.

**Proveedores comerciales:** `GET /api/proveedores`, `POST/PUT/DELETE /api/proveedores` con permisos Admin para cambios; datos `{nit_rut,razon_social,telefono?,direccion?,correo?}`.

**Abastecimiento:** `GET /api/abastecimiento/faltantes`; `POST /api/abastecimiento/generar` y `POST /api/abastecimiento/vinculos` (mutaciones Admin) requieren migración del esquema.

**Reportes:** `GET /api/reportes/dashboard`, `GET /api/reportes/ventas-resumen?desde=AAAA-MM-DD&hasta=AAAA-MM-DD`: solo Administrador.

**No disponibles en el backend original:** `/api/usuarios` y los endpoints de recuperación o registro público. El portal privado sí existe en el backend del commit `6b2e660`.

**Revisión de seguridad:** aunque el frontend no enseña operaciones administrativas al Cajero/Proveedor, el backend debe restringir sus rutas GET globales (como compras/ventas/proveedores y GET productos autenticado). La seguridad efectiva corresponde al backend.

## Nuevos usos de rutas comprobadas

- Buscador: `GET /api/productos/buscar?q=<texto>&especificacion=<texto opcional>`.
- Alternativas no garantizadas: `GET /api/productos/:id/alternativas`.
- Detalle administrativo de compra: `GET /api/compras/:id`.

## Portal privado Proveedor — verificado en commit 6b2e660

Se revisaron rutas, controlador y servicio en GitHub:

- `GET /api/proveedor/mi-perfil`: datos `id_proveedor`, `nit_rut`, `razon_social`, `telefono`, `direccion`, `correo`.
- `GET /api/proveedor/mis-ordenes`: array de órdenes propias, con `estado`, `total`, `fecha_confirmacion` y `confirmada_proveedor`.
- `GET /api/proveedor/mis-ordenes/:id`: incluye array `detalles` con productos y subtotales.
- `POST /api/proveedor/mis-ordenes/:id/confirmar`: confirma solicitud pendiente sin aumentar stock.

Todas requieren JWT de usuario Proveedor. El backend determina la identidad por
`req.usuario.id_usuario`, comprueba vínculo `usuario_proveedor` y solo muestra
órdenes asociadas. **No** utiliza `GET /api/compras` desde el Proveedor.
Ver `INTEGRACION_PROVEEDOR.md`.
