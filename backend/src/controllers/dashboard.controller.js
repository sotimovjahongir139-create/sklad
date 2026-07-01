const prisma = require('../config/database');
const { success } = require('../utils/response');

const stats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalInventoryQty, totalModels, inboundPending, outboundPending, todayMovements, lowStockCount] = await Promise.all([
      prisma.inventory.aggregate({ _sum: { quantity: true } }),
      prisma.productModel.count({ where: { isActive: true } }),
      prisma.inboundOrder.count({ where: { status: { in: ['PENDING', 'IN_TRANSIT', 'RECEIVING'] } } }),
      prisma.outboundOrder.count({ where: { status: { in: ['PENDING', 'PICKING', 'PACKING'] } } }),
      prisma.movement.count({ where: { createdAt: { gte: today } } }),
      (async () => {
        const models = await prisma.productModel.findMany({ where: { isActive: true, minStock: { gt: 0 } } });
        let count = 0;
        for (const m of models) {
          const agg = await prisma.inventory.aggregate({ where: { modelId: m.id }, _sum: { quantity: true } });
          if ((agg._sum.quantity || 0) <= m.minStock) count++;
        }
        return count;
      })(),
    ]);

    success(res, {
      totalInventoryQty: totalInventoryQty._sum.quantity || 0,
      totalModels,
      inboundPending,
      outboundPending,
      todayMovements,
      lowStockCount,
    });
  } catch (err) { next(err); }
};

const recentActivity = async (req, res, next) => {
  try {
    const movements = await prisma.movement.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { model: { select: { modelCode: true, name: true } }, performedBy: { select: { name: true } }, fromLocation: { select: { code: true } }, toLocation: { select: { code: true } } } });
    success(res, movements);
  } catch (err) { next(err); }
};

const alerts = async (req, res, next) => {
  try {
    const models = await prisma.productModel.findMany({ where: { isActive: true, minStock: { gt: 0 } } });
    const alerts = [];
    for (const m of models) {
      const agg = await prisma.inventory.aggregate({ where: { modelId: m.id }, _sum: { quantity: true } });
      const qty = agg._sum.quantity || 0;
      if (qty <= m.minStock) {
        alerts.push({ type: 'LOW_STOCK', severity: qty === 0 ? 'critical' : 'warning', model: { id: m.id, modelCode: m.modelCode, name: m.name }, currentQty: qty, minStock: m.minStock });
      }
    }
    success(res, alerts);
  } catch (err) { next(err); }
};

module.exports = { stats, recentActivity, alerts };
