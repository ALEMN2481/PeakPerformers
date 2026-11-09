const db = require("../config/database");
const {
    listarCategorias,
    crearCategoria
} = require("../services/categorias.service");

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
const registrarCategoria = async (req, res) => {
    try {
        const { nombre_categoria, descripcion } = req.body;

        if (
            typeof nombre_categoria !== "string" ||
            !nombre_categoria.trim()
        ) {
            return res.status(400).json({
                mensaje: "El nombre de la categoría es obligatorio"
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

        res.status(500).json({
            mensaje: "Error al registrar la categoría"
        });
    }
};

module.exports = {
    obtenerCategorias,
    registrarCategoria
};