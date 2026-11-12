const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const login = async (req, res) => {
    const { correo, contrasena } = req.body || {};
    if (typeof correo !== "string" || typeof contrasena !== "string" ||
        !correo.trim() || !contrasena || correo.length > 150 || contrasena.length > 256) {
        return res.status(400).json({ mensaje: "Correo y contrasena obligatorios" });
    }
    try {
        const [usuarios] = await db.query(
            "SELECT id_usuario, correo, contrasena_hash, estado FROM usuario WHERE correo = ? LIMIT 1",
            [correo.trim()]
        );
        const u = usuarios[0];
        if (!u || Number(u.estado) !== 1 || !await bcrypt.compare(contrasena, u.contrasena_hash)) {
            return res.status(401).json({ mensaje: "Credenciales invalidas" });
        }
        const token = jwt.sign({ sub: String(u.id_usuario) }, process.env.JWT_SECRET, {
            algorithm: "HS256", issuer: "controlstock", expiresIn: "8h"
        });
        return res.json({ mensaje: "Sesion iniciada", token, tipo: "Bearer", vence_en: "8h" });
    } catch (error) {
        console.error("Error de inicio de sesion:", error);
        return res.status(500).json({ mensaje: "Error interno al iniciar sesion" });
    }
};

const perfil = async (req, res) => res.json(req.usuario);

module.exports = { login, perfil };
