const { response } = require('express');
const mongoose = require('mongoose');
const Tarea = require('../models/Tarea');

// GET - Obtener todas las tareas (con populate de asignadoA y creadoPor)
const getTareas = async (req, res = response) => {
    try {
        const { asignadoA, estado, prioridad } = req.query;
        const filter = {};

        if (asignadoA && asignadoA !== 'todos') {
            filter.asignadoA = asignadoA;
        }

        if (estado && estado !== 'todos') {
            filter.estado = estado;
        }

        if (prioridad && prioridad !== 'todos') {
            filter.prioridad = prioridad;
        }

        const tareas = await Tarea.find(filter)
            .populate('asignadoA', 'name email rol')
            .populate('creadoPor', 'name email rol')
            .sort({ orden: 1, createdAt: -1 });

        res.json({
            ok: true,
            tareas
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener las tareas'
        });
    }
};

// POST - Crear nueva tarea
const crearTarea = async (req, res = response) => {
    try {
        const { titulo, descripcion, asignadoA, prioridad, fechaVencimiento, checklist, etiquetas } = req.body;

        let asignadoVal = asignadoA;
        if (!asignadoVal || asignadoVal === '' || !mongoose.Types.ObjectId.isValid(asignadoVal)) {
            asignadoVal = null;
        }

        const tarea = new Tarea({
            titulo,
            descripcion: descripcion || '',
            asignadoA: asignadoVal,
            creadoPor: req.uid,
            prioridad: prioridad || 'media',
            fechaVencimiento: fechaVencimiento || null,
            checklist: Array.isArray(checklist) ? checklist : [],
            etiquetas: Array.isArray(etiquetas) ? etiquetas : []
        });

        const tareaGuardada = await tarea.save();

        const tareaPopulated = await Tarea.findById(tareaGuardada._id)
            .populate('asignadoA', 'name email rol')
            .populate('creadoPor', 'name email rol');

        res.status(201).json({
            ok: true,
            msg: 'Tarea creada correctamente',
            tarea: tareaPopulated
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear la tarea'
        });
    }
};

// PUT - Actualizar tarea completa
const actualizarTarea = async (req, res = response) => {
    const tareaId = req.params.id;

    if (!tareaId || !mongoose.Types.ObjectId.isValid(tareaId)) {
        return res.status(400).json({
            ok: false,
            msg: 'ID de tarea no válido'
        });
    }

    try {
        const tarea = await Tarea.findById(tareaId);

        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada por id'
            });
        }

        const camposActualizar = { ...req.body };
        delete camposActualizar._id;
        delete camposActualizar.__v;
        delete camposActualizar.createdAt;
        delete camposActualizar.updatedAt;

        if (!camposActualizar.asignadoA || camposActualizar.asignadoA === '' || !mongoose.Types.ObjectId.isValid(camposActualizar.asignadoA)) {
            camposActualizar.asignadoA = null;
        }

        // Manejo automático de fechaCompletada según estado
        if (camposActualizar.estado === 'completada' && tarea.estado !== 'completada') {
            camposActualizar.fechaCompletada = new Date();
        } else if (camposActualizar.estado && camposActualizar.estado !== 'completada') {
            camposActualizar.fechaCompletada = null;
        }

        const tareaActualizada = await Tarea.findByIdAndUpdate(tareaId, camposActualizar, { new: true })
            .populate('asignadoA', 'name email rol')
            .populate('creadoPor', 'name email rol');

        res.json({
            ok: true,
            msg: 'Tarea actualizada',
            tarea: tareaActualizada
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar la tarea'
        });
    }
};

// PATCH - Cambiar estado rápido (pendiente, en_progreso, completada)
const cambiarEstadoTarea = async (req, res = response) => {
    const tareaId = req.params.id;
    const { estado } = req.body;

    if (!tareaId || !mongoose.Types.ObjectId.isValid(tareaId)) {
        return res.status(400).json({
            ok: false,
            msg: 'ID de tarea no válido'
        });
    }

    try {
        const tarea = await Tarea.findById(tareaId);

        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

        const actualizacion = { estado };
        if (estado === 'completada') {
            actualizacion.fechaCompletada = new Date();
        } else {
            actualizacion.fechaCompletada = null;
        }

        const tareaActualizada = await Tarea.findByIdAndUpdate(tareaId, actualizacion, { new: true })
            .populate('asignadoA', 'name email rol')
            .populate('creadoPor', 'name email rol');

        res.json({
            ok: true,
            tarea: tareaActualizada
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al cambiar estado de la tarea'
        });
    }
};

// PATCH - Toggle subtarea (checklist item)
const toggleSubtarea = async (req, res = response) => {
    const tareaId = req.params.id;
    const { subtareaId } = req.body;

    if (!tareaId || !mongoose.Types.ObjectId.isValid(tareaId)) {
        return res.status(400).json({
            ok: false,
            msg: 'ID de tarea no válido'
        });
    }

    try {
        const tarea = await Tarea.findById(tareaId);

        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

        const sub = tarea.checklist.find(s => s.id === subtareaId);
        if (sub) {
            sub.completada = !sub.completada;
            await tarea.save();
        }

        const tareaActualizada = await Tarea.findById(tareaId)
            .populate('asignadoA', 'name email rol')
            .populate('creadoPor', 'name email rol');

        res.json({
            ok: true,
            tarea: tareaActualizada
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al alternar subtarea'
        });
    }
};

// DELETE - Eliminar tarea
const eliminarTarea = async (req, res = response) => {
    const tareaId = req.params.id;

    if (!tareaId || !mongoose.Types.ObjectId.isValid(tareaId)) {
        return res.status(400).json({
            ok: false,
            msg: 'ID de tarea no válido'
        });
    }

    try {
        const tarea = await Tarea.findById(tareaId);

        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

        await Tarea.findByIdAndDelete(tareaId);

        res.json({
            ok: true,
            msg: 'Tarea eliminada correctamente',
            id: tareaId
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar la tarea'
        });
    }
};

module.exports = {
    getTareas,
    crearTarea,
    actualizarTarea,
    cambiarEstadoTarea,
    toggleSubtarea,
    eliminarTarea
};
