const prisma = require('../config/database');
const { success, badRequest } = require('../utils/response');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { createMovement } = require('../services/movement.service');
const { checkLowStock } = require('../services/notification.service');

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, locationId, zoneId, category } = req.query;

    const where = {
      quantity: { gt: 0 },
      ...(locationId && { locationId }),
      ...(zoneId && { location: { zoneId } }),
      ...(search && { model: { OR: [{ name: { contains: search, mode: 'insensitive' } }, { modelCode: { contains: search, mode: 'insensitive' } }] } }),
      ...(category && { model: { category } }),
    };

    const [total, data] = await Promise.all([
      prisma.inventory.count({ where }),
      prisma.inventory.findMany({ where, include: { model: true, location: { include: { zone: true } } }, orderBy: { updatedAt: 'desc' }, skip, take: limit }),
    ]);

    res.json({ success: true, data, pagination: buildPagination(total, page, limit) });
  } catch (err) { next(err); }
};

const summary = async (req, res, next) => {
  try {
    const [totalItems, totalValue, uniqueModels, uniqueLocations] = await Promise.all([
      prisma.inventory.aggregate({ _sum: { quantity: true } }),
      prisma.inventory.count({ where: { quantity: { gt: 0 } } }),
      prisma.inventory.groupBy({ by: ['modelId'], where: { quantity: { gt: 0 } }, _count: true }).then((r) => r.length),
      prisma.inventory.groupBy({ by: ['locationId'], where: { quantity: { gt: 0 } }, _count: true }).then((r) => r.length),
    ]);
    success(res, { totalQty: totalItems._sum.quantity || 0, occupiedSlots: totalValue, uniqueModels, uniqueLocations });
  } catch (err) { next(err); }
};

const lowStock = async (req, res, next) => {
  try {
    const models = await prisma.productModel.findMany({ where: { isActive: true, minStock: { gt: 0 } } });
    const results = [];
    for (const m of models) {
      const agg = await prisma.inventory.aggregate({ where: { modelId: m.id }, _sum: { quantity: true } });
      const total = agg._sum.quantity || 0;
      if (total <= m.minStock) results.push({ model: m, totalQty: total, minStock: m.minStock });
    }
    success(res, results);
  } catch (err) { next(err); }
};

const byLocation = async (req, res, next) => {
  try {
    const data = await prisma.inventory.findMany({ where: { locationId: req.params.locationId, quantity: { gt: 0 } }, include: { model: true } });
    success(res, data);
  } catch (err) { next(err); }
};

const byModel = async (req, res, next) => {
  try {
    const data = await prisma.inventory.findMany({ where: { modelId: req.params.modelId }, include: { location: { include: { zone: true } } } });
    success(res, data);
  } catch (err) { next(err); }
};

const adjust = async (req, res, next) => {
  try {
    const { modelId, locationId, quantity, notes } = req.body;
    if (!modelId || !locationId || quantity === undefined) return badRequest(res, 'modelId, locationId, quantity required');

    const inv = await prisma.inventory.findUnique({ where: { modelId_locationId: { modelId, locationId } } });
    const currentQty = inv?.quantity || 0;
    const diff = quantity - currentQty;

    if (quantity < 0) return badRequest(res, 'Quantity cannot be negative');

    await prisma.inventory.upsert({
      where: { modelId_locationId: { modelId, locationId } },
      update: { quantity },
      create: { modelId, locationId, quantity },
    });

    await createMovement({ type: 'ADJUSTMENT', modelId, toLocationId: diff > 0 ? locationId : null, fromLocationId: diff < 0 ? locationId : null, quantity: Math.abs(diff), performedById: req.user.id, notes });
    await checkLowStock(modelId);
    success(res, null, 'Inventory adjusted');
  } catch (err) { next(err); }
};

module.exports = { list, summary, lowStock, byLocation, byModel, adjust };
