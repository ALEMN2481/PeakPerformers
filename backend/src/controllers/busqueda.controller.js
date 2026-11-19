const db = require("../config/database");

// RF02: SKU, código de barras, nombre, descripción y opcionalmente especificaciones.
const buscarProductos = async (req, res) => {
    const q = req.query.q;
    const especificacion = req.query.especificacion;
    if (typeof q !== "string" || !q.trim() || q.length > 100 ||
        (especificacion !== undefined &&
         (typeof especificacion !== "string" || !especificacion.trim() || especificacion.length > 100))) {
        return res.status(400).json({ mensaje: "Indica q de 1 a 100 caracteres" });
    }
    try {
        const termino = q.trim();
        const filtroEspecificacion = especificacion ? ` OR EXISTS (
            SELECT 1 FROM producto_especificacion pe
            WHERE pe.id_producto=p.id_producto AND
                  (LOCATE(?,pe.atributo)>0 OR LOCATE(?,pe.valor)>0)
        )` : "";
        const parametros = [termino, termino, termino, termino];
        if (especificacion) parametros.push(especificacion.trim(), especificacion.trim());
        const [filas] = await db.query(`
            SELECT p.id_producto, p.sku, p.codigo_barras, p.nombre,
                   p.descripcion, p.stock_actual, p.precio_venta,
                   c.nombre_categoria
            FROM producto p JOIN categoria c ON c.id_categoria = p.id_categoria
            WHERE p.estado = 1 AND (
                LOCATE(?, p.sku) > 0 OR LOCATE(?, COALESCE(p.codigo_barras, '')) > 0
                OR LOCATE(?, p.nombre) > 0 OR LOCATE(?, COALESCE(p.descripcion, '')) > 0
                ${filtroEspecificacion}
            ) ORDER BY p.nombre LIMIT 50`, parametros);
        res.json(filas);
    } catch (error) {
        console.error(error);
        res.status(error.code === "ER_NO_SUCH_TABLE" ? 503 : 500).json({
            mensaje: error.code === "ER_NO_SUCH_TABLE" ? "Falta migración de especificaciones" : "Error al buscar productos"
        });
    }
};

// Alternativas sugeridas por categoría con disponibilidad positiva. NO implica equivalencia técnica certificada.
const alternativasProducto = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ mensaje: "ID inválido" });
    try {
        const [origen] = await db.query(
            "SELECT id_categoria FROM producto WHERE id_producto = ? AND estado = 1", [id]);
        if (!origen.length) return res.status(404).json({ mensaje: "Producto no encontrado" });
        const [filas] = await db.query(`SELECT id_producto, sku, nombre,
            descripcion, stock_actual, precio_venta FROM producto
            WHERE id_categoria=? AND id_producto<>? AND estado=1 AND stock_actual>0
            ORDER BY stock_actual DESC LIMIT 10`, [origen[0].id_categoria, id]);
        res.json({ criterio: "misma_categoria_con_stock", advertencia: "Verificar compatibilidad técnica", alternativas: filas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al sugerir alternativas" });
    }
};
module.exports = { buscarProductos, alternativasProducto };
