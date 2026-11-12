const router = require("express").Router();
const { login, perfil } = require("../controllers/auth.controller");
const { autenticar } = require("../middlewares/auth.middleware");

router.post("/login", login);
router.get("/me", autenticar, perfil);
module.exports = router;
