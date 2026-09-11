const PreciosFabrica = require('../models/PreciosFabrica');
const PrecioFabricaOtro = require('../models/PrecioFabricaOtro');

const PRECIOS_SEMILLA = [
    {
        anio: 2021,
        fechaVigencia: '2021-01-01',
        descripcion: 'Tarifa General Fábrica 2021',
        precioKits: { kcg: 17000, kcp: 13500, kb: 13500, kce: 0 },
        precioCirios: { cc: 7500, cb: 7500 },
        precioGuantes: { gb: 17000, gn: 18000, gm: 36000 },
        activo: true
    },
    {
        anio: 2022,
        fechaVigencia: '2022-01-01',
        descripcion: 'Tarifa General Fábrica 2022',
        precioKits: { kcg: 17500, kcp: 13500, kb: 13500, kce: 0 },
        precioCirios: { cc: 7500, cb: 7500 },
        precioGuantes: { gb: 17000, gn: 18000, gm: 36000 },
        activo: true
    },
    {
        anio: 2023,
        fechaVigencia: '2023-01-01',
        descripcion: 'Tarifa General Fábrica 2023',
        precioKits: { kcg: 17500, kcp: 13500, kb: 13500, kce: 0 },
        precioCirios: { cc: 7500, cb: 7500 },
        precioGuantes: { gb: 17000, gn: 18000, gm: 36000 },
        activo: true
    },
    {
        anio: 2024,
        fechaVigencia: '2024-01-01',
        descripcion: 'Tarifa General Fábrica 2024',
        precioKits: { kcg: 17500, kcp: 13500, kb: 13500, kce: 0 },
        precioCirios: { cc: 7500, cb: 7500 },
        precioGuantes: { gb: 17000, gn: 18000, gm: 36000 },
        activo: true
    },
    {
        anio: 2025,
        fechaVigencia: '2025-01-01',
        descripcion: 'Tarifa General Fábrica 2025',
        precioKits: { kcg: 18500, kcp: 13500, kb: 13500, kce: 7400 },
        precioCirios: { cc: 7800, cb: 7800 },
        precioGuantes: { gb: 23500, gn: 24500, gm: 33600 },
        activo: true
    },
    {
        anio: 2026,
        fechaVigencia: '2026-01-01',
        descripcion: 'Tarifa General Fábrica 2026',
        precioKits: { kcg: 20500, kcp: 14500, kb: 14500, kce: 7400 },
        precioCirios: { cc: 9000, cb: 9000 },
        precioGuantes: { gb: 25200, gn: 26400, gm: 32000 },
        activo: true
    }
];

// Obtener todas las tarifas de precios (inicializa con semilla si está vacía)
const getPrecios = async (req, res) => {
    try {
        let count = await PreciosFabrica.countDocuments();
        if (count === 0) {
            await PreciosFabrica.insertMany(PRECIOS_SEMILLA);
        }

        const precios = await PreciosFabrica.find().sort({ anio: -1, fechaVigencia: -1 });
        res.json({
            ok: true,
            precios
        });
    } catch (error) {
        console.error('Error al obtener precios:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los precios de fábrica'
        });
    }
};

// Crear una nueva tarifa
const crearPrecio = async (req, res) => {
    try {
        const { anio, fechaVigencia, descripcion, precioKits, precioCirios, precioGuantes } = req.body;

        if (!anio || !fechaVigencia) {
            return res.status(400).json({
                ok: false,
                msg: 'El año y la fecha de vigencia son obligatorios'
            });
        }

        const nuevoPrecio = new PreciosFabrica({
            anio: Number(anio),
            fechaVigencia,
            descripcion: descripcion || '',
            precioKits: precioKits || {},
            precioCirios: precioCirios || {},
            precioGuantes: precioGuantes || {},
            user: req.uid || req.body.user?.uid || null
        });

        const precioGuardado = await nuevoPrecio.save();

        res.status(201).json({
            ok: true,
            msg: 'Tarifa creada exitosamente',
            precio: precioGuardado
        });
    } catch (error) {
        console.error('Error al crear precio:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al guardar la tarifa en la base de datos'
        });
    }
};

