const { db } = require("./db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS analises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origem TEXT NOT NULL,
      destino TEXT NOT NULL,
      horario TEXT NOT NULL,
      clima TEXT,
      transporte TEXT,
      distanciaKm REAL,
      tempoBase INTEGER NOT NULL,
      trafego TEXT,
      mensagem TEXT,
      risco INTEGER,
      chanceLeve INTEGER,
      classificacaoIA TEXT,
      melhorHorario TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_analises_createdAt
    ON analises(createdAt DESC)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_analises_risco
    ON analises(risco)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_analises_tempo
    ON analises(tempoBase)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_analises_origem_destino
    ON analises(origem, destino)
  `);

  console.log("Tabela analises pronta e otimizada.");
});