const db = require("../database/db");

function getAllAnalyses() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM analises ORDER BY id DESC LIMIT 20",
      [],
      (err, rows) => {
        if (err) {
          reject(err);
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
        melhorHorario
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.origem,
      data.destino,
      data.horario,
      data.clima,
      data.transporte,
      data.distanciaKm || null,
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
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          ...data
        });
      }
    });
  });
}

function clearAnalyses() {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM analises", [], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ message: "Histórico limpo com sucesso." });
      }
    });
  });
}

module.exports = {
  getAllAnalyses,
  createAnalysis,
  clearAnalyses
};