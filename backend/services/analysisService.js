const analysisModel = require("../models/analysisModel");

/* =========================
   UTILITÁRIOS
========================= */

function normalizarTexto(valor = "") {
  return valor.toString().trim().toLowerCase();
}

function parseHorario(horario) {
  if (!horario || typeof horario !== "string" || !horario.includes(":")) {
    return 8;
  }

  const hora = parseInt(horario.split(":")[0], 10);

  if (Number.isNaN(hora) || hora < 0 || hora > 23) {
    return 8;
  }

  return hora;
}

function calcularFaixaHorario(hora) {
  if ((hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19)) {
    return "pico";
  }

  if (
    (hora >= 6 && hora < 7) ||
    (hora > 9 && hora <= 10) ||
    (hora >= 16 && hora < 17) ||
    (hora > 19 && hora <= 20)
  ) {
    return "atencao";
  }

  return "livre";
}

function obterNivelTrafego(faixaHorario) {
  if (faixaHorario === "pico") return "intenso";
  if (faixaHorario === "atencao") return "moderado";
  return "leve";
}

function normalizarClima(clima) {
  const valor = normalizarTexto(clima);

  if (["sol", "limpo", "ceu limpo"].includes(valor)) return "limpo";
  if (["nublado", "parcialmente nublado"].includes(valor)) return valor;
  if (["garoa"].includes(valor)) return "garoa";
  if (["chuva", "chuvisco"].includes(valor)) return "chuva";
  if (["tempestade", "trovoada"].includes(valor)) return "tempestade";

  return "nublado";
}

function normalizarTransporte(transporte) {
  const valor = normalizarTexto(transporte);

  if (["carro", "auto"].includes(valor)) return "carro";
  if (["moto", "motocicleta"].includes(valor)) return "moto";
  if (["onibus", "ônibus", "bus"].includes(valor)) return "onibus";

  return "carro";
}

/* =========================
   DISTÂNCIA / TEMPO
========================= */

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(1));
}

function obterVelocidadeMedia(transporte) {
  const velocidades = {
    carro: 72,
    moto: 78,
    onibus: 48
  };

  return velocidades[transporte] || 65;
}

function obterFatorHorario(hora) {
  if ((hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19)) return 1.45;
  if (
    (hora >= 6 && hora < 7) ||
    (hora > 9 && hora <= 10) ||
    (hora >= 16 && hora < 17) ||
    (hora > 19 && hora <= 20)
  ) {
    return 1.2;
  }

  if (hora >= 22 || hora <= 5) return 0.9;

  return 1;
}

function obterFatorClima(clima) {
  const fatores = {
    limpo: 1,
    "parcialmente nublado": 1.03,
    nublado: 1.06,
    garoa: 1.12,
    chuva: 1.22,
    tempestade: 1.38
  };

  return fatores[clima] || 1.08;
}

function obterAjusteTransporteMin(transporte) {
  const ajustes = {
    carro: 0,
    moto: -8,
    onibus: 18
  };

  return ajustes[transporte] || 0;
}

function estimarTempoPorDistancia(distanciaKm, transporte, hora, clima) {
  const velocidadeMedia = obterVelocidadeMedia(transporte);
  const tempoBaseMin = (distanciaKm / velocidadeMedia) * 60;

  const tempoAjustado =
    tempoBaseMin * obterFatorHorario(hora) * obterFatorClima(clima) +
    obterAjusteTransporteMin(transporte);

  return Math.max(10, Math.round(tempoAjustado));
}

/* =========================
   RISCO / IA
========================= */

function calcularRisco(clima, transporte, faixaHorario) {
  let risco = 15;

  const pesosHorario = {
    pico: 50,
    atencao: 25,
    livre: 5
  };

  const pesosClima = {
    limpo: 0,
    nublado: 8,
    "parcialmente nublado": 5,
    garoa: 12,
    chuva: 20,
    tempestade: 35
  };

  const pesosTransporte = {
    carro: 8,
    onibus: 15,
    moto: -5
  };

  risco += pesosHorario[faixaHorario] || 0;
  risco += pesosClima[clima] || 10;
  risco += pesosTransporte[transporte] || 5;

  return Math.max(0, Math.min(100, Math.round(risco)));
}

function gerarChanceLeve(risco) {
  const chance = 100 - risco;
  return chance < 5 ? 5 : chance;
}

function gerarClassificacaoIA(risco) {
  if (risco >= 75) return "Cenário crítico";
  if (risco >= 50) return "Cenário de atenção";
  if (risco >= 30) return "Cenário moderado";
  return "Cenário favorável";
}

