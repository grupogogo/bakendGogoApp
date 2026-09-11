const { Router } = require('express')
const { crearGasto, getGastos, eliminarGasto, actualizarGasto } = require('../controllers/gastos');

const router = Router();

router.get('/', getGastos);

router.post('/', crearGasto);

router.put('/:gastos_id', actualizarGasto);

router.delete('/:gastos_id', eliminarGasto); 


module.exports = router;