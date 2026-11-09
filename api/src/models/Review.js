// Avaliação: coleção própria (cresce sem limite e o administrador modera-a).
// Uma por encomenda entregue; conta para o produtor e para os produtos dessa encomenda.
const { Schema, model, Types } = require('mongoose');

const reviewSchema = new Schema({
  author: { type: Types.ObjectId, ref: 'User', required: true },
  authorName: String,
  producer: { type: Types.ObjectId, ref: 'User', required: true },
  order: { type: Types.ObjectId, ref: 'Order', required: true, unique: true },
  products: [{ type: Types.ObjectId, ref: 'Product' }],
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 1000 },
  status: { type: String, enum: ['visible', 'reported', 'hidden'], default: 'visible' },
  reportedBy: [{ type: Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

reviewSchema.index({ producer: 1, createdAt: -1 });

module.exports = model('Review', reviewSchema);
