import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { logActivity } from '@/lib/activity-logger';
import { ApiError, handleApiError } from '@/lib/api-error';
import { CheckStatus, RoomStatus, Checkin } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      throw new ApiError(400, 'Check-in ID is required');
    }

    // Define type for CheckIn with accommodation
    type CheckInWithAccommodation = Checkin & {
      accommodation: {
        id: string;
        status: RoomStatus;
        createdAt: Date;
        updatedAt: Date;
        roomNumber: string;
        roomType: string;
        pricePerNight: number;
      } | null;
    };

    const checkIn = await prisma.checkin.findUnique({
      where: { id },
      include: { accommodation: true },
    }) as CheckInWithAccommodation | null;

    if (!checkIn) {
      throw new ApiError(404, 'Check-in not found');
    }

    if (checkIn.status !== CheckStatus.ACTIVE) {
      throw new ApiError(400, 'Check-in is not active');
    }

    // Update check-in status to COMPLETED
    await prisma.checkin.update({
      where: { id },
      data: { status: CheckStatus.CHECKED_OUT },
    });

    // If this was an accommodation check-in, update room status
    if (checkIn.accommodation) {
      await prisma.accommodation.update({
        where: { id: checkIn.accommodation.id },
        data: { status: RoomStatus.VACANT },
      });
    }

    await logActivity(
      session.user.id,
      'CHECK_OUT',
      `Checked out from room ${checkIn.accommodation?.roomNumber}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
