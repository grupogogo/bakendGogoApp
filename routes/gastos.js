const { Router } = require('express')
const { crearGasto, getGastos, eliminarGasto } = require('../controllers/gastos');

const router = Router();

router.get('/', getGastos);

router.post('/', crearGasto);

/* router.put('/:id_producto', editarProducto);*/

router.delete('/:gastos_id', eliminarGasto); 


module.exports = router;