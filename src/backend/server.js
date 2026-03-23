const express = require("express");
const cors = require("cors");
const path = require("path");
const analysisRoutes = require("./routes/analysisRoutes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/* CAMINHO DO FRONTEND */
const rootDir = path.resolve(__dirname, "./frontend");

/* SERVE HTML, CSS e JS */
app.use(express.static(rootDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

/* API */
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API ViaLivre AI online"
  });
});

app.use("/api/v1/analises", analysisRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});