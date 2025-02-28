const {Schema, model} = require('mongoose');

const EventoSchema = Schema({
    title:{
        type: String,
        required:true
    },
    notes:{
        typed: String
    },
    start:{
        type: Date,
        required: true
    },
    end:{
        type: Date,
        required: true
    },
    user:{ //ESto viene del otro esqueme de usuario.js
        type: Schema.Types.ObjectId,
        ref:'Usuario',
        required: true
    }
});

EventoSchema.method('toJSON', function(){
 const {__v, _id, ...object} = this.toObject();
 object.Event_id = _id;
 return object;
})

module.exports = model('Evento', EventoSchema);