# PEAKPERFORMERS — ControlStock | backend para demostracion del jueves 19/11/2026

Este paquete REEMPLAZA las entregas y parches anteriores. Se construyo combinando el backend real enviado por el usuario (`ControlStock_backend_para_ChatGPT.zip`) con la entrega previa, y corrigiendo fallos identificados en la BD local del 18/11/2026.

## Objetivo y alcance

Backend completo de catalogo/inventario para ferreteria. **No incluye frontend React**, que desarrolla otro integrante. No se ha desplegado a internet ni ejecutado directamente en MariaDB del usuario desde este entorno.

### Cambios destacados

- **Ventas**: mapeo corregido al esquema real `venta.id_cajero`, `total_venta`, `metodo_pago` y `documento_cliente` (antes el backend esperaba erroneamente `id_usuario`). Las ventas descuentan stock, guardan detalle y movimientos dentro de una sola transaccion; stock insuficiente => HTTP 409 y rollback.
- **Roles**: Administrador y Cajero pueden registrar ventas; el Cajero puede crear, actualizar e inactivar productos, pero no recibir compras ni crear órdenes a proveedores. JWT sigue obligatorio para las rutas protegidas.
- **Productos/inventario**: GET `/api/productos` y `/api/inventario/resumen` visibles sin token, con campos financieros reservados a usuarios autenticados. Inventario completo y movimientos requieren token; cambiar stock requiere Administrador.
- **Compras/proveedores**: registrar orden, recibir una sola vez y ajustar stock; mantenidos del backend aportado.
- **Reabastecimiento**: vinculo producto-proveedor, informe de faltantes y ordenes por proveedor sin duplicar pendientes. Requiere SQL de migracion.
- **Especificaciones/busquedas**: especificaciones tecnicas, busqueda por SKU, codigo de barras y nombre; sugerencias de misma categoria (no equivalencia tecnica garantizada). Requiere SQL de migracion.
- **Reportes**: dashboard con ventas de los ultimos 30 dias; resumen de ventas por periodo, metodo de pago y top de productos.
- **Pruebas**: 12 unitarias + 2 pruebas del propio guion de integracion contra servidor HTTP simulado; comprobacion de BD real y prueba integral que crea datos QA.

## Instalacion y pruebas sin volver a repetir pasos

1. Cierra TODAS las ventanas PowerShell del backend (no cierres VS Code ni la carpeta del proyecto).
2. Descarga el ZIP `PeakPerformers_Backend_Listo_Jueves.zip` y EXTRAe su contenido completo en una carpeta de Descargas, sin copiar archivos manualmente.
3. Abre la carpeta extraida con el Explorador. Haz clic en la barra de direcciones, escribe `powershell` y presiona Enter.
4. Ejecuta **UN SOLO COMANDO**:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\TODO_PARA_JUEVES.ps1
   ```

   El asistente hace lo siguiente, deteniendose si falla: (a) respalda archivos modificados del backend en `%TEMP%`; (b) copia la version completa de `backend` al repo `C:\Users\juanc\Proyectos\PeakPerformers`; (c) `npm install`; (d) diagnostica MariaDB; (e) si faltan las dos tablas, solicita permiso y contraseña `root` para hacer RESPALDO SQL completo en Escritorio y aplicar `backend/migrations/001_producto_proveedor.sql`; (f) corre sintaxis y pruebas; (g) enciende temporalmente el backend; (h) solicita email y contraseñas sin mostrarlas; (i) prueba todas las rutas con datos `QA-*`.

5. Cuando pida `Correo Admin [administrador.test@controlstock.invalid]`, **presiona Enter** (NO pegues contraseñas en el campo de correo). Cuando pida la contraseña, escribe SOLO la del Administrador; si eliges probar Cajero, usa la suya.
6. Si termina con `TODO APROBADO` y `PRUEBA INTEGRAL APROBADA`, comparte al tester solo el resultado, sin contraseñas/tokens ni `.env`.

La prueba integral crea y conserva categorias, proveedores, productos, ventas y ordenes `QA-*` en la **base local**. Nunca la ejecutes en produccion. Conserva el respaldo SQL.

### Si el proceso se detiene

- `NO LISTO PARA QA: Faltan tablas` -> falta migracion; usa `PREPARAR_BD.ps1` (pide `root`).
- `Credenciales invalidas` -> revisa email y clave; puedes ejecutar `node scripts/crear-usuarios-locales.js` dentro de `backend` para generar claves NUEVAS (invalida las anteriores de Admin y Cajero). No compartas claves.
- `Error de MariaDB` -> comprueba el servicio Windows `MariaDB`, puerto 3307 y `.env`.
- `Backend de version anterior` -> cierra una terminal antigua que siga ejecutando el servidor en el puerto 3000.
- `FALLO en ...` -> copia solo la linea de error (sin contraseñas ni tokens) para corregir el codigo preciso.

### Comandos separados por si quieres repetir pasos

En la carpeta extraida:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALAR.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\PREPARAR_BD.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\PROBAR_TODO.ps1
```

Dentro de `backend`:

```powershell
npm run check
npm test
node scripts/preparar-pruebas.js
npm run dev
```

La prueba combinada detiene el servidor temporal que ella misma inicia. Para trabajar con React despues, deja `npm run dev` abierto en una terminal dedicada.

## No se alteran

- `frontend/` ni `main` de Git.
- `backend/.env` (password MariaDB/JWT), `.git` ni `node_modules` existentes.
- Tablas ya existentes: la migracion usa `CREATE TABLE IF NOT EXISTS` SOLO para dos tablas nuevas.
- Datos existentes: las pruebas suman registros QA, no borran pedidos/ventas de otras personas.

## Estado comprobado en esta entrega

**Aprobado en este entorno:** `npm run check` (38 archivos JavaScript verificados) y `npm test` (14/14 tests aprobados), incluida prueba del guion HTTP contra servidor simulado. **No comprobado desde este entorno:** conexion real a MariaDB 3307 Windows, ejecucion de PowerShell en Windows, migracion root, integracion con React. Los scripts entregados comprueban todo esto en tu equipo, y se detienen con errores explicitos si falla algo.

## Publicar Git (solo backend, no hacerlo antes de que QA pase)

1. Desde la raiz del repo: `git branch --show-current` y `git status --short`.
2. Si estas en `bugfix/seguridad-roles`, crea una rama derivada: `git switch -c feature/backend-demo-jueves`. Si ya existe esa rama, usa `git switch feature/backend-demo-jueves`. Si estas en otra rama, revisa el estado antes de cambiar de base.
3. Agrega SOLO archivos del backend, nunca uses `git add .` si `frontend/` es de tu compañero:
   `git add backend/src backend/scripts backend/pruebas backend/migrations backend/package.json backend/package-lock.json backend/.env.example backend/.gitignore`
4. Inspecciona `git diff --cached --stat` y `git diff --cached --name-only` para descartar secretos o frontend.
5. `git commit -m "Preparar backend ControlStock para pruebas integrales"`
6. `git push -u origin feature/backend-demo-jueves`
7. En GitHub abre **Pull Request** para revision. Si la rama deriva de `bugfix/seguridad-roles`, el PR se debe comparar primero contra esa rama o despues de integrarla contra la rama objetivo acordada (`prog_1` / `main`). No hagas push directo a `main` ni `push --force`.

**Seguridad:** las contraseñas que alguna vez se pegaron en un chat se deben rotar; `.env` estuvo en historial Git y requiere revision del equipo. No subas `.env`, capturas con tokens, logs con secretos, el respaldo SQL o `node_modules`.
