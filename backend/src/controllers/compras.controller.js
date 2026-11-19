const servicio = require("../services/compras.service");

const idValido = (valor) => Number.isSafeInteger(Number(valor)) && Number(valor) > 0;

// Se aceptan números JSON positivos de hasta 3 decimales (cantidades)
// o 2 decimales (costos), acordes con las columnas DECIMAL de MariaDB.
const validoDecimal = (n, decimales, maximo, puedeSerCero = false) =>
    typeof n === "number" && Number.isFinite(n) &&
    (puedeSerCero ? n >= 0 : n > 0) && n <= maximo &&
    Math.abs(n * 10 ** decimales - Math.round(n * 10 ** decimales)) < 0.00001;

const errorHttp = (err, res) => {
    console.error("Error de compras:", err);
    if (err.status) return res.status(err.status).json({ mensaje: err.message });
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ mensaje: "Producto repetido en la orden" });
    }
    return res.status(500).json({ mensaje: "Error interno al procesar compra" });
};

const listar = async (req, res) => {
    try { res.json(await servicio.listar()); }
    catch (e) { errorHttp(e, res); }
};

const obtener = async (req, res) => {
    if (!idValido(req.params.id)) {
        return res.status(400).json({ mensaje: "ID inválido" });
    }
    try {
        const orden = await servicio.buscar(Number(req.params.id));
        if (!orden) return res.status(404).json({ mensaje: "Orden no encontrada" });
        res.json(orden);
    } catch (e) { errorHttp(e, res); }
};

const registrar = async (req, res) => {
    const { id_proveedor, detalles } = req.body || {};
    if (!Number.isSafeInteger(id_proveedor) || id_proveedor <= 0) {
        return res.status(400).json({ mensaje: "ID de proveedor inválido" });
    }
    if (!Array.isArray(detalles) || detalles.length < 1 || detalles.length > 100) {
        return res.status(400).json({ mensaje: "Incluye entre 1 y 100 productos" });
    }

    const ids = new Set();
    let totalCentavos = 0n;
    for (const d of detalles) {
        if (!d || !Number.isSafeInteger(d.id_producto) || d.id_producto <= 0 ||
            !validoDecimal(d.cantidad, 3, 9999999.999) ||
            !validoDecimal(d.costo_unitario, 2, 99999999.99, true)) {
            return res.status(400).json({ mensaje: "Detalle de producto inválido" });
        }
        if (ids.has(d.id_producto)) {
            return res.status(400).json({ mensaje: "No repitas un producto en la orden" });
        }
        ids.add(d.id_producto);
        const milUnidades = BigInt(Math.round(d.cantidad * 1000));
        const centavosUnidad = BigInt(Math.round(d.costo_unitario * 100));
        totalCentavos += (milUnidades * centavosUnidad + 500n) / 1000n;
    }
    if (totalCentavos > 9999999999n) {
        return res.status(400).json({ mensaje: "Total excede el límite de la orden" });
    }

    try {
        const creada = await servicio.crear(id_proveedor, detalles, totalCentavos);
        res.status(201).json({ mensaje: "Orden creada", ...creada });
    } catch (e) { errorHttp(e, res); }
};

const recibir = async (req, res) => {
    if (!idValido(req.params.id)) {
        return res.status(400).json({ mensaje: "ID de orden inválido" });
    }
    // El usuario se obtiene del JWT comprobado, no del cuerpo enviado por el cliente.
    try {
        const resultado = await servicio.recibir(
            Number(req.params.id), req.usuario.id_usuario
        );
        res.json({ mensaje: "Compra recibida e inventario actualizado", ...resultado });
    } catch (e) { errorHttp(e, res); }
};

module.exports = { listar, obtener, registrar, recibir };
