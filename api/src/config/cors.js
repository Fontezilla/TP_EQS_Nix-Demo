// Origens que podem chamar a API e ligar-se ao Socket.io: a loja (SPA) e o backoffice (Laravel)
const origins = [process.env.CLIENT_URL, process.env.BACKOFFICE_URL].filter(Boolean);

module.exports = origins.length ? origins : '*';
