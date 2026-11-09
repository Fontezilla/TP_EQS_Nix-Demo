// Tratamento centralizado de erros: converte erros conhecidos em códigos HTTP
module.exports = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.name === 'ValidationError') {
    const fields = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    return res.status(400).json({ error: Object.values(fields).join('. '), fields });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: 'Identificador inválido' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'A fotografia não pode ter mais de 5 MB' });
  if (err.code === 11000) return res.status(409).json({ error: 'Já existe um registo com estes dados' });
  if (err.status) return res.status(err.status).json({ error: err.message });

  // Erro inesperado: regista no servidor, mas não revela detalhes ao cliente
  console.error(err);
  res.status(500).json({ error: 'Erro interno' });
};
