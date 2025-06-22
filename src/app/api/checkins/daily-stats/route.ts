import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

import { ApiError } from '@/lib/api-error';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new ApiError(401, 'Unauthorized');
    }
    const userId = session.user.id;

    // Parse query parameter for period
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily'; // Default to daily

    let dateFilter = {};
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    if (period === 'daily') {
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);
      dateFilter = {
        gte: startOfToday,
        lt: endOfToday,
      };
    } else if (period === 'weekly') {
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of the current week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      dateFilter = {
        gte: startOfWeek,
        lt: endOfWeek,
      };
    } else if (period === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      dateFilter = {
        gte: startOfMonth,
        lt: endOfMonth,
      };
    } else if (period === 'all-time') {
      // No date filter needed for all-time
      dateFilter = {};
    } else {
       throw new ApiError(400, 'Invalid period specified');
    }

    const checkinsIncome = await prisma.checkin.aggregate({
      _sum: {
        totalCost: true,
      },
      where: {
        userId: userId,
        checkOutDateTime: dateFilter, // Apply dynamic date filter
        status: 'CHECKED_OUT', // Only sum checked out checkins
        // Removed serviceType filter to include all types
      },
    });

    const totalIncome = checkinsIncome._sum.totalCost || 0;

    return NextResponse.json({ period, totalIncome });

  } catch (error) {
    console.error('Error fetching daily checkin income:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily checkin income' },
      { status: 500 }
    );
  }
} 