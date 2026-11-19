const db = require("../config/database");
const { idValido } = require("../utils/validaciones");
const consultar = async (req, res) => {
    const id = Number(req.params.id);
    if (!idValido(id)) return res.status(400).json({ mensaje: "ID inválido" });
    try {
        const [r] = await db.query(`SELECT atributo, valor FROM producto_especificacion
            WHERE id_producto=? ORDER BY atributo`, [id]);
        res.json(r);
    } catch (e) {
        console.error(e);
        res.status(e.code === "ER_NO_SUCH_TABLE" ? 503 : 500).json({
            mensaje: e.code === "ER_NO_SUCH_TABLE" ? "Ejecuta migrations/001_producto_proveedor.sql" : "Error al consultar especificaciones"
        });
    }
};
const reemplazar = async (req, res) => {
    const id = Number(req.params.id), datos = req.body?.especificaciones;
    if (!idValido(id) || !Array.isArray(datos) || datos.length > 40) {
        return res.status(400).json({ mensaje: "ID o lista de especificaciones inválidos" });
    }
    const claves = new Set();
    for (const e of datos) {
        if (!e || typeof e.atributo !== "string" || typeof e.valor !== "string" ||
            !e.atributo.trim() || e.atributo.trim().length > 60 || e.valor.trim().length > 255 ||
            claves.has(e.atributo.trim().toLowerCase())) {
            return res.status(400).json({ mensaje: "Especificaciones inválidas o repetidas" });
        }
        claves.add(e.atributo.trim().toLowerCase());
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [p] = await conn.query("SELECT id_producto FROM producto WHERE id_producto=? AND estado=1 FOR UPDATE", [id]);
        if (!p.length) {
            await conn.rollback();
            return res.status(404).json({ mensaje: "Producto activo no encontrado" });
        }
        await conn.query("DELETE FROM producto_especificacion WHERE id_producto=?", [id]);
        for (const e of datos) await conn.query(`INSERT INTO producto_especificacion
            (id_producto, atributo, valor) VALUES (?,?,?)`, [id, e.atributo.trim(), e.valor.trim()]);
        await conn.commit();
        res.json({ mensaje: "Especificaciones guardadas", cantidad: datos.length });
    } catch (e) {
        await conn.rollback();
        console.error(e);
        res.status(e.code === "ER_NO_SUCH_TABLE" ? 503 : 500).json({
            mensaje: e.code === "ER_NO_SUCH_TABLE" ? "Ejecuta migrations/001_producto_proveedor.sql" : "Error al guardar especificaciones"
        });
    } finally { conn.release(); }
};
module.exports = { consultar, reemplazar };
