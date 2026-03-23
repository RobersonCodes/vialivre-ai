module.exports = (err, req, res, next) => {
  console.error("Erro inesperado:", err);

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Erro interno do servidor"
  });
};