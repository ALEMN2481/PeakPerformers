const s = require("../services/abastecimiento.service");
const { idValido, decimalValido } = require("../utils/validaciones");

const errorApi = (err, res) => {
    console.error("Abastecimiento:", err);
    if (err.status) return res.status(err.status).json({ mensaje: err.message });
    if (err.code === "ER_NO_SUCH_TABLE") return res.status(503).json({
        mensaje: "Falta migración de proveedores. Ejecuta migrations/001_producto_proveedor.sql"
    });
    return res.status(500).json({ mensaje: "Error interno en abastecimiento" });
};
const vinculos = async (_req, res) => {
    try { res.json(await s.consultarVinculos()); } catch (err) { errorApi(err,res); }
};
const vincular = async (req, res) => {
    const { id_producto, id_proveedor, costo_referencia = null, es_principal = false } = req.body || {};
    if (!idValido(id_producto) || !idValido(id_proveedor) ||
        (costo_referencia !== null && !decimalValido(costo_referencia,2,99999999.99,true)) ||
        typeof es_principal !== "boolean") {
        return res.status(400).json({ mensaje: "Datos del vínculo inválidos" });
    }
    try {
        res.json(await s.guardarVinculo({ id_producto, id_proveedor, costo_referencia, es_principal }));
    } catch (err) { errorApi(err,res); }
};
const faltantes = async (_req, res) => {
    try { res.json(await s.consultarFaltantes()); } catch (err) { errorApi(err,res); }
};
const generar = async (_req, res) => {
    try { res.json(await s.generarOrdenes()); } catch (err) { errorApi(err,res); }
};
module.exports = { vinculos, vincular, faltantes, generar };
