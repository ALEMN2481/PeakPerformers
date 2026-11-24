const router = require("express").Router();
const { autenticar, autenticarOpcional, puedeGestionarProductos } = require("../middlewares/auth.middleware");
const { obtenerProductos, obtenerProducto, registrarProducto, modificarProducto, borrarProducto } = require("../controllers/productos.controller");
const { buscarProductos, alternativasProducto } = require("../controllers/busqueda.controller");
const espec = require("../controllers/especificaciones.controller");

// Consultas públicas: se ocultan costos internos, nunca se aceptan cambios sin JWT.
router.get("/", autenticarOpcional, obtenerProductos);
router.get("/buscar", buscarProductos);
router.get("/:id/alternativas", alternativasProducto);
router.get("/:id/especificaciones", espec.consultar);
router.put("/:id/especificaciones", autenticar, puedeGestionarProductos, espec.reemplazar);
router.get("/:id", autenticarOpcional, obtenerProducto);
router.post("/", autenticar, puedeGestionarProductos, registrarProducto);
router.put("/:id", autenticar, puedeGestionarProductos, modificarProducto);
router.delete("/:id", autenticar, puedeGestionarProductos, borrarProducto);
module.exports = router;
