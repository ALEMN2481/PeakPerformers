const servicio = require("../services/ventas.service");
const { idValido, decimalValido } = require("../utils/validaciones");
const manejar = (err, res) => {
    console.error("Ventas:", err);
    if (err.status) return res.status(err.status).json({ mensaje: err.message });
    if (err.code === "ER_NO_SUCH_TABLE" || err.code === "ER_BAD_FIELD_ERROR") {
        return res.status(503).json({ mensaje: "Esquema de ventas incompatible. Ejecuta el diagnóstico de BD" });
    }
    return res.status(500).json({ mensaje: "Error interno en ventas" });
};
const listar = async (_req, res) => {
    try { res.json(await servicio.listar()); } catch (err) { manejar(err, res); }
};
const obtener = async (req, res) => {
    const id = Number(req.params.id);
    if (!idValido(id)) return res.status(400).json({ mensaje: "ID inválido" });
    try {
        const resultado = await servicio.buscar(id);
        if (!resultado) return res.status(404).json({ mensaje: "Venta no encontrada" });
        res.json(resultado);
    } catch (err) { manejar(err, res); }
};
const registrar = async (req, res) => {
    const { detalles, metodo_pago = "Efectivo", documento_cliente = null } = req.body || {};
    if (!Array.isArray(detalles) || detalles.length < 1 || detalles.length > 100) {
        return res.status(400).json({ mensaje: "Incluye entre 1 y 100 productos" });
    }
    if (typeof metodo_pago !== "string" || !metodo_pago.trim() || metodo_pago.length > 20) {
        return res.status(400).json({ mensaje: "Método de pago inválido" });
    }
    if (documento_cliente !== null && (typeof documento_cliente !== "string" || documento_cliente.length > 30)) {
        return res.status(400).json({ mensaje: "Documento del cliente inválido" });
    }
    const ids = new Set();
    for (const d of detalles) {
        if (!d || !idValido(d.id_producto) || !decimalValido(d.cantidad, 3, 9999999.999)) {
            return res.status(400).json({ mensaje: "Producto o cantidad inválidos" });
        }
        if (ids.has(d.id_producto)) return res.status(400).json({ mensaje: "Producto repetido" });
        ids.add(d.id_producto);
    }
    try {
        const venta = await servicio.registrar(req.usuario.id_usuario, detalles, metodo_pago.trim(), documento_cliente?.trim() || null);
        res.status(201).json({ mensaje: "Venta registrada y stock descontado", ...venta });
    } catch (err) { manejar(err, res); }
};
module.exports = { listar, obtener, registrar };
