# Reporte Maestro de QA — ControlStock · Ciclo 1

**Proyecto:** ControlStock · PeakPerformers (ERS IEEE 830, RF01–RF06 / RNF01–RNF06)
**Responsable QA:** RuseBeT_23 · **Última actualización:** 26/11/2026
**Documento único:** reemplaza a `reporte_de_hallazgos_qa.md` (10–11/11), `reporte_revision_post_correccion_ciclo1.md` (12/11) y `reporte_avance_qa_2026-11-19.md` (19/11). Las versiones anteriores siguen en el historial de Git (commits `e361b78`, `acbd4a8` y `157de32`).

**Leyenda de estado:**
- ✅ Aprobado o corregido, con evidencia.
- 🟡 Pendiente: falta ejecutarlo con MariaDB o falta una confirmación.
- ⛔ Bloqueado en la UI: el backend está listo, pero la pantalla no está conectada o llama a otra ruta.
- ⚠️ Abierto, no bloqueante.
- ❌ No implementado o abierto sin cambios.

---

## 1. Estado actual (19/11/2026)

| Área | Estado |
|---|---|
| Seguridad del backend (JWT + roles) | ✅ JWT HS256 (`iss=controlstock`, vence en 8 h). Middlewares `autenticar`, `soloAdministrador`, `puedeVender` (Administrador o Cajero) y `autenticarOpcional` (consulta pública sin costos). |
| Proveedores, compras y recepción (RF03) | ✅ Implementado en el backend: CRUD de `/proveedores`, `/compras`, recepción que solo se puede hacer una vez (`/compras/:id/recibir`) y `/abastecimiento` (faltantes agrupados por proveedor y generación de órdenes). |
| Ventas con descuento de inventario | ✅ Implementado en el backend: `/ventas` usa una transacción con `FOR UPDATE`, responde 409 si no hay stock y revierte todo. |
| Búsqueda y equivalencias (RF02) | 🟡 Búsqueda por SKU, código de barras, nombre y especificación. **Sigue faltando `ubicacion_bodega`** en los resultados (BE-01). |
| Dashboard y reportes | ✅ Backend: `/reportes/dashboard` y `/reportes/ventas-resumen` (solo Administrador). |
| Pruebas automatizadas | ✅ **19/19:** backend 14/14 y frontend 5/5. |
| Prueba integral con MariaDB | 🟡 **Sin evidencia** (sección 6). |
| Integración con la UI | ⛔ **Bloqueada** por CNT-01, CNT-02, CNT-03 y CNT-10. El frontend no cambia desde `652dd3a` (12/11). |

**Dictamen:** el backend está **listo para las pruebas de API**, siempre que se aplique `migrations/001_producto_proveedor.sql` y se entregue la evidencia de la prueba integral. Las pruebas por la interfaz siguen **bloqueadas** hasta que el frontend corrija los desajustes de contrato de la sección 4.

---

## 2. Historial de auditoría

| Fecha | Ramas / commits | Tipo de revisión | Resultado |
|---|---|---|---|
| 10–11/11/2026 | `prog_1` (backend), `prog_2` (frontend) | Estática | ⛔ Bloqueado. Backend sin autenticación ni roles (BUG-001), `.env` versionado (SEC-001); frontend con datos fijos y sin llamadas HTTP (BUG-002); contrato desalineado (CON-001). |
| 12/11/2026 | `prog_1@54d313c`, `prog_2@652dd3a` | Estática + diseño de casos RF01–RF06 | 🟡 Seguridad corregida. Contrato bloqueado por CNT-01/02/03. Nuevos BE-01 a BE-08 y CNT-04 a CNT-09. |
| 19/11/2026 | `feature/proveedores-compras@2573f3a` (backend), `main@ceb73cf` (frontend) | Estática + ejecución de pruebas automatizadas | ✅ Backend con RF03 y ventas, 19/19 pruebas. ⛔ UI bloqueada (aparece CNT-10). Nuevos BE-09 a BE-13 y CNT-10 a CNT-14. |

**Ramas vigentes al 19/11/2026** (después de `git fetch --all --prune`):

| Rama remota | Último commit | Comentario |
|---|---|---|
| `origin/main` | `ceb73cf` (12/11) — PR #5 | Incluye backend `prog_1`, frontend `prog_2` y los reportes de QA del 12/11. |
| `origin/feature/proveedores-compras` | `2573f3a` (19/11) | Backend nuevo. Sale de `bugfix/seguridad-roles` y todavía no tiene PR hacia `main` (BE-12). |
| `origin/feature/unit-tests` | `157de32` (12/11) | Rama de QA. Ya está integrada en `main`. |
| `origin/bugfix/seguridad-roles` | `68b7d59` (12/11) | Integrada en `prog_1` y `main`. |
| `origin/prog_1` / `origin/prog_2` | `54d313c` / `652dd3a` (12/11) | Integradas en `main`. |

---

## 3. Hallazgos

### 3.1 Resueltos (cerrados)

