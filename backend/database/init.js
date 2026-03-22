const db = require("./db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS analises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origem TEXT NOT NULL,
      destino TEXT NOT NULL,
      horario TEXT NOT NULL,
      clima TEXT,
      transporte TEXT,
      distanciaKm TEXT,
      tempoBase INTEGER,
      trafego TEXT,
      mensagem TEXT,
      risco INTEGER,
      chanceLeve INTEGER,
      classificacaoIA TEXT,
      melhorHorario TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("Erro ao criar tabela:", err.message);
    } else {
      console.log("Tabela analises pronta.");
    }
  });
});