function sugerirMelhorHorario(hora, faixaHorario, clima, risco) {
  let ajuste = 0;

  if (faixaHorario === "pico") ajuste -= 1;
  if (faixaHorario === "atencao") ajuste -= 0.5;
  if (clima === "chuva") ajuste -= 0.5;
  if (clima === "tempestade") ajuste -= 1;
  if (risco >= 80) ajuste -= 0.5;

  const novaHora = Math.max(0, Math.min(23, hora + ajuste));

  if (novaHora === hora) return "Horário atual adequado";

  const minutos = ajuste % 1 !== 0 ? 30 : 0;

  return `${String(Math.floor(novaHora)).padStart(2, "0")}:${minutos === 0 ? "00" : "30"}`;
}

function gerarMensagemRecomendacao(trafego, clima, transporte) {
  if (trafego === "intenso" && clima === "tempestade") {
    return "Condição crítica de deslocamento. O ideal é sair com bastante antecedência.";
  }

  if (trafego === "intenso" && clima === "chuva" && transporte === "onibus") {
    return "Trânsito intenso com chuva. Para ônibus, o ideal é sair 30 minutos antes.";
  }

  if (trafego === "intenso" && (clima === "chuva" || clima === "garoa")) {
    return "Trânsito intenso com chuva. O ideal é sair 25 a 30 minutos antes.";
  }

  if (trafego === "intenso") {
    return "Trânsito intenso. Recomendamos sair com pelo menos 20 minutos de antecedência.";
  }

  if (trafego === "moderado" && (clima === "chuva" || clima === "garoa")) {
    return "Trânsito moderado com chuva. Considere sair 15 minutos antes.";
  }

  if (trafego === "moderado") {
    return "Trânsito moderado. Considere sair 10 minutos antes.";
  }

  return "Trânsito tranquilo. Você pode sair no horário planejado.";
}

/* =========================
   MONTAGEM DA ANÁLISE
========================= */

function montarAnalise(data) {
  const origem = data.origem?.trim();
  const destino = data.destino?.trim();
  const horario = data.horario?.trim();
  const clima = normalizarClima(data.clima);
  const transporte = normalizarTransporte(data.transporte);
  const hora = parseHorario(horario);
  const faixaHorario = calcularFaixaHorario(hora);
  const trafego = obterNivelTrafego(faixaHorario);

  let distanciaKm = Number(data.distanciaKm);

  if (
    (!distanciaKm || Number.isNaN(distanciaKm) || distanciaKm <= 0) &&
    data.origemLat !== undefined &&
    data.origemLon !== undefined &&
    data.destinoLat !== undefined &&
    data.destinoLon !== undefined
  ) {
    distanciaKm = calcularDistanciaKm(
      Number(data.origemLat),
      Number(data.origemLon),
      Number(data.destinoLat),
      Number(data.destinoLon)
    );
  }

  if (!distanciaKm || Number.isNaN(distanciaKm) || distanciaKm <= 0) {
    distanciaKm = 12;
  }

  let tempoBase = Number(data.tempoBase);

  const tempoEstimadoBackend = estimarTempoPorDistancia(
    distanciaKm,
    transporte,
    hora,
    clima
  );

  const tempoMinimoEsperado = Math.max(10, Math.round((distanciaKm / 120) * 60));

  if (
    !tempoBase ||
    Number.isNaN(tempoBase) ||
    tempoBase < tempoMinimoEsperado
  ) {
    tempoBase = tempoEstimadoBackend;
  }

  const risco = calcularRisco(clima, transporte, faixaHorario);
  const chanceLeve = gerarChanceLeve(risco);
  const classificacaoIA = gerarClassificacaoIA(risco);
  const melhorHorario = sugerirMelhorHorario(hora, faixaHorario, clima, risco);
  const mensagem = gerarMensagemRecomendacao(trafego, clima, transporte);

  return {
    origem,
    destino,
    horario,
    clima,
    transporte,
    distanciaKm: Number(distanciaKm.toFixed(1)),
    tempoBase,
    trafego,
    mensagem,
    risco,
    chanceLeve,
    classificacaoIA,
    melhorHorario
  };
}

/* =========================
   CRUD
========================= */

async function getAllAnalyses() {
  return await analysisModel.getAllAnalyses();
}

async function createAnalysis(data) {
  const analiseTratada = montarAnalise(data);
  return await analysisModel.createAnalysis(analiseTratada);
}

async function clearAnalyses() {
  return await analysisModel.clearAnalyses();
}

async function getStats() {
  return await analysisModel.getStats();
}

module.exports = {
  getAllAnalyses,
  createAnalysis,
  clearAnalyses,
  getStats
};