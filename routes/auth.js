//Rutas de usuarios /Auth
//Host + /api/auth

const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { crearUsuario, loginUsuario, revalidarToken } = require('../controllers/auth');
const { validarJWT } = require('../middlewares/validar-jwt')

const router = Router();

//importacion de los auth controller
//Rutas cuando se consulte esa URL

//CREAR USUARIO
router.post('/new',
    [//midelWares],
        check('name', 'EL nombre es obligatorio').not().isEmpty(),
        check('email', 'EL email es obligatorio').isEmail(),
        check('password', 'EL Password es obligatorio + de 6 caracteres').isLength({ min: 6 }),
        validarCampos
    ],
    crearUsuario);

// LOGIN USUARIO
router.post('/',
    [
        check('email', 'EL email es obligatorio').isEmail(),
        check('password', 'EL Password es obligatorio + de 6 caracteres').isLength({ min: 6 }),
        validarCampos
    ],
    loginUsuario
);

//VALIDAR TOKEN
router.get('/renew',validarJWT, revalidarToken);

module.exports = router