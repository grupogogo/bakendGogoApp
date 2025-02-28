const { Router } = require('express')
const { createProducto, getProductos } = require('../controllers/producto');

const router = Router();

router.get('/', getProductos);

router.post('/', createProducto);

/* router.put('/:id_producto', editarProducto);

router.delete('/:producto_id', eliminarProdcuto); */


module.exports = router;