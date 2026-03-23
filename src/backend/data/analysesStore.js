const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "analyses.json");

function ensureFile() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf-8");
  }
}

function getAll() {
  ensureFile();
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function insert(item) {
  const items = getAll();
  items.unshift(item);
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf-8");
  return item;
}

function clear() {
  fs.writeFileSync(filePath, "[]", "utf-8");
}

module.exports = {
  getAll,
  insert,
  clear
};