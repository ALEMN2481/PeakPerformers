
const db = require("../src/config/database");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");

(async () => {
    const correo = "inventario-pruebas@local.invalid";

    const [existentes] = await db.query(
        "SELECT id_usuario FROM usuario WHERE correo = ?",
        [correo]
    );

    if (existentes.length) {
        console.log("Usuario de prueba ID:", existentes[0].id_usuario);
        return;
    }

    const [roles] = await db.query(
        "SELECT id_rol FROM rol ORDER BY id_rol LIMIT 1"
    );

    if (!roles.length) {
        throw new Error("Primero debes registrar un rol");
    }

    const claveAleatoria = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(claveAleatoria, 12);

    const [resultado] = await db.query(
        `INSERT INTO usuario
         (id_rol, nombre, correo, contrasena_hash, estado)
         VALUES (?, ?, ?, ?, 1)`,
        [
            roles[0].id_rol,
            "Usuario local de pruebas",
            correo,
            hash
        ]
    );

    console.log("Usuario de prueba ID:", resultado.insertId);
})()
.catch(console.error)
.finally(() => db.end());
