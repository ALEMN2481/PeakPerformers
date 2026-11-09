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
module.exports = {
    listarCategorias,
    crearCategoria
};