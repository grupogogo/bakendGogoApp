const { Router } = require('express')
const { crearGasto, getGastos } = require('../controllers/gastos');

const router = Router();

router.get('/', getGastos);

router.post('/', crearGasto);

/* router.put('/:id_producto', editarProducto);

router.delete('/:producto_id', eliminarProdcuto); */


module.exports = router;