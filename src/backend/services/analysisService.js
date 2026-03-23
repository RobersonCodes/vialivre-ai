const axios = require("axios");
const analysisRepository = require("../repositories/analysisRepository");
const AppError = require("../utils/AppError");

async function predictRiskWithAI(data) {

  const hora = parseInt(
    (data.horario || "00:00").split(":")[0],
    10
  );

  const payload = {
    origem: data.origem,
    destino: data.destino,
    hora,
    clima: data.clima,
    transporte: data.transporte,
    distancia_km: Number(data.distanciaKm || 0),
    tempo_base: Number(data.tempoBase || 20)
  };

  try {

    const response = await axios.post(
      "http://127.0.0.1:8000/predict",
      payload
    );

    return response.data;

  } catch (error) {

    console.error("Erro ao chamar IA:", error.message);

    throw new AppError(
      "Serviço de IA indisponível.",
      503
    );

  }

}

function gerarMensagem(trafego) {

  if (trafego === "intenso") {
    return "Alta probabilidade de atraso.";
  }

  if (trafego === "moderado") {
    return "Pode haver pequeno atraso.";
  }

  return "Condições favoráveis.";

}

async function createAnalysis(payload) {

  if (!payload) {

    throw new AppError(
      "Dados não enviados.",
      400
    );

  }

  const ai = await predictRiskWithAI(payload);

  const analysis = {

    origem: payload.origem,
    destino: payload.destino,
    horario: payload.horario,
    clima: payload.clima,
    transporte: payload.transporte,

    distanciaKm: payload.distanciaKm || 0,

    tempoBase: payload.tempoBase || 20,

    risco: Math.round(ai.risco),

    chanceLeve: ai.chanceLeve,

    trafego: ai.trafego,

    classificacaoIA: ai.classificacaoIA,

    mensagem: gerarMensagem(ai.trafego),

    melhorHorario: payload.horario

  };

  return analysisRepository.createAnalysis(analysis);

}

async function getAllAnalyses() {

  return analysisRepository.getAllAnalyses();

}

async function clearAnalyses() {

  return analysisRepository.clearAnalyses();

}

async function getStats() {

  const analyses = await analysisRepository.getAllAnalyses();

  const total = analyses.length;

  if (!total) {

    return {
      total: 0
    };

  }

  const media =
    analyses.reduce(
      (sum, a) => sum + (a.risco || 0),
      0
    ) / total;

  return {

    total,

    riscoMedio:
      Math.round(media)

  };

}

module.exports = {

  createAnalysis,

  getAllAnalyses,

  clearAnalyses,

  getStats

};