import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { logActivity, ActivityAction } from '@/lib/activity-logger';
import { ApiError, handleApiError } from '@/lib/api-error';
import { authOptions } from '../auth/[...nextauth]/auth';
import { ServiceType, CheckStatus, RoomStatus } from '@prisma/client';


export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = await req.json();
      const { roomNumber, checkInDate, checkInTime, clientPhone } = body;

      // Find the accommodation by room number
      const accommodation = await prisma.accommodation.findUnique({
        where: { roomNumber },
      });

      if (!accommodation) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      if (accommodation.status === RoomStatus.OCCUPIED) {
        return NextResponse.json({ error: 'Room is already occupied' }, { status: 400 });
      }

      const checkin = await prisma.checkin.create({
        data: {
          clientPhone,
          serviceType: ServiceType.ACCOMMODATION,
          accommodation: { connect: { id: accommodation.id } },
          checkInDateTime: new Date(`${checkInDate}T${checkInTime}`),
          status: CheckStatus.ACTIVE,
          user: { connect: { id: session.user.id } },
        },
      });

      // Update accommodation status
      await prisma.accommodation.update({
        where: { id: accommodation.id },
        data: { status: RoomStatus.OCCUPIED },
      });

      await logActivity(
        session.user.id,
        'CHECK_IN',
        `Created check-in for room ${roomNumber}`
      );

      return NextResponse.json(checkin);
    } catch (error) {
      return handleApiError(error);
    }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await prisma.checkin.findMany({
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
