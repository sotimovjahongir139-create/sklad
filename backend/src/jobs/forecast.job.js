const cron = require('node-cron');
const prisma = require('../config/database');
const { forecastDemand } = require('../services/forecast.service');
const { notifyAllManagers } = require('../services/notification.service');
const logger = require('../utils/logger');

const runForecast = async () => {
  try {
    const models = await prisma.productModel.findMany({ where: { isActive: true, minStock: { gt: 0 } } });
    const alerts = [];

    for (const model of models) {
      const forecast = await forecastDemand(model.id, 7);
      if (forecast.daysOfStockRemaining !== null && forecast.daysOfStockRemaining < 14) {
        alerts.push({ modelCode: model.modelCode, name: model.name, daysRemaining: forecast.daysOfStockRemaining, currentStock: forecast.currentStock });
      }
    }

    if (alerts.length > 0) {
      await notifyAllManagers({
        type: 'LOW_STOCK',
        title: 'Reorder Alert',
        message: `${alerts.length} items projected to run out within 14 days`,
        data: { alerts },
      });
      logger.info(`Forecast job: ${alerts.length} reorder alerts`);
    }
  } catch (err) {
    logger.error('Forecast job failed:', err);
  }
};

module.exports = cron.schedule('0 9 * * 1-5', runForecast, { scheduled: false });
