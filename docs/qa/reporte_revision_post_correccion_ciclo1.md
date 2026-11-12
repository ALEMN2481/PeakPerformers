# Reporte de Revisión Post-Corrección y Casos de Prueba — Ciclo 1

**Proyecto:** ControlStock (ERS IEEE 830)
**Ramas evaluadas:** `origin/prog_1` @ `54d313c` (backend · Express 5 + mysql2/promise) · `origin/prog_2` @ `652dd3a` (frontend · React 19 + Vite)
**Fecha de revisión:** 12 de noviembre de 2026
**Tipo de revisión:** estática (lectura de código). No se ejecutó el backend, el frontend ni la base de datos.
**Referencia anterior:** `reporte_de_hallazgos_qa.md` (10/11/2026)

---

## 1. Resumen ejecutivo

| Área | Dictamen |
|---|---|
| Seguridad backend (`prog_1`) | **Corregido.** BUG-001 cerrado; SEC-001 cerrado en el árbol actual, con una acción pendiente (rotar credenciales). |
| Contrato API (`prog_1` ↔ `prog_2`) | **Bloqueado.** Ya no hay datos fijos en el código, pero 3 desajustes impiden que funcionen el login por rol, los movimientos y la baja lógica. |
| Inicio Ciclo 1 | **Parcial.** Se pueden ejecutar las pruebas de API del backend (Postman / `node:test`). Las pruebas de extremo a extremo (E2E) siguen bloqueadas hasta cerrar CNT-01, CNT-02 y CNT-03. |

---

## 2. Revisión de seguridad y configuración (`prog_1`)

### 2.1 Seguimiento de hallazgos anteriores

| ID | Hallazgo | Estado | Evidencia |
|---|---|---|---|
| SEC-001 | `.env` rastreado en Git | ✅ Corregido / ⚠️ acción pendiente | `backend/.env` eliminado del árbol en `68b7d59`. `.gitignore` contiene `**/.env`, `**/.env.*` y `!**/.env.example`. Existe `backend/.env.example` con valores de relleno (incluye `JWT_SECRET`). **Pendiente:** el archivo con la credencial real sigue en el historial (commit `cb0d98b`, que ya está en `main` y en `prog_1`). Hay que **rotar `DB_PASSWORD`** del usuario de MariaDB. |
| BUG-001 | Sin autenticación ni control por rol | ✅ Corregido | `middlewares/auth.middleware.js`: JWT HS256 con `issuer` y vencimiento de 8 h. En cada petición vuelve a consultar en la BD el `estado` del usuario y su rol, así que desactivar a un usuario le quita el acceso de inmediato. `router.use(autenticar)` en productos, categorías e inventario. `soloAdministrador` protege `POST/PUT/DELETE` de productos y categorías y `POST /inventario/movimientos`. |
| BUG-001 (auditoría) | `id_usuario` tomado del body | ✅ Corregido | `crearMovimiento` usa `req.usuario.id_usuario`, que viene del token. |
| IMP-001.1 | Pools de conexión duplicados | ✅ Corregido | `config/db.js` reexporta `config/database.js`. |
| IMP-001.2 | Sin manejo global de errores | ✅ Corregido | `app.js`: responde 404 en JSON, `400 "JSON invalido"` y 500 genérico. |
| OBS-001 (RF02) | Sin búsqueda ni equivalencias | 🟡 Parcial | `GET /api/productos/buscar?q=` y `GET /api/productos/:id/alternativas` existen. Ver BE-01 y BE-02. |
| OBS-001 (RF03) | Sin agrupación por proveedor ni órdenes | ❌ Abierto | No hay endpoints de proveedores ni de órdenes de compra. |

### 2.2 Hallazgos nuevos del backend

