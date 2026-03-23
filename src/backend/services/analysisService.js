const store = require("../data/analysesStore");

function gerarId() {
  return Math.random().toString(36).substring(2, 10);
}

function classificarRisco(risco) {
  if (risco <= 30) return "Baixo";
  if (risco <= 60) return "Médio";
  if (risco <= 80) return "Alto";
  return "Muito alto";
}

function normalizeAnalysisPayload(payload) {

  const risco = Number(payload.risco);
  const tempoBase = Number(payload.tempoBase);
  const distanciaKm = Number(payload.distanciaKm);

  return {

    id: gerarId(),

    origem: payload.origem.trim(),
    destino: payload.destino.trim(),

    horario: payload.horario,
    clima: payload.clima,
    transporte: payload.transporte,

    distanciaKm,
    tempoBase,

    trafego: payload.trafego,

    risco,

    classificacaoIA:
      payload.classificacaoIA ||
      classificarRisco(risco),

    chanceLeve:
      typeof payload.chanceLeve === "number"
        ? payload.chanceLeve
        : null,

    melhorHorario:
      payload.melhorHorario ||
      "Horário atual adequado",

    mensagem:
      payload.mensagem ||
      "Análise concluída.",

    createdAt: new Date().toISOString()

  };

}

async function getAllAnalyses() {

  const lista = store.getAll();

  return lista.sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );

}

async function getStats() {

  const analyses = store.getAll();

  if (analyses.length === 0) {

    return {

      totalAnalises: 0,
      riscoMedio: 0,
      tempoMedio: 0,
      ultimaAnalise: null

    };

  }

  const somaRisco = analyses.reduce(
    (acc, item) =>
      acc + Number(item.risco || 0),
    0
  );

  const somaTempo = analyses.reduce(
    (acc, item) =>
      acc + Number(item.tempoBase || 0),
    0
  );

  return {

    totalAnalises: analyses.length,

    riscoMedio: Math.round(
      somaRisco / analyses.length
    ),

    tempoMedio: Math.round(
      somaTempo / analyses.length
    ),

    ultimaAnalise:
      analyses[analyses.length - 1] || null

  };

}

async function createAnalysis(payload) {

  const analysis =
    normalizeAnalysisPayload(payload);

  return store.insert(analysis);

}

async function clearAnalyses() {

  store.clear();

  return {

    message:
      "Histórico removido com sucesso."

  };

}

module.exports = {

  getAllAnalyses,
  getStats,
  createAnalysis,
  clearAnalyses

};