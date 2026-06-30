const cron = require('node-cron');
const { emitToAll } = require('../config/socket');
const prisma = require('../config/database');
const logger = require('../utils/logger');

const broadcastStats = async () => {
  try {
    const [totalQty, pendingInbound, pendingOutbound] = await Promise.all([
      prisma.inventory.aggregate({ _sum: { quantity: true } }),
      prisma.inboundOrder.count({ where: { status: { in: ['PENDING', 'IN_TRANSIT', 'RECEIVING'] } } }),
      prisma.outboundOrder.count({ where: { status: { in: ['PENDING', 'PICKING', 'PACKING'] } } }),
    ]);

    emitToAll('dashboard:stats', { totalQty: totalQty._sum.quantity || 0, pendingInbound, pendingOutbound, ts: new Date().toISOString() });
  } catch (err) {
    logger.error('Analytics broadcast job failed:', err);
  }
};

module.exports = cron.schedule('*/5 * * * *', broadcastStats, { scheduled: false });
