// Comprobacion de entorno y esquema; solo SELECT, no altera datos.
require('dotenv').config();
const db = require('../src/config/database');

const tablas = ['categoria', 'producto', 'proveedor', 'usuario', 'rol',
    'orden_compra', 'detalle_orden_compra', 'venta', 'detalle_venta',
    'movimiento_inventario', 'producto_proveedor', 'producto_especificacion'];
const columnas = {
    venta: ['id_venta', 'id_cajero', 'total_venta', 'metodo_pago'],
    detalle_venta: ['id_venta', 'id_producto', 'cantidad', 'precio_unitario'],
    movimiento_inventario: ['id_producto', 'id_usuario', 'tipo', 'cantidad'],
    categoria: ['id_categoria', 'nombre_categoria'],
    producto: ['id_producto', 'id_categoria', 'stock_actual', 'precio_venta', 'estado'],
};

async function main() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
        throw new Error('JWT_SECRET debe estar definido en backend/.env (mínimo 16 caracteres)');
    }
    const [r] = await db.query('SELECT DATABASE() AS bd, VERSION() AS version');
    console.log(`Conectado a MariaDB (${r[0].bd})`);
    const [t] = await db.query(`SELECT TABLE_NAME AS nombre FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()`);
    const existentes = new Set(t.map(x => x.nombre));
    const faltantes = tablas.filter(x => !existentes.has(x));
    if (faltantes.length) {
        throw new Error('Faltan tablas: ' + faltantes.join(', ') +
            '. Ejecuta PREPARAR_BD.ps1 después de hacer respaldo.');
    }
    for (const [tabla, requeridas] of Object.entries(columnas)) {
        const [c] = await db.query(`SHOW COLUMNS FROM \`${tabla}\``);
        const campos = new Set(c.map(x => x.Field));
        const ausentes = requeridas.filter(x => !campos.has(x));
        if (ausentes.length) throw new Error(`Columnas ausentes en ${tabla}: ${ausentes.join(', ')}`);
    }
    console.log(`${tablas.length} tablas y columnas esenciales verificadas. Listo para QA.`);
}
main().catch(e => { console.error('NO LISTO PARA QA:', e.message); process.exitCode=1; })
    .finally(() => db.end());
