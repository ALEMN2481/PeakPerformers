
const express = require("express");
const router = express.Router();

const {
    obtenerProductos,
    obtenerProducto,
    registrarProducto,
    modificarProducto,
    borrarProducto
} = require("../controllers/productos.controller");

router.get("/", obtenerProductos);
router.get("/:id", obtenerProducto);
router.post("/", registrarProducto);
router.put("/:id", modificarProducto);
router.delete("/:id", borrarProducto);

module.exports = router;
