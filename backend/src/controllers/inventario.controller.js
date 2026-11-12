const servicio = require("../services/inventario.service");

const responderConsulta = (funcion) => async (req, res) => {
    try { res.json(await funcion()); }
    catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar inventario" });
    }
};

const resumenInventario = responderConsulta(servicio.obtenerResumen);
const consultarExistencias = responderConsulta(servicio.listarExistencias);
const consultarStockBajo = responderConsulta(servicio.listarStockBajo);
const consultarMovimientos = responderConsulta(servicio.listarMovimientos);

const crearMovimiento = async (req, res) => {
    // AUDITORIA: el usuario procede del token validado, NUNCA del body.
    const id_usuario = req.usuario.id_usuario;
    const { id_producto, tipo, cantidad, motivo } = req.body || {};

    if (!Number.isSafeInteger(id_producto) || id_producto <= 0) {
        return res.status(400).json({ mensaje: "Producto debe tener ID valido" });
    }
    if (!["Entrada", "Salida"].includes(tipo)) {
        return res.status(400).json({ mensaje: "El tipo debe ser Entrada o Salida" });
    }
    if (typeof cantidad !== "number" || !Number.isFinite(cantidad) ||
        cantidad <= 0 || cantidad > 9999999.999 ||
        Math.abs(cantidad * 1000 - Math.round(cantidad * 1000)) > 0.000001) {
        return res.status(400).json({ mensaje: "Cantidad invalida. Maximo 3 decimales" });
    }
    if (motivo != null && (typeof motivo !== "string" || motivo.length > 255)) {
        return res.status(400).json({ mensaje: "Motivo invalido" });
    }
    try {
        const resultado = await servicio.registrarMovimiento({
            id_producto, id_usuario, tipo, cantidad, motivo
        });
        res.status(201).json({ mensaje: "Movimiento registrado correctamente", ...resultado });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({
            mensaje: error.status ? error.message : "Error interno al registrar movimiento"
        });
    }
};

module.exports = { resumenInventario, consultarExistencias, consultarStockBajo,
    consultarMovimientos, crearMovimiento };
