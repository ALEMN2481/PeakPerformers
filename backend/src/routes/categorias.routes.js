const express = require("express");

const {
    obtenerCategorias,
    registrarCategoria,
    modificarCategoria,
    borrarCategoria
} = require("../controllers/categorias.controller");

const router = express.Router();

router.get("/", obtenerCategorias);

router.post("/", registrarCategoria);

router.put("/:id", modificarCategoria);

router.delete("/:id", borrarCategoria);

module.exports = router;