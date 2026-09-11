const { Router } = require('express');
const {
    getAnticipos,
    crearAnticipo,
    eliminarAnticipo
} = require('../controllers/anticipos');

const router = Router();

// Rutas CRUD de Anticipos
router.get('/', getAnticipos);
router.post('/', crearAnticipo);
router.delete('/:id', eliminarAnticipo);

module.exports = router;
