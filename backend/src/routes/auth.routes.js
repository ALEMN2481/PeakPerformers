const router = require("express").Router();
const { login, perfil } = require("../controllers/auth.controller");
const { autenticar } = require("../middlewares/auth.middleware");

const limiteLogin = require("../middlewares/limite-login");

router.post("/login", limiteLogin, login);
router.get("/me", autenticar, perfil);
module.exports = router;
