/* Events rutas */
/* /api/events */

const { Router } = require('express')
const { validarJWT } = require('../middlewares/validar-jwt');

const { isDate } = require('../helpers/isDate')
const { validarCampos } = require('../middlewares/validar-campos')
const { getEventos, eliminarEvento, actualizarEvento, crearEvento } = require('../controllers/events');
const { check } = require('express-validator');

const router = Router();

//Todas deben pasar por la validacion del token

router.use(validarJWT);

//Primero las rutas de Obtener eventos

router.get('/', getEventos);

//Crear un nuevo evento
router.post(
    '/',
    [
        check('title', 'El titulo es obligatorio').not().isEmpty(),
        check('start', 'Fecha de inicio es obligatoria').custom(isDate),
        check('end', 'Fecha de finalizacion es obligatoria').custom(isDate),

        validarCampos
    ],
    crearEvento);

//Actualizar evento
router.put('/:id', actualizarEvento);

//Borrar evento
router.delete('/:id', eliminarEvento);

module.exports = router;