| ID | Hallazgo | Cierre | Evidencia |
|---|---|---|---|
| BUG-001 | Sin autenticación ni control por rol; `id_usuario` tomado del body | 12/11 | `auth.middleware.js` y `soloAdministrador`. El `id_usuario` sale del token. La prueba unitaria "auditoría" lo cubre. |
| BUG-002 | Frontend sin sesión y con datos fijos | 12/11 | `App.jsx` manda a `#/login` cuando no hay sesión; `services/api.js` y `useApiList`. |
| CON-001 | Nombres de campo distintos entre el frontend y la BD | 12/11 | `normalizarProducto()`; el frontend envía las columnas de la BD. |
| IMP-001 | Pools de conexión duplicados; sin manejo global de errores | 12/11 | `config/db.js` reexporta `database.js`; `app.js` responde 404, 400 y 500 en JSON. |
| BE-05 | El Cajero no podía registrar salidas por venta | 19/11 | `POST /api/ventas` con `puedeVender`; registra el movimiento `Salida` "Venta #id". |
| OBS-001 (RF03) | Sin proveedores ni órdenes de compra | 19/11 (backend) | `/proveedores`, `/compras`, `/compras/:id/recibir`, `/abastecimiento/*`. |

### 3.2 Pendientes

| ID | Severidad | RF/RNF | Estado | Descripción | Acción sugerida | Responsable |
|---|---|---|---|---|---|---|
| SEC-001 | Alta | RNF02 | 🟡 | El `.env` ya no está en el árbol, pero la credencial real sigue en el historial (`cb0d98b`). | Rotar `DB_PASSWORD` y las claves que se pegaron en chats; confirmarlo a QA. | Backend |
| BE-01 | Media | RF02 | ❌ | `/productos/buscar` no devuelve `ubicacion_bodega` ni `unidad_medida`. Además `/buscar` es público y la vista pública oculta la ubicación. | Agregar las columnas; la Analista define si la ubicación se ve solo con sesión. | Backend + Analista |
| BE-02 | Baja | RF02 | 🟡 Aceptado | Las alternativas se buscan por categoría, no por equivalencia técnica. La respuesta trae `advertencia` y existe `/productos/:id/especificaciones`. | Equivalencia técnica en un ciclo posterior. | Analista |
| BE-03 | Media | RF01 | ❌ | Faltan `POST /auth/registro` y `/auth/recuperar`. | Implementarlos o documentar que el alta la hace el Administrador. | Backend + Analista |
| BE-04 | Media | RF01 | ❌ | El login devuelve solo `{token, tipo, vence_en}`; `/auth/me` no incluye `nombre`. | Incluir `nombre` y `rol` en el login o en `/me` (ver CNT-01). | Backend |
| BE-06 | Baja | RNF04 | ✅ Cerrado 26/11 | `server.js` exige `JWT_SECRET` ≥ 32 caracteres y termina con código 1 si la BD falla (SEG-27). | — | — |
| BE-07 | Baja | RNF02 | ✅ Cerrado 26/11 | Login limitado a 5 fallos / 15 min por IP (429) y CORS restringido a `FRONTEND_URL` (SEG-20, SEG-21, SEG-22). | Detrás de un proxy, configurar `trust proxy`. | Backend |
| BE-08 | Baja | RF06 | ❌ | La baja lógica no guarda el motivo. | Agregar una columna o tabla de auditoría. | Backend |
| BE-09 | Media | RNF02 | ❌ | El Cajero autenticado ve costos en `GET /compras`, `/abastecimiento/faltantes`, `/abastecimiento/vinculos` y `GET /productos` (`precio_costo`). | Usar `soloAdministrador` o la vista sin costos. | Backend |
| BE-10 | Baja | RNF05 | ❌ | `reportes.controller.js` usa nombres de columna fijos (`total_venta`, `fecha_hora`, `precio_unitario`); `ventas.service.js` detecta variantes del esquema. | Usar el mismo detector de esquema o fijar uno solo. | Backend |
| BE-11 | Baja | RNF05 | ❌ | `README_BACKEND.md` tiene una ruta local con nombre de usuario y cita ZIPs y scripts que no existen (`TODO_PARA_JUEVES.ps1`, `PREPARAR_BD.ps1`, `README_ENTREGA_JUEVES.md`). | Limpiar el README. | Backend |
| BE-12 | Info | Proceso | ⚠️ | `feature/proveedores-compras` sale de `bugfix/seguridad-roles`, no de `main`. | Abrir el PR hacia `main` y resolver conflictos en `app.js` y las rutas. | Backend |
| BE-13 | Info | RF03 | ⚠️ | `/abastecimiento/faltantes` excluye `stock_minimo = 0`: un producto agotado con mínimo 0 no genera alerta. | La Analista confirma la regla. | Analista |

---

## 4. Contrato de API: frontend (`main@ceb73cf`) frente al backend (`2573f3a`)

