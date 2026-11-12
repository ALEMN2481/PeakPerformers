# ControlStock · Frontend integrado (React + Vite)

Esta carpeta contiene el frontend entregado por el diseñador, **conservando su apariencia**, pero reemplazando los datos de muestra y acciones simuladas por peticiones HTTP al backend Express.

> **Estado real:** este ZIP contiene **solo el frontend**. No incluye el backend ni MariaDB. Las rutas de autenticación y categorías se basan en el avance documentado del proyecto; las rutas de productos, ventas, usuarios, movimientos, proveedores y órdenes se prepararon según el contrato definido en `CONTRATO_API.md`, pero requieren verificación/implementación contra el backend real antes de dar por terminada la integración.

## Cómo ejecutarlo en Windows (PowerShell)

1. Tener instalado **Node.js** y el backend de ControlStock con su MariaDB en funcionamiento.
2. Abrir PowerShell dentro de esta carpeta `frontend`.
3. Ejecutar:

```powershell
npm ci
npm run dev
```

4. Abrir la dirección que muestre Vite (normalmente `http://localhost:5173` o `http://localhost:5174`).
5. El backend debe escuchar en `http://localhost:3000` y responder bajo `/api`. El proxy de Vite dirige peticiones de `/api` a ese puerto. La contraseña y el token **no** deben figurar en el código.
6. Probar conexión y endpoints públicos sin credenciales:

```powershell
Invoke-RestMethod http://localhost:3000/api/test-db
Invoke-RestMethod http://localhost:3000/api/categorias
```

Si el backend usa una URL distinta, copiar `.env.example` a `.env` y cambiar `VITE_API_URL`. `VITE_API_URL` es una dirección pública visible en el navegador, **nunca** colocar credenciales ahí. Para producción ajustar CORS/servidor o servir frontend y backend desde el mismo origen.

## Qué cambiamos

- **Servicios**: `src/services/api.js` centraliza `fetch`, token Bearer, errores de red, CSV y normalización de respuestas.
- **Autenticación**: pantalla de login conectada a `POST /api/auth/login`; token almacenado por sesión o con opción «Recordar usuario»; redirección y cierre de sesión.
- **Catálogo**: consulta productos/categorías, filtra, pagina, exporta CSV, envía altas, ediciones, inactivaciones y nuevas categorías.
- **Panel**: estadísticas calculadas con productos reales; no presenta cifras ficticias de ventas.
- **Mostrador**: carrito local y solicitud real de registro de venta; conserva carrito en caso de error.
- **Movimientos**: consulta y registro de movimientos; actualiza la tabla al confirmar el backend.
- **Reabastecimiento/órdenes**: calculan faltantes a partir de productos reales, permiten seleccionar proveedor, generan borrador local y crean la orden mediante API.
- **Usuarios**: consulta y alta desde un rol administrador, con contraseña inicial (sin inventar envío de correo).
- **Estados**: pantallas de carga, validación y errores del backend; ninguna operación se declara exitosa antes de una respuesta HTTP exitosa.

**Limitaciones importantes:** al faltar el código del backend no se pudo validar su formato exacto ni ejecutar pruebas con MariaDB. El frontend no genera permisos de seguridad: deben comprobarse en cada ruta del servidor. Crear una orden no implica automáticamente aprobarla ni enviarla por email. El almacenamiento de borradores y carrito es local, no una base de datos.

## Comprobaciones

```powershell
npm run test:unit   # comprueba adaptadores, HTTP exitoso y errores
npm run lint        # analiza estilo/reglas de React
npm run build       # compila a /dist
```

En el entorno donde se generó este ZIP los tests unitarios (5) pasaron y se comprobó la sintaxis de los JSX. La instalación de npm/build no pudo completarse porque este entorno no tuvo acceso a `registry.npmjs.org`; **el build no se declara verificado**. Realizar `npm ci`, `npm run lint` y `npm run build` en tu equipo.

Consulta `CONTRATO_API.md` para revisar las rutas y los cuerpos esperados. Si la API real utiliza otros nombres o responde con formatos distintos, ajustar el adaptador en `src/services/api.js` y los métodos en las pantallas, no inventar datos de prueba.
