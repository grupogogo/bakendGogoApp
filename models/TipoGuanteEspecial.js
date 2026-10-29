const { Schema, model } = require('mongoose');

const TipoGuanteEspecialSchema = Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    precio: {
        type: Number,
        default: 0
    },
    activo: {
        type: Boolean,
        default: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

TipoGuanteEspecialSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

module.exports = model('TipoGuanteEspecial', TipoGuanteEspecialSchema);
