const mongoose = require('mongoose');

const ComentarioSchema = mongoose.Schema({
    contenido: {
        type: String,
        required: true,
        trim: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    autor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    creado: {
        type: Date,
        default: Date.now()
    }
});

ComentarioSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});


module.exports = mongoose.model('Comentario', ComentarioSchema);