| ID | Severidad | Pantalla | Frontend llama a | Backend expone | Estado |
|---|---|---|---|---|---|
| CNT-01 | **Bloqueante** | Login / AppLayout | Lee `usuario.rol` e `id_rol` de la respuesta del login | El login no devuelve `usuario`; `/auth/me` → `{id_usuario, rol}` | ⛔ Abierto. Todos aparecen como "Usuario" y se oculta el menú del Administrador. Corrección: llamar a `/auth/me` después del login (y BE-04). |
| CNT-02 | **Bloqueante** | Movimientos | `GET/POST /api/movimientos` | `/api/inventario/movimientos` | ⛔ Abierto. Responde 404. |
| CNT-03 | **Bloqueante** | Catálogo (inactivar) | `PUT /productos/:id {estado:0}` | `DELETE /productos/:id` | ⛔ Abierto. Responde 400 "Categoría inválida". |
| CNT-04 | Alta | Panel / Reabastecimiento | Calculan en el navegador con `stock < minimo` | `/inventario/stock-bajo` y `/abastecimiento/faltantes` usan `<=` y agrupan por proveedor | ⚠️ Abierto. Un producto justo en el mínimo no genera alerta. |
| CNT-05 | Media | Mostrador (búsqueda) | Filtra en el navegador | `/productos/buscar`, `/alternativas` | ⚠️ Abierto. |
| CNT-06 | Media | Catálogo (inactivos) | Muestra el conteo de inactivos | `GET /productos` devuelve solo los activos | ⚠️ Abierto. |
| CNT-07 | Media | Catálogo (stock) | Deja editar `stock_actual` | Se ignora (correcto) | ⚠️ Abierto. La interfaz confunde al usuario. |
| CNT-08 | Info | Varias | `/auth/registro`, `/auth/recuperar`, `/usuarios` | No existen | ⚠️ 404 controlado. |
| CNT-09 | Baja | Usuarios | `#/usuarios` se abre escribiendo la URL | `/usuarios` no existe | ⚠️ Protegerlo con `soloAdministrador` cuando exista. |
| CNT-10 | **Bloqueante** | Orden de compra | `POST /api/ordenes-compra` | `POST /api/compras` `{id_proveedor, detalles[{id_producto, cantidad, costo_unitario}]}` | ⛔ **Nuevo.** Responde 404; el cuerpo sí es compatible. |
| CNT-11 | Media | Recepción de compra | No hay pantalla | `POST /api/compras/:id/recibir` | ⚠️ Nuevo. La recepción no se puede probar desde la UI. |
| CNT-12 | Media | Panel | Calcula los indicadores con `/productos` | `/reportes/dashboard` | ⚠️ Nuevo. |
| CNT-13 | — | Mostrador (venta) | `POST /api/ventas` | `POST /api/ventas` (el precio sale de la BD) | ✅ Compatible. |
| CNT-14 | — | Reabastecimiento | `GET /api/proveedores` | `GET /api/proveedores` | ✅ Compatible. |

---

## 5. Evidencia de ejecución (19/11/2026)

**Entorno:** Windows 11, Node v22. Copia de `2573f3a:backend` y `main:frontend` extraída con `git archive`, con `npm ci` limpio.

| # | Comando | Resultado |
|---|---|---|
| E-01 | `cd backend && npm run check` | ✅ 38 archivos, 0 errores de sintaxis |
| E-02 | `cd backend && npm test` | ✅ **14/14** (`unitarios.test.js` + `integral-contrato.test.js`) |
| E-03 | `cd frontend && node --test tests/*.test.mjs` | ✅ **5/5** |
| E-04 | `node scripts/preparar-pruebas.js` | 🟡 No ejecutado (sin MariaDB ni `.env` en el equipo de QA) |
| E-05 | `pruebas/probar-entrega-jueves.ps1` → `prueba-integral.js` | 🟡 Pendiente (sección 6) |
| E-06 | `npm run build` / `npm run lint` del frontend | 🟡 No ejecutado |

> Las pruebas del backend usan una BD simulada. No prueban el SQL real, la concurrencia con `FOR UPDATE` ni el esquema de MariaDB; eso solo lo verifica E-05.

---

## 6. Pendientes de validación con MariaDB

| # | Pendiente | Quién | Criterio de cierre |
|---|---|---|---|
| DB-01 | Aplicar `migrations/001_producto_proveedor.sql` (tablas `producto_proveedor` y `producto_especificacion`) | Backend | `preparar-pruebas.js` sin errores |
| DB-02 | Ejecutar E-04 y E-05 con las cuentas de Administrador y Cajero | Backend | Salida `PRUEBA INTEGRAL APROBADA` o el archivo `ControlStock_QA_*.json` entregado a QA |
| DB-03 | Pasar a ✅ o ❌ todos los casos 🟡 de la sección 7 | QA | Matriz actualizada en este documento |
| DB-04 | Concurrencia: dos ventas o salidas en paralelo (CP-RF05-08) | QA | El stock nunca queda negativo |
| DB-05 | Rendimiento RNF01 (CP-RF02-10) | QA | p95 ≤ 2 s con 1.000 productos |
| DB-06 | Confirmar la rotación de `DB_PASSWORD` (SEC-001) | Backend | Confirmación escrita |

---

## 7. Matriz de casos de prueba

**Tipo:** U = unitaria · I = integración (API + MariaDB) · FE = frontend.
**Preparación común:** roles Administrador (1), Cajero (2) y Bodega (3). Cuentas de prueba `administrador.test@…` y `cajero.test@…`. `TOKEN_ADMIN` y `TOKEN_CAJERO` se obtienen con `POST /api/auth/login`. Los datos de prueba llevan el prefijo `QA-`.

