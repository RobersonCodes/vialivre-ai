CREATE TABLE IF NOT EXISTS analises (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  origem TEXT NOT NULL,

  destino TEXT NOT NULL,

  horario TEXT NOT NULL,

  clima TEXT NOT NULL,

  transporte TEXT NOT NULL,

  distanciaKm REAL,

  tempoBase INTEGER NOT NULL,

  trafego TEXT NOT NULL,

  mensagem TEXT NOT NULL,

  risco INTEGER NOT NULL CHECK (risco >= 0 AND risco <= 100),

  chanceLeve INTEGER CHECK (chanceLeve >= 0 AND chanceLeve <= 100),

  classificacaoIA TEXT,

  melhorHorario TEXT,

  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

);