const prisma = require('../config/database');

const createMovement = async ({ type, modelId, fromLocationId, toLocationId, quantity, performedById, notes, inboundId, outboundId }) => {
  return prisma.movement.create({
    data: { type, modelId, fromLocationId, toLocationId, quantity, performedById, notes, inboundId, outboundId },
  });
};

const transferStock = async ({ modelId, fromLocationId, toLocationId, quantity, performedById, notes }) => {
  return prisma.$transaction(async (tx) => {
    const source = await tx.inventory.findUnique({ where: { modelId_locationId: { modelId, locationId: fromLocationId } } });
    if (!source || source.quantity < quantity) throw Object.assign(new Error('Insufficient stock at source location'), { statusCode: 400 });

    await tx.inventory.update({
      where: { modelId_locationId: { modelId, locationId: fromLocationId } },
      data: { quantity: { decrement: quantity } },
    });

    await tx.inventory.upsert({
      where: { modelId_locationId: { modelId, locationId: toLocationId } },
      update: { quantity: { increment: quantity } },
      create: { modelId, locationId: toLocationId, quantity },
    });

    return tx.movement.create({
      data: { type: 'TRANSFER', modelId, fromLocationId, toLocationId, quantity, performedById, notes },
    });
  });
};

const receiveStock = async ({ modelId, locationId, quantity, performedById, inboundId }, tx = prisma) => {
  await tx.inventory.upsert({
    where: { modelId_locationId: { modelId, locationId } },
    update: { quantity: { increment: quantity } },
    create: { modelId, locationId, quantity },
  });
  return tx.movement.create({
    data: { type: 'INBOUND', modelId, toLocationId: locationId, quantity, performedById, inboundId },
  });
};

const dispatchStock = async ({ modelId, locationId, quantity, performedById, outboundId }, tx = prisma) => {
  const inv = await tx.inventory.findUnique({ where: { modelId_locationId: { modelId, locationId } } });
  if (!inv || inv.quantity < quantity) throw Object.assign(new Error('Insufficient stock'), { statusCode: 400 });

  await tx.inventory.update({
    where: { modelId_locationId: { modelId, locationId } },
    data: { quantity: { decrement: quantity } },
  });

  return tx.movement.create({
    data: { type: 'OUTBOUND', modelId, fromLocationId: locationId, quantity, performedById, outboundId },
  });
};

module.exports = { createMovement, transferStock, receiveStock, dispatchStock };
