const analysisModel = require("../models/analysisModel");
const { buscarClimaAtual } = require("./climaService");

/* =========================
   UTILITÁRIOS (Originais)
========================= */
function normalizarTexto(valor = "") {
  return valor.toString().trim().toLowerCase();
}

function parseHorario(horario) {
  if (!horario || typeof horario !== "string" || !horario.includes(":")) return 8;
  const hora = parseInt(horario.split(":")[0], 10);
  return (Number.isNaN(hora) || hora < 0 || hora > 23) ? 8 : hora;
}

function calcularFaixaHorario(hora) {
  if ((hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19)) return "pico";
  if ((hora >= 6 && hora < 7) || (hora > 9 && hora <= 10) || (hora >= 16 && hora < 17) || (hora > 19 && hora <= 20)) return "atencao";
  return "livre";
}

function obterNivelTrafego(faixaHorario) {
  if (faixaHorario === "pico") return "intenso";
  if (faixaHorario === "atencao") return "moderado";
  return "leve";
}

function normalizarClima(clima) {
  const valor = normalizarTexto(clima);
  if (["sol", "limpo"].includes(valor)) return "limpo";
  if (["nublado", "parcialmente nublado"].includes(valor)) return "nublado";
  if (["chuva", "garoa"].includes(valor)) return "chuva";
  if (["tempestade"].includes(valor)) return "tempestade";
  return "nublado";
}

function normalizarTransporte(transporte) {
  const valor = normalizarTexto(transporte);
  if (["carro", "moto", "onibus", "ônibus"].includes(valor)) {
    return valor === "ônibus" ? "onibus" : valor;
  }
  return "carro";
}

/* =========================
   CÁLCULOS GEOGRÁFICOS E IA
========================= */
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function estimarTempo(distanciaKm, transporte, hora, clima) {
  const velocidades = { carro: 70, moto: 80, onibus: 45 };
  let tempo = (distanciaKm / (velocidades[transporte] || 60)) * 60;
  if ((hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19)) tempo *= 1.4;
  if (clima === "chuva") tempo *= 1.2;
  if (clima === "tempestade") tempo *= 1.35;
  return Math.round(tempo);
}

function calcularRisco(clima, transporte, faixaHorario) {
  let risco = 20;
  if (faixaHorario === "pico") risco += 40;
  else if (faixaHorario === "atencao") risco += 20;
  if (clima === "chuva") risco += 15;
  else if (clima === "tempestade") risco += 30;
  if (transporte === "onibus") risco += 10;
  else if (transporte === "moto") risco -= 5;
  return Math.min(100, risco);
}

/* =========================
   FLUXO DE ANÁLISE (Lógica Principal)
========================= */
function montarAnalise(data) {
  const hora = parseHorario(data.horario);
  const faixaHorario = calcularFaixaHorario(hora);
  const clima = normalizarClima(data.clima);
  const transporte = normalizarTransporte(data.transporte);

  let distanciaKm = data.distanciaKm || (data.origemLat ? calcularDistanciaKm(data.origemLat, data.origemLon, data.destinoLat, data.destinoLon) : 15);

  const tempoBase = estimarTempo(distanciaKm, transporte, hora, clima);
  const risco = calcularRisco(clima, transporte, faixaHorario);

  return {
    ...data,
    distanciaKm,
    tempoBase,
    trafego: obterNivelTrafego(faixaHorario),
    risco,
    chanceLeve: 100 - risco,
    classificacaoIA: risco > 70 ? "Alto risco" : (risco > 40 ? "Atenção" : "Condição favorável"),
    melhorHorario: faixaHorario === "pico" ? "Evitar horário de pico" : "Horário adequado"
  };
}

/* =========================
   CRUD (Exportados)
========================= */
async function createAnalysis(data) {
  // Injeção de Clima Real
  const climaApi = await buscarClimaAtual(data.origem);
  const analiseCompleta = montarAnalise({ ...data, clima: climaApi });
  
  return await analysisModel.createAnalysis(analiseCompleta);
}

async function getAllAnalyses() { return await analysisModel.getAllAnalyses(); }
async function clearAnalyses() { return await analysisModel.clearAnalyses(); }
async function getStats() { return await analysisModel.getStats(); }

module.exports = { getAllAnalyses, createAnalysis, clearAnalyses, getStats };