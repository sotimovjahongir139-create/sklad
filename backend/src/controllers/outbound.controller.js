const prisma = require('../config/database');
const { success, created, notFound } = require('../utils/response');
const { parsePagination, buildPagination } = require('../utils/pagination');
const outboundService = require('../services/outbound.service');

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { status, priority, search } = req.query;
    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && { OR: [{ orderNumber: { contains: search, mode: 'insensitive' } }, { customer: { contains: search, mode: 'insensitive' } }] }),
    };
    const [total, data] = await Promise.all([
      prisma.outboundOrder.count({ where }),
      prisma.outboundOrder.findMany({ where, include: { createdBy: { select: { id: true, name: true } }, items: { include: { model: { select: { id: true, modelCode: true, name: true } } } } }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }], skip, take: limit }),
    ]);
    res.json({ success: true, data, pagination: buildPagination(total, page, limit) });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id }, include: { createdBy: { select: { id: true, name: true } }, items: { include: { model: true } }, movements: { include: { fromLocation: true } } } });
    if (!order) return notFound(res);
    success(res, order);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const order = await outboundService.createOrder({ ...req.body, createdById: req.user.id });
    created(res, order);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const order = await outboundService.updateOrder(req.params.id, req.body);
    success(res, order);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await outboundService.deleteOrder(req.params.id);
    success(res, null, 'Order deleted');
  } catch (err) { next(err); }
};

const pick = async (req, res, next) => {
  try {
    const order = await outboundService.pickOrder(req.params.id, req.body, req.user.id);
    success(res, order, 'Items picked');
  } catch (err) { next(err); }
};

const ship = async (req, res, next) => {
  try {
    const order = await outboundService.shipOrder(req.params.id, req.user.id);
    success(res, order, 'Order shipped');
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const order = await outboundService.cancelOrder(req.params.id, req.user.id);
    success(res, order, 'Order cancelled');
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, remove, pick, ship, cancel };
