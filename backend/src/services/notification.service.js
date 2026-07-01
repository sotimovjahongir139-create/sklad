const prisma = require('../config/database');
const { emitToUser, emitToRole } = require('../config/socket');

const createNotification = async ({ userId, type, title, message, data }) => {
  const notification = await prisma.notification.create({ data: { userId, type, title, message, data } });
  try { emitToUser(userId, 'notification', notification); } catch {}
  return notification;
};

const notifyAllManagers = async ({ type, title, message, data }) => {
  const managers = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true } });
  const notifications = await Promise.all(managers.map((u) => createNotification({ userId: u.id, type, title, message, data })));
  try { emitToRole('MANAGER', 'notification', { type, title, message }); } catch {}
  return notifications;
};

const checkLowStock = async (modelId) => {
  const model = await prisma.productModel.findUnique({ where: { id: modelId } });
  if (!model || model.minStock === 0) return;

  const agg = await prisma.inventory.aggregate({ where: { modelId }, _sum: { quantity: true } });
  const totalQty = agg._sum.quantity || 0;

  if (totalQty <= model.minStock) {
    await notifyAllManagers({
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `${model.name} (${model.modelCode}) has ${totalQty} units remaining (min: ${model.minStock})`,
      data: { modelId, modelCode: model.modelCode, currentQty: totalQty, minStock: model.minStock },
    });
  }
};

const notifyInboundComplete = async (order, performedById) => {
  const managers = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true } });
  await Promise.all(managers.map((u) =>
    createNotification({
      userId: u.id,
      type: 'INBOUND_RECEIVED',
      title: 'Inbound Order Complete',
      message: `Order ${order.orderNumber}${order.supplier ? ` from ${order.supplier}` : ''} has been fully received`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    })
  ));
};

const notifyOutboundShipped = async (order, performedById) => {
  const managers = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true } });
  await Promise.all(managers.map((u) =>
    createNotification({
      userId: u.id,
      type: 'OUTBOUND_SHIPPED',
      title: 'Outbound Order Shipped',
      message: `Order ${order.orderNumber}${order.customer ? ` for ${order.customer}` : ''} has been shipped`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    })
  ));
};

module.exports = { createNotification, notifyAllManagers, checkLowStock, notifyInboundComplete, notifyOutboundShipped };
