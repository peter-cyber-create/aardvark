import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { CheckinSchema } from '@/lib/validations/checkin';
import { ServiceType, CheckStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CheckinSchema.parse(body);

    // Validate that either phone or email is provided
    if (!validatedData.clientPhone && !validatedData.clientEmail) {
      return NextResponse.json(
        { error: 'Either phone number or email must be provided' },
        { status: 400 }
      );
    }

    // Convert the form data to match Prisma schema using unchecked create input
    const checkin = await prisma.checkin.create({
      data: {
        userId: session.user.id,
        serviceType: ServiceType.ACCOMMODATION,
        guestNames: [validatedData.clientName, ...validatedData.guestNames.map(g => g.name)],
        clientPhone: validatedData.clientPhone || undefined,
        clientEmail: validatedData.clientEmail || undefined,
        tourCompany: validatedData.tourCompany || undefined,
        otherInfo: validatedData.otherInfo || undefined,
        cottageType: validatedData.cottageType,
        cottageNumber: validatedData.cottageNumber,
        numChildren: validatedData.numChildren,
        childrenAges: validatedData.childrenAges,
        status: CheckStatus.ACTIVE,
        checkInDateTime: new Date(`${validatedData.checkInDate}T${validatedData.checkInTime}:00`)
      }
    });

    return NextResponse.json(checkin, { status: 201 });
  } catch (error) {
    console.error('Checkin error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}