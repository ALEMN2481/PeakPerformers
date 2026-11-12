const jwt = require("jsonwebtoken");
const db = require("../config/database");

function nombreDelRol(rol) {
    return String(rol.nombre_rol ?? rol.nombre ?? rol.rol ?? "").trim();
}

async function autenticar(req, res, next) {
    const cabecera = req.headers.authorization || "";
    const coincidencia = /^Bearer\s+(.+)$/i.exec(cabecera);

    if (!coincidencia) {
        return res.status(401).json({ mensaje: "Se requiere un token de acceso" });
    }

    try {
        const token = jwt.verify(coincidencia[1], process.env.JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "controlstock"
        });
        const id = Number(token.sub);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(401).json({ mensaje: "Token invalido" });
        }

        // Se consulta cada vez: desactivar un usuario revoca inmediatamente su acceso.
        const [usuarios] = await db.query(
            "SELECT id_usuario, id_rol, estado FROM usuario WHERE id_usuario = ? LIMIT 1",
            [id]
        );
        if (!usuarios.length || Number(usuarios[0].estado) !== 1) {
            return res.status(401).json({ mensaje: "Usuario no autorizado" });
        }
        const [roles] = await db.query(
            "SELECT * FROM rol WHERE id_rol = ? LIMIT 1",
            [usuarios[0].id_rol]
        );
        const rol = roles.length ? nombreDelRol(roles[0]) : "";
        if (!rol) {
            console.error("La tabla rol no tiene una columna de nombre reconocible");
            return res.status(500).json({ mensaje: "Configuracion de roles invalida" });
        }

        req.usuario = { id_usuario: id, rol };
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
            return res.status(401).json({ mensaje: "Token invalido o vencido" });
        }
        console.error("Error verificando acceso:", error);
        return res.status(500).json({ mensaje: "Error interno de autenticacion" });
    }
}

const soloAdministrador = (req, res, next) => {
    if (req.usuario?.rol?.toLowerCase() !== "administrador") {
        return res.status(403).json({ mensaje: "Acceso reservado al Administrador" });
    }
    next();
};

module.exports = { autenticar, soloAdministrador, nombreDelRol };
