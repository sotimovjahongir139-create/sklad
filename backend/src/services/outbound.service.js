const prisma = require('../config/database');
const { dispatchStock } = require('./movement.service');
const { notifyOutboundShipped } = require('./notification.service');

const generateOrderNumber = () => `OUT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const createOrder = async ({ customer, priority, items, requestedAt, notes, createdById }) => {
  if (!items?.length) throw Object.assign(new Error('Order must have at least one item'), { statusCode: 400 });

  return prisma.outboundOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      customer,
      priority: priority || 'NORMAL',
      requestedAt: requestedAt ? new Date(requestedAt) : null,
      notes,
      createdById,
      items: { create: items.map(({ modelId, requestedQty }) => ({ modelId, requestedQty })) },
    },
    include: { items: { include: { model: true } } },
  });
};

const updateOrder = async (id, { customer, priority, requestedAt, notes }) => {
  const order = await prisma.outboundOrder.findUnique({ where: { id } });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (['SHIPPED', 'CANCELLED'].includes(order.status)) throw Object.assign(new Error('Cannot modify shipped/cancelled order'), { statusCode: 400 });
  return prisma.outboundOrder.update({ where: { id }, data: { customer, priority, requestedAt: requestedAt ? new Date(requestedAt) : undefined, notes } });
};

const deleteOrder = async (id) => {
  const order = await prisma.outboundOrder.findUnique({ where: { id } });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (order.status !== 'PENDING') throw Object.assign(new Error('Only pending orders can be deleted'), { statusCode: 400 });
  await prisma.outboundOrder.delete({ where: { id } });
};

const pickOrder = async (id, { items }, performedById) => {
  if (!items?.length) throw Object.assign(new Error('No items provided'), { statusCode: 400 });

  return prisma.$transaction(async (tx) => {
    const order = await tx.outboundOrder.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    if (['SHIPPED', 'CANCELLED'].includes(order.status)) throw Object.assign(new Error('Cannot pick this order'), { statusCode: 400 });

    for (const { modelId, locationId, quantity } of items) {
      const orderItem = order.items.find((i) => i.modelId === modelId);
      if (!orderItem) throw Object.assign(new Error(`Model ${modelId} not in order`), { statusCode: 400 });

      await tx.outboundItem.update({
        where: { orderId_modelId: { orderId: id, modelId } },
        data: { pickedQty: { increment: quantity } },
      });

      await dispatchStock({ modelId, locationId, quantity, performedById, outboundId: id }, tx);
    }

    const allItems = await tx.outboundItem.findMany({ where: { orderId: id } });
    const allPicked = allItems.every((i) => i.pickedQty >= i.requestedQty);

    return tx.outboundOrder.update({ where: { id }, data: { status: allPicked ? 'PACKING' : 'PICKING' } });
  });
};

const shipOrder = async (id, performedById) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.outboundOrder.findUnique({ where: { id } });
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    if (!['PICKING', 'PACKING'].includes(order.status)) throw Object.assign(new Error('Order must be picked before shipping'), { statusCode: 400 });

    const updated = await tx.outboundOrder.update({ where: { id }, data: { status: 'SHIPPED', shippedAt: new Date() } });
    await notifyOutboundShipped(order, performedById);
    return updated;
  });
};

const cancelOrder = async (id, performedById) => {
  const order = await prisma.outboundOrder.findUnique({ where: { id } });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (['SHIPPED', 'CANCELLED'].includes(order.status)) throw Object.assign(new Error('Cannot cancel this order'), { statusCode: 400 });
  return prisma.outboundOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
};

module.exports = { createOrder, updateOrder, deleteOrder, pickOrder, shipOrder, cancelOrder };
