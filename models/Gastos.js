const { Schema, model } = require('mongoose')

const GastosSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },    
    fecha: {
        type: String,
        require: false,
    },
    tipoGasto: {
        type: String,
        require: true
    },
    proveedor: {
        type: String,
        require: true
    },
    codigo: {
        type: String,
        require: true
    },
    gasto: {
        type: String,
        require: true
    },
    categoria: {
        type: String,
        require: true
    },
    subCategoria: {
        type: String,
        require: true
    },
    precio: {
        type: Number,
        require: true
    },
    cantidad: {
        type: Number,
        require: true
    },
    detalle: {
        type: String,
        require: false
    },
    comprobante: {
        type: String,
        require: false,
        default: null
    },
    comprobanteNombre: {
        type: String,
        require: false,
        default: ''
    },
    comprobanteTipo: {
        type: String,
        require: false,
        default: ''
    },
    items: [
        {
            gasto: { type: String, default: '' },
            codigo: { type: String, default: '' },
            subCategoria: { type: String, default: 'G' },
            cantidad: { type: Number, default: 1 },
            precio: { type: Number, default: 0 },
        }
    ]
});
GastosSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.gastos_id = _id;
    return object;
})

module.exports = model('Gastos', GastosSchema);