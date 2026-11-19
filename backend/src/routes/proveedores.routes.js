const router = require("express").Router();
const { autenticar, soloAdministrador } = require("../middlewares/auth.middleware");
const c = require("../controllers/proveedores.controller");

router.use(autenticar, soloAdministrador);
router.get("/", c.listar);
router.get("/:id", c.obtener);
router.post("/", soloAdministrador, c.registrar);
router.put("/:id", soloAdministrador, c.modificar);
router.delete("/:id", soloAdministrador, c.borrar);
module.exports = router;
