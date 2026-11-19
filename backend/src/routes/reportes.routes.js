const router = require('express').Router();
const { autenticar, soloAdministrador } = require('../middlewares/auth.middleware');
const { dashboard, ventasResumen } = require('../controllers/reportes.controller');
router.get('/dashboard', autenticar, soloAdministrador, dashboard);
router.get('/ventas-resumen', autenticar, soloAdministrador, ventasResumen);
module.exports = router;
