const Anticipo = require('../models/Anticipo');

// Obtener todos los anticipos (con filtro opcional por año)
const getAnticipos = async (req, res) => {
    try {
        const { anio } = req.query;
        const filtro = {};
        if (anio && anio !== 'TODOS') {
            filtro.anio = Number(anio);
        }

        const anticipos = await Anticipo.find(filtro).sort({ createdAt: -1 });

        res.json({
            ok: true,
            anticipos
        });
    } catch (error) {
        console.error('Error al obtener anticipos:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al consultar anticipos en el servidor'
        });
    }
};

// Crear un nuevo anticipo
const crearAnticipo = async (req, res) => {
    try {
        const { detalle, cantidad, valor, total, tipo, anio, fecha, soportes } = req.body;

        if (!detalle || String(detalle).trim() === '') {
            return res.status(400).json({
                ok: false,
                msg: 'El detalle del anticipo es obligatorio'
            });
        }

        const cantNum = Number(cantidad) > 0 ? Number(cantidad) : 1;
        const valorNum = Number(valor) >= 0 ? Number(valor) : (Number(total) >= 0 ? Number(total) / cantNum : 0);
        const totalNum = (total !== undefined && total !== null && total !== '') 
            ? Number(total) 
            : (cantNum * valorNum);

        let fechaObj = new Date();
        if (fecha) {
            const parsed = new Date(typeof fecha === 'string' && !fecha.includes('T') ? `${fecha}T12:00:00` : fecha);
            if (!isNaN(parsed.getTime())) {
                fechaObj = parsed;
            }
        }

        const anioFinal = anio ? Number(anio) : fechaObj.getFullYear();

        const nuevoAnticipo = new Anticipo({
            detalle: String(detalle).trim(),
            cantidad: cantNum,
            valor: valorNum,
            total: totalNum,
            tipo: (tipo === 'LEO_A_OSCAR') ? 'LEO_A_OSCAR' : 'OSCAR_A_LEO',
            anio: anioFinal,
            fecha: fechaObj,
            soportes: Array.isArray(soportes) ? soportes : [],
            user: req.uid || null
        });

        const anticipoGuardado = await nuevoAnticipo.save();

        res.status(201).json({
            ok: true,
            anticipo: anticipoGuardado
        });
    } catch (error) {
        console.error('Error al crear anticipo:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al guardar el anticipo en la base de datos'
        });
    }
};

// Actualizar un anticipo (para modificar fecha, detalle, montos o soportes)
const actualizarAnticipo = async (req, res) => {
    const { id } = req.params;

    try {
        const anticipo = await Anticipo.findById(id);

        if (!anticipo) {
            return res.status(404).json({
                ok: false,
                msg: 'Anticipo no encontrado por ese ID'
            });
        }

        const { detalle, cantidad, valor, total, tipo, anio, fecha, soportes } = req.body;

        if (detalle !== undefined && String(detalle).trim() !== '') {
            anticipo.detalle = String(detalle).trim();
        }

        let cantCambio = false;
        if (cantidad !== undefined) {
            anticipo.cantidad = Number(cantidad) > 0 ? Number(cantidad) : 1;
            cantCambio = true;
        }

        let valCambio = false;
        if (valor !== undefined) {
            anticipo.valor = Number(valor) >= 0 ? Number(valor) : 0;
            valCambio = true;
        }

        if (total !== undefined && total !== null && total !== '') {
            anticipo.total = Number(total);
        } else if (cantCambio || valCambio) {
            anticipo.total = anticipo.cantidad * anticipo.valor;
        }

        if (tipo !== undefined) {
            anticipo.tipo = (tipo === 'LEO_A_OSCAR') ? 'LEO_A_OSCAR' : 'OSCAR_A_LEO';
        }

        if (fecha !== undefined) {
            const parsed = new Date(typeof fecha === 'string' && !fecha.includes('T') ? `${fecha}T12:00:00` : fecha);
            if (!isNaN(parsed.getTime())) {
                anticipo.fecha = parsed;
                anticipo.anio = parsed.getFullYear();
            }
        } else if (anio !== undefined) {
            anticipo.anio = Number(anio);
        }

        if (soportes !== undefined && Array.isArray(soportes)) {
            anticipo.soportes = soportes;
        }

        const anticipoActualizado = await anticipo.save();

        res.json({
            ok: true,
            anticipo: anticipoActualizado
        });
    } catch (error) {
        console.error('Error al actualizar anticipo:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar el anticipo en el servidor'
        });
    }
};

// Eliminar un anticipo
const eliminarAnticipo = async (req, res) => {
    const { id } = req.params;

    try {
        const anticipo = await Anticipo.findById(id);

        if (!anticipo) {
            return res.status(404).json({
                ok: false,
                msg: 'Anticipo no encontrado por ese ID'
            });
        }

        await Anticipo.findByIdAndDelete(id);

        res.json({
            ok: true,
            msg: 'Anticipo eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar anticipo:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar el anticipo en el servidor'
        });
    }
};

module.exports = {
    getAnticipos,
    crearAnticipo,
    actualizarAnticipo,
    eliminarAnticipo
};
