const { verifyAccess } = require('../config/jwt');
const { unauthorized } = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return unauthorized(res);

  const token = authHeader.slice(7);
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    unauthorized(res, 'Token invalid or expired');
  }
};

module.exports = { authenticate };