| ID | Severidad | RF/RNF | Descripción | Acción sugerida |
|---|---|---|---|---|
| BE-01 | Media | RF02 | `buscarProductos` no devuelve `ubicacion_bodega` ni `unidad_medida`. El ERS exige mostrar la disponibilidad "desglosada por ubicación física (pasillo y estante)". | Agregar `p.ubicacion_bodega` y `p.unidad_medida` al `SELECT`. |
| BE-02 | Baja (conocida) | RF02 | `alternativas` sugiere productos de la misma categoría con stock > 0. No compara equivalencias técnicas (medidas, calibre, rosca). El propio código lo marca como preliminar. | Documentar el alcance en el Ciclo 1. La equivalencia técnica queda para un ciclo posterior. |
| BE-03 | Media | RF01 | Faltan `POST /api/auth/registro` y `POST /api/auth/recuperar`, que el RF01 pide ("registro e inicio de sesión"). | Implementarlos o dejar por escrito que el registro lo hace solo el Administrador. |
| BE-04 | Media | RF01 / Contrato | `POST /api/auth/login` devuelve solo `{ token, tipo, vence_en }`, sin datos del usuario. `GET /api/auth/me` devuelve `{ id_usuario, rol }`, sin `nombre`. | Ver CNT-01. |
| BE-05 | Media | RF05 / 2.3 ERS | `POST /inventario/movimientos` es solo para el Administrador, así que el Cajero no puede registrar **salidas** por venta. El ERS (2.3) le asigna al Cajero el registro de ventas. | Decisión de la Analista: permitir `Salida` a Cajero y Bodega, o crear `/ventas`. |
| BE-06 | Baja | RNF04 | `server.js` sigue sin terminar el proceso si la BD falla al arrancar: el servidor no queda escuchando pero el proceso tampoco sale con error. Tampoco revisa que exista `JWT_SECRET`; si falta, el login responde 500. | Validar `JWT_SECRET` al inicio y usar `process.exit(1)` cuando falle. |
| BE-07 | Baja | RNF02 | `POST /auth/login` no limita intentos, lo que permite fuerza bruta. `cors()` está abierto (el código ya lo anota). | Limitar intentos por IP y restringir los orígenes de CORS antes del despliegue. |
| BE-08 | Baja | RF06 | La baja lógica no guarda el motivo de inactivación (no hay columna para él). | Agregar una columna o tabla de auditoría si el motivo es obligatorio. |

---

## 3. Verificación del contrato de API (`prog_1` ↔ `prog_2`)

### 3.1 Lo que cumple

- ✅ **Ya no hay datos fijos en el código.** Todas las pantallas consumen la API mediante `services/api.js` y `hooks/useApiList.js`. Lo único fijo que queda es el catálogo de roles en `Usuarios.jsx`, que es aceptable.
- ✅ **Los nombres de campo que viajan a la API son los de la BD.** `Catalogo.jsx` envía `ubicacion_bodega`, `stock_minimo`, `stock_actual`, `estado`, `precio_costo`, `precio_venta` y `unidad_medida`. `normalizarProducto()` lee esas columnas y las pasa a nombres cortos (`ub`, `minimo`, `stock`, `activo`) **solo dentro de la interfaz**. Hay una prueba unitaria en `tests/api.test.mjs` que lo cubre.
- ✅ **Sesión y rutas protegidas.** `App.jsx` manda a `#/login` cuando no hay sesión. El token se guarda en `sessionStorage`. Si la API responde 401, `api()` cierra la sesión.
- ✅ **Manejo de errores.** `ApiError` muestra el `mensaje` que envía el backend. Si no hay conexión, avisa con un mensaje claro y no muestra un "éxito" falso.
- ✅ Proxy de Vite `/api → http://localhost:3000` y `frontend/.env.example`.

### 3.2 Desajustes de contrato

