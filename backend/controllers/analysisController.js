const service = require("../services/analysisService");

function getAnalyses(req, res) {
  res.json(service.getAllAnalyses());
}

function createAnalysis(req, res) {
  const analysis = service.createAnalysis(req.body);
  res.status(201).json(analysis);
}

function clearAnalyses(req, res) {
  service.clearAnalyses();
  res.json({ message: "Histórico limpo" });
}

module.exports = {
  getAnalyses,
  createAnalysis,
  clearAnalyses
};