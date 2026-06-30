const prisma = require('../config/database');

const globalSearch = async (query, types = ['models', 'inbound', 'outbound', 'locations']) => {
  const results = {};
  const q = { contains: query, mode: 'insensitive' };

  if (types.includes('models')) {
    results.models = await prisma.productModel.findMany({
      where: { OR: [{ name: q }, { sku: q }, { category: q }], isActive: true },
      select: { id: true, sku: true, name: true, category: true },
      take: 10,
    });
  }

  if (types.includes('inbound')) {
    results.inbound = await prisma.inboundOrder.findMany({
      where: { OR: [{ orderNumber: q }, { supplier: q }] },
      select: { id: true, orderNumber: true, supplier: true, status: true, createdAt: true },
      take: 10,
    });
  }

  if (types.includes('outbound')) {
    results.outbound = await prisma.outboundOrder.findMany({
      where: { OR: [{ orderNumber: q }, { customer: q }] },
      select: { id: true, orderNumber: true, customer: true, status: true, priority: true, createdAt: true },
      take: 10,
    });
  }

  if (types.includes('locations')) {
    results.locations = await prisma.location.findMany({
      where: { code: q, isActive: true },
      include: { zone: { select: { code: true, name: true } } },
      take: 10,
    });
  }

  return results;
};

module.exports = { globalSearch };
