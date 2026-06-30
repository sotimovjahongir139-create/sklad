const prisma = require('../config/database');
const { receiveStock } = require('./movement.service');
const { checkLowStock, notifyInboundComplete } = require('./notification.service');
const { auditLog } = require('./audit.service');

const generateOrderNumber = () => `IN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const createOrder = async ({ supplier, items, expectedAt, notes, createdById }) => {
  if (!items?.length) throw Object.assign(new Error('Order must have at least one item'), { statusCode: 400 });

  return prisma.inboundOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      supplier,
      expectedAt: expectedAt ? new Date(expectedAt) : null,
      notes,
      createdById,
      items: {
        create: items.map(({ modelId, expectedQty }) => ({ modelId, expectedQty })),
      },
    },
    include: { items: { include: { model: true } } },
  });
};

const updateOrder = async (id, { supplier, status, expectedAt, notes }) => {
  const order = await prisma.inboundOrder.findUnique({ where: { id } });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (['COMPLETED', 'CANCELLED'].includes(order.status)) throw Object.assign(new Error('Cannot modify completed/cancelled order'), { statusCode: 400 });

  return prisma.inboundOrder.update({
    where: { id },
    data: { supplier, status, expectedAt: expectedAt ? new Date(expectedAt) : undefined, notes },
  });
};

const deleteOrder = async (id) => {
  const order = await prisma.inboundOrder.findUnique({ where: { id } });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (order.status !== 'PENDING') throw Object.assign(new Error('Only pending orders can be deleted'), { statusCode: 400 });
  await prisma.inboundOrder.delete({ where: { id } });
};

const receiveOrder = async (id, { items }, performedById) => {
  if (!items?.length) throw Object.assign(new Error('No items provided'), { statusCode: 400 });

  return prisma.$transaction(async (tx) => {
    const order = await tx.inboundOrder.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    if (order.status === 'CANCELLED') throw Object.assign(new Error('Order is cancelled'), { statusCode: 400 });

    for (const { modelId, locationId, quantity } of items) {
      const orderItem = order.items.find((i) => i.modelId === modelId);
      if (!orderItem) throw Object.assign(new Error(`Model ${modelId} not in order`), { statusCode: 400 });

      await tx.inboundItem.update({
        where: { orderId_modelId: { orderId: id, modelId } },
        data: { receivedQty: { increment: quantity } },
      });

      await receiveStock({ modelId, locationId, quantity, performedById, inboundId: id }, tx);
    }

    const allItems = await tx.inboundItem.findMany({ where: { orderId: id } });
    const allReceived = allItems.every((i) => i.receivedQty >= i.expectedQty);

    const updated = await tx.inboundOrder.update({
      where: { id },
      data: { status: allReceived ? 'COMPLETED' : 'RECEIVING', ...(allReceived && { receivedAt: new Date() }) },
    });

    if (allReceived) {
      for (const item of allItems) await checkLowStock(item.modelId);
      await notifyInboundComplete(order, performedById);
    }

    return updated;
  });
};

const cancelOrder = async (id, performedById) => {
  const order = await prisma.inboundOrder.findUnique({ where: { id } });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (['COMPLETED', 'CANCELLED'].includes(order.status)) throw Object.assign(new Error('Cannot cancel this order'), { statusCode: 400 });
  return prisma.inboundOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
};

module.exports = { createOrder, updateOrder, deleteOrder, receiveOrder, cancelOrder };
