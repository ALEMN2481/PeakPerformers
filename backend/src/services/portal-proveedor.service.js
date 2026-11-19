const db = require('../config/database');

const fallo = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });

// El proveedor se identifica únicamente por el usuario del JWT.
async function miPerfil(idUsuario) {
    const [filas] = await db.query(`
        SELECT p.id_proveedor, p.nit_rut, p.razon_social,
               p.telefono, p.direccion, p.correo
        FROM usuario_proveedor up
        JOIN proveedor p ON p.id_proveedor = up.id_proveedor
        WHERE up.id_usuario = ? LIMIT 1`, [idUsuario]);
    return filas[0] || null;
}

async function misOrdenes(idUsuario) {
    const [filas] = await db.query(`
        SELECT o.id_orden, o.id_proveedor, o.fecha_creacion,
               o.estado, o.total,
               cp.fecha_confirmacion,
               CASE WHEN cp.id_orden IS NULL THEN 0 ELSE 1 END AS confirmada_proveedor
        FROM usuario_proveedor up
        JOIN orden_compra o ON o.id_proveedor = up.id_proveedor
        LEFT JOIN confirmacion_proveedor cp ON cp.id_orden = o.id_orden
        WHERE up.id_usuario = ?
        ORDER BY o.id_orden DESC LIMIT 100`, [idUsuario]);
    return filas;
}

async function miOrden(idUsuario, idOrden) {
    const [ordenes] = await db.query(`
        SELECT o.id_orden, o.id_proveedor, o.fecha_creacion, o.estado, o.total,
               p.razon_social AS proveedor, cp.fecha_confirmacion,
               CASE WHEN cp.id_orden IS NULL THEN 0 ELSE 1 END AS confirmada_proveedor
        FROM usuario_proveedor up
        JOIN orden_compra o ON o.id_proveedor = up.id_proveedor
        JOIN proveedor p ON p.id_proveedor = o.id_proveedor
        LEFT JOIN confirmacion_proveedor cp ON cp.id_orden = o.id_orden
        WHERE up.id_usuario = ? AND o.id_orden = ? LIMIT 1`, [idUsuario, idOrden]);
    if (!ordenes.length) return null;
    // Solo si la orden pertenece al proveedor autenticado se consultan los detalles.
    const [detalles] = await db.query(`
        SELECT d.id_producto, p.sku, p.nombre AS producto,
               d.cantidad, d.costo_unitario,
               ROUND(d.cantidad * d.costo_unitario, 2) AS subtotal
        FROM detalle_orden_compra d
        JOIN producto p ON p.id_producto = d.id_producto
        WHERE d.id_orden = ? ORDER BY d.id_detalle_orden`, [idOrden]);
    return { ...ordenes[0], detalles };
}

async function confirmar(idUsuario, idOrden) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [ordenes] = await conn.query(`
            SELECT o.id_orden, o.estado
            FROM orden_compra o
            JOIN usuario_proveedor up ON up.id_proveedor = o.id_proveedor
            WHERE up.id_usuario = ? AND o.id_orden = ? FOR UPDATE`, [idUsuario, idOrden]);
        if (!ordenes.length) throw fallo('Orden no encontrada', 404);
        if (ordenes[0].estado !== 'Pendiente') {
            throw fallo('La orden ya no está pendiente', 409);
        }
        await conn.query(`
            INSERT INTO confirmacion_proveedor (id_orden, id_usuario) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE id_orden = id_orden`, [idOrden, idUsuario]);
        const [confirmaciones] = await conn.query(`
            SELECT fecha_confirmacion FROM confirmacion_proveedor WHERE id_orden = ?`, [idOrden]);
        await conn.commit();
        return { id_orden: idOrden, confirmada_proveedor: true,
            fecha_confirmacion: confirmaciones[0].fecha_confirmacion,
            estado: 'Pendiente' };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

module.exports = { miPerfil, misOrdenes, miOrden, confirmar };
