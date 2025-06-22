import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { ApiError, handleApiError } from '@/lib/api-error';
import { authOptions } from '../auth/[...nextauth]/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      throw new ApiError(400, 'Invalid page parameter');
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new ApiError(400, 'Invalid limit parameter');
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      ...(action ? { action } : {}),
    };

    // Apply user filter only for STAFF
    if (session.user.role === 'STAFF') {
      where.userId = session.user.id;
    }

    // Get total count for pagination
    const total = await prisma.liveActivity.count({ where });

    // Fetch activities with pagination and relations
    const activities = await prisma.liveActivity.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      status: 'success',
      data: activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    // Use the centralized error handler
    return handleApiError(error);
  }
}
