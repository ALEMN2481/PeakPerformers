require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {
        const conexion = await pool.getConnection();

        console.log("Conexion con MariaDB exitosa");

        conexion.release();

        app.listen(PORT, () => {
            console.log(`Servidor ejecutandose en el puerto ${PORT}`);
        });

    } catch (error) {
        console.error("Error al conectar con MariaDB:", error.message);
    }
}

iniciarServidor();