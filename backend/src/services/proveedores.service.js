const db = require("../config/database");

const listar = async () => {
    const [filas] = await db.query(
        "SELECT * FROM proveedor ORDER BY razon_social"
    );
    return filas;
};

const buscar = async (id) => {
    const [filas] = await db.query(
        "SELECT * FROM proveedor WHERE id_proveedor = ?", [id]
    );
    return filas[0] || null;
};

const crear = async (datos) => {
    const [resultado] = await db.query(
        `INSERT INTO proveedor (nit_rut, razon_social, telefono, direccion, correo)
         VALUES (?, ?, ?, ?, ?)`,
        [datos.nit_rut, datos.razon_social, datos.telefono, datos.direccion, datos.correo]
    );
    return resultado.insertId;
};

const actualizar = async (id, datos) => {
    const [resultado] = await db.query(
        `UPDATE proveedor SET nit_rut = ?, razon_social = ?, telefono = ?,
         direccion = ?, correo = ? WHERE id_proveedor = ?`,
        [datos.nit_rut, datos.razon_social, datos.telefono,
            datos.direccion, datos.correo, id]
    );
    return resultado.affectedRows;
};

const eliminar = async (id) => {
    const [resultado] = await db.query(
        "DELETE FROM proveedor WHERE id_proveedor = ?", [id]
    );
    return resultado.affectedRows;
};

module.exports = { listar, buscar, crear, actualizar, eliminar };
