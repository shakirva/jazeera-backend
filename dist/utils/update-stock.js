"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./prisma"));
/**
 * This script updates existing data with the stock for the driver van.
 * Run this when seed fails due to unique constraint violations.
 */
async function updateStock() {
    try {
        console.log('🔄 Updating stock for existing van...\n');
        // Get the existing driver
        const driver = await prisma_1.default.user.findUnique({
            where: { email: 'driver@jazeera.com' },
        });
        if (!driver) {
            console.error('❌ Driver not found');
            process.exit(1);
        }
        // Get the existing van
        const van = await prisma_1.default.van.findUnique({
            where: { plateNumber: 'DXB-A-12345' },
            include: { shifts: true },
        });
        if (!van) {
            console.error('❌ Van not found');
            process.exit(1);
        }
        console.log(`✅ Found van: ${van.plateNumber}`);
        // Get active shift
        let shift = van.shifts.find(s => s.status === 'ACTIVE');
        if (!shift) {
            console.log('⚠️  No active shift found, creating one...');
            // Get or create route
            let route = await prisma_1.default.route.findFirst();
            if (!route) {
                route = await prisma_1.default.route.create({
                    data: {
                        name: 'Dubai South Route',
                        area: 'Dubai South',
                        description: 'Covers Dubai South area'
                    },
                });
            }
            shift = await prisma_1.default.shift.create({
                data: {
                    driverId: driver.id,
                    vanId: van.id,
                    routeId: route.id,
                    status: 'ACTIVE',
                },
            });
            console.log(`✅ Active shift created: ${shift.id}\n`);
        }
        else {
            console.log(`✅ Active shift found: ${shift.id}\n`);
        }
        // Get all products
        const allProducts = await prisma_1.default.product.findMany();
        console.log(`📦 Found ${allProducts.length} products\n`);
        // Update/Create van inventory
        console.log('📥 Updating van inventory...');
        for (const product of allProducts) {
            await prisma_1.default.vanInventory.upsert({
                where: { vanId_productId: { vanId: van.id, productId: product.id } },
                update: { quantity: 50 },
                create: { vanId: van.id, productId: product.id, quantity: 50 },
            });
        }
        console.log(`✅ Van inventory updated (${allProducts.length} items)\n`);
        // Update/Create stock in shift queue
        console.log('📋 Loading stock into shift...');
        for (const product of allProducts) {
            await prisma_1.default.stockLoadQueue.upsert({
                where: { shiftId_productId: { shiftId: shift.id, productId: product.id } },
                update: { quantity: 50, confirmed: true },
                create: {
                    shiftId: shift.id,
                    productId: product.id,
                    quantity: 50,
                    confirmed: true,
                },
            });
        }
        console.log(`✅ Stock loaded into shift (${allProducts.length} items)\n`);
        console.log('🎉 Stock update complete!');
        console.log('─────────────────────────────────────────');
        console.log(`Van: ${van.plateNumber}`);
        console.log(`Driver: ${driver.email}`);
        console.log(`Shift ID: ${shift.id}`);
        console.log(`Products loaded: ${allProducts.length}`);
        console.log(`Units per product: 50`);
        console.log(`Total inventory: ${allProducts.length * 50} units`);
        console.log('─────────────────────────────────────────');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}
updateStock();
//# sourceMappingURL=update-stock.js.map