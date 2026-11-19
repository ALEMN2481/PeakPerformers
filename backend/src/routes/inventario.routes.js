const router = require("express").Router();
const { autenticar, autenticarOpcional, soloAdministrador, puedeConsultarInventario } = require("../middlewares/auth.middleware");
const { resumenInventario, consultarExistencias, consultarStockBajo, consultarMovimientos, crearMovimiento } = require("../controllers/inventario.controller");
router.get("/resumen", autenticarOpcional, resumenInventario);
router.get("/existencias", autenticar, puedeConsultarInventario, consultarExistencias);
router.get("/stock-bajo", autenticar, puedeConsultarInventario, consultarStockBajo);
router.get("/movimientos", autenticar, soloAdministrador, consultarMovimientos);
router.post("/movimientos", autenticar, soloAdministrador, crearMovimiento);
module.exports = router;
