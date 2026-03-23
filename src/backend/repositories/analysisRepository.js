const db = require("../database/db");

const SELECT_RECENT_ANALYSES = `
  SELECT *
  FROM analises
  ORDER BY id DESC
  LIMIT 20
`;

const INSERT_ANALYSIS = `
  INSERT INTO analises (
    origem,
    destino,
    horario,
    clima,
    transporte,
    distanciaKm,
    tempoBase,
    trafego,
    mensagem,
    risco,
    chanceLeve,
    classificacaoIA,
    melhorHorario
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const DELETE_ALL_ANALYSES = `
  DELETE FROM analises
`;

function getAllAnalyses() {
  return new Promise((resolve, reject) => {
    db.all(SELECT_RECENT_ANALYSES, [], (error, rows) => {
      if (error) return reject(error);
      return resolve(rows);
    });
  });
}

function createAnalysis(data) {
  const values = [
    data.origem,
    data.destino,
    data.horario,
    data.clima,
    data.transporte,
    data.distanciaKm ?? null,
    data.tempoBase,
    data.trafego,
    data.mensagem,
    data.risco,
    data.chanceLeve,
    data.classificacaoIA,
    data.melhorHorario
  ];

  return new Promise((resolve, reject) => {
    db.run(INSERT_ANALYSIS, values, function (error) {
      if (error) return reject(error);

      return resolve({
        id: this.lastID,
        ...data
      });
    });
  });
}

function clearAnalyses() {
  return new Promise((resolve, reject) => {
    db.run(DELETE_ALL_ANALYSES, [], function (error) {
      if (error) return reject(error);

      return resolve({
        deletedRows: this.changes
      });
    });
  });
}

module.exports = {
  getAllAnalyses,
  createAnalysis,
  clearAnalyses
};