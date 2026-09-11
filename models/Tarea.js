const { Schema, model } = require('mongoose');

const SubtareaSchema = Schema({
    id: {
        type: String,
        required: true
    },
    texto: {
        type: String,
        required: true
    },
    completada: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const ComentarioSchema = Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    nombreUsuario: {
        type: String
    },
    texto: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const TareaSchema = Schema({
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        default: '',
        trim: true
    },
    asignadoA: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    creadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'en_progreso', 'completada'],
        default: 'pendiente'
    },
    prioridad: {
        type: String,
        enum: ['baja', 'media', 'alta', 'urgente'],
        default: 'media'
    },
    fechaVencimiento: {
        type: Date,
        default: null
    },
    fechaCompletada: {
        type: Date,
        default: null
    },
    checklist: [SubtareaSchema],
    etiquetas: [{
        type: String,
        trim: true
    }],
    comentarios: [ComentarioSchema],
    orden: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

TareaSchema.method('toJSON', function() {
    const { __v, ...object } = this.toObject();
    return object;
});

module.exports = model('Tarea', TareaSchema);