| ID | Severidad | RF | Frontend (`prog_2`) | Backend (`prog_1`) | Efecto | Corrección sugerida |
|---|---|---|---|---|---|---|
| CNT-01 | **Bloqueante** | RF01 | `Login.jsx` lee `usuario.id_rol` y `usuario.rol` de la respuesta del login. | El login no devuelve `usuario`. | Todos los usuarios aparecen con el rol "Usuario". El Administrador no ve el menú "Usuarios y permisos" y el nombre mostrado es el correo. | Después del login, llamar a `GET /auth/me`. Que el backend incluya `nombre` y `rol` en el login o en `/me`. |
| CNT-02 | **Bloqueante** | RF05 | `Movimientos.jsx` llama a `GET/POST /api/movimientos`. | La ruta real es `/api/inventario/movimientos`. | 404 al listar y al registrar entradas o salidas. | Cambiar `endpoints.movimientos` a `/inventario/movimientos`. |
| CNT-03 | **Bloqueante** | RF06 | Inactivar envía `PUT /api/productos/:id` con `{ estado: 0, motivo_inactivacion }`. | La baja lógica es `DELETE /api/productos/:id`. El `PUT` valida el producto completo. | El `PUT` responde **400 "Categoría inválida"**; no se puede dar de baja desde la interfaz. | Usar `DELETE` en el frontend. El motivo depende de BE-08. |
| CNT-04 | Alta | RF03 | `Panel.jsx` y `Reabastecimiento.jsx` calculan las alertas en el navegador con `stock < minimo`. | `/inventario/stock-bajo` usa `stock_actual <= stock_minimo`. | Un producto **justo en el mínimo** no aparece en las alertas, aunque el ERS dice "igual o por debajo del umbral". | Consumir `/inventario/stock-bajo` (y `/inventario/resumen` para las cifras). |
| CNT-05 | Media | RF02 | `Mostrador.jsx` filtra en el navegador sobre `GET /productos` y no muestra equivalentes. | Existen `/productos/buscar` y `/productos/:id/alternativas`. | No se aprovecha la búsqueda del servidor ni se sugieren productos sustitutos. | Consumir los dos endpoints. |
| CNT-06 | Media | RF06 | El catálogo muestra el conteo de "inactivos" y un filtro para ellos. | `GET /productos` devuelve solo los productos con `estado = 1`. | El conteo de inactivos siempre es 0 y el filtro no muestra nada. | Agregar un parámetro `?incluir_inactivos=1` (solo Administrador) o quitar el filtro. |
| CNT-07 | Media | RF04/RF05 | El formulario de producto deja editar `stock_actual`. | `crearProducto` siempre guarda 0 y `actualizarProducto` ignora el stock (es lo correcto: el stock solo cambia por movimientos). | La interfaz confirma "Producto actualizado" aunque el stock no cambió, lo que confunde al usuario (RNF03). | Mostrar el stock en solo lectura y registrar los cambios de stock por Movimientos. |
| CNT-08 | Informativa | RF01, RF03 | El frontend llama a `/auth/registro`, `/auth/recuperar`, `/usuarios`, `/proveedores`, `/ventas` y `/ordenes-compra`. | No existen. | 404, que el frontend muestra bien ("El backend todavía no implementa…"). | Casos marcados como **BLQ** en la sección 4. |
| CNT-09 | Baja | RF01 | `#/usuarios` solo se oculta en el menú; se puede abrir escribiendo la URL. | — | No es una brecha de seguridad si el backend protege `/usuarios`, pero ese endpoint todavía no existe. | Cuando exista `/usuarios`, protegerlo con `soloAdministrador`. |

> `frontend/PRUEBAS_REALIZADAS.txt` indica que `npm run build`, `npm run lint` y las pruebas E2E **no se verificaron**. Hay que ejecutarlos en el equipo antes de iniciar el ciclo.

---

## 4. Casos de prueba unitarios y de integración — Ciclo 1 (RF01–RF06)

