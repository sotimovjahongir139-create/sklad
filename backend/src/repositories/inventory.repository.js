const prisma = require('../config/database');

const findByModelAndLocation = (modelId, locationId) =>
  prisma.inventory.findUnique({ where: { modelId_locationId: { modelId, locationId } } });

const getTotalByModel = async (modelId) => {
  const agg = await prisma.inventory.aggregate({ where: { modelId }, _sum: { quantity: true } });
  return agg._sum.quantity || 0;
};

const upsert = (modelId, locationId, quantity) =>
  prisma.inventory.upsert({
    where: { modelId_locationId: { modelId, locationId } },
    update: { quantity },
    create: { modelId, locationId, quantity },
  });

const increment = (modelId, locationId, qty) =>
  prisma.inventory.upsert({
    where: { modelId_locationId: { modelId, locationId } },
    update: { quantity: { increment: qty } },
    create: { modelId, locationId, quantity: qty },
  });

const decrement = async (modelId, locationId, qty, tx = prisma) => {
  const inv = await tx.inventory.findUnique({ where: { modelId_locationId: { modelId, locationId } } });
  if (!inv || inv.quantity < qty) throw Object.assign(new Error('Insufficient stock'), { statusCode: 400 });
  return tx.inventory.update({ where: { modelId_locationId: { modelId, locationId } }, data: { quantity: { decrement: qty } } });
};

module.exports = { findByModelAndLocation, getTotalByModel, upsert, increment, decrement };
