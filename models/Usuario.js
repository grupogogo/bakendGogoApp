const { Schema, model } = require('mongoose');

const UsuarioSchema = Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    rol: {
        type: String,        
    },
    telefono: {
        type: String,        
        required: false
    },
    numIdentificacion: {
        type: String,  
        required: false      
    }
})

module.exports = model('Usuario', UsuarioSchema)