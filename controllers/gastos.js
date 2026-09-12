const Gastos = require('../models/Gastos');

// Obtener todos los gastos
const getGastos = async (req, res) => {
    try {
        const gastos = await Gastos.find().populate('user', 'name nombre email');
        res.json(gastos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
/*
// Obtener un producto por ID
const getProductoById = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto' });
    }
}; */

// Crear un nuevo Gasto
const crearGasto = async (req, res) => {
    try {
        const {
            tipoGasto,
            fecha,
            proveedor,
            categoria,
            subCategoria,
            gasto,
            codigo,
            cantidad,
            precio,
            detalle,
            comprobante,
            comprobanteNombre,
            comprobanteTipo
        }
            = req.body.gasto;

        //const fechaCreacion = new Date().toISOString(); // ✅ Guardar fecha correctamente

        // ✅ Crear la instancia con los nombres correctos
        const newGasto = new Gastos({
            tipoGasto,
            fecha,
            proveedor,
            categoria,
            subCategoria,
            gasto,
            codigo,
            cantidad,
            precio,
            detalle,
            comprobante: comprobante || null,
            comprobanteNombre: comprobanteNombre || '',
            comprobanteTipo: comprobanteTipo || '',
            user: req.body.user.uid // ✅ Extraer usuario de `req.user`
        });


        // ✅ Guardar en MongoDB
        const gastoGuardado = await newGasto.save();
        await gastoGuardado.populate('user', 'name nombre email');

        res.status(201).json({
            gasto: gastoGuardado,
            estado: 'guardado'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


// Actualizar un Gasto existente
const actualizarGasto = async (req, res) => {
    const gastoId = req.params.gastos_id;
    try {
        const gastoExistente = await Gastos.findById(gastoId);
        if (!gastoExistente) {
            return res.status(404).json({
                ok: false,
                message: 'Gasto no encontrado'
            });
        }

        const dataGasto = req.body.gasto || req.body;
        const {
            tipoGasto,
            fecha,
            proveedor,
            categoria,
            subCategoria,
            gasto,
            codigo,
            cantidad,
            precio,
            detalle,
            comprobante,
            comprobanteNombre,
            comprobanteTipo
        } = dataGasto;

        const camposActualizar = {
            ...(tipoGasto !== undefined && { tipoGasto }),
            ...(fecha !== undefined && { fecha }),
            ...(proveedor !== undefined && { proveedor }),
            ...(categoria !== undefined && { categoria }),
            ...(subCategoria !== undefined && { subCategoria }),
            ...(gasto !== undefined && { gasto }),
            ...(codigo !== undefined && { codigo }),
            ...(cantidad !== undefined && { cantidad }),
            ...(precio !== undefined && { precio }),
            ...(detalle !== undefined && { detalle }),
            ...(comprobante !== undefined && { comprobante }),
            ...(comprobanteNombre !== undefined && { comprobanteNombre }),
            ...(comprobanteTipo !== undefined && { comprobanteTipo }),
        };

        const gastoActualizado = await Gastos.findByIdAndUpdate(
            gastoId,
            camposActualizar,
            { new: true }
        ).populate('user', 'name nombre email');

        res.json({
            ok: true,
            gasto: gastoActualizado,
            message: 'Gasto actualizado correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            message: 'Error al actualizar el gasto: ' + error.message
        });
    }
};

// Eliminar un producto
const eliminarGasto = async (req, res) => {
    const idPedido = req.params.gastos_id;
    console.log(idPedido)
    try {
        const gastoEliminado = await Gastos.findByIdAndDelete(idPedido);
        if (!gastoEliminado) {
            return res.status(404).json({ message: 'Gasto no encontrado' });
        }
        res.json({ message: 'Gasto eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el gasto' });
    }
};

module.exports = {
    crearGasto,
    actualizarGasto,
    getGastos,
    eliminarGasto
};