// SOLO DESARROLLO LOCAL. Genera cuentas temporales con contrasenas aleatorias.
const db = require("../src/config/database");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const { nombreDelRol } = require("../src/middlewares/auth.middleware");

(async () => {
    const [roles] = await db.query("SELECT * FROM rol");
    for (const nombre of ["Administrador", "Cajero"]) {
        const rol = roles.find(r => nombreDelRol(r).toLowerCase() === nombre.toLowerCase());
        if (!rol) {
            console.log(`No se encontro rol ${nombre}; se omite`);
            continue;
        }
        const correo = `${nombre.toLowerCase()}.test@controlstock.invalid`;
        const clave = crypto.randomBytes(24).toString("base64url");
        const hash = await bcrypt.hash(clave, 12);
        const [existentes] = await db.query("SELECT id_usuario FROM usuario WHERE correo = ?", [correo]);
        let id;
        if (existentes.length) {
            id = existentes[0].id_usuario;
            await db.query(
                "UPDATE usuario SET id_rol = ?, contrasena_hash = ?, estado = 1 WHERE id_usuario = ?",
                [rol.id_rol, hash, id]
            );
        } else {
            const [r] = await db.query(
                "INSERT INTO usuario (id_rol, nombre, correo, contrasena_hash, estado) VALUES (?, ?, ?, ?, 1)",
                [rol.id_rol, `Cuenta local de prueba ${nombre}`, correo, hash]
            );
            id = r.insertId;
        }
        console.log(`\nCuenta ${nombre}: ID ${id}`);
        console.log(`Correo: ${correo}`);
        console.log(`Contrasena generada (NO compartir): ${clave}`);
    }
})().catch(console.error).finally(() => db.end());
