
const servicio = require("../services/productos.service");

// Validar y preparar los datos
const validarProducto = (body) => {
    const id_categoria = Number(body.id_categoria);
    const precio_costo = Number(body.precio_costo);
    const precio_venta = Number(body.precio_venta);
    const stock_minimo = Number(body.stock_minimo ?? 0);

    if (!Number.isSafeInteger(id_categoria) || id_categoria <= 0) {
        return { error: "Categoría inválida" };
    }

    for (const [campo, maximo] of [
        ["sku", 50],
        ["nombre", 150],
        ["unidad_medida", 20]
    ]) {
        if (
            typeof body[campo] !== "string" ||
            !body[campo].trim() ||
            body[campo].trim().length > maximo
        ) {
            return { error: `Campo ${campo} inválido` };
        }
    }

    if (
        body.precio_costo == null ||
        body.precio_venta == null ||
        !Number.isFinite(precio_costo) ||
        !Number.isFinite(precio_venta) ||
        precio_costo < 0 ||
        precio_venta < 0
    ) {
        return { error: "Precios inválidos" };
    }

    if (!Number.isFinite(stock_minimo) || stock_minimo < 0) {
        return { error: "Stock mínimo inválido" };
    }

    for (const campo of ["codigo_barras", "descripcion", "ubicacion_bodega"]) {
        if (body[campo] != null && typeof body[campo] !== "string") {
            return { error: `Campo ${campo} inválido` };
        }
    }

    return {
        datos: {
            id_categoria,
            sku: body.sku.trim(),
            nombre: body.nombre.trim(),
            codigo_barras: body.codigo_barras?.trim() || null,
            descripcion: body.descripcion?.trim() || null,
            precio_costo,
            precio_venta,
            stock_minimo,
            unidad_medida: body.unidad_medida.trim(),
            ubicacion_bodega: body.ubicacion_bodega?.trim() || null
        }
    };
};

const manejarError = (error, res) => {
    console.error("Error en productos:", error);

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            mensaje: "El SKU o código de barras ya existe"
        });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
            mensaje: "La categoría indicada no existe"
        });
    }

    return res.status(500).json({
        mensaje: "Error interno al procesar producto"
    });
};

const validarId = (valor) => {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// GET todos
const obtenerProductos = async (req, res) => {
    try {
        res.json(await servicio.listarProductos());
    } catch (error) {
        manejarError(error, res);
    }
};

// GET por ID
const obtenerProducto = async (req, res) => {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({ mensaje: "ID inválido" });
    }

    try {
        const producto = await servicio.buscarProducto(id);

        if (!producto) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json(producto);
    } catch (error) {
        manejarError(error, res);
    }
};

// POST
const registrarProducto = async (req, res) => {
    const { error, datos } = validarProducto(req.body || {});

    if (error) {
        return res.status(400).json({ mensaje: error });
    }

    try {
        const id = await servicio.crearProducto(datos);

        res.status(201).json({
            mensaje: "Producto registrado correctamente",
            id_producto: id
        });
    } catch (error) {
        manejarError(error, res);
    }
};

// PUT
const modificarProducto = async (req, res) => {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({ mensaje: "ID inválido" });
    }

    const { error, datos } = validarProducto(req.body || {});

    if (error) {
        return res.status(400).json({ mensaje: error });
    }

    try {
        const existe = await servicio.buscarProducto(id);

        if (!existe) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        await servicio.actualizarProducto(id, datos);

        res.json({ mensaje: "Producto actualizado correctamente" });
    } catch (error) {
        manejarError(error, res);
    }
};

// DELETE lógico
const borrarProducto = async (req, res) => {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({ mensaje: "ID inválido" });
    }

    try {
        const resultado = await servicio.eliminarProducto(id);

        if (!resultado) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json({ mensaje: "Producto desactivado correctamente" });
    } catch (error) {
        manejarError(error, res);
    }
};

module.exports = {
    obtenerProductos,
    obtenerProducto,
    registrarProducto,
    modificarProducto,
    borrarProducto
};
