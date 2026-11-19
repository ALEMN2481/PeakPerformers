const router = require("express").Router();
const { autenticar, puedeVender } = require("../middlewares/auth.middleware");
const c = require("../controllers/ventas.controller");
router.use(autenticar);
router.get("/", c.listar);
router.get("/:id", c.obtener);
router.post("/", puedeVender, c.registrar);
module.exports = router;
