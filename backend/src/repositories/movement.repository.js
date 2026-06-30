const prisma = require('../config/database');

const create = (data) => prisma.movement.create({ data });

const findByModel = (modelId, limit = 50) =>
  prisma.movement.findMany({ where: { modelId }, orderBy: { createdAt: 'desc' }, take: limit, include: { fromLocation: true, toLocation: true, performedBy: { select: { name: true } } } });

const findByLocation = (locationId, limit = 50) =>
  prisma.movement.findMany({ where: { OR: [{ fromLocationId: locationId }, { toLocationId: locationId }] }, orderBy: { createdAt: 'desc' }, take: limit });

const getVolumeByType = (from, to) =>
  prisma.movement.groupBy({ by: ['type'], where: { createdAt: { gte: from, lte: to } }, _sum: { quantity: true }, _count: { id: true } });

module.exports = { create, findByModel, findByLocation, getVolumeByType };
