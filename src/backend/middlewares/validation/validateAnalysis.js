const AppError = require("../utils/AppError");

const allowedClimas = [
  "sol",
  "nublado",
  "chuva",
  "limpo",
  "garoa",
  "tempestade",
  "parcialmente nublado"
];

const allowedTransportes = [
  "carro",
  "moto",
  "onibus",
  "bicicleta"
];

function validateAnalysis(req, res, next) {
  const {
    origem,
    destino,
    horario,
    clima,
    transporte
  } = req.body;

  if (!origem || !destino || !horario || !clima || !transporte) {
    return next(new AppError("Todos os campos são obrigatórios.", 400));
  }

  if (origem.toString().trim().length < 2) {
    return next(new AppError("Origem inválida.", 400));
  }

  if (destino.toString().trim().length < 2) {
    return next(new AppError("Destino inválido.", 400));
  }

  const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!horarioRegex.test(horario)) {
    return next(new AppError("Horário inválido. Use HH:MM.", 400));
  }

  if (!allowedClimas.includes(clima)) {
    return next(
      new AppError(
        `Clima inválido. Valores permitidos: ${allowedClimas.join(", ")}`,
        400
      )
    );
  }

  if (!allowedTransportes.includes(transporte)) {
    return next(
      new AppError(
        `Transporte inválido. Valores permitidos: ${allowedTransportes.join(", ")}`,
        400
      )
    );
  }

  next();
}

module.exports = validateAnalysis;