const router = require("express").Router();
const { autenticar, soloAdministrador } = require("../middlewares/auth.middleware");
const { obtenerProductos, obtenerProducto, registrarProducto, modificarProducto, borrarProducto } = require("../controllers/productos.controller");
const { buscarProductos, alternativasProducto } = require("../controllers/busqueda.controller");

router.use(autenticar);
router.get("/", obtenerProductos);
router.get("/buscar", buscarProductos); // Debe ir ANTES de /:id
router.get("/:id/alternativas", alternativasProducto);
router.get("/:id", obtenerProducto);
router.post("/", soloAdministrador, registrarProducto);
router.put("/:id", soloAdministrador, modificarProducto);
router.delete("/:id", soloAdministrador, borrarProducto);
module.exports = router;
