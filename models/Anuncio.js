const mongoose = require('mongoose');

const AnuncioSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  contenido: {
    type: String,
    required: true,
    trim: true
  },
  imagenUrl: {
    type: String,
    trim: true
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFinal: {
    type: Date,
    required: true
  },
  creado: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Anuncio', AnuncioSchema);
