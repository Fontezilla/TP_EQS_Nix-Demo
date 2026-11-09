// Pesquisas com $regex a partir do texto do utilizador
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const VOWELS = { a: 'aáàâã', e: 'eéê', i: 'ií', o: 'oóôõ', u: 'uú', c: 'cç' };

// "abobora" também encontra "Abóbora": cada vogal aceita as versões acentuadas
function accentInsensitiveRegex(text) {
  const base = escapeRegex(text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
  return new RegExp(base.replace(/[aeiouc]/g, (l) => `[${VOWELS[l]}]`), 'i');
}

module.exports = { escapeRegex, accentInsensitiveRegex };
