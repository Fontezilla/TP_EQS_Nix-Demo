// Encomenda (uma por produtor): as LINHAS e o HISTÓRICO são embebidos (lidos sempre com a encomenda);
// comprador, produtor e leilão são REFERENCIADOS.
const { Schema, model, Types } = require('mongoose');

const STATUSES = ['pending', 'confirmed', 'ready', 'delivered'];

const itemSchema = new Schema({
  product: { type: Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true }, // cópia do nome no momento da compra
  unitPrice: { type: Number, required: true, min: 0 }, // cópia do preço no momento da compra
  quantity: { type: Number, required: true, min: 1 },
  unit: String
}, { _id: false });

const orderSchema = new Schema({
  buyer: { type: Types.ObjectId, ref: 'User', required: true },
  producer: { type: Types.ObjectId, ref: 'User', required: true },
  items: {
    type: [itemSchema],
    validate: { validator: (i) => i.length > 0, message: 'A encomenda precisa de pelo menos uma linha' }
  },
  status: { type: String, enum: STATUSES, default: 'pending' },
  history: [{ _id: false, status: { type: String, enum: STATUSES }, at: { type: Date, default: Date.now } }],
  delivery: {
    type: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    address: String
  },
  source: { type: String, enum: ['shop', 'auction'], default: 'shop' },
  auction: { type: Types.ObjectId, ref: 'Auction' },
  // Resumo do pagamento (o registo completo está na coleção payments)
  payment: {
    reference: String,
    method: { type: String, enum: ['card', 'mbway'] },
    label: String, // "Visa •••• 4242" ou "MB WAY 91*****78"
    paidAt: Date
  },
  reviewed: { type: Boolean, default: false }
}, { timestamps: true, toJSON: { virtuals: true } });

orderSchema.virtual('total').get(function total() {
  return this.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
});

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ producer: 1, createdAt: -1 });

orderSchema.statics.STATUSES = STATUSES;

module.exports = model('Order', orderSchema);
