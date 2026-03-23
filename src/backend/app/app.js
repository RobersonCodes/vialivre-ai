const express = require("express");
const cors = require("cors");
const analysisRoutes = require("../routes/analysisRoutes");
const errorHandler = require("../middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API ViaLivre AI online"
  });
});

app.use("/api/v1/analises", analysisRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada."
  });
});

app.use(errorHandler);

module.exports = app;