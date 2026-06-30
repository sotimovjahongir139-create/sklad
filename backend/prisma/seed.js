const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('admin123', 12);
  const managerPass = await bcrypt.hash('manager123', 12);
  const operatorPass = await bcrypt.hash('operator123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sklad.local' },
    update: {},
    create: { email: 'admin@sklad.local', password: adminPass, name: 'Admin', role: 'ADMIN' },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@sklad.local' },
    update: {},
    create: { email: 'manager@sklad.local', password: managerPass, name: 'Manager', role: 'MANAGER' },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@sklad.local' },
    update: {},
    create: { email: 'operator@sklad.local', password: operatorPass, name: 'Operator', role: 'OPERATOR' },
  });

  const zones = await Promise.all([
    prisma.zone.upsert({ where: { code: 'RCV' }, update: {}, create: { code: 'RCV', name: 'Receiving', type: 'RECEIVING', capacity: 50 } }),
    prisma.zone.upsert({ where: { code: 'A' }, update: {}, create: { code: 'A', name: 'Zone A', type: 'STORAGE', capacity: 200 } }),
    prisma.zone.upsert({ where: { code: 'B' }, update: {}, create: { code: 'B', name: 'Zone B', type: 'STORAGE', capacity: 200 } }),
    prisma.zone.upsert({ where: { code: 'STG' }, update: {}, create: { code: 'STG', name: 'Staging', type: 'STAGING', capacity: 50 } }),
    prisma.zone.upsert({ where: { code: 'SHP' }, update: {}, create: { code: 'SHP', name: 'Shipping', type: 'SHIPPING', capacity: 30 } }),
  ]);

  const locationData = [];
  for (const aisle of ['A', 'B', 'C']) {
    for (const shelf of ['1', '2', '3', '4']) {
      for (const bin of ['L', 'R']) {
        locationData.push({ code: `A-${aisle}${shelf}${bin}`, zoneId: zones[1].id, aisle, shelf, bin, capacity: 100 });
        locationData.push({ code: `B-${aisle}${shelf}${bin}`, zoneId: zones[2].id, aisle, shelf, bin, capacity: 100 });
      }
    }
  }

  for (const loc of locationData) {
    await prisma.location.upsert({ where: { code: loc.code }, update: {}, create: loc });
  }

  const categories = ['Electronics', 'Furniture', 'Clothing', 'Food', 'Tools'];
  const models = [];
  for (let i = 1; i <= 20; i++) {
    const sku = `SKU-${String(i).padStart(4, '0')}`;
    const model = await prisma.productModel.upsert({
      where: { sku },
      update: {},
      create: {
        sku,
        name: `Product ${i}`,
        description: `Sample product ${i} description`,
        category: categories[i % categories.length],
        unit: i % 3 === 0 ? 'kg' : 'pcs',
        minStock: 10,
        maxStock: 500,
        weight: Math.round(Math.random() * 10 * 10) / 10,
      },
    });
    models.push(model);
  }

  const locations = await prisma.location.findMany({ where: { zoneId: { in: [zones[1].id, zones[2].id] } } });

  for (const model of models.slice(0, 15)) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    await prisma.inventory.upsert({
      where: { modelId_locationId: { modelId: model.id, locationId: loc.id } },
      update: {},
      create: { modelId: model.id, locationId: loc.id, quantity: Math.floor(Math.random() * 200) + 10 },
    });
  }

  console.log('Seed complete:', { admin: admin.email, manager: manager.email, operator: operator.email });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
