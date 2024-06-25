const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  publicacion: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    required: true 
  },
  motivo: { 
    type: String, 
    required: true 
  },
  estado: { 
    type: String, 
    enum: ['pendiente', 'revisado', 'rechazado'], 
    default: 'pendiente',
    required: true
  },
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  },
});

reporteSchema.index({ usuario: 1, publicacion: 1 }, { unique: true });

module.exports = mongoose.model('Reporte', reporteSchema);
