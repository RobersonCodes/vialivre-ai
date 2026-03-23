const express = require("express");
const router = express.Router();

const {
  getAnalyses,
  getStats,
  createAnalysis,
  clearAnalyses
} = require("../controllers/analysisController");

router.get("/", getAnalyses);
router.get("/stats", getStats);
router.post("/", createAnalysis);
router.delete("/", clearAnalyses);

module.exports = router;