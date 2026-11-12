const express = require("express");
const cors = require("cors");
const db = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const categoriasRoutes = require("./routes/categorias.routes");
const productosRoutes = require("./routes/productos.routes");
const inventarioRoutes = require("./routes/inventario.routes");

const app = express();
app.use(cors()); // Configurar origenes permitidos antes del despliegue.
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => res.json({ mensaje: "API de ControlStock funcionando correctamente" }));
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT NOW() AS fecha");
        res.json({ mensaje: "Conexion con MariaDB exitosa", fecha: rows[0].fecha });
    } catch (error) {
        console.error("Error de base de datos:", error.message);
        res.status(500).json({ mensaje: "Error al conectar con MariaDB" });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/inventario", inventarioRoutes);

app.use((req, res) => res.status(404).json({ mensaje: "Ruta no encontrada" }));
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ mensaje: "JSON invalido" });
    }
    console.error("Error no controlado:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
});

module.exports = app;
