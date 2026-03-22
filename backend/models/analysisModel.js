const { db } = require("../database/db");

function getAllAnalyses(limit = 20) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT
        id,
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
        melhorHorario,
        createdAt
      FROM analises
      ORDER BY id DESC
      LIMIT ?
      `,
      [limit],
      (err, rows) => {
        if (err) {
          reject({
            message: "Erro ao buscar análises",
            error: err.message
          });
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function createAnalysis(data) {
  return new Promise((resolve, reject) => {
    const sql = `
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
        melhorHorario,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

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

    db.run(sql, values, function (err) {
      if (err) {
        reject({
          message: "Erro ao salvar análise",
          error: err.message
        });
      } else {
        resolve({
          id: this.lastID,
          ...data,
          createdAt: new Date().toISOString()
        });
      }
    });
  });
}

function clearAnalyses() {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM analises", [], function (err) {
      if (err) {
        reject({
          message: "Erro ao limpar histórico",
          error: err.message
        });
      } else {
        resolve({
          deletedRows: this.changes,
          message: "Histórico removido com sucesso."
        });
      }
    });
  });
}

function getStats() {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT
        COUNT(*) as totalAnalises,
        AVG(tempoBase) as tempoMedio,
        AVG(risco) as riscoMedio
      FROM analises
      `,
      [],
      (err, row) => {
        if (err) {
          reject({
            message: "Erro ao buscar estatísticas",
            error: err.message
          });
        } else {
          resolve({
            total: row?.totalAnalises || 0,
            tempoMedio: Math.round(row?.tempoMedio || 0),
            riscoMedio: Math.round(row?.riscoMedio || 0)
          });
        }
      }
    );
  });
}

module.exports = {
  getAllAnalyses,
  createAnalysis,
  clearAnalyses,
  getStats
};