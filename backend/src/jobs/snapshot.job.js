const cron = require('node-cron');
const prisma = require('../config/database');
const { saveSnapshot } = require('../repositories/analytics.repository');
const logger = require('../utils/logger');

const takeSnapshot = async () => {
  try {
    const inventories = await prisma.inventory.findMany({
      where: { quantity: { gt: 0 } },
      include: { model: { select: { modelCode: true, name: true, category: true } }, location: { select: { code: true } } },
    });

    const totalQty = inventories.reduce((sum, i) => sum + i.quantity, 0);
    const byCategory = inventories.reduce((acc, i) => {
      const cat = i.model.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + i.quantity;
      return acc;
    }, {});

    await saveSnapshot(inventories, { totalQty, byCategory, itemCount: inventories.length });
    logger.info(`Snapshot taken: ${inventories.length} items, ${totalQty} total qty`);
  } catch (err) {
    logger.error('Snapshot job failed:', err);
  }
};

module.exports = cron.schedule('0 23 * * *', takeSnapshot, { scheduled: false });
