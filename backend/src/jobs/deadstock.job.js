const cron = require('node-cron');
const { getDeadstock } = require('../services/analytics.service');
const { notifyAllManagers } = require('../services/notification.service');
const logger = require('../utils/logger');

const checkDeadstock = async () => {
  try {
    const deadstock = await getDeadstock(90);
    if (deadstock.length > 0) {
      await notifyAllManagers({
        type: 'SYSTEM',
        title: 'Deadstock Alert',
        message: `${deadstock.length} items have had no movement in 90+ days`,
        data: { count: deadstock.length, topItems: deadstock.slice(0, 5).map((d) => ({ sku: d.model.sku, daysStagnant: d.daysStagnant })) },
      });
      logger.info(`Deadstock check: ${deadstock.length} items flagged`);
    }
  } catch (err) {
    logger.error('Deadstock job failed:', err);
  }
};

module.exports = cron.schedule('0 8 * * 1', checkDeadstock, { scheduled: false });
