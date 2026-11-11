const multer = require("multer");

// Middleware global de erros: evita que a aplicação caia
// e devolve um status HTTP adequado.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Imagem maior que o limite de 5 MB" });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido no corpo da requisição" });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error("Erro não tratado:", err);
  return res.status(500).json({ error: "Erro interno do servidor" });
}

module.exports = errorHandler;
