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
        const { detalle, cantidad, valor, total, tipo, anio, fecha } = req.body;

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

        const nuevoAnticipo = new Anticipo({
            detalle: String(detalle).trim(),
            cantidad: cantNum,
            valor: valorNum,
            total: totalNum,
            tipo: (tipo === 'LEO_A_OSCAR') ? 'LEO_A_OSCAR' : 'OSCAR_A_LEO',
            anio: anio ? Number(anio) : new Date().getFullYear(),
            fecha: fecha ? new Date(fecha) : new Date(),
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
    eliminarAnticipo
};
