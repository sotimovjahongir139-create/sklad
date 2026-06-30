const prisma = require('../config/database');
const { success, created } = require('../utils/response');
const warehouseService = require('../services/warehouse3d.service');

const listZones = async (req, res, next) => {
  try {
    const zones = await prisma.zone.findMany({ include: { locations: { select: { id: true, code: true, isActive: true } } }, orderBy: { code: 'asc' } });
    success(res, zones);
  } catch (err) { next(err); }
};

const createZone = async (req, res, next) => {
  try {
    const zone = await prisma.zone.create({ data: req.body });
    created(res, zone);
  } catch (err) { next(err); }
};

const updateZone = async (req, res, next) => {
  try {
    const zone = await prisma.zone.update({ where: { id: req.params.id }, data: req.body });
    success(res, zone);
  } catch (err) { next(err); }
};

const listLocations = async (req, res, next) => {
  try {
    const { zoneId, isActive } = req.query;
    const where = { ...(zoneId && { zoneId }), ...(isActive !== undefined && { isActive: isActive === 'true' }) };
    const locations = await prisma.location.findMany({ where, include: { zone: true, inventory: { include: { model: { select: { sku: true, name: true } } } } }, orderBy: { code: 'asc' } });
    success(res, locations);
  } catch (err) { next(err); }
};

const getLocation = async (req, res, next) => {
  try {
    const loc = await prisma.location.findUnique({ where: { id: req.params.id }, include: { zone: true, inventory: { include: { model: true } } } });
    if (!loc) return res.status(404).json({ success: false, message: 'Not found' });
    success(res, loc);
  } catch (err) { next(err); }
};

const createLocation = async (req, res, next) => {
  try {
    const loc = await prisma.location.create({ data: req.body });
    created(res, loc);
  } catch (err) { next(err); }
};

const updateLocation = async (req, res, next) => {
  try {
    const loc = await prisma.location.update({ where: { id: req.params.id }, data: req.body });
    success(res, loc);
  } catch (err) { next(err); }
};

const getWarehouseMap = async (req, res, next) => {
  try {
    const map = await warehouseService.buildWarehouseMap();
    success(res, map);
  } catch (err) { next(err); }
};

module.exports = { listZones, createZone, updateZone, listLocations, getLocation, createLocation, updateLocation, getWarehouseMap };
