const db = require("../config/database");

const fallo = (mensaje, status = 400) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const listar = async () => {
    const [filas] = await db.query(`
        SELECT o.id_orden, o.id_proveedor, p.razon_social AS proveedor,
               o.fecha_creacion, o.estado, o.total
        FROM orden_compra o
        JOIN proveedor p ON p.id_proveedor = o.id_proveedor
        ORDER BY o.id_orden DESC
    `);
    return filas;
};

const buscar = async (id) => {
    const [ordenes] = await db.query(`
        SELECT o.*, p.razon_social AS proveedor
        FROM orden_compra o
        JOIN proveedor p ON p.id_proveedor = o.id_proveedor
        WHERE o.id_orden = ?
    `, [id]);
    if (!ordenes.length) return null;
    const [detalles] = await db.query(`
        SELECT d.id_detalle_orden, d.id_producto, p.nombre AS producto,
               d.cantidad, d.costo_unitario,
               ROUND(d.cantidad * d.costo_unitario, 2) AS subtotal
        FROM detalle_orden_compra d
        JOIN producto p ON p.id_producto = d.id_producto
        WHERE d.id_orden = ?
        ORDER BY d.id_detalle_orden
    `, [id]);
    return { ...ordenes[0], detalles };
};

const crear = async (idProveedor, detalles, totalCentavos) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [proveedores] = await conn.query(
            "SELECT id_proveedor FROM proveedor WHERE id_proveedor = ?", [idProveedor]
        );
        if (!proveedores.length) throw fallo("Proveedor no encontrado", 404);

        for (const detalle of detalles) {
            const [productos] = await conn.query(
                "SELECT id_producto FROM producto WHERE id_producto = ? AND estado = 1",
                [detalle.id_producto]
            );
            if (!productos.length) {
                throw fallo(`Producto activo no encontrado: ${detalle.id_producto}`, 404);
            }
        }

        const [resultado] = await conn.query(
            `INSERT INTO orden_compra (id_proveedor, estado, total)
             VALUES (?, 'Pendiente', ?)`,
            [idProveedor, (Number(totalCentavos) / 100).toFixed(2)]
        );
        const idOrden = resultado.insertId;
        for (const detalle of detalles) {
            await conn.query(
                `INSERT INTO detalle_orden_compra
                 (id_orden, id_producto, cantidad, costo_unitario)
                 VALUES (?, ?, ?, ?)`,
                [idOrden, detalle.id_producto,
                    detalle.cantidad.toFixed(3), detalle.costo_unitario.toFixed(2)]
            );
        }
        await conn.commit();
        return { id_orden: idOrden, total: Number(totalCentavos) / 100 };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// La recepción es atómica y solo puede hacerse una vez por orden.
const recibir = async (idOrden, idUsuario) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [ordenes] = await conn.query(
            "SELECT id_orden, estado FROM orden_compra WHERE id_orden = ? FOR UPDATE",
            [idOrden]
        );
        if (!ordenes.length) throw fallo("Orden no encontrada", 404);
        if (ordenes[0].estado !== "Pendiente") {
            throw fallo("La orden ya fue recibida o no está pendiente", 409);
        }

        const [usuarios] = await conn.query(
            "SELECT id_usuario FROM usuario WHERE id_usuario = ? AND estado = 1",
            [idUsuario]
        );
        if (!usuarios.length) throw fallo("Usuario activo no encontrado", 404);

        const [detalles] = await conn.query(
            `SELECT id_producto, cantidad FROM detalle_orden_compra
             WHERE id_orden = ? ORDER BY id_producto`,
            [idOrden]
        );
        if (!detalles.length) throw fallo("Orden sin productos", 409);

        for (const detalle of detalles) {
            const [productos] = await conn.query(
                `SELECT stock_actual FROM producto
                 WHERE id_producto = ? AND estado = 1 FOR UPDATE`,
                [detalle.id_producto]
            );
            if (!productos.length) {
                throw fallo(`Producto no disponible: ${detalle.id_producto}`, 409);
            }
            const actualMil = Math.round(Number(productos[0].stock_actual) * 1000);
            const recibidoMil = Math.round(Number(detalle.cantidad) * 1000);
            const nuevoMil = actualMil + recibidoMil;
            if (nuevoMil > 9999999999) {
                throw fallo(`El stock excede el máximo permitido: ${detalle.id_producto}`, 409);
            }

            await conn.query(
                "UPDATE producto SET stock_actual = ? WHERE id_producto = ?",
                [(nuevoMil / 1000).toFixed(3), detalle.id_producto]
            );
            await conn.query(
                `INSERT INTO movimiento_inventario
                 (id_producto, id_usuario, tipo, cantidad, motivo)
                 VALUES (?, ?, 'Entrada', ?, ?)`,
                [detalle.id_producto, idUsuario, detalle.cantidad,
                    `Recepcion de orden de compra #${idOrden}`]
            );
        }

        await conn.query(
            "UPDATE orden_compra SET estado = 'Recibida' WHERE id_orden = ?",
            [idOrden]
        );
        await conn.commit();
        return { id_orden: idOrden, estado: "Recibida", productos_recibidos: detalles.length };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

module.exports = { listar, buscar, crear, recibir };
