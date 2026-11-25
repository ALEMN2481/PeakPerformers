// Carga datos ficticios de ferreteria para la demostracion academica.
// Uso: node scripts/cargar-catalogo-demo.js [--aplicar] [--stock] [--proveedor ID]
const fs = require('node:fs');
const path = require('node:path');

const archivo = path.join(__dirname, '..', 'datos', 'catalogo-ferreteria-demo.json');
const catalogo = JSON.parse(fs.readFileSync(archivo, 'utf8'));
const argumentos = process.argv.slice(2);
const aplicar = argumentos.includes('--aplicar');
const incluirStock = argumentos.includes('--stock');
const posProveedor = argumentos.indexOf('--proveedor');
if (posProveedor >= 0 && (posProveedor + 1 >= argumentos.length || !/^\d+$/.test(argumentos[posProveedor + 1]))) {
    console.error('Uso de --proveedor: --proveedor 1');
    process.exit(1);
}
const idProveedor = posProveedor >= 0 ? Number(argumentos[posProveedor + 1]) : null;
const opciones = new Set(['--aplicar', '--stock', '--proveedor']);
for (let i = 0; i < argumentos.length; i++) {
    if (argumentos[i] === '--proveedor') { i++; continue; }
    if (!opciones.has(argumentos[i])) {
        console.error('Opcion no reconocida:', argumentos[i]);
        process.exit(1);
    }
}

function validar() {
    if (!Array.isArray(catalogo.productos) || catalogo.productos.length === 0) {
        throw new Error('El catalogo no contiene productos.');
    }
    const skus = new Set();
    for (const [i, p] of catalogo.productos.entries()) {
        const etiqueta = `Producto ${i + 1}`;
        for (const [campo, limite] of [['sku', 50], ['categoria', 100], ['nombre', 150], ['unidad_medida', 20], ['ubicacion_bodega', 100]]) {
            if (typeof p[campo] !== 'string' || !p[campo].trim() || p[campo].length > limite) {
                throw new Error(`${etiqueta}: campo ${campo} invalido.`);
            }
        }
        if (!/^DEMO-FER-\d{3}$/.test(p.sku) || skus.has(p.sku)) {
            throw new Error(`${etiqueta}: SKU duplicado o inesperado.`);
        }
        skus.add(p.sku);
        for (const campo of ['precio_costo', 'precio_venta', 'stock_inicial', 'stock_minimo']) {
            if (typeof p[campo] !== 'number' || !Number.isFinite(p[campo]) || p[campo] < 0) {
                throw new Error(`${etiqueta}: ${campo} no valido.`);
            }
        }
        if (p.precio_venta < p.precio_costo) throw new Error(`${etiqueta}: precio de venta inferior al costo.`);
        if (p.precio_venta > 99999999.99 || p.precio_costo > 99999999.99 || p.stock_inicial > 9999999.999) {
            throw new Error(`${etiqueta}: valor fuera de los limites de MariaDB.`);
        }
        if (Math.abs(p.stock_inicial * 1000 - Math.round(p.stock_inicial * 1000)) > 0.00001) {
            throw new Error(`${etiqueta}: stock con mas de tres decimales.`);
        }
        if (p.especificaciones && (typeof p.especificaciones !== 'object' || Array.isArray(p.especificaciones))) {
            throw new Error(`${etiqueta}: especificaciones invalidas.`);
        }
        for (const [atributo, valor] of Object.entries(p.especificaciones || {})) {
            if (atributo.length > 60 || typeof valor !== 'string' || valor.length > 255) {
                throw new Error(`${etiqueta}: especificacion invalida.`);
            }
        }
    }
}

