const { Router } = require('express')
const { validarJWT } = require('../middlewares/validar-jwt');

const { getPedidos, crearPedido, eliminarPedido, editarEstadoPedido, getPedidosCliente, getOldOrders } = require('../controllers/pedido');


const router = Router();

router.use(validarJWT);

router.get('/', getPedidos);

router.get('/oldOrders', getOldOrders);

router.get('/cliente/:cliente_id', getPedidosCliente); // Nueva ruta

router.post('/', crearPedido);

router.put('/:id_pedido', editarEstadoPedido);

router.delete('/:pedido_id', eliminarPedido);


module.exports = router;