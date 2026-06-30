const { success, badRequest } = require('../utils/response');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { createMovement, transferStock } = require('../services/movement.service');
const prisma = require('../config/database');

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { type, modelId, locationId } = req.query;

    const where = {
      ...(type && { type }),
      ...(modelId && { modelId }),
      ...(locationId && { OR: [{ fromLocationId: locationId }, { toLocationId: locationId }] }),
    };

    const [total, data] = await Promise.all([
      prisma.movement.count({ where }),
      prisma.movement.findMany({ where, include: { model: { select: { id: true, sku: true, name: true } }, fromLocation: true, toLocation: true, performedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ]);

    res.json({ success: true, data, pagination: buildPagination(total, page, limit) });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const m = await prisma.movement.findUnique({ where: { id: req.params.id }, include: { model: true, fromLocation: { include: { zone: true } }, toLocation: { include: { zone: true } }, performedBy: { select: { id: true, name: true } }, inbound: true, outbound: true } });
    if (!m) return res.status(404).json({ success: false, message: 'Not found' });
    success(res, m);
  } catch (err) { next(err); }
};

const transfer = async (req, res, next) => {
  try {
    const { modelId, fromLocationId, toLocationId, quantity, notes } = req.body;
    if (!modelId || !fromLocationId || !toLocationId || !quantity) return badRequest(res, 'modelId, fromLocationId, toLocationId, quantity required');
    if (fromLocationId === toLocationId) return badRequest(res, 'Source and destination cannot be the same');
    const movement = await transferStock({ modelId, fromLocationId, toLocationId, quantity, performedById: req.user.id, notes });
    success(res, movement, 'Transfer complete');
  } catch (err) { next(err); }
};

const adjust = async (req, res, next) => {
  try {
    const { modelId, locationId, quantity, notes } = req.body;
    if (!modelId || !locationId || quantity === undefined) return badRequest(res, 'modelId, locationId, quantity required');
    const movement = await createMovement({ type: 'ADJUSTMENT', modelId, toLocationId: locationId, quantity, performedById: req.user.id, notes });
    success(res, movement, 'Adjustment recorded');
  } catch (err) { next(err); }
};

module.exports = { list, getById, transfer, adjust };