**Leyenda de tipo:** **U** = unitaria (controlador o función aislada, con el servicio o `fetch` simulado) · **I** = integración (API real + MariaDB) · **FE** = frontend.
**Estado previsto:** ✅ ejecutable · ⚠️ ejecutable, se espera que falle por un hallazgo · **BLQ** = bloqueado, la funcionalidad no existe.
**Preparación común:** BD de prueba con roles `Administrador (1)`, `Cajero (2)` y `Bodega (3)`. Cuentas creadas con `scripts/crear-usuarios-locales.js`. `TOKEN_ADMIN` y `TOKEN_CAJERO` se obtienen con `POST /api/auth/login`.

### RF01 — Gestión de usuarios y autenticación por roles

| ID | Tipo | Descripción técnica | Datos de entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF01-01 | I | Login con credenciales válidas | `POST /api/auth/login` `{correo:"administrador.test@controlstock.invalid", contrasena:<generada>}` | 200 `{mensaje, token, tipo:"Bearer", vence_en:"8h"}` | El token es un JWT con `iss=controlstock` y `sub=id_usuario`. | ✅ |
| CP-RF01-02 | I | Contraseña incorrecta | correo válido, `contrasena:"Mala123"` | 401 `"Credenciales invalidas"` | No se emite token. | ✅ |
| CP-RF01-03 | I | Correo inexistente (no revelar si una cuenta existe) | `correo:"noexiste@x.com"` | 401 con el **mismo** mensaje que CP-RF01-02 | El mensaje y el código no permiten saber si la cuenta existe. | ✅ |
| CP-RF01-04 | U | Validación de entrada del login | `{}`, `{correo:123}`, `contrasena` de 257 caracteres | 400 `"Correo y contrasena obligatorios"` | No se consulta la BD (el servicio simulado no recibe llamadas). | ✅ |
| CP-RF01-05 | I | Usuario desactivado | `UPDATE usuario SET estado=0`; login y luego `GET /auth/me` con un token emitido antes | 401 en ambos | El acceso se revoca sin esperar a que venza el token. | ✅ |
| CP-RF01-06 | I | Ruta privada sin token | `GET /api/productos` sin `Authorization` | 401 `"Se requiere un token de acceso"` | Ningún endpoint de negocio responde 2xx sin token. | ✅ |
| CP-RF01-07 | U | Token manipulado o vencido | Token firmado con otra clave; token con `exp` pasado; `Bearer abc` | 401 `"Token invalido o vencido"` | No hay 500 ni se filtra la traza del error. | ✅ |
| CP-RF01-08 | I | Rol insuficiente | `POST /api/productos` con `TOKEN_CAJERO` | 403 `"Acceso reservado al Administrador"` | No se inserta ningún registro. | ✅ |
| CP-RF01-09 | I | Perfil de sesión | `GET /api/auth/me` con `TOKEN_ADMIN` | 200 `{id_usuario, rol:"Administrador"}` | El rol coincide con la tabla `rol`. | ✅ |
| CP-RF01-10 | FE | Pantalla protegida sin sesión | `sessionStorage` vacío; navegar a `#/catalogo` | Redirige a `#/login` | No se llega a mostrar la pantalla protegida. | ✅ |
| CP-RF01-11 | FE·U | Sesión vencida | `fetch` simulado responde 401 | `api()` lanza `ApiError(status 401)` y borra `controlstock_sesion` | La interfaz vuelve al login. | ✅ |
| CP-RF01-12 | FE·I | Rol visible después del login | Login como Administrador | El menú lateral muestra "Administrador" y "Usuarios y permisos" | — | ⚠️ CNT-01 |
| CP-RF01-13 | I | Registro de usuario | `POST /api/auth/registro` | 201 y contraseña guardada con bcrypt | — | BLQ (BE-03) |

### RF02 — Búsqueda avanzada de stock y equivalencias

