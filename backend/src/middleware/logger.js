const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms — ${req.ip}`);
  });
  next();
};

module.exports = { requestLogger };
