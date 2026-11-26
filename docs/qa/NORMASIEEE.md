# PeakPerformers — Especificación y Guía del Sistema (Enfoque IEEE 830)

## 1. Introducción

### 1.1 Propósito
Definir el propósito operativo, la arquitectura y los requisitos principales del sistema **PeakPerformers**, estructurados bajo los criterios esenciales del estándar **IEEE 830** para orientar a desarrollo, pruebas (QA) y mantenimiento.

### 1.2 Alcance
El repositorio contiene una solución full-stack dividida en `backend/`, `frontend/`, `docs/qa/` y suites de pruebas automatizadas (`backend/pruebas/` y `frontend/tests/`), cubriendo autenticación, catálogo y categorías, búsqueda y especificaciones, inventario y movimientos, ventas en mostrador, abastecimiento/compras, portal de proveedores y reportes.

### 1.3 Definiciones, Acrónimos y Abreviaturas
* **ERS:** Especificación de Requisitos de Software.
* **RF / RNF:** Requisito Funcional / Requisito No Funcional.
* **API REST:** Interfaz de comunicación entre el frontend y los servicios del backend.
* **RBAC:** Control de acceso basado en roles.
* **QA:** Aseguramiento de calidad y ejecución de pruebas.

## 2. Descripción General
### 2.1 Perspectiva del Producto
**PeakPerformers** sigue una arquitectura cliente-servidor desacoplada:

* **Backend:** Servicios Node.js (`src/app.js`, `src/server.js`) organizados en capas (`routes`, `controllers`, `services`, `middlewares`, `utils`, `config`) y migraciones SQL (`migrations/001_producto_proveedor.sql`, `migrations/002_acceso_proveedor.sql`).

* **Frontend:** Aplicación web (`index.html`, `src/App.jsx`, `src/services/api.js`) organizada por componentes, hooks, vistas (`pages/`) y control de permisos (`src/services/permisos.js`).

### 2.2 Funciones del Producto (Módulos Identificados)
* **Autenticación y roles:** `auth`, `Usuarios`, `SinAcceso`, `CAMBIOS_ROLES.md`.

* **Catálogo, especificaciones y búsqueda:** `productos`, `categorias`, `especificaciones`, `busqueda`, `Catalogo.jsx`, `ConsultaProductos.jsx`, `FichaTecnica.jsx`.

* **Inventario y ventas:** `inventario`, `ventas`, `Mostrador.jsx`, `Movimientos.jsx`, `ACTUALIZACION_CAJERO_23NOV2026.md`.

* **Abastecimiento, compras y portal de proveedores:** `abastecimiento`, `compras`, `proveedores`, `portal-proveedor`, `Orden.jsx`, `Reabastecimiento.jsx`, `PortalProveedor.jsx`, `README_PROVEEDOR.md`, `INTEGRACION_PROVEEDOR.md`.

* **Reportes y panel:** `reportes`, `Panel.jsx`, `Reportes.jsx`.

### 2.3 Características de los Usuarios
* **Administrador / Gestión:** Administra usuarios, roles, catálogo, movimientos de inventario, compras/abastecimiento y reportes.

* **Cajero / Operador de mostrador:** Consulta productos y ejecuta operaciones de venta en mostrador.

* **Proveedor:** Consulta y gestiona su interacción mediante el portal y endpoints dedicados a proveedores.

### 2.4 Restricciones, Suposiciones y Dependencias
* **Variables de entorno:** Requiere configurar `.env` a partir de `.env.example` tanto en `backend/` como en `frontend/`.

* **Base de datos y esquema:** Depende de la ejecución ordenada de las migraciones SQL y de la integridad del esquema (`scripts/diagnosticar-esquema.js`).

* **Contrato de API:** El consumo del frontend depende del contrato documentado en `frontend/CONTRATO_API.md` y validado en pruebas de contrato.

## 3. Requisitos Específicos

### 3.1 Requisitos de Interfaz
* **Interfaz de usuario:** Vistas web en `frontend/src/pages/` con diseño modular (`AppLayout.jsx`, `AuthLayout.jsx`, `components/ui.jsx`) y rutas protegidas por rol.

* **Interfaz de software y comunicación:** Endpoints REST consumidos vía `frontend/src/services/api.js` y `frontend/src/services/portalProveedor.js`, sujetos a `CONTRATO_API.md`.

### 3.2 Requisitos Funcionales (RF)
* **RF-01 — Autenticación y autorización:** Iniciar sesión (`Login.jsx`, `auth.controller.js`) y validar permisos por rol (`auth.middleware.js`, `permisos.js`).

* **RF-02 — Búsqueda y consulta de catálogo:** Consultar productos, categorías y especificaciones técnicas (`busqueda`, `productos`, `categorias`, `especificaciones`).

* **RF-03 — Gestión de inventario y movimientos:** Registrar y consultar cambios de stock y movimientos (`inventario`, `Movimientos.jsx`).

* **RF-04 — Registro de ventas:** Operar ventas desde mostrador (`ventas`, `Mostrador.jsx`).
* **RF-05 — Abastecimiento, compras y portal de proveedores:** Gestionar órdenes, abastecimiento y flujo de proveedores (`abastecimiento`, `compras`, `portal-proveedor`, `Orden.jsx`, `Reabastecimiento.jsx`, `PortalProveedor.jsx`).

* **RF-06 — Generación de reportes:** Consultar indicadores y reportes del sistema (`reportes`, `Reportes.jsx`).

### 3.3 Requisitos No Funcionales (RNF)
* **RNF-01 — Seguridad:** Protección de rutas y operaciones según rol (`permisos-operaciones.test.js`, `permisos.test.mjs`, `probar-seguridad.ps1`). `[Verificar políticas exactas de token/hash en backend]`

* **RNF-02 — Fiabilidad y calidad:** Cobertura de pruebas unitarias, de integración y de contrato en `backend/pruebas/` y `frontend/tests/`, además de `docs/qa/REPORTE_MAESTRO_QA_CICLO1.md`.

* **RNF-03 — Mantenibilidad:** Separación por capas en backend (`routes`, `controllers`, `services`) y módulos en frontend (`pages`, `components`, `services`, `hooks`).

## 4. Estructura del Repositorio y Pruebas

* **Documentación base:** `README.md`, `backend/README_BACKEND.md`, `backend/README_PROVEEDOR.md`, `frontend/README.md`, `frontend/CONTRATO_API.md`, `docs/qa/REPORTE_MAESTRO_QA_CICLO1.md`.

* **Scripts y pruebas backend:** `backend/scripts/` (`verificar-sintaxis.js`, `diagnosticar-esquema.js`, `preparar-pruebas.js`, etc.) y `backend/pruebas/`.

* **Pruebas frontend:** `frontend/tests/` (`api.test.mjs`, `contrato-backend.test.mjs`, `permisos.test.mjs`, `portal-proveedor.test.mjs`) y `frontend/scripts-check-api.mjs`.