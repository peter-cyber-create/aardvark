import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const recentActivities = await prisma.liveActivity.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return NextResponse.json(recentActivities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    );
  }
}
