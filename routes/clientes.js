const { Router } = require('express')
const { validarJWT } = require('../middlewares/validar-jwt');

/* const { isDate } = require('../helpers/isDate')
const { validarCampos } = require('../middlewares/validar-campos') */
const { crearCliente, getClientes, actualizarCliente, eliminarCliente } = require('../controllers/clientes');
//const { check } = require('express-validator');


const router = Router();

router.use(validarJWT);

router.get('/', getClientes);

router.post('/', crearCliente);

router.put('/:id_cliente', actualizarCliente);

router.delete('/:id_cliente', eliminarCliente);

module.exports = router;