### 7.1 Flujos críticos (30 casos)

| ID | Flujo | Endpoint(s) | Datos / pasos | Resultado esperado | API | UI |
|---|---|---|---|---|---|---|
| CP-AUT-01 | Login Administrador | `POST /auth/login`, `GET /auth/me` | Cuenta de Administrador | 200 + token; `/me` → `rol:"Administrador"` | 🟡 | ⛔ CNT-01 |
| CP-AUT-02 | Login Cajero | Ídem | Cuenta de Cajero | `/me` → `rol:"Cajero"` | 🟡 | ⛔ CNT-01 |
| CP-AUT-03 | Sin token y rol insuficiente | `DELETE /productos/:id` | Sin token / `TOKEN_CAJERO` | 401 / 403 | ✅ U | — |
| CP-CAT-01 | Crear categoría | `POST /categorias` | `{nombre_categoria:"QA-…"}` con `TOKEN_ADMIN` | 201 | 🟡 | 🟡 |
| CP-PRO-01 | Crear producto | `POST /productos` | Producto `QA-*` | 201, `stock_actual=0` | 🟡 | 🟡 |
| CP-PRO-02 | Catálogo público sin costos | `GET /productos` sin token | — | 200 sin `precio_costo` ni `ubicacion_bodega` | 🟡 | — |
| CP-INV-01 | Resumen público frente a autenticado | `GET /inventario/resumen` | Sin token / con token | Sin token no trae `valor_inventario` | 🟡 | — |
| CP-INV-02 | Existencias y movimientos | `GET /inventario/existencias`, `/movimientos` | `TOKEN_ADMIN` | 200; movimientos solo para el Administrador | 🟡 | ⛔ CNT-02 |
| CP-PRV-01 | Crear proveedor | `POST /proveedores` | `{nit_rut, razon_social, correo}` | 201; NIT duplicado → 409 | 🟡 | ❌ sin pantalla |
| CP-PRV-02 | Eliminar proveedor con órdenes | `DELETE /proveedores/:id` | Proveedor con una orden | 409 "tiene órdenes asociadas" | 🟡 | — |
| CP-COM-01 | Crear orden de compra | `POST /compras` | `{id_proveedor, detalles:[{id_producto, cantidad:5, costo_unitario:1200}]}` | 201 `{id_orden, total:6000}`, estado `Pendiente` | 🟡 | ⛔ CNT-10 |
| CP-COM-02 | Recibir orden | `POST /compras/:id/recibir` | Orden pendiente | 200; el stock sube en la cantidad; movimiento `Entrada`; estado `Recibida` | 🟡 | ⛔ CNT-11 |
| CP-COM-03 | Recibir dos veces | Repetir CP-COM-02 | — | 409; el stock no cambia | 🟡 | — |
| CP-COM-04 | Validar la orden | `POST /compras` | Producto repetido, `cantidad:0`, `costo_unitario:1.234` | 400 | 🟡 | — |
| CP-VEN-01 | La venta descuenta inventario | `POST /ventas` | Stock 8; venta de 2 | 201; stock 6; `detalle_venta` y movimiento `Salida` "Venta #id" | ✅ U / 🟡 BD | 🟡 (CNT-13 compatible) |
| CP-VEN-02 | Venta sin stock | `POST /ventas` | Cantidad mayor que el stock | 409; se revierte todo | ✅ U / 🟡 BD | 🟡 |
| CP-VEN-03 | Esquema real | — | Columnas `id_cajero` y `total_venta` | Se insertan en las columnas reales | ✅ U | — |
| CP-VEN-04 | Precio y usuario no manipulables | `POST /ventas` | `precio_unitario:1` e `id_usuario` ajeno en el body | Se usan el precio de la BD y el usuario del token | ✅ U | — |
| CP-VEN-05 | El Cajero vende pero no administra | `POST /ventas`, `DELETE /productos/:id` | `TOKEN_CAJERO` | 201 / 403 | ✅ U / 🟡 BD | ⛔ CNT-01 |
| CP-VEN-06 | Validar la venta | `POST /ventas` | `metodo_pago:""`, documento de 31 caracteres, producto repetido, 0 líneas | 400 sin tocar la BD | ✅ U | — |
| CP-BUS-01 | Búsqueda por SKU, código o nombre | `GET /productos/buscar?q=QA-…` | — | 200 con coincidencias | 🟡 | ⛔ CNT-05 |
| CP-BUS-02 | Búsqueda por especificación | `GET /buscar?q=x&especificacion=UNC` | Producto con especificación | Lo encuentra | 🟡 | ❌ sin UI |
| CP-BUS-03 | Ubicación física en el resultado | `GET /buscar` | — | Incluye `ubicacion_bodega` | ❌ BE-01 | — |
| CP-STK-01 | Alerta "igual o por debajo" | `GET /inventario/stock-bajo` | `stock = mínimo` | Aparece en la lista | 🟡 | ⚠️ CNT-04 |
| CP-ABS-01 | Faltantes agrupados por proveedor | `GET /abastecimiento/faltantes` | Producto bajo el mínimo con proveedor vinculado | Aparece en `grupos[]`; sin vínculo → `sin_proveedor[]` | 🟡 | ⚠️ CNT-04 |
| CP-ABS-02 | Generar órdenes sin duplicar | `POST /abastecimiento/generar` dos veces | — | La 1.ª crea órdenes; la 2.ª las deja en `omitidos` | 🟡 | ❌ sin UI |
| CP-REP-01 | Dashboard | `GET /reportes/dashboard` | Administrador / Cajero / sin token | 200 / 403 / 401 | 🟡 | ⚠️ CNT-12 |
| CP-REP-02 | Resumen de ventas por período | `GET /reportes/ventas-resumen?desde=…&hasta=…` | Fecha inválida o `desde > hasta` | 200 / 400 | 🟡 | ❌ sin UI |
| CP-SEG-01 | El Cajero no ve costos | `/abastecimiento/faltantes`, `/compras` con `TOKEN_CAJERO` | — | 403 o datos sin costo | ❌ BE-09 | — |
| CP-SEG-02 | Rotación de credenciales | — | Confirmar con el backend | `DB_PASSWORD` rotada | 🟡 SEC-001 | — |

