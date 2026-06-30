const { forbidden } = require('../utils/response');

const ROLE_HIERARCHY = { VIEWER: 0, OPERATOR: 1, MANAGER: 2, ADMIN: 3 };

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return forbidden(res);
  const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
  const required = Math.max(...roles.map((r) => ROLE_HIERARCHY[r] ?? 99));
  if (userLevel < required) return forbidden(res, 'Insufficient permissions');
  next();
};

const requireAdmin = requireRole('ADMIN');
const requireManager = requireRole('MANAGER');
const requireOperator = requireRole('OPERATOR');

module.exports = { requireRole, requireAdmin, requireManager, requireOperator };
