const express = require("express");

const analysisController = require("../controllers/analysisController");
const validateAnalysis = require("../middlewares/validateAnalysis");

const router = express.Router();

/*
  Base URL:
  /api/v1/analises
*/

router.get(
  "/analises",
  analysisController.getAnalyses
);

router.post(
  "/analises",
  validateAnalysis,
  analysisController.createAnalysis
);

router.delete(
  "/analises",
  analysisController.clearAnalyses
);

router.get(
  "/analises/stats",
  analysisController.getStatistics
);

module.exports = router;