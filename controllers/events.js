const { response } = require('express');
const Evento = require('../models/Evento');


const getEventos = async (req, res = response) => {

    const eventos = await Evento.find().populate('user', 'name');

    res.json({
        ok: true,
        eventos,
        msg: 'getEventos'
    })
}

const crearEvento = async (req, res = response) => {

    const evento = new Evento(req.body);

    try {
        evento.user = req.uid;
        const eventoGuardado = await evento.save();
        res.json({
            ok: true,
            evento: eventoGuardado
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con su administrador'
        });
    }
}

const actualizarEvento = async (req, res = response) => {

    const eventoId = req.params.id;
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
                mgs: "El usuario no tiene privilegios para actualizar esta informacion que no creó"
            });
        }

        const nuevoEvento = {
            ...req.body,
            user: uid
        }

        const eventoActualizado = await Evento.findByIdAndUpdate(eventoId, nuevoEvento, { new: true });

        res.json({
            ok: true,
            evento: eventoActualizado
        });



    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: ('Hable con el admin sobre actualizacion de eventos')
        })
    }
}

const eliminarEvento = async (req, res = response) => {

    const eventoId = req.params.id;
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
    }
}

module.exports = {
    getEventos,
    crearEvento,
    actualizarEvento,
    eliminarEvento
}