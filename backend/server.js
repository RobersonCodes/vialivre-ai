const express = require("express");
const cors = require("cors");
const analysisRoutes = require("./routes/analysisRoutes");

require("./database/init");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    name: "ViaLivre AI API",
    version: "1.0.0",
    status: "online"
  });
});

app.use("/api", analysisRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada"
  });
});

app.use((err, req, res, next) => {
  console.error("Erro inesperado:", err);

  res.status(500).json({
    success: false,
    message: "Erro interno do servidor"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 ViaLivre AI rodando em http://localhost:${PORT}`);
});