### 7.2 RF01 — Usuarios y autenticación por roles

| ID | Tipo | Descripción | Entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF01-01 | I | Login válido | `POST /auth/login` con la cuenta de Administrador | 200 `{mensaje, token, tipo:"Bearer", vence_en:"8h"}` | JWT con `iss=controlstock` y `sub=id_usuario` | 🟡 |
| CP-RF01-02 | I | Contraseña incorrecta | Correo válido y contraseña errada | 401 "Credenciales invalidas" | No se emite token | 🟡 |
| CP-RF01-03 | I | Correo inexistente | `noexiste@x.com` | 401 con el mismo mensaje que CP-RF01-02 | No revela si la cuenta existe | 🟡 |
| CP-RF01-04 | U | Validar la entrada | `{}`, `{correo:123}`, contraseña de 257 caracteres | 400 | No consulta la BD | 🟡 |
| CP-RF01-05 | I | Usuario desactivado | `estado=0`; login y `/me` con un token emitido antes | 401 en ambos | El acceso se revoca sin esperar a que venza el token | 🟡 |
| CP-RF01-06 | I | Ruta privada sin token | `DELETE /productos/:id` sin `Authorization` | 401 | Ningún endpoint privado responde 2xx sin token | ✅ U |
| CP-RF01-07 | U | Token manipulado o vencido | Otra clave, `exp` pasado, `Bearer abc` | 401 | Sin 500 ni traza del error | 🟡 |
| CP-RF01-08 | I | Rol insuficiente | `POST /productos` con `TOKEN_CAJERO` | 403 | No se inserta nada | ✅ U |
| CP-RF01-09 | I | Perfil de sesión | `GET /auth/me` con `TOKEN_ADMIN` | 200 `{id_usuario, rol:"Administrador"}` | El rol coincide con la tabla `rol` | 🟡 |
| CP-RF01-10 | FE | Pantalla protegida sin sesión | `sessionStorage` vacío; abrir `#/catalogo` | Redirige a `#/login` | — | 🟡 |
| CP-RF01-11 | FE·U | Sesión vencida | `fetch` simulado responde 401 | `ApiError(401)` y se borra la sesión | Vuelve al login | 🟡 |
| CP-RF01-12 | FE·I | Rol visible después del login | Login como Administrador | El menú muestra "Usuarios y permisos" | — | ⛔ CNT-01 |
| CP-RF01-13 | I | Registro de usuario | `POST /auth/registro` | 201, contraseña guardada con bcrypt | — | ❌ BE-03 |

### 7.3 RF02 — Búsqueda de stock y equivalencias

| ID | Tipo | Descripción | Entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF02-01 | I | Búsqueda por SKU | `GET /productos/buscar?q=<SKU>` | 200 con el SKU | Solo activos; máximo 50 resultados | 🟡 |
| CP-RF02-02 | I | Por código de barras y por nombre parcial | `q=<codigo>`, `q=tornillo` | Coinciden los esperados | Igual a una consulta directa en la BD | 🟡 |
| CP-RF02-03 | U | Validar `q` | Vacío, espacios, 101 caracteres | 400 | No ejecuta SQL | 🟡 |
| CP-RF02-04 | I | Inyección SQL | `q=%`, `q=' OR 1=1 --` | `[]` o solo coincidencias literales | Sin 500 y sin devolver todo el catálogo | 🟡 |
| CP-RF02-05 | I | Inactivos excluidos | SKU de un producto con `estado=0` | No aparece | — | 🟡 |
| CP-RF02-06 | I | Orden de las rutas | `GET /productos/buscar?q=x` | La atiende `buscar`, no `/:id` | No responde 400 "ID inválido" | 🟡 |
| CP-RF02-07 | I | Alternativas para un producto agotado | `GET /productos/{id}/alternativas` | Misma categoría con stock > 0, máximo 10, con `advertencia` | Excluye el propio producto | 🟡 |
| CP-RF02-08 | U | ID inválido o inexistente | `abc` → 400; `999999` → 404 | Códigos correctos | — | 🟡 |
| CP-RF02-09 | I | Ubicación física | `GET /buscar?q=TOR` | Cada fila trae `ubicacion_bodega` | Requisito del ERS | ❌ BE-01 |
| CP-RF02-10 | I | Rendimiento (RNF01) | 1.000 productos, 20 búsquedas | p95 ≤ 2 s | Postman Runner o `autocannon` | 🟡 |
| CP-RF02-11 | FE·I | Mostrador usa la búsqueda y las alternativas del servidor | Buscar un producto agotado | Se muestran sustitutos | — | ⛔ CNT-05 |

