const prisma = require('../config/database');

const saveSnapshot = (data, summary) =>
  prisma.inventorySnapshot.create({ data: { data, summary } });

const getSnapshots = (from, to) =>
  prisma.inventorySnapshot.findMany({ where: { createdAt: { gte: from, lte: to } }, orderBy: { createdAt: 'asc' } });

const getLatestSnapshot = () =>
  prisma.inventorySnapshot.findFirst({ orderBy: { createdAt: 'desc' } });

module.exports = { saveSnapshot, getSnapshots, getLatestSnapshot };
