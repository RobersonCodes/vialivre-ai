const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH =
  process.env.DB_PATH ||
  path.join(__dirname, "vialivre.db");

const db = new sqlite3.Database(
  DB_PATH,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (error) => {

    if (error) {

      console.error("❌ erro ao conectar no banco SQLite");

      console.error(error.message);

      process.exit(1);

    }

    console.log("✅ SQLite conectado");
  }
);


/*
 configuração de performance e segurança
*/

db.serialize(() => {

  db.run("PRAGMA foreign_keys = ON");

  db.run("PRAGMA journal_mode = WAL");

  db.run("PRAGMA synchronous = NORMAL");

  db.run("PRAGMA temp_store = MEMORY");

});


module.exports = db;