// Actualizar una tarifa existente
const actualizarPrecio = async (req, res) => {
    try {
        const { id } = req.params;
        const precioDB = await PreciosFabrica.findById(id);

        if (!precioDB) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe una tarifa con ese ID'
            });
        }

        const campos = {
            ...req.body,
            anio: Number(req.body.anio || precioDB.anio),
            updatedAt: new Date()
        };

        const precioActualizado = await PreciosFabrica.findByIdAndUpdate(
            id,
            campos,
            { new: true }
        );

        res.json({
            ok: true,
            msg: 'Tarifa actualizada exitosamente',
            precio: precioActualizado
        });
    } catch (error) {
        console.error('Error al actualizar precio:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar la tarifa'
        });
    }
};

// Eliminar una tarifa
const eliminarPrecio = async (req, res) => {
    try {
        const { id } = req.params;
        const precioDB = await PreciosFabrica.findById(id);

        if (!precioDB) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe una tarifa con ese ID'
            });
        }

        await PreciosFabrica.findByIdAndDelete(id);

        res.json({
            ok: true,
            msg: 'Tarifa eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar precio:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar la tarifa'
        });
    }
};

// Restablecer valores predeterminados de fábrica
const resetPrecios = async (req, res) => {
    try {
        await PreciosFabrica.deleteMany({});
        const preciosInsertados = await PreciosFabrica.insertMany(PRECIOS_SEMILLA);

        res.json({
            ok: true,
            msg: 'Tarifas restablecidas con éxito',
            precios: preciosInsertados
        });
    } catch (error) {
        console.error('Error al restablecer precios:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al restablecer las tarifas'
        });
    }
};

// Obtener todos los precios de fábrica para "Otros"
const getPreciosOtros = async (req, res) => {
    try {
        const preciosOtros = await PrecioFabricaOtro.find();
        res.json({
            ok: true,
            preciosOtros
        });
    } catch (error) {
        console.error('Error al obtener precios de otros:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los precios de otros'
        });
    }
};

// Guardar o actualizar un precio de fábrica para "Otros"
const guardarPrecioOtro = async (req, res) => {
    try {
        const { key, nombre, precioFabrica, anio, categoria } = req.body;

        if (!key || nombre === undefined || precioFabrica === undefined) {
            return res.status(400).json({
                ok: false,
                msg: 'Key, nombre y precioFabrica son obligatorios'
            });
        }

        const dataToUpdate = {
            key,
            nombre,
            precioFabrica: Number(precioFabrica) || 0,
        };

        if (categoria) {
            dataToUpdate.categoria = categoria;
        }

        if (anio) {
            dataToUpdate.anio = Number(anio);
        }

        if (req.uid) {
            dataToUpdate.user = req.uid;
        }

        const precioOtro = await PrecioFabricaOtro.findOneAndUpdate(
            { key },
            dataToUpdate,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({
            ok: true,
            msg: 'Precio de fábrica guardado exitosamente',
            precioOtro
        });
    } catch (error) {
        console.error('Error al guardar precio de otro:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al guardar el precio de fábrica para otros'
        });
    }
};

// Actualizar la categoría de negocio ('Kits' o 'Guantes') para un producto de "Otros"
const actualizarCategoriaOtro = async (req, res) => {
    try {
        const { key, nombre, categoria } = req.body;

        if (!key || !categoria) {
            return res.status(400).json({
                ok: false,
                msg: 'Key y categoría son obligatorios'
            });
        }

        const dataToUpdate = {
            key,
            categoria
        };

        if (nombre) {
            dataToUpdate.nombre = nombre;
        }

        if (req.uid) {
            dataToUpdate.user = req.uid;
        }

        const precioOtro = await PrecioFabricaOtro.findOneAndUpdate(
            { key },
            dataToUpdate,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({
            ok: true,
            msg: 'Categoría actualizada exitosamente',
            precioOtro
        });
    } catch (error) {
        console.error('Error al actualizar categoría de otro:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar categoría de otro'
        });
    }
};

// Eliminar un precio de fábrica de "Otros"
const eliminarPrecioOtro = async (req, res) => {
    try {
        const { key } = req.params;
        await PrecioFabricaOtro.findOneAndDelete({ key });
        res.json({
            ok: true,
            msg: 'Precio de fábrica eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar precio de otro:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar precio de otro'
        });
    }
};

module.exports = {
    getPrecios,
    crearPrecio,
    actualizarPrecio,
    eliminarPrecio,
    resetPrecios,
    getPreciosOtros,
    guardarPrecioOtro,
    actualizarCategoriaOtro,
    eliminarPrecioOtro
};
