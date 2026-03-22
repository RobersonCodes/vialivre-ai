const analysisService = require("../services/analysisService");

/* =========================
   UTILITÁRIOS / VALIDAÇÃO
========================= */
function validateInput(data) {
  const requiredFields = [
    "origem",
    "destino",
    "horario",
    "clima",
    "transporte"
  ];

  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === "") {
      return {
        valid: false,
        message: `Campo obrigatório não informado: ${field}`
      };
    }
  }

  return { valid: true };
}

/* =========================
   HANDLERS DA API
========================= */

async function getAnalyses(req, res) {
  try {
    const analyses = await analysisService.getAllAnalyses();

    res.status(200).json({
      success: true,
      total: analyses.length,
      data: analyses
    });
  } catch (error) {
    console.error("Erro ao buscar análises:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar análises."
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
      message: "Análise criada com sucesso.",
      data: newAnalysis
    });
  } catch (error) {
    console.error("Erro ao criar análise:", error);
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
      message: "Histórico removido com sucesso.",
      data: result
    });
  } catch (error) {
    console.error("Erro ao limpar histórico:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao limpar histórico."
    });
  }
}

async function getStatistics(req, res) {
  try {
    const stats = await analysisService.getStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas."
    });
  }
}

module.exports = {
  getAnalyses,
  createAnalysis,
  clearAnalyses,
  getStatistics
};