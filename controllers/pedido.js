const { response } = require('express');
const Pedido = require('../models/Pedido');
const Cliente = require('../models/Clientes');
const Usuario = require('../models/Usuario');
const { enviarCorreoNuevoPedido } = require('../helpers/emailService');
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

        // Agrupar ítems por remisión asegurando formato string y trim
        const itemsByRemision = {};
        for (const item of orderItems) {
            const rawItem = item.toObject ? item.toObject() : item;
            const rem = String(rawItem.REMISION || rawItem.remision || '').trim();
            if (rem) {
                if (!itemsByRemision[rem]) {
                    itemsByRemision[rem] = [];
                }
                itemsByRemision[rem].push(rawItem);
            }
        }

        // Unir pedidos con sus ítems
        const pedidosConItems = orders.map(order => {
            const rawOrder = order.toObject ? order.toObject() : order;
            const rem = String(rawOrder.REMISION || rawOrder.remision || '').trim();
            return {
                ...rawOrder,
                items: itemsByRemision[rem] || []
            };
        });
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
            pedido: pedidoGuardado
        });

        // Envío asíncrono de notificación por correo (no bloquea la respuesta HTTP)
        try {
            const [clienteDb, usuarioDb] = await Promise.all([
                Cliente.findById(cliente),
                Usuario.findById(req.uid)
            ]);

            enviarCorreoNuevoPedido({
                pedido: pedidoGuardado,
                cliente: clienteDb,
                usuario: usuarioDb,
                listadoPedido,
                info
            }).catch(mailError => {
                console.error('Error al enviar correo del nuevo pedido:', mailError);
            });
        } catch (dbError) {
            console.error('Error al obtener datos para el correo del pedido:', dbError);
        }

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
        const pedidoId = req.params.id_pedido || req.body.pedido_id || req.body._id;

        if (!pedidoId || !mongoose.Types.ObjectId.isValid(pedidoId)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de pedido no válido'
            });
        }

        const pedidoExistente = await Pedido.findById(pedidoId);
        if (!pedidoExistente) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe el pedido por el ID especificado'
            });
        }

        const fechaActual = new Date().toISOString();
        const nuevoEstado = req.body.estado || pedidoExistente.estado;

        // Construir datos de actualización de forma limpia y segura (evitando objetos poblados o conflictos)
        const updateData = {
            estado: nuevoEstado,
            fechaModificacionEstado: req.body.fechaModificacionEstado || fechaActual,
            userEdit: req.body.userEdit || req.uid || ''
        };

        if (nuevoEstado === 'pagado') {
            updateData.fechaPagado = req.body.fechaPagado || fechaActual;
        }

        if (req.body.numeroGuia !== undefined) {
            updateData.numeroGuia = req.body.numeroGuia;
        }

        if (req.body.detalleEstado !== undefined) {
            updateData.detalleEstado = req.body.detalleEstado;
        }

        if (req.body.detalleGeneral !== undefined) {
            updateData.detalleGeneral = req.body.detalleGeneral;
        }

        if (req.body.tipoDespacho !== undefined) {
            updateData.tipoDespacho = req.body.tipoDespacho;
        }

        if (req.body.formaPago !== undefined) {
            updateData.formaPago = req.body.formaPago;
        }

        if (req.body.costoEnvio !== undefined) {
            updateData.costoEnvio = req.body.costoEnvio;
        }

        // Si se envió cliente como objeto poblado o ID, asegurar que quede como ObjectId
        if (req.body.cliente) {
            const cid = req.body.cliente._id || req.body.cliente.cliente_id || req.body.cliente;
            if (typeof cid === 'string' && mongoose.Types.ObjectId.isValid(cid)) {
                updateData.cliente = cid;
            }
        }

        // Si se envió user como objeto poblado o ID, asegurar que quede como ObjectId
        if (req.body.user) {
            const uid = req.body.user._id || req.body.user.uid || req.body.user;
            if (typeof uid === 'string' && mongoose.Types.ObjectId.isValid(uid)) {
                updateData.user = uid;
            }
        }

        const entradaHistorial = {
            estado: nuevoEstado,
            fecha: fechaActual,
            userEdit: req.body.userEdit || req.uid || ''
        };

        const pedidoActualizado = await Pedido.findByIdAndUpdate(
            pedidoId,
            {
                $set: updateData,
                $push: { historialEstados: entradaHistorial }
            },
            { new: true }
        )
            .populate('user', 'name email telefono numIdentificacion')
            .populate({ path: 'cliente', select: 'nombre ciudad distribuidor direccion telefono nitCC detalle' })
            .populate({ path: 'itemPedido' });

        res.json({
            ok: true,
            msg: 'Estado de pedido actualizado',
            pedido: pedidoActualizado,
            estado: nuevoEstado,
        });
    } catch (error) {
        console.error('Error al editar estado pedido:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar estado pedido',
            error: error.message || error
        });
    }
}

const editarItemsPedido = async (req, res = response) => {
    const { pedido_id } = req.params;
    const { items, info } = req.body;

    try {
        const pedido = await Pedido.findById(pedido_id);

        if (!pedido) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe el pedido con ese ID'
            });
        }

        // Validación estricta: Solo pedidos en estado pendiente pueden ser editados
        if (pedido.estado !== 'pendiente') {
            return res.status(400).json({
                ok: false,
                msg: 'Solo se pueden editar pedidos que estén en estado pendiente'
            });
        }

        // Buscar el documento ItemPedido asociado
        let itemPedidoDoc = null;
        if (pedido.itemPedido && pedido.itemPedido.length > 0) {
            const itemDocId = pedido.itemPedido[0]._id || pedido.itemPedido[0];
            itemPedidoDoc = await ItemPedido.findById(itemDocId);
        }
        if (!itemPedidoDoc) {
            itemPedidoDoc = await ItemPedido.findOne({ id_Pedido: pedido._id });
        }

        console.log('--- EDITAR ITEMS PEDIDO LLAMADO ---', pedido_id);

        if (itemPedidoDoc && items) {
            itemPedidoDoc = await ItemPedido.findByIdAndUpdate(
                itemPedidoDoc._id,
                { itemPedido: items },
                { new: true }
            );
        } else if (items) {
            // Si no existía, crearlo
            const nuevoItem = new ItemPedido({
                id_Pedido: pedido._id,
                itemPedido: items
            });
            await nuevoItem.save();
            pedido.itemPedido = [nuevoItem._id];
        }

        // Actualizar información general del pedido si se envió
        if (info) {
            if (info.formaPago !== undefined) pedido.formaPago = info.formaPago;
            if (info.tipoDespacho !== undefined) pedido.tipoDespacho = info.tipoDespacho;
            if (info.costoEnvio !== undefined) pedido.costoEnvio = info.costoEnvio;
            if (info.detalleGeneral !== undefined) pedido.detalleGeneral = info.detalleGeneral;
            if (info.numeroGuia !== undefined) pedido.numeroGuia = info.numeroGuia;
        }

        pedido.userEdit = req.uid;
        const pedidoActualizado = await pedido.save();

        res.json({
            ok: true,
            msg: 'Pedido e ítems actualizados correctamente',
            pedido: pedidoActualizado,
            itemPedido: itemPedidoDoc
        });

    } catch (error) {
        console.error('Error al editar items del pedido:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno al actualizar el pedido',
            error: error.message || error
        });
    }
};

module.exports = {
    getPedidos,
    crearPedido,
    eliminarPedido,
    editarEstadoPedido,
    getPedidosCliente,
    getOldOrders,
    editarItemsPedido
};