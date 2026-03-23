const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  logger.error("Erro inesperado", {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500
  });

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Erro interno do servidor"
  });
};