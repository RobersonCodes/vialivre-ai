const express = require("express");
const cors = require("cors");

const analysisRoutes = require("./routes/analysisRoutes");
const errorHandler = require("./middlewares/errorHandler");
const notFoundHandler = require("./middlewares/notFoundHandler");

require("./database/init");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: "ViaLivre AI API",
      version: "1.0.0",
      status: "online"
    }
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API saudável",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

app.use("/api/v1", analysisRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;