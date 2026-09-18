const { response } = require('express');
const Cliente = require('../models/Clientes');
const Precios = require('../models/Precios');
const { default: mongoose } = require('mongoose');


const pedidos = mongoose.models.pedidos || mongoose.model("pedidos", new mongoose.Schema({}, { strict: false }));

const getClientes = async (req, res = response) => {

    const clientes = await Cliente.find({ user: req.uid }).populate('user', 'name').populate('precios');
    res.json({
        ok: true,
        clientes: clientes,
        msg: 'getClientes'
    })
}
const crearCliente = async (req, res = response) => {
    const {
        nombre,
        nitCC,
        direccion,
        ciudad,
        email,
        telefono,
        detalle,
        distribuidor,
        precios,
    } = req.body;

    const { precioKits, precioCirios, precioGuantes } = precios;
    try {

        const fechaActual = new Date().toLocaleDateString("es-CO", {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });

        const cliente = new Cliente({
            fechaCreacion: fechaActual,
            nombre,
            nitCC,
            direccion,
            ciudad,
            email,
            telefono,
            detalle,
            distribuidor,
            user: req.uid
        });
        const clienteGuardado = await cliente.save();

        const { kcg, kcp, kb, kce } = precioKits;
        const { cc, cb } = precioCirios;
        const { gb, gn, gm } = precioGuantes;
        // Crear los precios asociados al cliente

        const precios = new Precios({
            cliente: clienteGuardado._id,
            precioKits: { kcg, kcp, kb, kce },
            precioCirios: { cc, cb },
            precioGuantes: { gb, gn, gm }
        });
        const preciosGuardados = await precios.save();
        // Actualizar el cliente con la referencia de precios
        clienteGuardado.precios = preciosGuardados._id;
        await clienteGuardado.save();

        res.json({
            ok: true,
            cliente: clienteGuardado,
            precios: preciosGuardados
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con su administrador'
        });
    }
}

const actualizarCliente = async (req, res = response) => {

    const clienteid = req.params.id_cliente || req.body.cliente_id || req.body._id;
    const uid = req.uid;

    try {
        const cliente = await Cliente.findById(clienteid);

        if (!cliente) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe el cliente por el id'
            });
        }

        if (cliente.user && cliente.user.toString() !== uid) {
            return res.status(401).json({
                ok: false,
                msg: "El usuario no tiene privilegios para actualizar esta información que no creó"
            });
        }

        // Actualizar o crear los precios asociados
        let precioActualizado = null;
        const precioData = req.body.precios;

        if (precioData && typeof precioData === 'object') {
            const { precioKits, precioCirios, precioGuantes } = precioData;
            const precioId = precioData._id || precioData.Precios_id || cliente.precios;

            if (precioId && mongoose.Types.ObjectId.isValid(precioId)) {
                precioActualizado = await Precios.findByIdAndUpdate(
                    precioId,
                    {
                        cliente: clienteid,
                        ...(precioKits !== undefined && { precioKits }),
                        ...(precioCirios !== undefined && { precioCirios }),
                        ...(precioGuantes !== undefined && { precioGuantes }),
                        user: uid
                    },
                    { new: true }
                );
            }

            // Si no existía o no se encontró por ID, buscar o crear por cliente
            if (!precioActualizado) {
                precioActualizado = await Precios.findOneAndUpdate(
                    { cliente: clienteid },
                    {
                        cliente: clienteid,
                        precioKits: precioKits || {},
                        precioCirios: precioCirios || {},
                        precioGuantes: precioGuantes || {},
                        user: uid
                    },
                    { upsert: true, new: true }
                );
            }
        }

        // Extraer precios del body para NO pasar el objeto al modelo Cliente (evita el CastError a ObjectId)
        const { precios: _precios, cliente_id: _cid, _id: _id, __v: _v, user: _user, ...restoCliente } = req.body;

        const nuevoCliente = {
            ...restoCliente,
            user: cliente.user || uid,
            precios: precioActualizado ? precioActualizado._id : cliente.precios
        };

        const clienteActualizado = await Cliente.findByIdAndUpdate(
            clienteid,
            nuevoCliente,
            { new: true }
        ).populate('precios').populate('user', 'name');

        res.json({
            ok: true,
            cliente: clienteActualizado,
            precio: precioActualizado
        });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({
            ok: false,
            msg: 'No fue posible actualizar el Cliente'
        });
    }
}


const eliminarCliente = async (req, res = response) => {
    const idCliente = req.params.id_cliente;


    const pedidosRelacionados = await pedidos.find({
        cliente: new mongoose.Types.ObjectId(idCliente)
    });

    try {
        // Verifica si hay pedidos relacionados con el cliente

        if (pedidosRelacionados.length > 0) {
            return res.status(400).json({
                ok: false,
                message: 'No se puede eliminar el cliente porque tiene pedidos relacionados',
                pedidosRelacionados: pedidosRelacionados.length
            });
        }

        // Si no hay pedidos relacionados, elimina el cliente
        const clienteEliminado = await Cliente.findByIdAndDelete(idCliente);

        if (!clienteEliminado) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        res.json({ ok: true, message: 'Cliente eliminado correctamente' });

    } catch (error) {
        console.error('Error al eliminar el cliente:', error);
        res.status(500).json({ message: 'Error al eliminar el cliente' });
    }
};


module.exports = {
    crearCliente,
    getClientes,
    actualizarCliente,
    eliminarCliente,
}