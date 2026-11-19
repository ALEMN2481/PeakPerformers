const router = require('express').Router();
const { autenticar, soloProveedor } = require('../middlewares/auth.middleware');
const c = require('../controllers/portal-proveedor.controller');

router.use(autenticar, soloProveedor);
router.get('/mi-perfil', c.perfil);
router.get('/mis-ordenes', c.listar);
router.get('/mis-ordenes/:id', c.obtener);
router.post('/mis-ordenes/:id/confirmar', c.confirmar);

module.exports = router;
