const router = require("express").Router();
const { autenticar, soloAdministrador } = require("../middlewares/auth.middleware");
const c = require("../controllers/compras.controller");

router.use(autenticar, soloAdministrador);
router.get("/", c.listar);
router.get("/:id", c.obtener);
router.post("/", soloAdministrador, c.registrar);
router.post("/:id/recibir", soloAdministrador, c.recibir);
module.exports = router;
