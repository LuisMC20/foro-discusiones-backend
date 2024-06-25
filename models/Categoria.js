const mongoose = require('mongoose');

const CategoriaSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    descripcion: {
        type: String,
        required: true,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now()
    }
}, { toJSON: { virtuals: true } });

CategoriaSchema.virtual('id').get(function() {
  return this._id.toHexString();
  /**/
});

module.exports = mongoose.model('Categoria', CategoriaSchema);
