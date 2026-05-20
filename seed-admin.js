require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedUser() {
  try {
    // Delete existing user
    await prisma.user.deleteMany({
      where: { email: 'superadmin@jazeera.com' }
    });
    console.log('✅ Deleted existing user');

    // Create new user
    const passwordHash = bcrypt.hashSync('admin123', 10);
    console.log('🔐 Generated password hash');

    const user = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@jazeera.com',
        phone: '+966501234567',
        passwordHash,
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log('✅ User created:', user.email);

    // Verify password match
    const match = bcrypt.compareSync('admin123', user.passwordHash);
    console.log('✅ Password verification:', match ? 'SUCCESS' : 'FAILED');

    console.log('\n🎉 Login Credentials:');
    console.log('Email: superadmin@jazeera.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedUser();
