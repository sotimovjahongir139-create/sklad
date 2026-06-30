const prisma = require('../config/database');
const { success, created, notFound, badRequest } = require('../utils/response');
const { parsePagination, buildPagination } = require('../utils/pagination');
const inboundService = require('../services/inbound.service');

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { status, search } = req.query;
    const where = {
      ...(status && { status }),
      ...(search && { OR: [{ orderNumber: { contains: search, mode: 'insensitive' } }, { supplier: { contains: search, mode: 'insensitive' } }] }),
    };
    const [total, data] = await Promise.all([
      prisma.inboundOrder.count({ where }),
      prisma.inboundOrder.findMany({ where, include: { createdBy: { select: { id: true, name: true } }, items: { include: { model: { select: { id: true, sku: true, name: true } } } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ]);
    res.json({ success: true, data, pagination: buildPagination(total, page, limit) });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const order = await prisma.inboundOrder.findUnique({ where: { id: req.params.id }, include: { createdBy: { select: { id: true, name: true } }, items: { include: { model: true } }, movements: { include: { toLocation: true } } } });
    if (!order) return notFound(res);
    success(res, order);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const order = await inboundService.createOrder({ ...req.body, createdById: req.user.id });
    created(res, order);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const order = await inboundService.updateOrder(req.params.id, req.body);
    success(res, order);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await inboundService.deleteOrder(req.params.id);
    success(res, null, 'Order deleted');
  } catch (err) { next(err); }
};

const receive = async (req, res, next) => {
  try {
    const order = await inboundService.receiveOrder(req.params.id, req.body, req.user.id);
    success(res, order, 'Items received');
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const order = await inboundService.cancelOrder(req.params.id, req.user.id);
    success(res, order, 'Order cancelled');
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, remove, receive, cancel };
