const { Schema, model } = require('mongoose');

const PedidoSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    cliente: {// cambiar esto a cliente
        type: Schema.Types.ObjectId,
        ref: 'Cliente'
    },
    fechaCreacion: {
        type: String,
        require: false,
    },
    formaPago: {
        type: String,
        require: false
    },
    costoEnvio: {
        type: String,
        require: false
    },
    tipoDespacho: {
        type: String,
        require: false
    },
    estado: {
        type: String,
        require: false
    },
    detalleEstado: {
        type: String,
        require: false
    },
    detalleGeneral: {
        type: String,
        require: false
    },
    numeroGuia: {
        type: String,
        require: false
    },
    userEdit: {
        type: String,
        require: false
    },
    itemPedido: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ItemPedido'  // Referencia a la colección de ItemPedido
        }
    ]
})

PedidoSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.pedido_id = _id;
    return object;
})

module.exports = model('Pedido', PedidoSchema);