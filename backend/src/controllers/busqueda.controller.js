const db = require("../config/database");

// RF02: busqueda por SKU, barras, nombre y descripcion.
const buscarProductos = async (req, res) => {
    const q = req.query.q;
    if (typeof q !== "string" || !q.trim() || q.length > 100) {
        return res.status(400).json({ mensaje: "Indica q (entre 1 y 100 caracteres)" });
    }
    try {
        const termino = q.trim();
        // LOCATE interpreta la busqueda como texto literal, no como comodin SQL.
        const [filas] = await db.query(`
            SELECT p.id_producto, p.sku, p.codigo_barras, p.nombre,
                   p.descripcion, p.stock_actual, p.precio_venta,
                   c.nombre_categoria
            FROM producto p JOIN categoria c ON c.id_categoria = p.id_categoria
            WHERE p.estado = 1 AND (
                LOCATE(?, p.sku) > 0 OR LOCATE(?, COALESCE(p.codigo_barras, '')) > 0
                OR LOCATE(?, p.nombre) > 0 OR LOCATE(?, COALESCE(p.descripcion, '')) > 0
            ) ORDER BY p.nombre LIMIT 50
        `, [termino, termino, termino, termino]);
        res.json(filas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al buscar productos" });
    }
};

// Sugerencias preliminares: misma categoria y stock positivo.
// La equivalencia tecnica real requiere atributos de producto normalizados.
const alternativasProducto = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ mensaje: "ID invalido" });
    }
    try {
        const [origen] = await db.query(
            "SELECT id_categoria FROM producto WHERE id_producto = ? AND estado = 1",
            [id]
        );
        if (!origen.length) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }
        const [filas] = await db.query(`
            SELECT id_producto, sku, nombre, descripcion, stock_actual, precio_venta
            FROM producto
            WHERE id_categoria = ? AND id_producto <> ? AND estado = 1 AND stock_actual > 0
            ORDER BY stock_actual DESC LIMIT 10
        `, [origen[0].id_categoria, id]);
        res.json({ criterio: "misma_categoria_con_stock", alternativas: filas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al sugerir alternativas" });
    }
};

module.exports = { buscarProductos, alternativasProducto };
