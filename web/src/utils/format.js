const EURO = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
const DAY = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });
const LONG_DAY = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
const TIME = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' });

export const euro = (amount) => EURO.format(amount);
export const time = (date) => TIME.format(new Date(date));

const startOfDay = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const daysFromToday = (date) => Math.round((startOfDay(date) - startOfDay(Date.now())) / 864e5);

// "hoje", "amanhã", "ontem" ou "sex., 2 out."
export function day(date, { long = false } = {}) {
  const d = daysFromToday(date);
  if (d === 0) return 'hoje';
  if (d === 1) return 'amanhã';
  if (d === -1) return 'ontem';
  return (long ? LONG_DAY : DAY).format(new Date(date));
}

export const duration = (start, end) => {
  const min = Math.round((Date.parse(end) - Date.parse(start)) / 6e4);
  return min < 60 ? `${min} min` : `${min / 60} h`;
};

export const initials = (name = '') =>
  name.split(' ').filter((p) => p.length > 2).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

// Sem acentos e em minúsculas, para pesquisas
export const normalize = (text = '') => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const MUNICIPALITIES = ['Arcos de Valdevez', 'Caminha', 'Melgaço', 'Monção', 'Paredes de Coura', 'Ponte da Barca',
  'Ponte de Lima', 'Valença', 'Viana do Castelo', 'Vila Nova de Cerveira'];
