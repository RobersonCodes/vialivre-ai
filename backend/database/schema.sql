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
);