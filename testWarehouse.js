require('dotenv').config();
const { PrismaClient } = require('/app/jazeera-backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const id = 'f750bcc9-9380-48ec-828e-2080764c0ce0';
    const dayStart = new Date(); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(); dayEnd.setHours(23,59,59,999);
    
    const van = await prisma.van.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
        inventory: {
          include: { product: { select: { id: true, name: true, sku: true, unit: true, priceRetail: true, category: true } } },
        },
      },
    });
    console.log('van retrieved');
    
    const shifts = await prisma.shift.findMany({
      where: { vanId: id, startedAt: { gte: dayStart, lte: dayEnd } },
      include: { driver: { select: { id: true, name: true } }, route: { select: { id: true, name: true, area: true } } },
    });

    const shiftIds = shifts.map(s => s.id);
    console.log('shiftIds:', shiftIds);

    const loadedStock = shiftIds.length > 0
      ? await prisma.stockLoadQueue.findMany({
          where: { shiftId: { in: shiftIds }, confirmed: true },
          include: { product: { select: { id: true, name: true, sku: true, unit: true, priceRetail: true, category: true } } },
        })
      : [];

    const driverIds = [...new Set(shifts.map(s => s.driverId))];
    console.log('driverIds:', driverIds);

    const cashSales = driverIds.length > 0
      ? await prisma.cashSale.findMany({
          where: { driverId: { in: driverIds }, createdAt: { gte: dayStart, lte: dayEnd } },
          include: {
            items: { include: { product: { select: { id: true, name: true, sku: true, unit: true } } } },
          },
        })
      : [];

    const deliveries = driverIds.length > 0
      ? await prisma.delivery.findMany({
          where: { driverId: { in: driverIds }, updatedAt: { gte: dayStart, lte: dayEnd } },
          select: { id: true, status: true, totalAmount: true, customer: { select: { name: true } } },
        })
      : [];

    const soldMap = new Map();
    for (const sale of cashSales) {
      for (const item of sale.items) {
        const existing = soldMap.get(item.productId) ?? { productId: item.productId, name: item.product.name, sku: item.product.sku, unit: item.product.unit, soldQty: 0, revenue: 0 };
        existing.soldQty += item.quantity;
        existing.revenue += item.unitPrice * item.quantity;
        soldMap.set(item.productId, existing);
      }
    }

    const loadedMap = new Map();
    for (const item of loadedStock) {
      loadedMap.set(item.productId, (loadedMap.get(item.productId) ?? 0) + item.quantity);
    }

    const currentInventory = van.inventory.map(inv => {
      const loaded = loadedMap.get(inv.productId) ?? inv.quantity;
      const sold = soldMap.get(inv.productId);
      return {
        productId: inv.productId,
        name: inv.product.name,
        sku: inv.product.sku,
        unit: inv.product.unit,
        category: inv.product.category,
        priceRetail: inv.product.priceRetail,
        loadedQty: loaded,
        remainingQty: inv.quantity,
        soldQty: sold?.soldQty ?? (loaded - inv.quantity > 0 ? loaded - inv.quantity : 0),
        revenue: sold?.revenue ?? 0,
      };
    });

    console.log('currentInventory', currentInventory.length);

  } catch (e) {
    console.error('CRASH REASON:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
