const db = require("./db");

function runQuery(sql, successMessage) {
  db.run(sql, (error) => {
    if (error) {
      console.error("❌ Erro ao executar query:");
      console.error(error.message);
      return;
    }

    if (successMessage) {
      console.log(successMessage);
    }
  });
}

db.serialize(() => {
  runQuery(`
    CREATE TABLE IF NOT EXISTS analises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origem TEXT NOT NULL,
      destino TEXT NOT NULL,
      horario TEXT NOT NULL,
      clima TEXT NOT NULL,
      transporte TEXT NOT NULL,
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
  `, "✅ Tabela analises pronta.");

  runQuery(`
    CREATE INDEX IF NOT EXISTS idx_analises_createdAt
    ON analises(createdAt DESC)
  `);

  runQuery(`
    CREATE INDEX IF NOT EXISTS idx_analises_risco
    ON analises(risco)
  `);

  runQuery(`
    CREATE INDEX IF NOT EXISTS idx_analises_tempo
    ON analises(tempoBase)
  `);

  runQuery(`
    CREATE INDEX IF NOT EXISTS idx_analises_origem_destino
    ON analises(origem, destino)
  `);

  console.log("✅ Estrutura do banco inicializada com sucesso.");
});