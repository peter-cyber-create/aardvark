import { PrismaClient, RoomStatus } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to MongoDB');

    // Test read operations
    const accommodationsCount = await prisma.accommodation.count();
    console.log('✅ Read operation successful. Accommodations count:', accommodationsCount);

    const usersCount = await prisma.user.count();
    console.log('✅ Read operation successful. Users count:', usersCount);

    // Test write operation
    const testAccommodation = await prisma.accommodation.create({
      data: {
        roomNumber: 'TEST-999',
        roomType: 'SINGLE',
        pricePerNight: 100,
        status: RoomStatus.VACANT
      },
    });
    console.log('✅ Write operation successful. Created test accommodation:', testAccommodation.id);

    // Clean up test data
    await prisma.accommodation.delete({
      where: { id: testAccommodation.id },
    });
    console.log('✅ Clean-up successful');

    console.log('🎉 All database tests passed successfully!');
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
