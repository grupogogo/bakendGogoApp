const { Router } = require('express')
const { validarJWT } = require('../middlewares/validar-jwt');

const { getPedidos, crearPedido, eliminarPedido, editarEstadoPedido, getPedidosCliente, getOldOrders, editarItemsPedido } = require('../controllers/pedido');


const router = Router();

router.use(validarJWT);

router.get('/', getPedidos);

router.get('/oldOrders', getOldOrders);

router.get('/cliente/:cliente_id', getPedidosCliente); // Nueva ruta

router.post('/', crearPedido);

router.put('/:id_pedido', editarEstadoPedido);

router.put('/items/:pedido_id', editarItemsPedido);

router.delete('/:pedido_id', eliminarPedido);


module.exports = router;