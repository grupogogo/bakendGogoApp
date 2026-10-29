const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const { getTiposGuanteEspecial, crearTipoGuanteEspecial, editarTipoGuanteEspecial, desactivarTipoGuanteEspecial } = require('../controllers/tiposGuanteEspecial');

const router = Router();

router.use(validarJWT);

router.get('/', getTiposGuanteEspecial);
router.post('/', crearTipoGuanteEspecial);
router.put('/:id', editarTipoGuanteEspecial);
router.delete('/:id', desactivarTipoGuanteEspecial);

module.exports = router;
