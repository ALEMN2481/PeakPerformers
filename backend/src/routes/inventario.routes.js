const router = require("express").Router();
const { autenticar, soloAdministrador } = require("../middlewares/auth.middleware");
const { resumenInventario, consultarExistencias, consultarStockBajo, consultarMovimientos, crearMovimiento } = require("../controllers/inventario.controller");

router.use(autenticar);
router.get("/resumen", resumenInventario);
router.get("/existencias", consultarExistencias);
router.get("/stock-bajo", consultarStockBajo);
router.get("/movimientos", consultarMovimientos);
router.post("/movimientos", soloAdministrador, crearMovimiento);
module.exports = router;
