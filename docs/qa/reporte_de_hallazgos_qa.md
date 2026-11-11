# Reporte de Errores / Hallazgos de QA (ControlStock - Backend)

**Para:** Juan Rentería (Programador Backend)   
**Rama evaluada:** `prog_1`  
**Fecha de revisión:** 10 de noviembre de 2026  
**Ciclo de Pruebas:** Ciclo 1 (Pre-integración)  

Durante la auditoría de código realizada sobre el backend (`backend/src`) en la rama `prog_1` frente a la Especificación de Requisitos de Software (IEEE 830), se identificaron **2 hallazgos bloqueantes** de seguridad y arquitectura, junto con **2 requerimientos funcionales incompletos**.

---

## 2. Detalle de Hallazgos

### BUG-001: Ausencia de Control de Acceso por Roles (Bloqueante)
* **Requerimientos ERS:** RF01, RF04, RF05, RF06 / RNF02.
* **Ubicación:** `backend/src/routes/productos.routes.js`, `backend/src/routes/inventario.routes.js`.
* **Descripción:** Los endpoints de creación, modificación y eliminación de productos y movimientos no cuentan con middleware de autenticación ni verificación de rol (Administrador).
* **Impacto:** Cualquier usuario sin autenticar puede ejecutar operaciones `POST`, `PUT` y `DELETE`. Además, el `id_usuario` se recibe en el cuerpo de la petición (`body`), comprometiendo la auditoría de movimientos.
* **Pasos para reproducir:**
  1. Ejecutar una petición HTTP: `DELETE /api/productos/1` sin incluir cabeceras de autorización.
* **Resultado Obtenido:** HTTP status `200 OK` (Operación realizada).
* **Resultado Esperado:** HTTP status `401 Unauthorized` o `403 Forbidden`.

---

### SEC-001: Exposición del archivo .env en el Repositorio (Bloqueante)
* **Requerimiento ERS:** RNF02 (Seguridad).
* **Ubicación:** `backend/.env`.
* **Descripción:** El archivo de variables de entorno con credenciales de la base de datos se encuentra rastreado en el historial de Git de la rama `prog_1`.
* **Acción Requerida:** Remover del rastreo (`git rm --cached backend/.env`), añadir a `.gitignore` y rotar las contraseñas expuestas.

---

### OBS-001: Funcionalidades Incompletas del ERS
* **RF02 (Búsqueda avanzada y equivalencias):** Falta implementar el endpoint de búsqueda por código de barras/SKU/especificaciones y la lógica del recomendador para productos agotados.
* **RF03 (Notificación de faltantes):** El endpoint `/stock-bajo` no agrupa existencias por proveedor ni genera las órdenes de reabastecimiento.

---

### IMP-001: Mejoras Técnicas y Mantenibilidad (RNF05)
1. **Pools de conexión duplicados:** Coexisten `backend/src/config/db.js` y `backend/src/config/database.js`. Se recomienda unificar en un solo módulo.
2. **Manejo global de errores:** Express carece de middleware para capturar errores de parseo de JSON malformados (responde con página HTML por defecto).

---

## 3. Estado y Próximos Pasos

* **Estado:** Pendiente de corrección por Backend (`prog_1`).
* **Criterio de Desbloqueo Ciclo 1:** Corrección de `BUG-001` y eliminación de `SEC-001`.

# Reporte de Hallazgos de QA - Pre-Integración (Ciclo 1)

**Estado:** Bloqueado para Pruebas de Integración  

## 1. RESUMEN EJECUTIVO
No es posible iniciar el Ciclo 1 de Pruebas de Integración debido a que:
1. `prog_1` (Backend) no posee middleware de autenticación ni control de acceso por roles.
2. `prog_2` (Frontend) funciona únicamente con datos estáticos en código y sin llamadas HTTP (sin fetch/axios).
3. Existen incompatibilidades severas en las rutas de la API y en los nombres de campos entre ambas ramas.

---

## 2. HALLAZGOS EN FRONTEND (`prog_2`)

### BUG-002: Ausencia de Control de Rutas y Sesión en Frontend (Bloqueante)
* **Ubicación:** `frontend/src/App.jsx`, `frontend/src/components/AppLayout.jsx`
* **Descripción:** La navegación por hash permite ingresar a cualquier vista (ej. `#/usuarios`) sin autenticación. El login no valida credenciales. El rol "Administrador" y el usuario "Juan Pablo" están fijos en código.

### CON-001: Desacople de Contrato de Datos Frontend/Backend (Bloqueante para Integración)
* **Nombres de Campos:**
  * Frontend espera: `ub`, `minimo`, `activo`, `stock`
  * Backend devuelve: `ubicacion_bodega`, `stock_minimo`, `estado`, `stock_actual`
* **Rutas Inexistentes:** Frontend intenta conectar a `/api/auth/*` pero el backend no tiene ese prefijo implementado.
* **Datos Descartados:** Frontend envía `motivo` en bajas y `documento` en movimientos, pero las tablas/endpoints del backend no soportan esos campos.

---

## 3. ACCIONES REQUERIDAS ANTES DEL MERGE EN STAGING
1. **Juan Rentería (Backend):** Implementar middleware de roles y definir rutas `/api/auth`.
2. **Juan Pablo (Frontend):** Renombrar propiedades del estado/componentes para alinearse con los nombres de la base de datos de `prog_1`.
3. **Ambos:** Acordar el contrato de interfaz (JSON request/response) antes de realizar el Pull Request a `staging`.