const router = require("express").Router();
const { autenticar, soloAdministrador } = require("../middlewares/auth.middleware");
const { obtenerCategorias, registrarCategoria, modificarCategoria, borrarCategoria } = require("../controllers/categorias.controller");

router.use(autenticar);
router.get("/", obtenerCategorias);
router.post("/", soloAdministrador, registrarCategoria);
router.put("/:id", soloAdministrador, modificarCategoria);
router.delete("/:id", soloAdministrador, borrarCategoria);
module.exports = router;
