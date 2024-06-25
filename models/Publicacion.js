const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  contenido: {
    type: String,
    required: true,
    trim: true,
  },
  pdfUrl: {
    type: String,
    trim: true,
  },
  imagenUrl: {
    type: String,
    trim: true,
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true,
  },
  creado: {
    type: Date,
    default: Date.now,
  },
}, { toJSON: { virtuals: true } });

PostSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

PostSchema.virtual('promedioPuntuacion').get(async function () {
  const puntuaciones = await mongoose.model('Puntuacion').find({ publicacion: this._id });
  if (puntuaciones.length === 0) return 0;
  const total = puntuaciones.reduce((acc, puntuacion) => acc + puntuacion.puntuacion, 0);
  return total / puntuaciones.length;
});

PostSchema.virtual('numeroPuntuaciones').get(async function () {
  const puntuaciones = await mongoose.model('Puntuacion').find({ publicacion: this._id });
  return puntuaciones.length;
});

module.exports = mongoose.model('Post', PostSchema);
