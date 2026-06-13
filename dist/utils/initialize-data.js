"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Initialize production data - create van with products if not exists
 */
async function initializeData() {
    try {
        console.log('🚀 Initializing production data...\n');
        // 1. Get or create driver
        let driver = await prisma_1.default.user.findUnique({
            where: { email: 'driver@jazeera.com' },
        });
        if (!driver) {
            console.log('👤 Creating driver...');
            const passwordHash = await bcryptjs_1.default.hash('password123', 10);
            driver = await prisma_1.default.user.create({
                data: {
                    name: 'Ahmed Al-Rashid',
                    email: 'driver@jazeera.com',
                    phone: '+971501234567',
                    passwordHash,
                    role: 'DRIVER',
                },
            });
            console.log(`✅ Driver created: ${driver.email}\n`);
        }
        else {
            console.log(`✅ Driver found: ${driver.email}\n`);
        }
        // 2. Get or create van
        const van = await prisma_1.default.van.upsert({
            where: { plateNumber: 'DXB-A-12345' },
            update: { driverId: driver.id },
            create: {
                plateNumber: 'DXB-A-12345',
                model: 'Toyota Hiace',
                driverId: driver.id,
            },
        });
        console.log(`✅ Van found/created: ${van.plateNumber}\n`);
        // 3. Get or create route
        let route = await prisma_1.default.route.findFirst();
        if (!route) {
            console.log('🗺️  Creating route...');
            route = await prisma_1.default.route.create({
                data: {
                    name: 'Dubai South Route',
                    area: 'Dubai South',
                    description: 'Covers Dubai South area',
                },
            });
            console.log(`✅ Route created: ${route.name}\n`);
        }
        else {
            console.log(`✅ Route found: ${route.name}\n`);
        }
        // 4. Get or create active shift
        let shift = await prisma_1.default.shift.findFirst({
            where: { vanId: van.id, status: 'ACTIVE' },
        });
        if (!shift) {
            console.log('📋 Creating active shift...');
            shift = await prisma_1.default.shift.create({
                data: {
                    driverId: driver.id,
                    vanId: van.id,
                    routeId: route.id,
                    status: 'ACTIVE',
                },
            });
            console.log(`✅ Shift created: ${shift.id}\n`);
        }
        else {
            console.log(`✅ Shift found: ${shift.id}\n`);
        }
        // 5. Load products into van and shift
        const allProducts = await prisma_1.default.product.findMany();
        console.log(`📦 Found ${allProducts.length} products\n`);
        if (allProducts.length > 0) {
            console.log('📥 Loading inventory into van...');
            for (const product of allProducts) {
                await prisma_1.default.vanInventory.upsert({
                    where: { vanId_productId: { vanId: van.id, productId: product.id } },
                    update: { quantity: 50 },
                    create: { vanId: van.id, productId: product.id, quantity: 50 },
                });
            }
            console.log(`✅ Van inventory loaded (${allProducts.length} products)\n`);
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
            console.log(`✅ Shift inventory loaded (${allProducts.length} products)\n`);
        }
        console.log('🎉 Initialization complete!');
        console.log('─────────────────────────────────────────');
        console.log(`Driver: ${driver.email}`);
        console.log(`Van: ${van.plateNumber}`);
        console.log(`Route: ${route.name}`);
        console.log(`Shift ID: ${shift.id}`);
        console.log(`Total products: ${allProducts.length}`);
        console.log(`Total inventory units: ${allProducts.length * 50}`);
        console.log('─────────────────────────────────────────');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}
initializeData();
//# sourceMappingURL=initialize-data.js.map