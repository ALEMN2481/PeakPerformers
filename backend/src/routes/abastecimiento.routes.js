const router = require("express").Router();
const { autenticar, soloAdministrador } = require("../middlewares/auth.middleware");
const c = require("../controllers/abastecimiento.controller");
router.use(autenticar, soloAdministrador);
router.get("/vinculos", c.vinculos);
router.post("/vinculos", soloAdministrador, c.vincular);
router.get("/faltantes", c.faltantes);
router.post("/generar", soloAdministrador, c.generar);
module.exports = router;
