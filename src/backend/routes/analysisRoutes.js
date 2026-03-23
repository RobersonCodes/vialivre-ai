const express = require("express");

const analysisController = require("../controllers/analysisController");
const validateAnalysis = require("../middlewares/validateAnalysis");

const router = express.Router();

/*
 Base URL:
 /api/v1/analises
*/

router
  .route("/analises")

  .get(
    analysisController.getAnalyses
  )

  .post(
    validateAnalysis,
    analysisController.createAnalysis
  )

  .delete(
    analysisController.clearAnalyses
  );


router.get(
  "/analises/stats",
  analysisController.getStatistics
);

module.exports = router;