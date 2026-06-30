const prisma = require('../config/database');
const { subDays, startOfDay, format } = require('../utils/dateUtils');

const getInventoryTrend = async (days) => {
  const snapshots = await prisma.inventorySnapshot.findMany({
    where: { createdAt: { gte: subDays(new Date(), days) } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true, summary: true },
  });
  return snapshots.map((s) => ({ date: format(s.createdAt), ...(s.summary || {}) }));
};

const getMovementVolume = async (days) => {
  const from = subDays(new Date(), days);
  const movements = await prisma.movement.groupBy({
    by: ['type'],
    where: { createdAt: { gte: from } },
    _count: { id: true },
    _sum: { quantity: true },
  });
  return movements.map((m) => ({ type: m.type, count: m._count.id, totalQty: m._sum.quantity || 0 }));
};

const getTurnover = async (days) => {
  const from = subDays(new Date(), days);
  const outboundMovements = await prisma.movement.groupBy({
    by: ['modelId'],
    where: { type: 'OUTBOUND', createdAt: { gte: from } },
    _sum: { quantity: true },
  });

  const results = [];
  for (const m of outboundMovements) {
    const model = await prisma.productModel.findUnique({ where: { id: m.modelId }, select: { sku: true, name: true, category: true } });
    const inv = await prisma.inventory.aggregate({ where: { modelId: m.modelId }, _sum: { quantity: true } });
    const avgInventory = inv._sum.quantity || 1;
    const outQty = m._sum.quantity || 0;
    results.push({ model, outboundQty: outQty, avgInventory, turnoverRate: parseFloat((outQty / avgInventory).toFixed(3)) });
  }

  return results.sort((a, b) => b.turnoverRate - a.turnoverRate);
};

const getDeadstock = async (days) => {
  const cutoff = subDays(new Date(), days);
  const inventories = await prisma.inventory.findMany({ where: { quantity: { gt: 0 } }, include: { model: { select: { sku: true, name: true, category: true } }, location: { select: { code: true } } } });

  const results = [];
  for (const inv of inventories) {
    const lastMovement = await prisma.movement.findFirst({
      where: { modelId: inv.modelId, OR: [{ fromLocationId: inv.locationId }, { toLocationId: inv.locationId }] },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastMovement || lastMovement.createdAt < cutoff) {
      results.push({ model: inv.model, location: inv.location, quantity: inv.quantity, lastMovementAt: lastMovement?.createdAt || null, daysStagnant: lastMovement ? Math.floor((Date.now() - lastMovement.createdAt.getTime()) / 86400000) : days });
    }
  }

  return results.sort((a, b) => b.daysStagnant - a.daysStagnant);
};

const getCategoryBreakdown = async () => {
  const inventories = await prisma.inventory.findMany({
    where: { quantity: { gt: 0 } },
    include: { model: { select: { category: true } } },
  });

  const categories = {};
  for (const inv of inventories) {
    const cat = inv.model.category || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + inv.quantity;
  }

  return Object.entries(categories).map(([category, quantity]) => ({ category, quantity })).sort((a, b) => b.quantity - a.quantity);
};

module.exports = { getInventoryTrend, getMovementVolume, getTurnover, getDeadstock, getCategoryBreakdown };
