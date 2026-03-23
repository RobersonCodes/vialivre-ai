const analysisService = require("../services/analysisService");

function validateInput(body) {
  const {
    origem,
    destino,
    horario,
    clima,
    transporte,
    distanciaKm,
    tempoBase,
    trafego,
    risco
  } = body;

  if (!origem || typeof origem !== "string") {
    return { valid: false, message: "Origem é obrigatória." };
  }

  if (!destino || typeof destino !== "string") {
    return { valid: false, message: "Destino é obrigatório." };
  }

  if (!horario || typeof horario !== "string") {
    return { valid: false, message: "Horário é obrigatório." };
  }

  if (!clima || typeof clima !== "string") {
    return { valid: false, message: "Clima é obrigatório." };
  }

  if (!transporte || typeof transporte !== "string") {
    return { valid: false, message: "Transporte é obrigatório." };
  }

  if (typeof distanciaKm !== "number" || Number.isNaN(distanciaKm)) {
    return { valid: false, message: "Distância inválida." };
  }

  if (typeof tempoBase !== "number" || Number.isNaN(tempoBase)) {
    return { valid: false, message: "Tempo estimado inválido." };
  }

  if (!trafego || typeof trafego !== "string") {
    return { valid: false, message: "Tráfego é obrigatório." };
  }

  if (typeof risco !== "number" || Number.isNaN(risco)) {
    return { valid: false, message: "Risco inválido." };
  }

  return { valid: true };
}

async function getAnalyses(req, res) {
  try {
    const analyses = await analysisService.getAllAnalyses();

    res.status(200).json({
      success: true,
      total: analyses.length,
      data: analyses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar análises."
    });
  }
}

async function getStats(req, res) {
  try {
    const stats = await analysisService.getStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas."
    });
  }
}

async function createAnalysis(req, res) {
  try {
    const validation = validateInput(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const newAnalysis = await analysisService.createAnalysis(req.body);

    res.status(201).json({
      success: true,
      data: newAnalysis
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erro ao salvar análise."
    });
  }
}

async function clearAnalyses(req, res) {
  try {
    const result = await analysisService.clearAnalyses();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erro ao limpar análises."
    });
  }
}

module.exports = {
  getAnalyses,
  getStats,
  createAnalysis,
  clearAnalyses
};