// Leilão em direto. As licitações ficam numa coleção própria (Bid): podem ser centenas.
const { Schema, model, Types } = require('mongoose');

const auctionSchema = new Schema({
  producer: { type: Types.ObjectId, ref: 'User', required: true },
  product: { type: Types.ObjectId, ref: 'Product', required: true }, // dá a categoria e a imagem
  lot: { type: String, required: [true, 'Indique o nome do lote'], trim: true, maxlength: [100, 'O nome do lote pode ter até 100 caracteres'] }, // "200 kg de kiwi Hayward, calibre A"
  // Quantidade do produto (na unidade dele) reservada do stock para o leilão
  quantity: { type: Number, required: [true, 'Indique a quantidade do lote'], min: [0.01, 'A quantidade tem de ser maior que zero'] },
  // true quando a reserva voltou ao stock (lote sem comprador); impede que volte duas vezes
  stockReleased: { type: Boolean, default: false },
  description: { type: String, maxlength: 1000 },
  startPrice: { type: Number, required: [true, 'Indique o preço base'], min: [0, 'O preço base não pode ser negativo'] },
  increment: { type: Number, required: [true, 'Indique o incremento mínimo'], min: [0.01, 'O incremento tem de ser pelo menos 0,01 €'] },
  // Começa com amount = startPrice; a 1.ª licitação tem de ser >= startPrice + increment
  currentBid: {
    amount: Number,
    buyer: { type: Types.ObjectId, ref: 'User' },
    name: String,
    at: Date
  },
  bidCount: { type: Number, default: 0 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },

  // Depois de terminar: o vencedor tem um prazo para confirmar a compra. Se não confirmar
  // (ou recusar), o lote passa ao comprador com a licitação seguinte mais alta, e assim por diante.
  outcome: { type: String, enum: ['awaiting', 'sold', 'unsold'] },
  winner: {
    buyer: { type: Types.ObjectId, ref: 'User' },
    name: String,
    amount: Number,
    deadline: Date
  },
  declined: [{ type: Types.ObjectId, ref: 'User' }], // não confirmaram a tempo ou recusaram
  order: { type: Types.ObjectId, ref: 'Order' } // criada quando o vencedor confirma
}, { timestamps: true });

auctionSchema.index({ status: 1, endsAt: 1 });
auctionSchema.index({ outcome: 1, 'winner.deadline': 1 });
auctionSchema.index({ 'winner.buyer': 1, outcome: 1 });
auctionSchema.index({ producer: 1 });

module.exports = model('Auction', auctionSchema);
