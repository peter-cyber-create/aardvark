import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { ApiError } from '@/lib/api-error';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Restrict this endpoint to ADMIN users
    if (!session?.user || session.user.role !== 'ADMIN') {
      throw new ApiError(401, 'Unauthorized');
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period'); // daily, weekly, monthly

    let startDate: Date;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'daily':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        throw new ApiError(400, 'Invalid period specified. Use daily, weekly, or monthly.');
    }

    // Aggregate total system income for the period
    const systemCheckinIncome = await prisma.checkin.aggregate({
      _sum: {
        totalCost: true,
      },
      where: {
        status: 'CHECKED_OUT',
        checkOutDateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const systemParkingIncome = { _sum: { totalCost: 0 } };

    const totalSystemIncome = (systemCheckinIncome._sum.totalCost || 0) + (systemParkingIncome._sum.totalCost || 0);

    // Aggregate income per user for the period
    const userCheckinIncome = await prisma.checkin.groupBy({
      by: ['userId'],
      _sum: {
        totalCost: true,
      },
      where: {
        status: 'CHECKED_OUT',
        checkOutDateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const userParkingIncome: any[] = [];

    // Combine and format user income data
    const userIncomeMap = new Map<string, number>();
    userCheckinIncome.forEach(item => {
      userIncomeMap.set(item.userId, (userIncomeMap.get(item.userId) || 0) + (item._sum.totalCost || 0));
    });
    userParkingIncome.forEach(item => {
      userIncomeMap.set(item.userId, (userIncomeMap.get(item.userId) || 0) + (item._sum.totalCost || 0));
    });

    // Fetch usernames for the user IDs with income
    const userIds = Array.from(userIncomeMap.keys());
    const users = await prisma.user.findMany({
        where: {
            id: { in: userIds }
        },
        select: {
            id: true,
            username: true,
        }
    });

    const userIncomeDetails = users.map(user => ({
        userId: user.id,
        username: user.username,
        totalIncome: userIncomeMap.get(user.id) || 0,
    }));

    return NextResponse.json({
      period,
      startDate,
      endDate,
      totalSystemIncome,
      userIncomeDetails,
    });

  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching income report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income report' },
      { status: 500 }
    );
  }
} 