> Desde `2573f3a`, `/buscar` y `/alternativas` son públicos (no exigen token).

### 7.4 RF03 — Faltantes y órdenes a proveedores

| ID | Tipo | Descripción | Entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF03-01 | I | Umbral "igual o por debajo" | A: 5/5, B: 4/5, C: 6/5 | `/inventario/stock-bajo` devuelve A y B, no C | Ordenado por stock ascendente | 🟡 |
| CP-RF03-02 | I | Inactivos excluidos | `stock=0`, `estado=0` | No aparece | — | 🟡 |
| CP-RF03-03 | I | Resumen coherente con la lista | `/inventario/resumen` | `productos_stock_bajo` = filas de `/stock-bajo` | `valor_inventario` = Σ stock × costo | 🟡 |
| CP-RF03-04 | U | Consulta protegida | `/stock-bajo` sin token | 401 | — | 🟡 |
| CP-RF03-05 | FE·I | Panel con el mismo criterio que el backend | Producto A | A aparece en las alertas | — | ⚠️ CNT-04 |
| CP-RF03-06 | I | Consolidación por proveedor y órdenes | Ver CP-ABS-01/02 y CP-COM-01 | — | — | 🟡 |

### 7.5 RF04 — Catálogo de productos

| ID | Tipo | Descripción | Entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF04-01 | I | Alta por el Administrador | `POST /productos` (SKU `QA-001`, precios, mínimo, unidad, ubicación) | 201 `{id_producto}` | `stock_actual=0`, `estado=1` | 🟡 |
| CP-RF04-02 | U | Textos obligatorios y longitud | `sku:""`, SKU de 51 caracteres, nombre de 151, sin unidad | 400 | — | 🟡 |
| CP-RF04-03 | U | Precios y stock mínimo | `precio_venta:-1`, sin costo, `stock_minimo:"abc"` | 400 | — | 🟡 |
| CP-RF04-04 | I | SKU duplicado | Repetir CP-RF04-01 | 409 | No se crea un duplicado | 🟡 |
| CP-RF04-05 | I | Categoría inexistente | `id_categoria:9999` | 400 | — | 🟡 |
| CP-RF04-06 | I | Rol no Administrador | CP-RF04-01 con `TOKEN_CAJERO` | 403 | — | 🟡 |
| CP-RF04-07 | FE·U | Lectura de las columnas de la BD | `normalizarProducto({...})` | `{stock, minimo, precio, activo}` | `tests/api.test.mjs` | ✅ (E-03) |
| CP-RF04-08 | FE·I | El stock no se edita en el alta | Escribir `stock_actual=50` | Campo deshabilitado o con aviso | — | ⚠️ CNT-07 |
| CP-RF04-09 | I | Venta fraccionada (m, kg, L) | — | — | — | ❌ sin campo en el modelo |

### 7.6 RF05 — Modificación y control de entradas

| ID | Tipo | Descripción | Entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF05-01 | I | Modificar el precio | `PUT /productos/{id}` con `precio_venta:7500` | 200 | El stock no cambia | 🟡 |
| CP-RF05-02 | U | ID inválido o inexistente | `abc` → 400; `999999` → 404 | Códigos correctos | — | 🟡 |
| CP-RF05-03 | I | Registrar una entrada | `POST /inventario/movimientos` `{tipo:"Entrada", cantidad:10}` | 201 con el stock anterior y el nuevo | `id_usuario` del token | 🟡 |
| CP-RF05-04 | I | No se puede suplantar al autor | `id_usuario` ajeno en el body | Se guarda el del token | — | ✅ U |
| CP-RF05-05 | I | Salida con stock insuficiente | Stock 3; salida de 5 | 409 | Sin cambios en la BD | 🟡 |
| CP-RF05-06 | U | Validar la cantidad | `0`, `-1`, `1.2345`, `"5"`, `10000000` | 400; `2.125` se acepta | — | ✅ U |
| CP-RF05-07 | U | Validar el tipo y el motivo | `tipo:"Ajuste"`, motivo de 256 caracteres | 400 | — | 🟡 |
| CP-RF05-08 | I | Concurrencia (`FOR UPDATE`) | Stock 10; dos salidas de 6 en paralelo | Una 201 y otra 409 | Stock final 4 | 🟡 DB-04 |
| CP-RF05-09 | I | Producto inactivo | `estado=0` | 404 | — | 🟡 |
| CP-RF05-10 | I | Historial de auditoría | `GET /inventario/movimientos` | Hasta 100 filas, de la más reciente a la más antigua | — | 🟡 |
| CP-RF05-11 | FE·I | Registrar una entrada desde la UI | Formulario de Movimientos | Llega al backend | — | ⛔ CNT-02 |
| CP-RF05-12 | I | Salida registrada por el Cajero | — | Se cubre con CP-VEN-05 | — | ✅ (BE-05 resuelto) |

