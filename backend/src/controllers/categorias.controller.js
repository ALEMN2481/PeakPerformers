
const {
    listarCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} = require("../services/categorias.service");

// GET: Consultar categorías
const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await listarCategorias();

        res.json(categorias);
    } catch (error) {
        console.error("Error al consultar categorías:", error);

        res.status(500).json({
            mensaje: "Error al consultar las categorías"
        });
    }
};

// POST: Registrar categoría
const registrarCategoria = async (req, res) => {
    try {
        const { nombre_categoria, descripcion } = req.body;

        if (
            typeof nombre_categoria !== "string" ||
            !nombre_categoria.trim() ||
            nombre_categoria.trim().length > 100
        ) {
            return res.status(400).json({
                mensaje: "El nombre debe tener entre 1 y 100 caracteres"
            });
        }

        if (
            descripcion != null &&
            typeof descripcion !== "string"
        ) {
            return res.status(400).json({
                mensaje: "La descripción debe ser un texto"
            });
        }

        const id_categoria = await crearCategoria(
            nombre_categoria.trim(),
            descripcion || null
        );

        res.status(201).json({
            mensaje: "Categoría registrada correctamente",
            id_categoria
        });
    } catch (error) {
        console.error("Error al registrar categoría:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensaje: "Ya existe una categoría con ese nombre"
            });
        }

        res.status(500).json({
            mensaje: "Error al registrar la categoría"
        });
    }
};

// PUT: Actualizar categoría
const modificarCategoria = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nombre_categoria, descripcion } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: "ID de categoría inválido"
            });
        }

        if (
            typeof nombre_categoria !== "string" ||
            !nombre_categoria.trim() ||
            nombre_categoria.trim().length > 100
        ) {
            return res.status(400).json({
                mensaje: "El nombre debe tener entre 1 y 100 caracteres"
            });
        }

        if (
            descripcion != null &&
            typeof descripcion !== "string"
        ) {
            return res.status(400).json({
                mensaje: "La descripción debe ser texto"
            });
        }

        const resultado = await actualizarCategoria(
            id,
            nombre_categoria.trim(),
            descripcion || null
        );

        if (resultado === 0) {
            return res.status(404).json({
                mensaje: "Categoría no encontrada"
            });
        }

        res.json({
            mensaje: "Categoría actualizada correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar categoría:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensaje: "Ya existe una categoría con ese nombre"
            });
        }

        res.status(500).json({
            mensaje: "Error al actualizar la categoría"
        });
    }
};

// DELETE: Eliminar categoría
const borrarCategoria = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: "ID de categoría inválido"
            });
        }

        const resultado = await eliminarCategoria(id);

        if (resultado === 0) {
            return res.status(404).json({
                mensaje: "Categoría no encontrada"
            });
        }

        res.json({
            mensaje: "Categoría eliminada correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar categoría:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                mensaje: "No se puede eliminar una categoría con productos asociados"
            });
        }

        res.status(500).json({
            mensaje: "Error al eliminar la categoría"
        });
    }
};

module.exports = {
    obtenerCategorias,
    registrarCategoria,
    modificarCategoria,
    borrarCategoria
};
