
const db = require("../config/database");

// Consultar todos los productos activos
const listarProductos = async () => {
    const [productos] = await db.query(`
        SELECT p.*, c.nombre_categoria
        FROM producto p
        INNER JOIN categoria c
        ON p.id_categoria = c.id_categoria
        WHERE p.estado = 1
        ORDER BY p.id_producto DESC
    `);

    return productos;
};

// Consultar un producto por ID
const buscarProducto = async (id) => {
    const [productos] = await db.query(
        "SELECT * FROM producto WHERE id_producto = ? AND estado = 1",
        [id]
    );

    return productos[0] || null;
};

// Registrar un producto
const crearProducto = async (datos) => {
    const [resultado] = await db.query(`
        INSERT INTO producto (
            id_categoria, sku, codigo_barras,
            nombre, descripcion, precio_costo,
            precio_venta, stock_actual, stock_minimo,
            unidad_medida, ubicacion_bodega, estado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 1)
    `, [
        datos.id_categoria,
        datos.sku,
        datos.codigo_barras,
        datos.nombre,
        datos.descripcion,
        datos.precio_costo,
        datos.precio_venta,
        datos.stock_minimo,
        datos.unidad_medida,
        datos.ubicacion_bodega
    ]);

    return resultado.insertId;
};

// Actualizar datos del producto
const actualizarProducto = async (id, datos) => {
    const [resultado] = await db.query(`
        UPDATE producto SET
            id_categoria = ?,
            sku = ?,
            codigo_barras = ?,
            nombre = ?,
            descripcion = ?,
            precio_costo = ?,
            precio_venta = ?,
            stock_minimo = ?,
            unidad_medida = ?,
            ubicacion_bodega = ?
        WHERE id_producto = ? AND estado = 1
    `, [
        datos.id_categoria,
        datos.sku,
        datos.codigo_barras,
        datos.nombre,
        datos.descripcion,
        datos.precio_costo,
        datos.precio_venta,
        datos.stock_minimo,
        datos.unidad_medida,
        datos.ubicacion_bodega,
        id
    ]);

    return resultado.affectedRows;
};

// Desactivar sin borrar el historial
const eliminarProducto = async (id) => {
    const [resultado] = await db.query(
        "UPDATE producto SET estado = 0 WHERE id_producto = ? AND estado = 1",
        [id]
    );

    return resultado.affectedRows;
};

module.exports = {
    listarProductos,
    buscarProducto,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};
