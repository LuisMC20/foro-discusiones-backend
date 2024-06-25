const mongoose = require ('mongoose');

const UsuarioSchema = mongoose.Schema({
    nombre:{
        type: String,
        required: true,
        trim: true

    },
    apellido:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password:{
        type: String,
        required: true,
        trim: true
    },
    celular:{
        type: String,
        required: true,
        trim: true
    },
    pais:{
        type: String,
        required: true,
        trim: true
    },
    ciudad:{
        type: String,
        required: true,
        trim: true
    },
    rubro:{
        type: String,
        required: true,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now()
    },
    rol: {
        type: String,
        enum: ['administrador', 'moderador', 'miembro'],
        default: 'miembro'
    }
})

module.exports =mongoose.model('Usuario', UsuarioSchema);