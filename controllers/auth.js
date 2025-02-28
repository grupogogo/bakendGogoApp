const { response } = require('express');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt')

//POST
const crearUsuario = async (req, res = response) => {

    const { email, password, telefono, numIdentificacion } = req.body;
    try {
        //Manejo de errores

        /* Existe el usuario? */
        let usuario = await Usuario.findOne({ email });
        if (usuario) {
            return res.status(400).json({
                ok: false,
                msg: 'Existe un usuario registrado con ese correo'
            })
        }
        /* Sino existe guardar */
        usuario = new Usuario(
            {
                name: req.body.name,
                email,
                password,
                telefono,
                numIdentificacion,
                rol: 'default'
            }
        );
        /* Encriptar contrasenia */
        const salt = bcrypt.genSaltSync();
        usuario.password = bcrypt.hashSync(password, salt);
        await usuario.save();

        //Generar JWT

        const token = await generarJWT(usuario.id, usuario.name);

        res.status(201).json({
            ok: true,
            msj: 'Usuario registrado correctamente',
            uid: usuario.id,
            name: usuario.name,
            token
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Por favor contacte con su administrador'
        })
    }
}
//POST
const loginUsuario = async (req, res = response) => {

    const { email, password } = req.body;
    //Manejo de errores

    /* Existe el usuario? */
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({
                ok: false,
                msg: 'No existe un usuario registrado con ese correo'
            })
        }
        /* Si existe Login */

        /* Validar password con BD */
        const validPassword = bcrypt.compareSync(password, usuario.password);

        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                msg: 'Password incorrecto'
            });
        }

        //Generar JWT
        const token = await generarJWT(usuario.id, usuario.name);

        res.json({
            ok: true,
            hola: 'holamuendo',
            uid: usuario.id,
            name: usuario.name,
            rol: usuario.rol,
            token
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Por favor contacte con su administrador'
        })
    }
}
//GET
const revalidarToken = async (req, res = response) => {

    const { uid, name } = req;
    //Gemerar un nuevo token y retornalo en la peticion
    const token = await generarJWT(uid, name);
    const usuario = await Usuario.findOne({ _id: uid });
    res.json({
        ok: true,
        uid,
        name,
        token,
        rol: usuario.rol
    });
}

module.exports = {
    crearUsuario,
    loginUsuario,
    revalidarToken
}