const db = require("../config/database");

const listarCategorias = async () => {
    const [categorias] = await db.query(
        "SELECT * FROM categoria"
    );

    return categorias;
};
const crearCategoria = async (nombre_categoria, descripcion) => {
    const [resultado] = await db.query(
        "INSERT INTO categoria (nombre_categoria, descripcion) VALUES (?, ?)",
        [nombre_categoria, descripcion]
    );

    return resultado.insertId;
};
const actualizarCategoria = async (id, nombre, descripcion) => {
    const [resultado] = await db.query(
        `UPDATE categoria
         SET nombre_categoria = ?, descripcion = ?
         WHERE id_categoria = ?`,
        [nombre, descripcion, id]
    );

    return resultado.affectedRows;
};
const eliminarCategoria = async (id) => {
    const [resultado] = await db.query(
        "DELETE FROM categoria WHERE id_categoria = ?",
        [id]
    );

    return resultado.affectedRows;
};
module.exports = {
    listarCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
};