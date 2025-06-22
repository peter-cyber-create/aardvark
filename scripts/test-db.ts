import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  try {
    // Test the connection
    const result = await prisma.$connect();
    console.log('Successfully connected to the database');

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`Number of users in the database: ${userCount}`);

  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
