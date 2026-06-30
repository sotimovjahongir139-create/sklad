const prisma = require('../config/database');
const { success, created, notFound, badRequest } = require('../utils/response');
const { parsePagination, buildPagination, parseSorting } = require('../utils/pagination');

const ALLOWED_SORT = ['name', 'sku', 'category', 'createdAt'];

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const orderBy = parseSorting(req.query, ALLOWED_SORT);
    const { search, category, isActive } = req.query;

    const where = {
      ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] }),
      ...(category && { category }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const [total, data] = await Promise.all([
      prisma.productModel.count({ where }),
      prisma.productModel.findMany({ where, orderBy, skip, take: limit }),
    ]);

    res.json({ success: true, data, pagination: buildPagination(total, page, limit) });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const model = await prisma.productModel.findUnique({ where: { id: req.params.id }, include: { inventory: { include: { location: { include: { zone: true } } } } } });
    if (!model) return notFound(res);
    success(res, model);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { sku, name, description, category, unit, minStock, maxStock, weight, dimensions } = req.body;
    if (!sku || !name) return badRequest(res, 'SKU and name required');
    const model = await prisma.productModel.create({ data: { sku, name, description, category, unit, minStock: minStock || 0, maxStock, weight, dimensions } });
    created(res, model);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { sku, name, description, category, unit, minStock, maxStock, weight, dimensions, isActive } = req.body;
    const model = await prisma.productModel.update({ where: { id: req.params.id }, data: { sku, name, description, category, unit, minStock, maxStock, weight, dimensions, isActive } });
    success(res, model);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const inv = await prisma.inventory.findFirst({ where: { modelId: req.params.id, quantity: { gt: 0 } } });
    if (inv) return badRequest(res, 'Cannot delete model with inventory');
    await prisma.productModel.update({ where: { id: req.params.id }, data: { isActive: false } });
    success(res, null, 'Model deactivated');
  } catch (err) { next(err); }
};

const getInventory = async (req, res, next) => {
  try {
    const data = await prisma.inventory.findMany({ where: { modelId: req.params.id }, include: { location: { include: { zone: true } } } });
    success(res, data);
  } catch (err) { next(err); }
};

const getMovements = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [total, data] = await Promise.all([
      prisma.movement.count({ where: { modelId: req.params.id } }),
      prisma.movement.findMany({ where: { modelId: req.params.id }, include: { fromLocation: true, toLocation: true, performedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ]);
    res.json({ success: true, data, pagination: buildPagination(total, page, limit) });
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, remove, getInventory, getMovements };
