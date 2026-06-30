const snapshotJob = require('./snapshot.job');
const forecastJob = require('./forecast.job');
const deadstockJob = require('./deadstock.job');
const analyticsJob = require('./analytics.job');
const logger = require('../utils/logger');

const initJobs = () => {
  snapshotJob.start();
  forecastJob.start();
  deadstockJob.start();
  analyticsJob.start();
  logger.info('Background jobs started');
};

module.exports = { initJobs };
