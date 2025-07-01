const { response } = require('express');
const Pedido = require('../models/Pedido');
const { default: mongoose } = require('mongoose');

const ItemPedido = mongoose.models.ItemPedido || mongoose.model("ItemPedido", new mongoose.Schema({}, { strict: false }));
const PedidoEliminado = mongoose.models.PedidoEliminado || mongoose.model("PedidoEliminado", new mongoose.Schema({}, { strict: false }));
const oldOrders = mongoose.models.oldOrders || mongoose.model("oldOrders", new mongoose.Schema({}, { strict: false }));
const oldOrdersItems = mongoose.models.oldOrdersItems || mongoose.model("itemsololders", new mongoose.Schema({}, { strict: false }));

const getPedidos = async (req, res = response) => {
    try {
        const pedidos = await Pedido.find().populate('user', 'name email telefono numIdentificacion')
            .populate({ path: 'cliente', select: 'nombre ciudad distribuidor direccion telefono nitCC detalle' })
            .populate({ path: 'itemPedido' })
            .sort({ fechaCreacion: -1 });

        res.json({
            ok: true,
            pedidos,
            msg: 'getPedidos'
        });
    } catch (error) {
        res.json({
            ok: false,
            error,
            msg: 'getPedidos'
        });
    }
}

const getOldOrders = async (req, res = response) => {
    try {
        const orders = await oldOrders.find();
        const orderItems = await oldOrdersItems.find();

        // Agrupar ítems por remisión
        const itemsByRemision = {};
        for (const item of orderItems) {
            const rem = item.REMISION;
            if (!itemsByRemision[rem]) {
                itemsByRemision[rem] = [];
            }
            itemsByRemision[rem].push(item);
        }

        // Unir pedidos con sus ítems
        const pedidosConItems = orders.map(order => ({
            ...order.toObject(),
            items: itemsByRemision[order.REMISION] || []
        }));
        res.json({
            ok: true,
            pedidos: pedidosConItems,
            msg: 'getOldOrders'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error,
            msg: error.message
        });
    }
};


const getPedidosCliente = async (req, res = response) => {
    try {
        // Obtener el cliente_id de los parámetros de la solicitud
        const { cliente_id: cliente } = req.params;

        // Buscar los pedidos asociados al cliente_id
        const pedidos = await Pedido.find({ cliente })
            .populate({ path: 'itemPedido' }) // Populate para los ítems del pedido            
        // Retornar la respuesta con los pedidos
        res.json({
            ok: true,
            pedidos,
            msg: 'getPedidosCliente',
        });
    } catch (error) {
        // Manejo de errores
        console.error(error);
        res.status(500).json({
            ok: false,
            error,
            msg: 'Error al obtener los pedidos del cliente',
        });
    }
};

const crearPedido = async (req, res = response) => {

    const {
        cliente,
        info,
        listadoPedido
    } = req.body;

    const {
        fechaActual,
        costoEnvio,
        tipoDespacho,
        formaPago,
        estado,
        detalleEstado,
        detalleGeneral,
        numeroGuia
    } = info;

    const pedido = new Pedido({
        fechaCreacion: fechaActual,
        costoEnvio,
        tipoDespacho,
        formaPago,
        estado,
        detalleEstado,
        detalleGeneral,
        numeroGuia,
        userEdit: '',
        user: req.uid,
        cliente: cliente
    });
    try {
        const pedidoGuardado = await pedido.save();
        const nuevoItemPedido = new ItemPedido({
            id_Pedido: pedidoGuardado._id,
            itemPedido: listadoPedido
        });
        const itemPedidoGuardado = await nuevoItemPedido.save();

        // Agrega el ID del itemPedido al campo itemPedido del pedido
        pedidoGuardado.itemPedido.push(itemPedidoGuardado._id);
        await pedidoGuardado.save();

        res.json({
            ok: true,
            msg: 'Pedido guardado exitosamente',
        });

    } catch (error) {
        res.json({
            ok: false,
            msg: error,
        });
    }
}
const eliminarPedido = async (req, res = response) => {
    const pedidoId = req.params.pedido_id;
    const uid = req.uid;

    try {
        const pedido = await Pedido.findById(pedidoId);

        if (!pedido) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe el pedido por el id'
            });
        }
        if (pedido.user.toString() !== uid) {
            return res.status(401).json({
                ok: false,
                msg: "El usuario no tiene privilegios para eliminar esta información que no creó"
            });
        }
        const objectIdPedido = new mongoose.Types.ObjectId(pedidoId); // Asegúrate de usar 'new'

        // Luego busca el documento en ItemPedido
        const itemIdPedido = await ItemPedido.findOne({ id_Pedido: objectIdPedido }, '_id itemPedido');

        const guardaPedidoEliminado = new PedidoEliminado({

            pedido,
            itemIdPedido,
            uid

        })
        await guardaPedidoEliminado.save();
        await ItemPedido.findByIdAndDelete(itemIdPedido._id);
        // Luego elimina el Pedido
        await Pedido.findByIdAndDelete(pedidoId);
        res.json({
            ok: true,
            msg: 'Pedido Eliminado'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el admin sobre actualizacion de pedidos'
        });
    }
}


const editarEstadoPedido = async (req, res = response) => {
    try {
        const pedido = await Pedido.findByIdAndUpdate(req.body.pedido_id, req.body, { new: true });
        res.json({
            ok: true,
            msg: 'Editar Estado pedido ',
            pedido,
            estado,
            mjs2: req.body,
        });
    } catch (error) {
        res.json({
            ok: true,
            msg: 'Editar Estado pedido ',
            error
        });
    }
}

module.exports = {
    getPedidos,
    crearPedido,
    eliminarPedido,
    editarEstadoPedido,
    getPedidosCliente,
    getOldOrders
}