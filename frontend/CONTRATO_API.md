# Contrato frontend ↔ backend para ControlStock

**Base URL por defecto:** `/api` (proxy de Vite → `http://localhost:3000/api`).

**Nota:** `GET /api/categorias`, `POST /api/categorias` y `POST /api/auth/login` figuran en avances anteriores de ControlStock. **El resto de rutas son el contrato que necesita este frontend**, no rutas confirmadas del servidor actual. Revisarlas con la carpeta `backend` antes de probar.

| Método | Ruta | Pantalla | Entrada esperada / salida |
|---|---|---|---|
| POST | `/api/auth/login` | Login | `{ "correo": "...", "contrasena": "..." }` → `{ "token": "JWT", "usuario": { "id_usuario": 1, "nombre": "...", "id_rol": 1, "correo": "..." } }` |
| POST | `/api/auth/registro` | Registro | `{ "nombre", "correo", "contrasena" }`, solo si el backend admite registro; **no permitir atribuirse un rol de administrador** |
| POST | `/api/auth/recuperar` | Recuperación | `{ "correo" }` → mensaje genérico sin revelar existencia de cuentas |
| GET | `/api/categorias` | Catálogo | Array de `{ id_categoria, nombre_categoria, descripcion }` o `{ categorias: [...] }` |
| POST | `/api/categorias` | Catálogo | `{ "nombre_categoria": "Herramientas" }` |
| GET | `/api/productos` | Catálogo, panel, mostrador, compras | Array de registros de la tabla `producto` o `{ productos: [...] }` |
| POST | `/api/productos` | Catálogo | Campos de `producto`, `id_categoria` numérico y precios/stock numéricos |
| PUT | `/api/productos/:id` | Catálogo | Campos del producto; para baja lógica `{ "estado": 0, "motivo_inactivacion": "..." }` |
| GET | `/api/proveedores` | Reabastecimiento | Registros con `id_proveedor`, `razon_social` |
| GET | `/api/usuarios` | Usuarios | Registros `id_usuario`, `nombre`, `correo`, `id_rol`, `estado`; **NO** enviar `contrasena_hash` |
| POST | `/api/usuarios` | Usuarios | `{ "nombre", "correo", "id_rol", "contrasena" }`; backend debe hashear con bcrypt y restringir a administradores |
| GET | `/api/movimientos` | Historial | Array de registros de `movimiento_inventario`, opcionalmente `sku`, `nombre_usuario` |
| POST | `/api/movimientos` | Inventario | `{ "id_producto": 1, "tipo": "Entrada", "cantidad": 2, "motivo": "..." }` |
| POST | `/api/ventas` | Mostrador | `{ "documento_cliente": null, "metodo_pago": "Efectivo", "detalles": [{ "id_producto": 1, "cantidad": 2, "precio_unitario": 1200 }] }` |
| POST | `/api/ordenes-compra` | Compras | `{ "id_proveedor": 1, "total": 2400, "motivo": "...", "detalles": [{ "id_producto": 1, "cantidad": 2, "costo_unitario": 1200 }] }` |

## Requisitos del backend

1. Validar los JWT/autorizaciones en rutas privadas. Controlar permisos por rol **también en Express**, no solo por menús de React.
2. Derivar `id_usuario`, `id_cajero` y autoría de la sesión verificada, no de campos arbitrarios del navegador.
3. **Ventas y movimientos:** validar stock, precios y cantidades, registrar cabecera + detalles y actualizar stock en **transacción SQL**. Revertir todo en caso de fallo; impedir stock negativo cuando corresponda.
4. **Órdenes:** guardar cabecera + detalle en transacción. No afirmar autorización ni correo enviado si no existen esas funciones.
5. **Inactivación:** proteger historial y guardar un motivo en auditoría si hay tabla/función para ello; el esquema SQL compartido originalmente no tiene columna para ese motivo.
6. **Errores:** devolver JSON `{ "mensaje": "Descripción clara" }` con códigos 400/401/403/404/409/500 adecuados.
7. No devolver hashes, tokens ajenos, contraseñas ni información personal innecesaria al navegador.
8. `rol` actual de MariaDB: `Administrador=1`, `Cajero=2`, `Bodega=3`. El diseño anterior mencionaba «Proveedor», pero **ese rol no existe** en el esquema compartido. No asumir que se implementó.

## Cómo comprobar cuando esté disponible el backend

- Iniciar MariaDB y Express, verificar `GET /api/test-db`.
- Iniciar frontend y comprobar login válido, inválido y cierre de sesión.
- Confirmar con phpMyAdmin que crear producto/categoría guarda un registro real.
- Probar una venta con producto sin stock y otra con stock suficiente; verificar cambios de `stock_actual` y `detalle_venta`.
- Probar una salida de inventario, confirmar `movimiento_inventario` y nuevo stock.
- Probar usuario no administrador intentando `POST /api/usuarios`: debe responder **403**.
- Probar un error desconectando Express: debe mostrarse aviso; **no** deben aparecer mensajes de guardado exitoso.