| ID | Tipo | Descripción técnica | Datos de entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF02-01 | I | Búsqueda por SKU | `GET /api/productos/buscar?q=TOR-3812` | 200 con un arreglo que incluye el SKU | Solo productos con `estado=1`; máximo 50 resultados. | ✅ |
| CP-RF02-02 | I | Búsqueda por código de barras y por nombre parcial | `q=<codigo_barras>`, `q=tornillo` | Coinciden los productos esperados | El resultado es igual al de una consulta directa en la BD. | ✅ |
| CP-RF02-03 | U | Validación del parámetro `q` | sin `q`, `q="   "`, `q` de 101 caracteres | 400 `"Indica q (entre 1 y 100 caracteres)"` | No se ejecuta SQL. | ✅ |
| CP-RF02-04 | I | Búsqueda con caracteres especiales (inyección SQL) | `q=%`, `q=' OR 1=1 --` | 200 con `[]` o solo coincidencias literales | No responde 500 ni devuelve todo el catálogo. | ✅ |
| CP-RF02-05 | I | Productos inactivos excluidos | Buscar el SKU de un producto con `estado=0` | No aparece | — | ✅ |
| CP-RF02-06 | I | Orden de las rutas | `GET /api/productos/buscar?q=x` | La atiende `buscarProductos`, no `/:id` | No responde `400 "ID inválido"`. | ✅ |
| CP-RF02-07 | I | Alternativas para un producto agotado | `GET /api/productos/{id agotado}/alternativas` | 200 `{criterio:"misma_categoria_con_stock", alternativas:[…]}` | Misma categoría, `stock_actual>0`, excluye el propio producto, máximo 10. | ✅ |
| CP-RF02-08 | U | Alternativas con ID inválido o inexistente | `id=abc` → 400; `id=999999` → 404 | Códigos correctos | — | ✅ |
| CP-RF02-09 | I | Ubicación física en el resultado | `GET /buscar?q=TOR` | Cada fila trae `ubicacion_bodega` | Requisito explícito del ERS. | ⚠️ BE-01 |
| CP-RF02-10 | I | Rendimiento (RNF01) | 1.000 productos cargados, 20 búsquedas | p95 ≤ 2 s | Medido con Postman Runner o `autocannon`. | ✅ |
| CP-RF02-11 | FE·I | Mostrador usa la búsqueda y las alternativas del servidor | Buscar un producto agotado en Mostrador | Se piden `/buscar` y `/alternativas` y se muestran los sustitutos | — | ⚠️ CNT-05 |

### RF03 — Notificación de faltantes y órdenes a proveedores

| ID | Tipo | Descripción técnica | Datos de entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF03-01 | I | Umbral "igual o por debajo" | Producto A: `stock=5, min=5`; B: `stock=4, min=5`; C: `stock=6, min=5` | `GET /api/inventario/stock-bajo` devuelve A y B, no C | Ordenado por `stock_actual` ascendente. | ✅ |
| CP-RF03-02 | I | Productos inactivos excluidos de las alertas | Producto con `stock=0` y `estado=0` | No aparece | — | ✅ |
| CP-RF03-03 | I | Resumen coherente con la lista | `GET /api/inventario/resumen` | `productos_stock_bajo` = número de filas de `/stock-bajo` | `valor_inventario` = Σ `stock_actual`·`precio_costo` de los activos. | ✅ |
| CP-RF03-04 | U | Consultas protegidas | `/stock-bajo` sin token | 401 | — | ✅ |
| CP-RF03-05 | FE·I | Panel y Reabastecimiento usan el mismo criterio que el backend | Producto A del CP-RF03-01 | A aparece en las alertas del Panel | — | ⚠️ CNT-04 |
| CP-RF03-06 | I | Consolidación por proveedor y orden de reabastecimiento | `GET /api/proveedores`, `POST /api/ordenes-compra` | 201 con cabecera y detalle | — | BLQ |

### RF04 — Gestión del catálogo de productos y unidades