### 7.7 RF06 — Baja lógica

| ID | Tipo | Descripción | Entrada | Resultado esperado | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|
| CP-RF06-01 | I | Baja por el Administrador | `DELETE /productos/{id}` | 200 | `estado=0`; la fila no se borra | 🟡 |
| CP-RF06-02 | I | El producto deja de estar disponible | `GET /productos`, `/:id`, `/buscar` | No aparece; `/:id` → 404 | — | 🟡 |
| CP-RF06-03 | I | El historial se conserva | `GET /inventario/movimientos` | Siguen los movimientos anteriores | — | 🟡 |
| CP-RF06-04 | I | Baja repetida | Mismo ID otra vez | 404 | — | 🟡 |
| CP-RF06-05 | I | Sin permiso | `TOKEN_CAJERO` → 403; sin token → 401 | — | `estado` no cambia | ✅ U (401) / 🟡 |
| CP-RF06-06 | FE·I | Inactivar desde el Catálogo | Botón "Inactivar" | El backend recibe un `DELETE` | — | ⛔ CNT-03 |

### 7.8 Pruebas transversales

| ID | Tipo | Descripción | Entrada | Resultado esperado | Estado |
|---|---|---|---|---|---|
| CP-TR-01 | I | JSON mal formado | Body `{malformado` | 400 `{"mensaje":"JSON invalido"}` | 🟡 |
| CP-TR-02 | I | Ruta inexistente | `GET /api/noexiste` | 404 en JSON | 🟡 |
| CP-TR-03 | I | Body mayor de 100 KB | — | 413 o 400 en JSON, sin traza | 🟡 |
| CP-TR-04 | FE·U | Backend caído | `fetch` lanza `TypeError` | Mensaje de conexión, sin éxito falso | ✅ (E-03) |

---

## 8. Criterios de desbloqueo y próximos pasos

1. **Backend (J. Rentería):**
   - Aplicar la migración y ejecutar E-04 y E-05; entregar la evidencia (DB-01, DB-02).
   - Rotar las credenciales (SEC-001).
   - Corregir BE-01 y BE-09 y abrir el PR de `feature/proveedores-compras` hacia `main` (BE-12).
2. **Frontend (J. P. Castillo):** corregir CNT-01, CNT-02, CNT-03 y CNT-10; luego CNT-04, CNT-11 y CNT-12. Ejecutar `npm run build` y `npm run lint` (E-06).
3. **QA:** con la evidencia de E-05, pasar los casos 🟡 a ✅ o ❌ en este documento e iniciar las pruebas de interfaz de punta a punta.
4. **Analista:** decidir BE-01 (¿la ubicación se ve solo con sesión?), BE-03 (alcance del registro) y BE-13.

---

## Ciclo 2: Ejecución de Pruebas Unitarias, Auditoría y Refuerzos de Seguridad

**Fecha de Ejecución:** 26 de noviembre de 2026  
**Rama de Trabajo:** `feature/unit-tests`  
**Resultado Global:** **91/91 pruebas aprobadas (100 % de éxito): 63 backend + 28 frontend**

### 1. Resumen de Resultados por Suite

| Suite / Verificación | Total Casos | Aprobados | Fallidos | Observaciones |
| :--- | :---: | :---: | :---: | :--- |
| Análisis estático (`npm run check`) | 44 archivos | 44 | 0 | Sin errores de sintaxis en backend |
| Backend — Pruebas previas | 26 | 26 | 0 | Suites base operativas |
| Backend — Seguridad (`seguridad.test.js`) | 28 | 28 | 0 | RBAC (3 roles), JWT, SQLi, payloads, baja lógica; SEG-19 a SEG-27: Helmet, CORS, límite de login, solo HS256, endpoints públicos y `JWT_SECRET` ≥ 32 |
| Backend — Reglas de negocio (`negocio.test.js`) | 9 | 9 | 0 | Atomicidad en ventas, stock mínimo y soft delete; NEG-10: orden BEGIN → FOR UPDATE → UPDATE → COMMIT |
| Frontend — Pruebas unitarias | 28 | 28 | 0 | Componentes y flujos principales |
| **Total Consolidado** | **91** | **91** | **0** | **0 defectos críticos abiertos en código** |

---

### 2. Defectos Detectados y Corregidos

1. **Enumeración de usuarios por tiempo de respuesta (*Timing Attack*) — `auth.controller.js`**
   * **Hallazgo:** El login omitía la comparación criptográfica cuando el correo no existía en la base de datos, permitiendo inferir cuentas registradas midiendo la latencia.
   * **Corrección:** Se implementó una comparación contra un hash ficticio cuando el usuario no existe, igualando los tiempos de respuesta y retornando un mensaje genérico (`401 Credenciales inválidas`).
