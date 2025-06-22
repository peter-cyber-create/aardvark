import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/auth';
import { z } from 'zod';
import { CottageType } from '@prisma/client';

const querySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  cottageType: z.nativeEnum(CottageType).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      cottageType: searchParams.get('cottageType') as CottageType | undefined,
    });

    const startDate = new Date(parsed.startDate);
    const endDate = new Date(parsed.endDate);

    // Get all checkins within the date range
    const checkins = await prisma.checkin.findMany({
      where: {
        checkInDateTime: {
          gte: startDate,
          lte: endDate,
        },
        ...(parsed.cottageType && {
          cottageType: parsed.cottageType,
        }),
      },
      include: {
        accommodation: true,
      },
    });

    // Calculate total revenue and bookings
    const totalRevenue = checkins.reduce((sum, checkin) => sum + (checkin.totalCost || 0), 0);
    const totalBookings = checkins.length;

    // Calculate average stay duration
    const completedStays = checkins.filter(checkin => checkin.checkOutDateTime);
    const totalStayDurationMs = completedStays.reduce((sum, checkin) => {
      const checkOut = checkin.checkOutDateTime!;
      const checkIn = checkin.checkInDateTime;
      return sum + (checkOut.getTime() - checkIn.getTime());
    }, 0);
    
    const averageStayDuration = completedStays.length > 0 
      ? Math.round(totalStayDurationMs / (completedStays.length * 24 * 60 * 60 * 1000)) // Convert to days
      : 0;

    // Calculate cottage-specific stats
    const cottageStats = await prisma.accommodation.findMany({
      select: {
        roomNumber: true,
        checkins: {
          where: {
            checkInDateTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            totalCost: true,
            checkInDateTime: true,
            checkOutDateTime: true,
          },
        },
      },
    });

    const cottageStatsProcessed = cottageStats.map(cottage => {
      const totalBookings = cottage.checkins.length;
      const revenue = cottage.checkins.reduce((sum, checkin) => sum + (checkin.totalCost || 0), 0);
      
      // Calculate occupancy rate
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const occupiedDays = cottage.checkins.reduce((sum, checkin) => {
        const checkOut = checkin.checkOutDateTime || new Date();
        const stayDuration = Math.ceil((checkOut.getTime() - checkin.checkInDateTime.getTime()) / (1000 * 60 * 60 * 24));
        return sum + stayDuration;
      }, 0);
      
      const occupancyRate = (occupiedDays / totalDays) * 100;

      return {
        cottageNumber: cottage.roomNumber,
        totalBookings,
        revenue,
        occupancyRate,
      };
    });

    // Get popular activities
    const activities = await prisma.liveActivity.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        action: 'CHECK_IN',
      },
      select: {
        description: true,
      },
    });

    const popularActivities = activities.reduce((acc, curr) => {
      const activity = curr.description.split(' - ')[0];
      const existing = acc.find(a => a.name === activity);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ name: activity, count: 1 });
      }
      return acc;
    }, [] as { name: string; count: number }[])
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

    return NextResponse.json({
      totalRevenue,
      totalBookings,
      averageStayDuration,
      cottageStats: cottageStatsProcessed,
      popularActivities,
    });
  } catch (error) {
    console.error('Reports API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}