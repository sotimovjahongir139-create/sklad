const prisma = require('../config/database');
const { subDays, format } = require('../utils/dateUtils');

const forecastDemand = async (modelId, periods = 7) => {
  const model = await prisma.productModel.findUnique({ where: { id: modelId } });
  if (!model) throw Object.assign(new Error('Model not found'), { statusCode: 404 });

  const historicalDays = Math.max(periods * 4, 30);
  const movements = await prisma.movement.findMany({
    where: { modelId, type: 'OUTBOUND', createdAt: { gte: subDays(new Date(), historicalDays) } },
    orderBy: { createdAt: 'asc' },
    select: { quantity: true, createdAt: true },
  });

  const byDay = {};
  for (const m of movements) {
    const day = format(m.createdAt);
    byDay[day] = (byDay[day] || 0) + m.quantity;
  }

  const dailyDemand = Object.values(byDay);
  if (dailyDemand.length === 0) {
    return { model: { id: model.id, sku: model.sku, name: model.name }, historicalAvgDaily: 0, forecast: [] };
  }

  const avg = dailyDemand.reduce((a, b) => a + b, 0) / dailyDemand.length;
  const variance = dailyDemand.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / dailyDemand.length;
  const stdDev = Math.sqrt(variance);

  const forecast = [];
  for (let i = 1; i <= periods; i++) {
    const date = format(subDays(new Date(), -i));
    forecast.push({ date, predicted: Math.round(avg), lower: Math.round(Math.max(0, avg - stdDev)), upper: Math.round(avg + stdDev) });
  }

  const currentStock = await prisma.inventory.aggregate({ where: { modelId }, _sum: { quantity: true } });
  const totalStock = currentStock._sum.quantity || 0;
  const daysOfStock = avg > 0 ? Math.floor(totalStock / avg) : null;

  return { model: { id: model.id, sku: model.sku, name: model.name }, historicalAvgDaily: parseFloat(avg.toFixed(2)), stdDev: parseFloat(stdDev.toFixed(2)), currentStock: totalStock, daysOfStockRemaining: daysOfStock, forecast };
};

module.exports = { forecastDemand };
