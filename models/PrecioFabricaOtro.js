const { Schema, model } = require('mongoose');

const PrecioFabricaOtroSchema = Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    precioFabrica: {
        type: Number,
        required: true,
        default: 0
    },
    anio: {
        type: Number,
        default: null
    },
    categoria: {
        type: String,
        enum: ['Kits', 'Guantes'],
        default: 'Kits'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, {
    timestamps: true
});

PrecioFabricaOtroSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    object._id = _id;
    return object;
});

module.exports = model('PrecioFabricaOtro', PrecioFabricaOtroSchema, 'precios_fabrica_otros');
