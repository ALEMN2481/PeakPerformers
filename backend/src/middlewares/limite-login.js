const { rateLimit } = require("express-rate-limit");

// Fuerza bruta: 5 intentos fallidos por IP cada 15 minutos; los logins correctos no cuentan.
// shortcut: memoria del proceso, se reinicia al reiniciar y no se comparte entre instancias; usar un store compartido (Redis) si se escala.
module.exports = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { mensaje: "Demasiados intentos de inicio de sesion. Intenta de nuevo en 15 minutos" }
});
