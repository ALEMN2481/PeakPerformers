
const express = require("express");
const router = express.Router();

const {
    resumenInventario,
    consultarExistencias,
    consultarStockBajo,
    consultarMovimientos,
    crearMovimiento
} = require("../controllers/inventario.controller");

router.get("/resumen", resumenInventario);
router.get("/existencias", consultarExistencias);
router.get("/stock-bajo", consultarStockBajo);

router.get("/movimientos", consultarMovimientos);
router.post("/movimientos", crearMovimiento);

module.exports = router;
