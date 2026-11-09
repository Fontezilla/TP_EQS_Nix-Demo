const { Schema, model, Types } = require('mongoose');

const bidSchema = new Schema({
  auction: { type: Types.ObjectId, ref: 'Auction', required: true },
  buyer: { type: Types.ObjectId, ref: 'User', required: true },
  name: String, // cópia do nome do comprador para o histórico
  amount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

bidSchema.index({ auction: 1, createdAt: -1 });

module.exports = model('Bid', bidSchema);
