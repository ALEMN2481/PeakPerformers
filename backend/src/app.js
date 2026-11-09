const express = require("express");
const cors = require("cors");
const db = require("./config/database");
const categoriasRoutes = require("./routes/categorias.routes");
const app = express();

// Configuraciones del servidor
app.use(cors());
app.use(express.json());
app.use("/api/categorias", categoriasRoutes);
// Ruta principal de prueba
app.get("/", (req, res) => {
    res.json({
        mensaje: "API de ControlStock funcionando correctamente"
    });
});

// Ruta para comprobar la conexion con MariaDB
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT NOW() AS fecha");

        res.json({
            mensaje: "Conexion con MariaDB exitosa",
            fecha: rows[0].fecha
        });

    } catch (error) {
        console.error("Error de base de datos:", error.message);

        res.status(500).json({
            mensaje: "Error al conectar con MariaDB"
        });
    }
});

module.exports = app;