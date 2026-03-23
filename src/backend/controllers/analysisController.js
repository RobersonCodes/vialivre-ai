const analysisService = require("../services/analysisService");
const { successResponse } = require("../utils/apiResponse");

async function getAnalyses(req, res, next) {
  try {
    const analyses = await analysisService.getAllAnalyses();

    return successResponse(
      res,
      {
        total: analyses.length,
        items: analyses
      },
      "Análises listadas com sucesso.",
      200
    );
  } catch (error) {
    next(error);
  }
}

async function createAnalysis(req, res, next) {
  try {
    const newAnalysis = await analysisService.createAnalysis(req.body);

    return successResponse(
      res,
      newAnalysis,
      "Análise criada com sucesso.",
      201
    );
  } catch (error) {
    next(error);
  }
}

async function clearAnalyses(req, res, next) {
  try {
    const result = await analysisService.clearAnalyses();

    return successResponse(
      res,
      result,
      "Histórico removido com sucesso.",
      200
    );
  } catch (error) {
    next(error);
  }
}

async function getStatistics(req, res, next) {
  try {
    const stats = await analysisService.getStats();

    return successResponse(
      res,
      stats,
      "Estatísticas carregadas com sucesso.",
      200
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnalyses,
  createAnalysis,
  clearAnalyses,
  getStatistics
};