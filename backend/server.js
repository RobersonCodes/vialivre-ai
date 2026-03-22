const express = require("express");
const cors = require("cors");
const analysisRoutes = require("./routes/analysisRoutes");

require("./database/init");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API ViaLivre AI funcionando");
});

app.use("/api", analysisRoutes);

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});