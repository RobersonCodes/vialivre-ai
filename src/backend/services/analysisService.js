const analysisRepository = require("../repositories/analysisRepository");
const AppError = require("../utils/AppError");

function isRushHour(horario) {
  return (
    (horario >= "07:00" && horario <= "09:00") ||
    (horario >= "17:00" && horario <= "19:00")
  );
}

function calculateTrafficLevel(risco) {
  if (risco >= 70) return "intenso";
  if (risco >= 40) return "moderado";
  return "leve";
}

function generateRecommendation(risco, horario) {
  if (risco >= 70) {
    return {
      mensagem: "Alto risco de atraso. Saia mais cedo.",
      melhorHorario: "06:00"
    };
  }

  if (risco >= 40) {
    return {
      mensagem: "Risco moderado. Considere sair um pouco antes.",
      melhorHorario: horario
    };
  }

  return {
    mensagem: "Condições favoráveis para sair no horário planejado.",
    melhorHorario: horario
  };
}

function buildAnalysis(data) {
  let tempoBase = 20;
  let risco = 20;

  if (isRushHour(data.horario)) {
    tempoBase += 20;
    risco += 25;
  }

  if (data.clima === "chuva") {
    tempoBase += 15;
    risco += 20;
  }

  if (data.transporte === "onibus") {
    tempoBase += 10;
    risco += 10;
  }

  if (data.transporte === "bicicleta" && data.clima === "chuva") {
    tempoBase += 20;
    risco += 15;
  }

  if (risco > 100) risco = 100;

  const trafego = calculateTrafficLevel(risco);

  const recomendacao = generateRecommendation(risco, data.horario);

  return {
    origem: data.origem,
    destino: data.destino,
    horario: data.horario,
    clima: data.clima,
    transporte: data.transporte,

    distanciaKm: data.distanciaKm || null,

    tempoBase,
    trafego,

    mensagem: recomendacao.mensagem,

    risco,

    chanceLeve: 100 - risco,

    classificacaoIA: trafego,

    melhorHorario: recomendacao.melhorHorario
  };
}

async function getAllAnalyses() {
  return analysisRepository.getAllAnalyses();
}

async function createAnalysis(payload) {
  if (!payload) {
    throw new AppError("Dados não informados.", 400);
  }

  const analysis = buildAnalysis(payload);

  return analysisRepository.createAnalysis(analysis);
}

async function clearAnalyses() {
  const result = await analysisRepository.clearAnalyses();

  return {
    message: "Histórico removido com sucesso.",
    deletedRows: result.deletedRows
  };
}

async function getStats() {
  const analyses = await analysisRepository.getAllAnalyses();

  const total = analyses.length;

  if (total === 0) {
    return {
      total: 0,
      riscoMedio: 0,
      trafegoMaisComum: null
    };
  }

  const riscoTotal = analyses.reduce((acc, item) => acc + item.risco, 0);

  const trafegoContagem = {};

  analyses.forEach(a => {
    trafegoContagem[a.trafego] =
      (trafegoContagem[a.trafego] || 0) + 1;
  });

  const trafegoMaisComum = Object.entries(trafegoContagem)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    total,
    riscoMedio: Math.round(riscoTotal / total),
    trafegoMaisComum
  };
}

module.exports = {
  getAllAnalyses,
  createAnalysis,
  clearAnalyses,
  getStats
};