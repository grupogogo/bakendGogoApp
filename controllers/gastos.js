const Gastos = require('../models/Gastos');

// Obtener todos los gastos
const getGastos = async (req, res) => {
    try {
        const gastos = await Gastos.find();
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
            detalle
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
            user: req.body.user.uid // ✅ Extraer usuario de `req.user`
        });


        // ✅ Guardar en MongoDB
        const gastoGuardado = await newGasto.save();

        res.status(201).json({
            gasto: gastoGuardado,
            estado: 'guardado'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


/* // Actualizar un producto existente
const updateProducto = async (req, res) => {
    try {
        const productoActualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!productoActualizado) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json(productoActualizado);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};

// Eliminar un producto
const deleteProducto = async (req, res) => {
    try {
        const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
        if (!productoEliminado) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
}; */

module.exports = {
    crearGasto,
    getGastos
};