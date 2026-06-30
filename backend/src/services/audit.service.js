const prisma = require('../config/database');

const auditLog = async (userId, action, resource, resourceId, before, after, ip) => {
  try {
    await prisma.auditLog.create({ data: { userId, action, resource, resourceId, before, after, ip } });
  } catch (err) {
    require('../utils/logger').error('Audit log failed:', err);
  }
};

module.exports = { auditLog };
