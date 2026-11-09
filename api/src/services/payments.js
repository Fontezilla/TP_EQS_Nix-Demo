// Pagamentos fictícios: valida os dados como um processador real faria, mas não cobra nada.
// Cartões de teste: 4242 4242 4242 4242 é aceite; 4000 0000 0000 0002 é recusado.
// MB WAY: 910 000 000 simula uma recusa na app; outro número começado por 9 é aceite.
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { HttpError } = require('../utils/httpError');

const DECLINED_CARD = '4000000000000002';
const DECLINED_PHONE = '910000000';

// Algoritmo de Luhn: o último dígito de um cartão confirma os outros
function luhn(number) {
  let sum = 0;
  [...number].reverse().forEach((d, i) => {
    let n = Number(d);
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  });
  return sum % 10 === 0;
}

const brandOf = (n) => (n.startsWith('4') ? 'Visa' : /^5[1-5]/.test(n) ? 'Mastercard' : 'Cartão');

// Devolve só o que se pode guardar; os dados sensíveis ficam por aqui
function validate(payment = {}) {
  if (payment.method === 'card') {
    const number = String(payment.number || '').replace(/\D/g, '');
    if (number.length < 13 || number.length > 19 || !luhn(number)) throw new HttpError(400, 'O número do cartão não é válido.');
    const [mm, yy] = String(payment.expiry || '').split('/').map(Number);
    const expiry = new Date(2000 + yy, mm, 1); // o primeiro dia do mês a seguir
    if (!(mm >= 1 && mm <= 12) || !(expiry > new Date())) throw new HttpError(400, 'A validade do cartão não é válida (MM/AA).');
    if (!/^\d{3,4}$/.test(String(payment.cvc || ''))) throw new HttpError(400, 'O código de segurança (CVC) tem 3 ou 4 dígitos.');
    if (!String(payment.name || '').trim()) throw new HttpError(400, 'Indique o nome que está no cartão.');
    return { method: 'card', card: { brand: brandOf(number), last4: number.slice(-4) }, declined: number === DECLINED_CARD };
  }
  if (payment.method === 'mbway') {
    const phone = String(payment.phone || '').replace(/\D/g, '');
    if (!/^9\d{8}$/.test(phone)) throw new HttpError(400, 'Indique um número de telemóvel português (9 dígitos, começado por 9).');
    return { method: 'mbway', phone: `${phone.slice(0, 2)}*****${phone.slice(-2)}`, declined: phone === DECLINED_PHONE };
  }
  throw new HttpError(400, 'Escolha o método de pagamento (cartão ou MB WAY).');
}

// "Cobra" o valor: recusa os dados de teste, senão aprova e devolve a referência da transação
function charge(details) {
  if (details.declined) {
    throw new HttpError(402, details.method === 'card'
      ? 'O pagamento foi recusado pelo banco. Experimente outro cartão.'
      : 'O pagamento foi recusado na app MB WAY. Tente outra vez ou pague com cartão.');
  }
  return `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// Regista o pagamento e copia o resumo para cada encomenda (para a mostrar sem outra consulta)
async function record(details, reference, { buyer, orders, amount, auction }) {
  const { declined, ...stored } = details; // eslint-disable-line no-unused-vars
  const payment = await Payment.create({ ...stored, reference, buyer, orders: orders.map((o) => o._id), amount, auction });
  const label = details.method === 'card' ? `${details.card.brand} •••• ${details.card.last4}` : `MB WAY ${details.phone}`;
  const summary = { reference, method: details.method, label, paidAt: payment.createdAt };
  await Order.updateMany({ _id: { $in: payment.orders } }, { payment: summary });
  orders.forEach((o) => { o.payment = summary; });
  return payment;
}

module.exports = { validate, charge, record, luhn };
