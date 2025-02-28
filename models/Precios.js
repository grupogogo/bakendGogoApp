const { Schema, model } = require('mongoose')

const PreciosSchema = Schema({
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'Clientes',
        required: true
    },
    precioKits: {
        kcg: { type: Number, require: false },
        kcp: { type: Number, require: false },
        kb: { type: Number, require: false }
    },
    precioCirios: {
        cc: { type: Number, require: false },
        cb: { type: Number, require: false }
    },
    precioGuantes: {
        gb: { type: Number, require: false },
        gn: { type: Number, require: false },
        gm: { type: Number, require: false }
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    }
})

PreciosSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.Precios_id = _id;
    return object;
})

module.exports = model('Precios', PreciosSchema);