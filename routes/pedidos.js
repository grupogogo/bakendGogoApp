const { Router } = require('express')
const { validarJWT } = require('../middlewares/validar-jwt');

/* const { isDate } = require('../helpers/isDate')
const { validarCampos } = require('../middlewares/validar-campos') */
const { getPedidos, crearPedido, eliminarPedido, editarEstadoPedido, getPedidosCliente } = require('../controllers/pedido');
//const { check } = require('express-validator');


const router = Router();

router.use(validarJWT);

router.get('/', getPedidos);

router.get('/cliente/:cliente_id', getPedidosCliente); // Nueva ruta

router.post('/', crearPedido);

router.put('/:id_pedido', editarEstadoPedido);

router.delete('/:pedido_id', eliminarPedido);


module.exports = router;