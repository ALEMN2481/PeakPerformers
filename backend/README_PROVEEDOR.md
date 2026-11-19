# Portal de Proveedor — PeakPerformers / ControlStock

**Estado:** Código desarrollado y pruebas unitarias aprobadas. **La migración 002 y las pruebas HTTP reales deben ejecutarse en la MariaDB local antes de declarar el rol listo para demostración.**

## Acceso y permisos

El Proveedor es el tercer rol de usuario. **Registrar empresas proveedoras no es lo mismo que habilitarles una cuenta con permisos.** Cada cuenta Proveedor se vincula en la tabla `usuario_proveedor` con una única empresa de la tabla `proveedor`. Pueden existir varias cuentas para una misma empresa, pero cada cuenta pertenece a una sola empresa.

Las órdenes y confirmaciones se consultan por el usuario autenticado (`req.usuario.id_usuario`) mediante parámetros SQL. Un ID de orden proporcionado por el navegador **no** concede acceso a otras empresas.

| Rol | Puede hacer |
| --- | --- |
| Administrador | Gestionar proveedores, compras, recepción, productos e inventario |
| Cajero | Registrar ventas y consultar existencias autorizadas |
| Proveedor | Consultar datos de su empresa, sus órdenes y confirmarlas |

La confirmación hecha por el Proveedor **no cambia el estado `Pendiente` de la orden ni suma inventario**. El Administrador recibe físicamente la mercancía mediante el endpoint existente `POST /api/compras/:id/recibir` y entonces la orden pasa a `Recibida`.

## API para frontend y tester

En todas las peticiones siguientes se necesita `Authorization: Bearer <JWT de Proveedor>`. Primero iniciar sesión con `POST /api/auth/login` y consultar `GET /api/auth/me` para obtener el rol.

| Método | Endpoint | Resultado |
| --- | --- | --- |
| GET | `/api/proveedor/mi-perfil` | `id_proveedor`, `nit_rut`, `razon_social`, `telefono`, `direccion`, `correo` de su empresa |
| GET | `/api/proveedor/mis-ordenes` | Lista de las últimas 100 órdenes de su empresa, con estado y confirmación |
| GET | `/api/proveedor/mis-ordenes/:id` | Orden propia y detalles de productos/cantidades/costos; otra empresa → 404 |
| POST | `/api/proveedor/mis-ordenes/:id/confirmar` | Registra que recibió/conoce la orden; NO altera existencias ni estado de compra |

**Ejemplo `GET /api/proveedor/mis-ordenes`:**

```json
[
  {
    "id_orden": 12,
    "id_proveedor": 3,
    "fecha_creacion": "2026-11-19T09:00:00.000Z",
    "estado": "Pendiente",
    "total": "85000.00",
    "fecha_confirmacion": null,
    "confirmada_proveedor": 0
  }
]
```

Este JSON es ilustrativo: IDs, fechas y valores dependen de la base de datos de cada integrante. Después de confirmar, `confirmada_proveedor` pasa a 1; `estado` se mantiene `Pendiente`. En `GET /api/compras` y `GET /api/compras/:id` el Administrador también ve los campos de confirmación.

### Respuestas habituales

- **401**: sin token o token vencido.
- **403**: rol incorrecto o usuario Proveedor sin empresa vinculada.
- **404**: orden inexistente o asignada a otra empresa. No se revela cuál caso ocurrió.
- **409**: intentar confirmar una orden que ya no está pendiente.
- **503**: falta aplicar la migración 002.

El Proveedor recibe **403** en `/api/compras`, `/api/proveedores`, `/api/ventas`, `/api/abastecimiento/faltantes`, `/api/inventario/existencias` y `/api/reportes/dashboard`. No puede realizar altas de productos ni ventas. Las consultas públicas de catálogo y resumen de inventario no muestran costos privados.

## Instalación local (NO ejecutar en producción)

1. En PowerShell, en la carpeta donde extrajiste el ZIP, ejecuta `powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALAR_PROVEEDOR.ps1`.
2. Para respaldar la BD y crear las dos tablas, ejecuta `powershell -NoProfile -ExecutionPolicy Bypass -File .\MIGRAR_PROVEEDOR.ps1`. Pedirá la contraseña root de MariaDB; no compartirla. La migración puede ejecutarse más de una vez sin eliminar datos.
3. En `backend`, ejecuta `npm run check` y `npm test`.
4. Crea una cuenta temporal de Proveedor ligada a una empresa existente:
   - `node scripts/crear-proveedor-demo.js --listar`
   - `node scripts/crear-proveedor-demo.js 3` (sustituye 3 por ID real)
   - Guardar la clave temporal **en privado**. Repetir este comando cambia la clave de ese Proveedor.
5. Inicia backend en una ventana: `npm run dev`.
6. En otra ventana, desde la carpeta extraída: `powershell -NoProfile -ExecutionPolicy Bypass -File .\PROBAR_PROVEEDOR.ps1`.
7. La prueba del Proveedor es **solo lectura** y verifica filtrado de órdenes, perfiles, catálogo sin costos y bloqueos por rol. Para verificar el botón de confirmación, usar POST manual en una orden **propia** y `Pendiente`, y comprobar `confirmada_proveedor=1`. Esta confirmación no aumenta stock.

**Para la demostración:** Crear una orden de compra de esa empresa con un Administrador antes de iniciar sesión como Proveedor; una empresa sin órdenes muestra `[]` correctamente.

## Casos mínimos para el tester

| ID | Caso | Esperado |
| --- | --- | --- |
| PR-01 | Login de Proveedor válido | 200, JWT; `/api/auth/me` devuelve `rol: Proveedor` |
| PR-02 | Proveedor accede a su perfil | 200, únicamente su empresa |
| PR-03 | Proveedor lista sus órdenes | 200; ninguna orden de empresa ajena |
| PR-04 | Proveedor intenta abrir orden ajena | 404 |
| PR-05 | Proveedor confirma orden propia pendiente | 200, `confirmada_proveedor=true` |
| PR-06 | Proveedor confirma orden recibida | 409 |
| PR-07 | Proveedor intenta administrar productos | 403 |
| PR-08 | Proveedor consulta `/api/compras` | 403 |
| PR-09 | Cajero intenta abrir el portal del Proveedor | 403 |
| PR-10 | Proveedor consulta catálogo/resumen | 200, sin `precio_costo` ni `valor_inventario` |
| PR-11 | Administrador recibe orden confirmada | Stock aumenta una vez y la orden pasa a `Recibida` |

## Pendientes externos a este parche

- Completar el panel React del Proveedor en el otro chat, con sus rutas privadas, lista y detalle de órdenes y botón Confirmar.
- Ejecutar pruebas HTTP con MariaDB real y validar tanto un Proveedor con órdenes como una orden ajena de otra empresa.
- Rotar las contraseñas de prueba antes de usar un entorno compartido; el script genera claves locales temporales.
- No hacer push directo a `main`. Subir solo `backend/` a `feature/proveedores-compras` y actualizar el PR existente.
