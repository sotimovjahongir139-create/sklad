const prisma = require('../config/database');
const { success } = require('../utils/response');
const { parsePagination, buildPagination } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { isRead } = req.query;
    const where = { userId: req.user.id, ...(isRead !== undefined && { isRead: isRead === 'true' }) };
    const [total, data] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ]);
    res.json({ success: true, data, pagination: buildPagination(total, page, limit) });
  } catch (err) { next(err); }
};

const unreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
    success(res, { count });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { isRead: true } });
    success(res, null, 'Marked as read');
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    success(res, null, 'All marked as read');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    success(res, null, 'Notification deleted');
  } catch (err) { next(err); }
};

module.exports = { list, unreadCount, markRead, markAllRead, remove };
