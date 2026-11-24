const servicio = require('../services/portal-proveedor.service');

const idValido = (valor) => /^[1-9]\d*$/.test(String(valor)) && Number.isSafeInteger(Number(valor));

function manejar(error, res) {
    if (error.status) return res.status(error.status).json({ mensaje: error.message });
    console.error('Portal de proveedor:', error);
    if (['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(error.code)) {
        return res.status(503).json({ mensaje: 'Falta la migración del portal Proveedor' });
    }
    return res.status(500).json({ mensaje: 'Error interno del portal de proveedor' });
}

async function perfil(req, res) {
    try {
        const proveedor = await servicio.miPerfil(req.usuario.id_usuario);
        if (!proveedor) return res.status(403).json({ mensaje: 'La cuenta no tiene un proveedor asociado' });
        return res.json(proveedor);
    } catch (error) { return manejar(error, res); }
}

async function listar(req, res) {
    try {
        const proveedor = await servicio.miPerfil(req.usuario.id_usuario);
        if (!proveedor) return res.status(403).json({ mensaje: 'La cuenta no tiene un proveedor asociado' });
        return res.json(await servicio.misOrdenes(req.usuario.id_usuario));
    } catch (error) { return manejar(error, res); }
}

async function obtener(req, res) {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: 'ID inválido' });
    try {
        const orden = await servicio.miOrden(req.usuario.id_usuario, Number(req.params.id));
        if (!orden) return res.status(404).json({ mensaje: 'Orden no encontrada' });
        return res.json(orden);
    } catch (error) { return manejar(error, res); }
}

async function confirmar(req, res) {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: 'ID inválido' });
    try {
        const resultado = await servicio.confirmar(req.usuario.id_usuario, Number(req.params.id));
        return res.json({ mensaje: 'Orden confirmada por el proveedor', ...resultado });
    } catch (error) { return manejar(error, res); }
}

module.exports = { perfil, listar, obtener, confirmar };
