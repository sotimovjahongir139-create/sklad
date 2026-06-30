const { success } = require('../utils/response');
const analyticsService = require('../services/analytics.service');
const forecastService = require('../services/forecast.service');

const inventoryTrend = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getInventoryTrend(days);
    success(res, data);
  } catch (err) { next(err); }
};

const movementVolume = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getMovementVolume(days);
    success(res, data);
  } catch (err) { next(err); }
};

const turnover = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getTurnover(days);
    success(res, data);
  } catch (err) { next(err); }
};

const deadstock = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const data = await analyticsService.getDeadstock(days);
    success(res, data);
  } catch (err) { next(err); }
};

const forecast = async (req, res, next) => {
  try {
    const periods = parseInt(req.query.periods) || 7;
    const data = await forecastService.forecastDemand(req.params.modelId, periods);
    success(res, data);
  } catch (err) { next(err); }
};

const categoryBreakdown = async (req, res, next) => {
  try {
    const data = await analyticsService.getCategoryBreakdown();
    success(res, data);
  } catch (err) { next(err); }
};

module.exports = { inventoryTrend, movementVolume, turnover, deadstock, forecast, categoryBreakdown };
