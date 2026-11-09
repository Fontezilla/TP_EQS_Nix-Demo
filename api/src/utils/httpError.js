// Erro com código HTTP: throw new HttpError(404, 'Produto não encontrado')
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { HttpError };
