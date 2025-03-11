const { Schema, model } = require('mongoose');

const ClienteSchema = Schema({    
    distribuidor: {
        type: Boolean,
        require: true
    },

    fechaCreacion: {
        type: String,
        require: true
    },
    nombre: {
        type: String,
        require: true
    },
    nitCC: {
        type: String,
        require: true
    },
    email: {
        type: String
    },
    telefono: {
        type: String,
        require: true,
    },
    direccion: {
        type: String,
        require: true
    },
    ciudad: {
        type: String,
        require: true
    },
    detalle: {
        type: String,
        require: false
    },
    precios: {
        type: Schema.Types.ObjectId,
        ref: 'Precios' // Debe coincidir con el nombre del modelo 'Precio'.
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    }
})

ClienteSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.cliente_id = _id;
    return object;
})

module.exports = model('Cliente', ClienteSchema);
