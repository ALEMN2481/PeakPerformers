const express = require("express");
const db = require("../config/database");
const router = express.Router();
const {
    obtenerCategorias,
    registrarCategoria
} = require("../controllers/categorias.controller");

router.get("/", obtenerCategorias);


router.post("/", registrarCategoria);
module.exports = router;