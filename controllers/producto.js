const Producto = require('../models/Producto');

// Obtener todos los productos
const getProductos = async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
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

// Crear un nuevo producto
const createProducto = async (req, res) => {
    try {
        const { producto, codigo, detalle, precio } = req.body.producto; // ✅ Coincide con el esquema        
        const fechaCreacion = new Date().toISOString(); // ✅ Guardar fecha correctamente

        // ✅ Crear la instancia con los nombres correctos
        const newProducto = new Producto({
            producto,
            codigo,
            precio,
            detalle,
            fechaCreacion,
            user: req.body.user.uid // ✅ Extraer usuario de `req.user`
        });


        // ✅ Guardar en MongoDB
        const productoGuardado = await newProducto.save();

        res.status(201).json(productoGuardado);
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
    getProductos, /*
     getProductoById, */
    createProducto,
    /*  updateProducto,
     deleteProducto */
};