async function cargar() {
    validar();
    const categorias = new Set(catalogo.productos.map(p => p.categoria));
    const bajos = catalogo.productos.filter(p => p.stock_inicial <= p.stock_minimo).length;
    console.log('PEAKPERFORMERS / CATALOGO DE FERRETERIA DEMO');
    console.log(`Categorias: ${categorias.size} | Productos: ${catalogo.productos.length} | Stock bajo o agotado: ${bajos}`);
    console.log('Datos inventados para fines academicos; no son precios reales.');
    if (!aplicar) {
        console.log('MODO VISTA PREVIA. No se ha conectado a MariaDB ni se ha modificado nada.');
        console.log('Para aplicar (con respaldo previo): node scripts/cargar-catalogo-demo.js --aplicar --stock --proveedor 1');
        return;
    }
    if (idProveedor !== null && (!Number.isSafeInteger(idProveedor) || idProveedor <= 0)) {
        throw new Error('ID de Proveedor invalido.');
    }
    // Se carga la configuracion local del backend; las credenciales no se imprimen.
    const db = require('../src/config/database');
    const conn = await db.getConnection();
    let creados = 0, existentes = 0, entradas = 0, asociados = 0, atributos = 0, categoriasNuevas = 0;
    try {
        // Comprobar relaciones antes de comenzar cambios.
        await conn.query('SELECT id_producto FROM producto_especificacion LIMIT 0');
        if (idProveedor !== null) {
            await conn.query('SELECT id_producto FROM producto_proveedor LIMIT 0');
            const [proveedores] = await conn.query('SELECT id_proveedor FROM proveedor WHERE id_proveedor = ?', [idProveedor]);
            if (!proveedores.length) throw new Error(`No existe el Proveedor ${idProveedor}. Consulta antes /api/proveedores.`);
        }
        let idAdministrador = null;
        if (incluirStock) {
            const [administradores] = await conn.query(`
                SELECT u.id_usuario FROM usuario u
                JOIN rol r ON r.id_rol = u.id_rol
                WHERE LOWER(r.nombre_rol) = 'administrador' AND u.estado = 1
                ORDER BY u.id_usuario LIMIT 1`);
            if (!administradores.length) throw new Error('Falta un usuario Administrador activo para auditar la entrada inicial de stock.');
            idAdministrador = administradores[0].id_usuario;
        }
        await conn.beginTransaction();
        const idsCategoria = new Map();
        for (const nombre of categorias) {
            const [actuales] = await conn.query(
                'SELECT id_categoria FROM categoria WHERE LOWER(TRIM(nombre_categoria)) = LOWER(?) LIMIT 1', [nombre.trim()]
            );
            if (actuales.length) {
                idsCategoria.set(nombre, actuales[0].id_categoria);
            } else {
                const [r] = await conn.query('INSERT INTO categoria (nombre_categoria, descripcion) VALUES (?, ?)',
                    [nombre, 'Categoria de productos de demostracion PeakPerformers']);
                idsCategoria.set(nombre, r.insertId);
                categoriasNuevas++;
            }
        }
        for (const p of catalogo.productos) {
            const [actual] = await conn.query('SELECT id_producto FROM producto WHERE sku = ? LIMIT 1', [p.sku]);
            if (actual.length) { existentes++; continue; } // Nunca modifica productos ya existentes.
            const [resultado] = await conn.query(`
                INSERT INTO producto (id_categoria, sku, codigo_barras, nombre, descripcion,
                    precio_costo, precio_venta, stock_actual, stock_minimo,
                    unidad_medida, ubicacion_bodega, estado)
                VALUES (?, ?, NULL, ?, ?, ?, ?, 0, ?, ?, ?, 1)`,
                [idsCategoria.get(p.categoria), p.sku, p.nombre, p.descripcion,
                    p.precio_costo, p.precio_venta, p.stock_minimo, p.unidad_medida, p.ubicacion_bodega]
            );
            const idProducto = resultado.insertId;
            creados++;
            for (const [atributo, valor] of Object.entries(p.especificaciones || {})) {
                await conn.query(`INSERT INTO producto_especificacion (id_producto, atributo, valor) VALUES (?, ?, ?)`,
                    [idProducto, atributo, valor]);
                atributos++;
            }
            if (incluirStock && p.stock_inicial > 0) {
                await conn.query('UPDATE producto SET stock_actual = ? WHERE id_producto = ?', [p.stock_inicial, idProducto]);
                await conn.query(`INSERT INTO movimiento_inventario
                    (id_producto, id_usuario, tipo, cantidad, motivo)
                    VALUES (?, ?, 'Entrada', ?, ?)`,
                    [idProducto, idAdministrador, p.stock_inicial, 'Carga inicial del catalogo de demostracion']);
                entradas++;
            }
            if (idProveedor !== null && p.stock_inicial <= p.stock_minimo) {
                await conn.query(`INSERT INTO producto_proveedor
                    (id_producto, id_proveedor, costo_referencia, es_principal)
                    VALUES (?, ?, ?, 1)`, [idProducto, idProveedor, p.precio_costo]);
                asociados++;
            }
        }
        await conn.commit();
        console.log(`CARGA CORRECTA: categorias nuevas ${categoriasNuevas}; productos creados ${creados}; ya existentes ${existentes}.`);
        console.log(`Entradas de inventario: ${entradas}; especificaciones: ${atributos}; asociaciones proveedor: ${asociados}.`);
        console.log('Volver a ejecutar no duplica los productos; los SKU existentes se omiten sin alterarlos.');
    } catch (error) {
        try { await conn.rollback(); } catch (_) {}
        throw error;
    } finally {
        conn.release();
        await db.end();
    }
}
cargar().catch(err => {
    console.error('NO SE APLICO LA CARGA COMPLETA:', err.message);
    process.exitCode = 1;
});