| ID | Tipo | Descripción técnica | Datos de entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF04-01 | I | Alta válida por el Administrador | `POST /api/productos` con `TOKEN_ADMIN` `{id_categoria:1, sku:"QA-001", nombre:"Martillo QA", precio_costo:5000, precio_venta:7000, stock_minimo:5, unidad_medida:"Unidad", ubicacion_bodega:"B-01 / E-02"}` | 201 `{id_producto}` | Fila en la BD con `stock_actual=0` y `estado=1`. | ✅ |
| CP-RF04-02 | U | Campos de texto obligatorios y su longitud | `sku:""`, `sku` de 51 caracteres, `nombre` de 151, sin `unidad_medida` | 400 `"Campo <x> inválido"` | — | ✅ |
| CP-RF04-03 | U | Precios y stock mínimo | `precio_venta:-1`, sin `precio_costo`, `stock_minimo:"abc"` | 400 `"Precios inválidos"` / `"Stock mínimo inválido"` | — | ✅ |
| CP-RF04-04 | I | SKU duplicado | Repetir el CP-RF04-01 | 409 `"El SKU o código de barras ya existe"` | No se crea un duplicado. | ✅ |
| CP-RF04-05 | I | Categoría inexistente | `id_categoria:9999` | 400 `"La categoría indicada no existe"` | — | ✅ |
| CP-RF04-06 | I | Rol no Administrador | CP-RF04-01 con `TOKEN_CAJERO` | 403 | — | ✅ |
| CP-RF04-07 | FE·U | Lectura de las columnas de la BD | `normalizarProducto({stock_actual:"5.000", stock_minimo:"8.000", precio_venta:"7000.00", estado:0})` | `{stock:5, minimo:8, precio:7000, activo:false}` | Prueba que ya existe en `tests/api.test.mjs`. | ✅ |
| CP-RF04-08 | FE·I | El stock inicial no es editable en el alta | Crear un producto escribiendo `stock_actual=50` | La interfaz no permite el campo, o avisa que el stock entra por Movimientos | — | ⚠️ CNT-07 |
| CP-RF04-09 | I | Regla de conversión para venta fraccionada (m, kg, L) | — | — | — | BLQ (sin campo en el modelo) |

### RF05 — Modificación de artículos y control de entradas

| ID | Tipo | Descripción técnica | Datos de entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF05-01 | I | Modificar precio | `PUT /api/productos/{id}` con `TOKEN_ADMIN` y el producto completo con `precio_venta:7500` | 200 `"Producto actualizado correctamente"` | `GET /:id` refleja el cambio; `stock_actual` no cambia. | ✅ |
| CP-RF05-02 | U | ID inválido o inexistente | `PUT /productos/abc` → 400; `PUT /productos/999999` → 404 | Códigos correctos | — | ✅ |
| CP-RF05-03 | I | Registrar una entrada | `POST /api/inventario/movimientos` `{id_producto, tipo:"Entrada", cantidad:10, motivo:"Compra REM-001"}` | 201 `{id_movimiento, stock_anterior:S, stock_actual:S+10}` | Fila en `movimiento_inventario` con el `id_usuario` del token. | ✅ |
| CP-RF05-04 | I | No se puede suplantar al autor | Igual que CP-RF05-03 con `id_usuario:<otro>` en el body | 201 | La BD guarda el `id_usuario` del token, no el del body. | ✅ |
| CP-RF05-05 | I | Salida con stock insuficiente (se revierte) | Stock 3; `tipo:"Salida", cantidad:5` | 409 `"Stock insuficiente"` | `stock_actual` sigue en 3 y no se inserta ningún movimiento. | ✅ |
| CP-RF05-06 | U | Validar la cantidad | `0`, `-1`, `1.2345`, `"5"`, `10000000` | 400 `"Cantidad invalida. Maximo 3 decimales"` | `2.125` sí se acepta. | ✅ |
| CP-RF05-07 | U | Validar el tipo y el motivo | `tipo:"Ajuste"`; `motivo` de 256 caracteres | 400 | — | ✅ |
| CP-RF05-08 | I | Concurrencia (`FOR UPDATE`) | Stock 10; dos `Salida` de 6 en paralelo | Una responde 201 y la otra 409 | El stock final es 4, nunca negativo. | ✅ |
| CP-RF05-09 | I | Movimiento sobre un producto inactivo | Producto con `estado=0` | 404 `"Producto activo no encontrado"` | — | ✅ |
| CP-RF05-10 | I | Historial de auditoría | `GET /api/inventario/movimientos` | Hasta 100 filas, de la más reciente a la más antigua, con `producto` y `usuario` | — | ✅ |
| CP-RF05-11 | FE·I | Registrar una entrada desde la interfaz | Formulario de Movimientos | Llega al backend y se refresca el stock | — | ⚠️ CNT-02 |
| CP-RF05-12 | I | Salida registrada por el Cajero | `POST /movimientos` con `TOKEN_CAJERO`, `tipo:"Salida"` | Según la decisión de BE-05 | — | ⚠️ BE-05 (por definir) |

