const router = require("express").Router();
const { autenticar, autenticarOpcional, soloAdministrador } = require("../middlewares/auth.middleware");
const { obtenerProductos, obtenerProducto, registrarProducto, modificarProducto, borrarProducto } = require("../controllers/productos.controller");
const { buscarProductos, alternativasProducto } = require("../controllers/busqueda.controller");
const espec = require("../controllers/especificaciones.controller");

// Consultas públicas: se ocultan costos internos, nunca se aceptan cambios sin JWT.
router.get("/", autenticarOpcional, obtenerProductos);
router.get("/buscar", buscarProductos);
router.get("/:id/alternativas", alternativasProducto);
router.get("/:id/especificaciones", espec.consultar);
router.put("/:id/especificaciones", autenticar, soloAdministrador, espec.reemplazar);
router.get("/:id", autenticarOpcional, obtenerProducto);
router.post("/", autenticar, soloAdministrador, registrarProducto);
router.put("/:id", autenticar, soloAdministrador, modificarProducto);
router.delete("/:id", autenticar, soloAdministrador, borrarProducto);
module.exports = router;
