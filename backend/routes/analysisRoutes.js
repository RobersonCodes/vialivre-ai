const express = require("express");
const router = express.Router();

const controller = require("../controllers/analysisController");

router.get("/analises", controller.getAnalyses);
router.post("/analises", controller.createAnalysis);
router.delete("/analises", controller.clearAnalyses);

module.exports = router;