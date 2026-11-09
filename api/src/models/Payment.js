// Pagamento (fictício): o registo de cada transação. Um cesto com vários produtores dá UM pagamento
// que cobre várias encomendas, por isso é uma coleção própria que referencia as encomendas.
// Nunca se guarda o número do cartão nem o CVC: só a marca e os últimos 4 dígitos.
const { Schema, model, Types } = require('mongoose');

const paymentSchema = new Schema({
  reference: { type: String, required: true, unique: true }, // PAY-XXXXXXXX
  buyer: { type: Types.ObjectId, ref: 'User', required: true },
  orders: [{ type: Types.ObjectId, ref: 'Order' }],
  auction: { type: Types.ObjectId, ref: 'Auction' }, // quando paga um lote ganho em leilão
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['card', 'mbway'], required: true },
  card: { brand: String, last4: String },
  phone: String, // MB WAY, mascarado (91*****78)
  status: { type: String, enum: ['paid'], default: 'paid' }
}, { timestamps: true });

paymentSchema.index({ buyer: 1, createdAt: -1 });

module.exports = model('Payment', paymentSchema);
