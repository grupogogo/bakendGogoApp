const Producto = require('../models/Producto');

// Obtener todos los productos
const getProductos = async (req, res) => {
    const userId = req.headers['x-user-id'];
    try {
        const productos = await Producto.find({ user: userId });
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
        const { producto, codigo, detalle, precio, categoria } = req.body.producto; // ✅ Coincide con el esquema        
        const fechaCreacion = new Date().toISOString(); // ✅ Guardar fecha correctamente

        // ✅ Crear la instancia con los nombres correctos
        const newProducto = new Producto({
            producto,
            codigo,
            precio,
            detalle,
            categoria: categoria || 'Kits',
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

// Actualizar un producto existente
const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const dataProducto = req.body.producto || req.body;
        const { producto, codigo, detalle, precio, categoria } = dataProducto;

        const productoActualizado = await Producto.findByIdAndUpdate(
            id,
            { producto, codigo, detalle, precio, categoria },
            { new: true }
        );

        if (!productoActualizado) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json({ ok: true, producto: productoActualizado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};

// Eliminar un producto
const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const productoEliminado = await Producto.findByIdAndDelete(id);
        if (!productoEliminado) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json({ ok: true, message: 'Producto eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
};

module.exports = {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto
};