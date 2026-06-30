const prisma = require('../config/database');

const buildWarehouseMap = async () => {
  const zones = await prisma.zone.findMany({
    where: { isActive: true },
    include: {
      locations: {
        where: { isActive: true },
        include: {
          inventory: {
            where: { quantity: { gt: 0 } },
            include: { model: { select: { sku: true, name: true, category: true } } },
          },
        },
      },
    },
    orderBy: { code: 'asc' },
  });

  return zones.map((zone, zoneIdx) => ({
    id: zone.id,
    code: zone.code,
    name: zone.name,
    type: zone.type,
    position: { x: zoneIdx * 12, y: 0, z: 0 },
    locations: zone.locations.map((loc, locIdx) => {
      const totalQty = loc.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      const capacity = loc.capacity || 100;
      const occupancy = Math.min(1, totalQty / capacity);

      return {
        id: loc.id,
        code: loc.code,
        aisle: loc.aisle,
        shelf: loc.shelf,
        bin: loc.bin,
        capacity,
        totalQty,
        occupancy,
        position: { x: locIdx % 4 * 3, y: Math.floor(locIdx / 4) * 3, z: 0 },
        items: loc.inventory.map((inv) => ({ modelId: inv.modelId, sku: inv.model.sku, name: inv.model.name, quantity: inv.quantity })),
      };
    }),
  }));
};

module.exports = { buildWarehouseMap };
