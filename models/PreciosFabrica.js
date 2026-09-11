const { Schema, model } = require('mongoose');

const PreciosFabricaSchema = Schema({
    anio: {
        type: Number,
        required: true,
        index: true
    },
    fechaVigencia: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        default: ''
    },
    precioKits: {
        kcg: { type: Number, default: 0 },
        kcp: { type: Number, default: 0 },
        kb: { type: Number, default: 0 },
        kce: { type: Number, default: 0 }
    },
    precioCirios: {
        cc: { type: Number, default: 0 },
        cb: { type: Number, default: 0 }
    },
    precioGuantes: {
        gb: { type: Number, default: 0 },
        gn: { type: Number, default: 0 },
        gm: { type: Number, default: 0 }
    },
    activo: {
        type: Boolean,
        default: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, {
    timestamps: true
});

PreciosFabricaSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    object._id = _id;
    return object;
});

module.exports = model('PreciosFabrica', PreciosFabricaSchema, 'precios_fabrica');
