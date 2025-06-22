import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { ApiError } from '@/lib/api-error';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new ApiError(401, 'Unauthorized');
    }
    const userId = session.user.id;

    // Get total active check-ins (general)
    const totalActiveCheckins = await prisma.checkin.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // Get total occupied parking spaces (placeholder - no parking model exists)
    const totalOccupiedParking = 0;

    // Get total checked-out check-ins for the user
    const totalAccommodationCheckouts = await prisma.checkin.count({
      where: {
        userId: userId,
        status: 'CHECKED_OUT',
      },
    });

    // Get total vacant parking spaces (placeholder - no parking model exists)
    const totalParkingCheckouts = 0;

    const totalCompletedCheckoutsUser = totalAccommodationCheckouts + totalParkingCheckouts;

    // Calculate daily income for the user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get checkins income for today for the user
    const checkinsIncome = await prisma.checkin.aggregate({
      _sum: {
        totalCost: true,
      },
      where: {
        userId: userId,
        checkOutDateTime: {
          gte: today,
          lt: tomorrow,
        },
        status: 'CHECKED_OUT',
      },
    });

    // Get parking income for today for the user (placeholder - no parking model exists)
    const parkingIncome = { _sum: { totalCost: 0 } };

    const totalDailyIncome = (checkinsIncome._sum.totalCost || 0) + 
                            (parkingIncome._sum.totalCost || 0);

    // Calculate cumulative total income (all time) for the user
    const totalCumulativeIncome = await prisma.checkin.aggregate({
      _sum: {
        totalCost: true,
      },
      where: {
        userId: userId,
        status: 'CHECKED_OUT',
      },
    });

    const totalCumulativeParkingIncome = { _sum: { totalCost: 0 } };

    const cumulativeIncomeUser = (totalCumulativeIncome._sum.totalCost || 0) +
                             (totalCumulativeParkingIncome._sum.totalCost || 0);

    // Get active accommodations (general)
    const activeAccommodations = await prisma.accommodation.count({
      where: {
        status: 'OCCUPIED',
      },
    });

    return NextResponse.json({
      totalActiveCheckins: totalActiveCheckins, // General
      totalCompletedCheckouts: totalCompletedCheckoutsUser, // User-specific
      totalOccupiedParking: totalOccupiedParking, // General
      dailyIncome: totalDailyIncome, // User-specific (keeping for now)
      cumulativeIncome: cumulativeIncomeUser, // User-specific
      activeAccommodations: activeAccommodations, // General
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
