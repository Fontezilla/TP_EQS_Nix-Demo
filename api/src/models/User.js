// Utilizador: comprador, produtor ou administrador.
// Os dados do produtor ficam EMBEBIDOS: só existem para ele e leem-se sempre com ele.
const { Schema, model } = require('mongoose');

const ROLES = ['buyer', 'producer', 'admin'];

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: 'buyer' },
  address: { type: String, trim: true }, // morada de entrega por defeito do comprador

  producer: {
    description: { type: String, maxlength: 1000 },
    city: String,
    address: String, // morada de levantamento, mostrada no mapa
    location: { lat: Number, lng: Number },
    verified: { type: Boolean, default: false } // o administrador valida o registo
  }
}, { timestamps: true });

// Dados que podem sair da API (nunca o hash da password)
userSchema.methods.toPublic = function toPublic() {
  return { id: this._id, name: this.name, email: this.email, role: this.role };
};

userSchema.statics.ROLES = ROLES;

module.exports = model('User', userSchema);
