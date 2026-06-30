const prisma = require('../config/database');

const findBySku = (sku) => prisma.productModel.findUnique({ where: { sku } });
const findById = (id) => prisma.productModel.findUnique({ where: { id } });
const findActive = () => prisma.productModel.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

const findWithLowStock = async () => {
  const models = await prisma.productModel.findMany({ where: { isActive: true, minStock: { gt: 0 } } });
  const low = [];
  for (const m of models) {
    const agg = await prisma.inventory.aggregate({ where: { modelId: m.id }, _sum: { quantity: true } });
    if ((agg._sum.quantity || 0) <= m.minStock) low.push({ ...m, currentQty: agg._sum.quantity || 0 });
  }
  return low;
};

module.exports = { findBySku, findById, findActive, findWithLowStock };
