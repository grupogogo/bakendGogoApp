const { Router } = require('express');
const {
    getPrecios,
    crearPrecio,
    actualizarPrecio,
    eliminarPrecio,
    resetPrecios,
    getPreciosOtros,
    guardarPrecioOtro,
    actualizarCategoriaOtro,
    eliminarPrecioOtro
} = require('../controllers/precios');

const router = Router();

// Rutas de Precios de Fábrica para Otros
router.get('/otros', getPreciosOtros);
router.post('/otros', guardarPrecioOtro);
router.post('/otros/categoria', actualizarCategoriaOtro);
router.delete('/otros/:key', eliminarPrecioOtro);

// Rutas CRUD de Precios de Fábrica
router.get('/', getPrecios);
router.post('/', crearPrecio);
router.put('/:id', actualizarPrecio);
router.delete('/:id', eliminarPrecio);
router.post('/reset', resetPrecios);

module.exports = router;