### RF06 — Baja lógica de artículos

| ID | Tipo | Descripción técnica | Datos de entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF06-01 | I | Baja lógica por el Administrador | `DELETE /api/productos/{id}` con `TOKEN_ADMIN` | 200 `"Producto desactivado correctamente"` | En la BD: `estado=0` y la fila **no** se borra. | ✅ |
| CP-RF06-02 | I | El producto deja de estar disponible para la venta | Después del CP-RF06-01: `GET /productos`, `GET /productos/{id}`, `/buscar` | No aparece en la lista; `/:id` responde 404 | — | ✅ |
| CP-RF06-03 | I | El historial se conserva | `GET /api/inventario/movimientos` | Los movimientos anteriores del producto siguen apareciendo | Los reportes y la auditoría no cambian. | ✅ |
| CP-RF06-04 | I | Baja repetida | `DELETE` del mismo ID otra vez | 404 | — | ✅ |
| CP-RF06-05 | I | Sin permiso | `DELETE` con `TOKEN_CAJERO` → 403; sin token → 401 | — | `estado` no cambia. | ✅ |
| CP-RF06-06 | FE·I | Inactivar desde el Catálogo | Botón "Inactivar" con un motivo | El backend recibe un `DELETE` y el producto queda inactivo | — | ⚠️ CNT-03 |

### Pruebas transversales

| ID | Tipo | Descripción | Entrada | Resultado esperado | Estado |
|---|---|---|---|---|---|
| CP-TR-01 | I | JSON mal formado | `POST /api/productos` con body `{malformado` | 400 `{"mensaje":"JSON invalido"}` | ✅ |
| CP-TR-02 | I | Ruta inexistente | `GET /api/noexiste` | 404 `{"mensaje":"Ruta no encontrada"}` | ✅ |
| CP-TR-03 | I | Body demasiado grande | Body de más de 100 KB | 413 (o 400) en JSON, sin traza | ✅ |
| CP-TR-04 | FE·U | Backend caído | `fetch` simulado lanza `TypeError` | `"No se pudo conectar con la API…"` y no se muestra un éxito falso | ✅ (ya existe) |

---

## 5. Criterios para desbloquear el Ciclo 1

1. **Backend:** rotar la contraseña de MariaDB expuesta (SEC-001) y corregir BE-01.
2. **Frontend / Contrato:** cerrar CNT-01, CNT-02 y CNT-03 (bloqueantes) y CNT-04.
3. **Ambos equipos:** confirmar que `npm run build`, `npm run lint` y `npm run test:unit` pasan en el equipo de desarrollo.
4. **Analista:** decidir el alcance de BE-03 (registro), BE-05 (salidas del Cajero) y RF03 (proveedores) para este ciclo. Los casos marcados como **BLQ** quedan fuera del Ciclo 1 si no se implementan.

> **Nota sobre las pruebas unitarias del backend:** `prog_1` no tiene un framework de pruebas (solo el script manual `pruebas/probar-seguridad.ps1`). Para los casos **U** se recomienda usar `node:test` (incluido en Node, sin dependencias nuevas), como ya hace el frontend, simulando los módulos `services/*` y `config/database`.
