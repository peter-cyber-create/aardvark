import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { RoomStatus } from '@prisma/client';
import { logActivity, ActivityAction } from '@/lib/activity-logger';
import { roomCreationSchema } from '@/lib/validations/room';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as RoomStatus | null;
    const searchQuery = searchParams.get('search') || '';

    // Construct the where clause without deletedAt filtering
    const where: any = {};

    // If user is STAFF, they can only view vacant rooms
    if (session.user.role === 'STAFF') {
      where.status = RoomStatus.VACANT;

      if (searchQuery) {
        where.OR = [
          { roomNumber: { contains: searchQuery, mode: 'insensitive' } },
          { roomType: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }

      const rooms = await prisma.accommodation.findMany({
        where,
        orderBy: {
          roomNumber: 'asc'
        },
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
          status: true,
          pricePerNight: true
        }
      });

      return NextResponse.json(rooms);
    }

    // For ADMIN users, allow viewing all rooms with optional status filter
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Construct ADMIN where clause without deletedAt filtering
    if (status) {
      where.status = status; // Add status filter if present
    }

    if (searchQuery) {
       where.OR = [
         { roomNumber: { contains: searchQuery, mode: 'insensitive' } },
         { roomType: { contains: searchQuery, mode: 'insensitive' } },
       ];
    }

    const rooms = await prisma.accommodation.findMany({
      where,
      orderBy: {
        roomNumber: 'asc'
      },
      select: {
        id: true,
        roomNumber: true,
        roomType: true,
        status: true,
        pricePerNight: true
      }
    });

    const response = NextResponse.json(rooms);
    
    // Cache room data for 1 minute with stale-while-revalidate
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');
    response.headers.set('Vary', 'Cookie'); // Vary based on user session
    
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching rooms:', error);
    } else {
      console.error('An unknown error occurred while fetching rooms:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = roomCreationSchema.parse(body);

    const room = await prisma.accommodation.create({
      data: validatedData
    });

    await logActivity(session.user.id, 'ROOM_CREATE' as ActivityAction, `Created room ${room.roomNumber}`);

    return NextResponse.json(room);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'name' in error && typeof (error as any).name === 'string' && (error as any).name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid room data' }, { status: 400 });
    }
    if (error instanceof Error) {
      console.error('Error creating room:', error);
    } else {
      console.error('An unknown error occurred while creating room:', error);
    }
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
