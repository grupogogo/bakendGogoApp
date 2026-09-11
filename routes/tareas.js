const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const {
    getTareas,
    crearTarea,
    actualizarTarea,
    cambiarEstadoTarea,
    toggleSubtarea,
    eliminarTarea
} = require('../controllers/tareas');

const router = Router();

// Todas las rutas de tareas requieren autenticación JWT
router.use(validarJWT);

// GET - Listar tareas
router.get('/', getTareas);

// POST - Crear tarea
router.post(
    '/',
    [
        check('titulo', 'El título de la tarea es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearTarea
);

// PUT - Actualizar tarea
router.put(
    '/:id',
    [
        check('titulo', 'El título de la tarea es obligatorio').not().isEmpty(),
        validarCampos
    ],
    actualizarTarea
);

// PATCH - Cambiar estado rápido
router.patch(
    '/:id/estado',
    [
        check('estado', 'El estado es obligatorio').isIn(['pendiente', 'en_progreso', 'completada']),
        validarCampos
    ],
    cambiarEstadoTarea
);

// PATCH - Toggle subtarea
router.patch(
    '/:id/subtarea',
    [
        check('subtareaId', 'El ID de la subtarea es obligatorio').not().isEmpty(),
        validarCampos
    ],
    toggleSubtarea
);

// DELETE - Eliminar tarea
router.delete('/:id', eliminarTarea);

module.exports = router;
