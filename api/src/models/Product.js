// Produto: o produtor é REFERENCIADO (um produtor tem muitos produtos)
const { Schema, model, Types } = require('mongoose');

const CATEGORIES = ['fruit', 'vegetables', 'honey', 'wine', 'cheese', 'bakery', 'other'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

const productSchema = new Schema({
  producer: { type: Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: [true, 'Indique o nome do produto'], trim: true, maxlength: [80, 'O nome pode ter até 80 caracteres'] },
  description: { type: String, maxlength: 1000 }, // também serve para a pesquisa por ingrediente
  category: { type: String, enum: { values: CATEGORIES, message: 'Categoria inválida' }, required: [true, 'Escolha a categoria'] },
  price: { type: Number, required: [true, 'Indique o preço'], min: [0, 'O preço não pode ser negativo'] },
  unit: { type: String, default: 'kg', trim: true }, // kg, unid., garrafa, 500 g…
  stock: { type: Number, default: 0, min: [0, 'O stock não pode ser negativo'] },
  minStock: { type: Number, default: 10, min: [0, 'O stock mínimo não pode ser negativo'] }, // abaixo disto o produtor recebe um alerta
  organic: { type: Boolean, default: false },
  seasons: [{ type: String, enum: { values: SEASONS, message: 'Época inválida' } }],
  imageUrl: String, // Passo 8: URL da imagem no storage da Cloud
  hidden: { type: Boolean, default: false } // ocultado pelo administrador (moderação de conteúdos)
}, { timestamps: true });

productSchema.index({ category: 1, price: 1 });
productSchema.index({ producer: 1 });

productSchema.statics.CATEGORIES = CATEGORIES;
productSchema.statics.SEASONS = SEASONS;

module.exports = model('Product', productSchema);
