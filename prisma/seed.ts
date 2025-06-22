import { PrismaClient, ServiceType, RoomStatus, CheckStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CURRENT_DATE = new Date('2025-05-27');

async function main() {
  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create a staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      username: 'staff',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  // Create some example rooms and store their IDs
  const roomConfigs = [
    { roomNumber: 'GONOLEK-101', roomType: 'STANDARD', pricePerNight: 250 },
    { roomNumber: 'FISH-EAGLE-201', roomType: 'DELUXE', pricePerNight: 350 },
    { roomNumber: 'PIAPIAC-301', roomType: 'SUITE', pricePerNight: 500 },
    { roomNumber: 'SUNBIRD-102', roomType: 'STANDARD', pricePerNight: 250 },
    { roomNumber: 'SHOEBILL-202', roomType: 'DELUXE', pricePerNight: 350 },
    { roomNumber: 'LITTLE-EAGLE-302', roomType: 'SUITE', pricePerNight: 500 },
    { roomNumber: 'WAGTAIL-103', roomType: 'STANDARD', pricePerNight: 250 },
  ];

  const roomRecords: { [key: string]: { id: string } } = {};
  
  for (const room of roomConfigs) {
    const createdRoom = await prisma.accommodation.upsert({
      where: { roomNumber: room.roomNumber },
      update: {},
      create: {
        ...room,
        status: RoomStatus.VACANT,
      },
    });
    roomRecords[room.roomNumber] = { id: createdRoom.id };
  }

  // Create check-ins with proper status handling
  const checkIns = [
    {
      guestName: 'John Doe',
      clientPhone: '111-222-3333',
      serviceType: ServiceType.ACCOMMODATION,
      accommodationId: roomRecords['GONOLEK-101'].id,
      checkInDateTime: new Date(CURRENT_DATE.getTime() - 2 * 24 * 60 * 60 * 1000),
      checkOutDateTime: new Date(CURRENT_DATE.getTime() - 1 * 24 * 60 * 60 * 1000),
      totalCost: 250,
      status: CheckStatus.CHECKED_OUT
    },
    {
      guestName: 'Jane Smith',
      clientPhone: '444-555-6666',
      serviceType: ServiceType.ACCOMMODATION,
      accommodationId: roomRecords['FISH-EAGLE-201'].id,
      checkInDateTime: new Date(CURRENT_DATE.getTime() - 3 * 24 * 60 * 60 * 1000),
      checkOutDateTime: new Date(CURRENT_DATE.getTime() - 2 * 24 * 60 * 60 * 1000),
      totalCost: 350,
      status: CheckStatus.CHECKED_OUT
    },
    {
      guestName: 'Bob Wilson',
      clientPhone: '777-888-9999',
      serviceType: ServiceType.ACCOMMODATION,
      accommodationId: roomRecords['SUNBIRD-102'].id,
      checkInDateTime: CURRENT_DATE,
      checkOutDateTime: null,
      totalCost: null,
      status: CheckStatus.ACTIVE
    },
  ];

  // Create check-in records
  for (const checkIn of checkIns) {
    await prisma.checkin.create({
      data: {
        ...checkIn,
        userId: staff.id,
      },
    });

    // Update room status based on check-in status
    if (checkIn.accommodationId) {
      await prisma.accommodation.update({
        where: { id: checkIn.accommodationId },
        data: {
          status: checkIn.status === CheckStatus.ACTIVE ? RoomStatus.OCCUPIED : RoomStatus.VACANT
        }
      });
    }
  }

  // Create activity logs
  const activities = [
    {
      action: 'USER_LOGIN',
      description: 'Admin user logged in',
      userId: admin.id,
      createdAt: new Date(CURRENT_DATE.getTime() - 1 * 60 * 60 * 1000),
    },
    {
      action: 'USER_LOGIN',
      description: 'Staff user logged in',
      userId: staff.id,
      createdAt: new Date(CURRENT_DATE.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      action: 'CHECK_IN',
      description: 'New guest check-in: John Doe (Room GONOLEK-101)',
      userId: staff.id,
      createdAt: new Date(CURRENT_DATE.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      action: 'CHECK_OUT',
      description: 'Guest check-out: Jane Smith (Room FISH-EAGLE-201)',
      userId: staff.id,
      createdAt: new Date(CURRENT_DATE.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const activity of activities) {
    await prisma.liveActivity.create({
      data: activity,
    });
  }

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
