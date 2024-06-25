const mongoose = require('mongoose');

const PuntuacionSchema = mongoose.Schema({
    publicacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post', // Referencia al modelo de Publicación
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', // Referencia al modelo de Usuario
        required: true
    },
    puntuacion: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    creado: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Puntuacion', PuntuacionSchema);
