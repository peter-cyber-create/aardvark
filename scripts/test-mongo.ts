import { PrismaClient, RoomStatus } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testMongoConnection() {
  console.log('Testing MongoDB connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to MongoDB');
    
    // Test read operation
    const roomCount = await prisma.accommodation.count();
    console.log('✅ Read operation successful. Room count:', roomCount);

    // Test write operation
    const testRoom = await prisma.accommodation.create({
      data: {
        roomNumber: 'TEST-999',
        roomType: 'SINGLE',
        status: RoomStatus.VACANT,
        pricePerNight: 100
      },
    });
    console.log('✅ Write operation successful. Created test room:', testRoom.id);

    // Clean up test data
    await prisma.accommodation.delete({
      where: { id: testRoom.id },
    });
    console.log('✅ Clean-up successful');

  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testMongoConnection()
  .then(() => {
    console.log('🎉 All MongoDB tests passed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('MongoDB test suite failed:', error);
    process.exit(1);
  });
