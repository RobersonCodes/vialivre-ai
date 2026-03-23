const levels = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
  debug: "DEBUG"
};

function log(level, message, meta = null) {
  const timestamp = new Date().toISOString();

  const baseLog = {
    timestamp,
    level,
    message
  };

  const output = meta
    ? { ...baseLog, meta }
    : baseLog;

  console.log(JSON.stringify(output));
}

module.exports = {
  info: (msg, meta) => log(levels.info, msg, meta),
  warn: (msg, meta) => log(levels.warn, msg, meta),
  error: (msg, meta) => log(levels.error, msg, meta),
  debug: (msg, meta) => log(levels.debug, msg, meta)
};