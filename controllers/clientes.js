const { response } = require('express');
const Cliente = require('../models/Clientes');
const Precios = require('../models/Precios');

const getClientes = async (req, res = response) => {
    const clientes = await Cliente.find().populate('user', 'name').populate('precios');

    res.json({
        ok: true,
        clientes: clientes,
        msg: 'getClientes'
    })
}
const crearCliente = async (req, res = response) => {
console.log(req)
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

        const { kcg, kcp, kb } = precioKits;
        const { cc, cb } = precioCirios;
        const { gb, gn, gm } = precioGuantes;
        // Crear los precios asociados al cliente

        const precios = new Precios({
            cliente: clienteGuardado._id,
            precioKits: { kcg, kcp, kb },
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
    const clienteid = req.body.cliente_id;
    const uid = req.body.user._id;


    try {
        const cliente = await Cliente.findById(clienteid);

        if (!cliente) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe el evento por el id'
            })
        }
        if (cliente.user.toString() !== uid) {
            return res.status(401).json({
                ok: false,
                mgs: "El usuario no tiene privilegios para actualizar esta informacion que no creó"
            });
        }

        const nuevoCliente = {
            ...req.body,
            user: uid
        }

        const nuevoPrecio = {
            ...req.body.precios,
            cliente_id: clienteid
        }
        const precioid = req.body.precios._id;

        const clienteActualizado = await Cliente.findByIdAndUpdate(clienteid, nuevoCliente, { new: true });
        const precioActualizado = await Precios.findByIdAndUpdate(precioid, nuevoPrecio, { new: true });

        res.json({
            ok: true,
            cliente: clienteActualizado,
            precio: precioActualizado
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: ('No fue posible actualizar el Cliente')
        })
    }
}


const eliminarCliente = async (req, res = response) => {

    res.json({
        ok: true,
        msg: 'EliminarCliente'
    })

    /*  const eventoId = req.params.id;
     const uid = req.uid;
 
     try {
         const evento = await Evento.findById(eventoId);
 
         if (!evento) {
             return res.status(404).json({
                 ok: false,
                 msg: 'No existe el evento por el id'
             })
         }
         if (evento.user.toString() !== uid) {
             return res.status(401).json({
                 ok: false,
                 mgs: "El usuario no tiene privilegios para eliminar esta informacion que no creó"
             });
         }
 
         const eventoEliminado = await Evento.findByIdAndDelete(eventoId);
         res.json({
             ok: true,
             msg: 'Evento Eliminado'
         });
     } catch (error) {
         console.log(error);
         res.status(500).json({
             ok: false,
             msg: ('Hable con el admin sobre actualizacion de eventos')
         })
     } */
}

module.exports = {
    crearCliente,
    getClientes,
    actualizarCliente,
    eliminarCliente,    
}