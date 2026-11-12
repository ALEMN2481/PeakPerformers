
const db = require("../config/database");

const obtenerResumen = async () => {
    const [filas] = await db.query(`
        SELECT COUNT(*) AS total_productos,
        COALESCE(SUM(stock_actual), 0) AS unidades_disponibles,
        COALESCE(SUM(stock_actual * precio_costo), 0) AS valor_inventario,
        COALESCE(SUM(CASE WHEN stock_actual <= stock_minimo
        THEN 1 ELSE 0 END), 0) AS productos_stock_bajo
        FROM producto WHERE estado = 1
    `);
    return filas[0];
};

const listarExistencias = async () => {
    const [filas] = await db.query(`
        SELECT p.id_producto, p.sku, p.nombre,
        c.nombre_categoria, p.stock_actual, p.stock_minimo,
        p.unidad_medida, p.ubicacion_bodega
        FROM producto p
        JOIN categoria c ON p.id_categoria = c.id_categoria
        WHERE p.estado = 1
        ORDER BY p.nombre
    `);
    return filas;
};

const listarStockBajo = async () => {
    const [filas] = await db.query(`
        SELECT p.id_producto, p.sku, p.nombre,
        c.nombre_categoria, p.stock_actual,
        p.stock_minimo, p.unidad_medida
        FROM producto p
        JOIN categoria c ON p.id_categoria = c.id_categoria
        WHERE p.estado = 1
        AND p.stock_actual <= p.stock_minimo
        ORDER BY p.stock_actual
    `);
    return filas;
};

const listarMovimientos = async () => {
    const [filas] = await db.query(`
        SELECT m.id_movimiento, m.id_producto,
        p.nombre AS producto, m.id_usuario,
        u.nombre AS usuario, m.tipo, m.cantidad,
        m.motivo, m.fecha_hora
        FROM movimiento_inventario m
        JOIN producto p ON m.id_producto = p.id_producto
        JOIN usuario u ON m.id_usuario = u.id_usuario
        ORDER BY m.fecha_hora DESC, m.id_movimiento DESC
        LIMIT 100
    `);
    return filas;
};

const registrarMovimiento = async (datos) => {
    const conexion = await db.getConnection();

    try {
        await conexion.beginTransaction();

        const [productos] = await conexion.query(
            `SELECT id_producto, stock_actual
             FROM producto
             WHERE id_producto = ? AND estado = 1
             FOR UPDATE`,
            [datos.id_producto]
        );

        if (!productos.length) {
            const error = new Error("Producto activo no encontrado");
            error.status = 404;
            throw error;
        }

        const [usuarios] = await conexion.query(
            "SELECT id_usuario FROM usuario WHERE id_usuario = ? AND estado = 1",
            [datos.id_usuario]
        );

        if (!usuarios.length) {
            const error = new Error("Usuario activo no encontrado");
            error.status = 404;
            throw error;
        }

        // Trabajar en milésimas evita errores con decimales.
        const anterior = Math.round(
            Number(productos[0].stock_actual) * 1000
        );
        const cantidad = Math.round(datos.cantidad * 1000);

        const nuevo = datos.tipo === "Entrada"
            ? anterior + cantidad
            : anterior - cantidad;

        if (nuevo < 0) {
            const error = new Error("Stock insuficiente");
            error.status = 409;
            throw error;
        }

        if (nuevo > 9999999999) {
            const error = new Error("Stock excede el límite permitido");
            error.status = 400;
            throw error;
        }

        await conexion.query(
            "UPDATE producto SET stock_actual = ? WHERE id_producto = ?",
            [(nuevo / 1000).toFixed(3), datos.id_producto]
        );

        const [resultado] = await conexion.query(
            `INSERT INTO movimiento_inventario
             (id_producto, id_usuario, tipo, cantidad, motivo)
             VALUES (?, ?, ?, ?, ?)`,
            [
                datos.id_producto,
                datos.id_usuario,
                datos.tipo,
                datos.cantidad.toFixed(3),
                datos.motivo || null
            ]
        );

        await conexion.commit();

        return {
            id_movimiento: resultado.insertId,
            stock_anterior: anterior / 1000,
            stock_actual: nuevo / 1000
        };
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
};

module.exports = {
    obtenerResumen,
    listarExistencias,
    listarStockBajo,
    listarMovimientos,
    registrarMovimiento
};
