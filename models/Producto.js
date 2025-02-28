const { Schema, model } = require('mongoose')

const ProductosSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    
    fechaCreacion: {
        type: Date,
        require: false,
    },
    producto: {
        type: String,
        require: true
    },
    codigo: {
        type: String,
        require: true
    },
    precio: {
        type: Number,
        require: false
    },
    detalle: {
        type: String,
        require: false
    },
});
ProductosSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.producto_id = _id;
    return object;
})

module.exports = model('Productos', ProductosSchema);