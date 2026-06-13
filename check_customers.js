require('dotenv').config();
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // 1. Check total customer count
  const count = await prisma.customer.count();
  console.log('Total customers in DB:', count);

  // 2. Search for "blossom" (case-insensitive)
  const blossom = await prisma.customer.findMany({
    where: {
      name: { contains: 'blossom', mode: 'insensitive' }
    },
    select: { id: true, name: true, phone: true, address: true }
  });
  console.log('\nCustomers matching "blossom":', JSON.stringify(blossom, null, 2));

  // 3. Show first 20 customers
  const all = await prisma.customer.findMany({
    take: 20,
    select: { id: true, name: true, phone: true },
    orderBy: { name: 'asc' }
  });
  console.log('\nFirst 20 customers:', JSON.stringify(all, null, 2));

  await prisma.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
