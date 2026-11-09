// Envolve um handler async: qualquer erro segue para o errorHandler (sem try/catch em cada rota)
module.exports = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
