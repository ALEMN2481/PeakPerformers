const servicio = require("../services/proveedores.service");

const idValido = (valor) => {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validar = (cuerpo = {}) => {
    const requeridos = { nit_rut: 30, razon_social: 150 };
    const opcionales = { telefono: 30, direccion: 200, correo: 150 };
    const datos = {};

    for (const [campo, limite] of Object.entries(requeridos)) {
        if (typeof cuerpo[campo] !== "string" ||
            !cuerpo[campo].trim() || cuerpo[campo].trim().length > limite) {
            return { error: `Campo obligatorio inválido: ${campo} (máximo ${limite})` };
        }
        datos[campo] = cuerpo[campo].trim();
    }

    for (const [campo, limite] of Object.entries(opcionales)) {
        if (cuerpo[campo] != null && typeof cuerpo[campo] !== "string") {
            return { error: `El campo ${campo} debe ser texto` };
        }
        const valor = cuerpo[campo]?.trim() || null;
        if (valor && valor.length > limite) {
            return { error: `El campo ${campo} supera ${limite} caracteres` };
        }
        datos[campo] = valor;
    }

    if (datos.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
        return { error: "Correo electrónico inválido" };
    }
    return { datos };
};

const responderError = (error, res) => {
    console.error("Error de proveedores:", error);
    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ mensaje: "El NIT/RUT ya está registrado" });
    }
    if (["ER_ROW_IS_REFERENCED_2", "ER_ROW_IS_REFERENCED"].includes(error.code)) {
        return res.status(409).json({
            mensaje: "No se puede eliminar: el proveedor tiene órdenes asociadas"
        });
    }
    return res.status(500).json({ mensaje: "Error interno con proveedores" });
};

const listar = async (req, res) => {
    try { res.json(await servicio.listar()); }
    catch (error) { responderError(error, res); }
};

const obtener = async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ mensaje: "ID inválido" });
    try {
        const proveedor = await servicio.buscar(id);
        if (!proveedor) return res.status(404).json({ mensaje: "Proveedor no encontrado" });
        res.json(proveedor);
    } catch (error) { responderError(error, res); }
};

const registrar = async (req, res) => {
    const { error, datos } = validar(req.body || {});
    if (error) return res.status(400).json({ mensaje: error });
    try {
        const id_proveedor = await servicio.crear(datos);
        res.status(201).json({ mensaje: "Proveedor creado", id_proveedor });
    } catch (e) { responderError(e, res); }
};

const modificar = async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ mensaje: "ID inválido" });
    const { error, datos } = validar(req.body || {});
    if (error) return res.status(400).json({ mensaje: error });
    try {
        const existe = await servicio.buscar(id);
        if (!existe) return res.status(404).json({ mensaje: "Proveedor no encontrado" });
        await servicio.actualizar(id, datos);
        res.json({ mensaje: "Proveedor actualizado" });
    } catch (e) { responderError(e, res); }
};

const borrar = async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ mensaje: "ID inválido" });
    try {
        const eliminados = await servicio.eliminar(id);
        if (!eliminados) return res.status(404).json({ mensaje: "Proveedor no encontrado" });
        res.json({ mensaje: "Proveedor eliminado" });
    } catch (e) { responderError(e, res); }
};

module.exports = { listar, obtener, registrar, modificar, borrar };
