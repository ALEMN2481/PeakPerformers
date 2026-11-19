const router = require("express").Router();
const { autenticar, soloAdministrador } = require("../middlewares/auth.middleware");
const { obtenerCategorias, registrarCategoria, modificarCategoria, borrarCategoria } = require("../controllers/categorias.controller");

router.get("/", obtenerCategorias);
router.post("/", autenticar, soloAdministrador, registrarCategoria);
router.put("/:id", autenticar, soloAdministrador, modificarCategoria);
router.delete("/:id", autenticar, soloAdministrador, borrarCategoria);
module.exports = router;
