const { response } = require('express');
const TipoGuanteEspecial = require('../models/TipoGuanteEspecial');

// GET: Obtener todos los tipos de guante especial activos
const getTiposGuanteEspecial = async (req, res = response) => {
    try {
        // Seed automático: si no hay ningún tipo, crear el predeterminado
        const count = await TipoGuanteEspecial.countDocuments();
        if (count === 0) {
            await TipoGuanteEspecial.create({ nombre: 'Guante de tiras', precio: 0 });
        }

        const tipos = await TipoGuanteEspecial.find({ activo: true }).sort({ nombre: 1 });
        res.json({ ok: true, tipos });
    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error al obtener tipos de guante especial', error });
    }
};

// POST: Crear un nuevo tipo de guante especial
const crearTipoGuanteEspecial = async (req, res = response) => {
    const { nombre, precio } = req.body;
    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ ok: false, msg: 'El nombre es requerido' });
    }
    try {
        // Si ya existe (incluso inactivo), lo reactiva y actualiza precio
        const existente = await TipoGuanteEspecial.findOne({ nombre: nombre.trim() });
        if (existente) {
            existente.activo = true;
            if (precio !== undefined) existente.precio = Number(precio) || 0;
            await existente.save();
            return res.json({ ok: true, tipo: existente, msg: 'Tipo reactivado' });
        }
        const nuevo = new TipoGuanteEspecial({
            nombre: nombre.trim(),
            precio: Number(precio) || 0
        });
        await nuevo.save();
        res.status(201).json({ ok: true, tipo: nuevo });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ ok: false, msg: 'Ya existe un tipo con ese nombre' });
        }
        res.status(500).json({ ok: false, msg: 'Error al crear tipo de guante especial', error });
    }
};

// PUT: Editar nombre y/o precio de un tipo
const editarTipoGuanteEspecial = async (req, res = response) => {
    const { id } = req.params;
    const { nombre, precio } = req.body;
    try {
        const updates = {};
        if (nombre && nombre.trim()) updates.nombre = nombre.trim();
        if (precio !== undefined) updates.precio = Number(precio) || 0;

        const tipo = await TipoGuanteEspecial.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!tipo) return res.status(404).json({ ok: false, msg: 'Tipo no encontrado' });
        res.json({ ok: true, tipo });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ ok: false, msg: 'Ya existe un tipo con ese nombre' });
        }
        res.status(500).json({ ok: false, msg: 'Error al editar tipo', error });
    }
};

// DELETE: Desactivar un tipo (soft delete)
const desactivarTipoGuanteEspecial = async (req, res = response) => {
    const { id } = req.params;
    try {
        const tipo = await TipoGuanteEspecial.findByIdAndUpdate(id, { activo: false }, { new: true });
        if (!tipo) return res.status(404).json({ ok: false, msg: 'Tipo no encontrado' });
        res.json({ ok: true, tipo });
    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error al desactivar tipo', error });
    }
};

module.exports = { getTiposGuanteEspecial, crearTipoGuanteEspecial, editarTipoGuanteEspecial, desactivarTipoGuanteEspecial };
