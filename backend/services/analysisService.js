const analyses = require("../data/analyses");

function getAllAnalyses() {
  return analyses;
}

function createAnalysis(data) {
  const newAnalysis = {
    id: analyses.length + 1,
    ...data,
    createdAt: new Date()
  };

  analyses.unshift(newAnalysis);

  if (analyses.length > 10) {
    analyses.pop();
  }

  return newAnalysis;
}

function clearAnalyses() {
  analyses.length = 0;
}

module.exports = {
  getAllAnalyses,
  createAnalysis,
  clearAnalyses
};