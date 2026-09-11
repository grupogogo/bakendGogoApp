const { Schema, model } = require('mongoose');

const AnticipoSchema = Schema({
    detalle: {
        type: String,
        required: true,
        trim: true
    },
    cantidad: {
        type: Number,
        default: 1
    },
    valor: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    tipo: {
        type: String,
        enum: ['OSCAR_A_LEO', 'LEO_A_OSCAR'],
        default: 'OSCAR_A_LEO',
        required: true
    },
    anio: {
        type: Number,
        default: () => new Date().getFullYear()
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, {
    timestamps: true
});

AnticipoSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    object._id = _id;
    return object;
});

module.exports = model('Anticipo', AnticipoSchema, 'anticipos');