2. **Coerción insegura de tipos numéricos — `productos.controller.js`**
   * **Hallazgo:** Entradas como `""`, `true` o `[5]` eran convertidas implícitamente a `0`, `1` o `5` al crear o actualizar productos.
   * **Corrección:** Se agregó validación estricta para aceptar únicamente números finitos o cadenas numéricas válidas.
3. **Error interno `500` ante payloads sobredimensionados — `app.js`**
   * **Hallazgo:** Peticiones JSON superiores a `100 KB` provocaban una excepción no controlada (`500 Internal Server Error`).
   * **Corrección:** Se añadió manejo explícito del error `entity.too.large` respondiendo con estado HTTP `413` en formato JSON estructurado.
4. **Arranque inseguro sin variables críticas (Cierre de BE-06) — `server.js`**
   * **Corrección:** El servidor aborta el inicio si `JWT_SECRET` no está definido o no cumple la longitud mínima, y detiene el arranque con error explícito si falla la conexión inicial con MariaDB.

---

### 3. Refuerzos de Seguridad Aplicados (API y Base de Datos)

#### Capa de Aplicación y Autenticación (Node.js / Express)
* **Cabeceras HTTP (`helmet`):** Protección activa contra *Clickjacking*, *MIME-sniffing* y ocultamiento de la cabecera `X-Powered-By`. Prueba SEG-19.
* **Política CORS estricta:** Origen restringido exclusivamente a la URL autorizada del frontend (`FRONTEND_URL`), bloqueando peticiones cruzadas desde dominios no confiables. Prueba SEG-20. **Cierra BE-07 (CORS).**
* **Protección contra Fuerza Bruta (`express-rate-limit`):** Límite estricto en `/api/auth/login` (la API no usa el prefijo `/v1`) de máximo **5 intentos fallidos cada 15 minutos** por IP (respuesta HTTP `429`); los inicios de sesión correctos no consumen intentos. Pruebas SEG-21 y SEG-22. **Cierra BE-07 (fuerza bruta).**
* **Endurecimiento de JWT:** Validación explícita del algoritmo de firma (`algorithms: ['HS256']`), expiración acotada (`8h`) y exigencia de secreto robusto (`>= 32` caracteres). Pruebas SEG-23 (HS384/HS512 → 401) y SEG-27 (`server.js` termina con código 1).
* **Aislamiento de rutas de diagnóstico:** Restricción de `/api/test-db` y saneamiento de `/api/estado` para evitar fuga de información de infraestructura. `/api/test-db` exige token de Administrador salvo con `NODE_ENV=development`; `/api/estado` devuelve solo `{ "estado": "operativo" }`. Pruebas SEG-24, SEG-25 y SEG-26. **Cierra el hallazgo de endpoints públicos.**

#### Capa de Persistencia (MariaDB)
* **Consultas Parametrizadas:** 100 % de las sentencias SQL utilizan *prepared statements* (`?`), mitigando inyección SQL.
* **Principio de Mínimo Privilegio:** Definición de usuario dedicado de aplicación (`controlstock_app`) con permisos limitados a DML (`SELECT, INSERT, UPDATE, DELETE, EXECUTE`), sin privilegios administrativos ni DDL (`DROP`, `ALTER`).
* **Integridad y Concurrencia:** Reglas `CHECK (stock_actual >= 0)` a nivel de esquema y bloqueo transaccional de fila (`SELECT ... FOR UPDATE`) durante el procesamiento de ventas para evitar condiciones de carrera (*Race Conditions*).

---

### 4. Pendientes y Validaciones de Negocio

* **Visibilidad de costos para rol `Cajero`:** Coherente con la unificación operativa del rol `Cajero` (mostrador + gestión de inventario), pendiente de validación formal con la Analista.
* **Ubicación física en bodega (BE-01):** Pendiente incluir el campo `ubicacion_bodega` en la respuesta del endpoint de búsqueda rápida.

### 5. Cierre de hallazgos (26/11/2026)

| Hallazgo | Estado | Evidencia |
| :--- | :--- | :--- |
| Fuerza bruta en el login (BE-07) | ✅ Cerrado | `express-rate-limit` en `src/middlewares/limite-login.js`; SEG-21, SEG-22 |
| CORS abierto (BE-07) | ✅ Cerrado | `cors({ origin: FRONTEND_URL \|\| 'http://localhost:5173' })`; SEG-20 |
| Endpoints públicos `/api/test-db` y `/api/estado` | ✅ Cerrado | `app.js`; SEG-24, SEG-25, SEG-26 |
| Arranque sin `JWT_SECRET` robusto (BE-06) | ✅ Cerrado | `server.js`; SEG-27 |
| Ubicación en la búsqueda (BE-01) | ❌ Abierto | Pendiente de backend y decisión de la Analista |
| Costos visibles para el Cajero | 🟡 En análisis | Pendiente de validación con la Analista |

**Defectos del ciclo:** 7 reportados, 5 corregidos y 2 en proceso. Casos con incidencia: 3 de 91 (3,3 %): SEG-10, SEG-15 y SEG-16, todos corregidos.
