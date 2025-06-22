import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { logActivity, ActivityAction } from '@/lib/activity-logger';
import { ApiError } from '@/lib/api-error';
import { roomUpdateSchema } from '@/lib/validations/room';
import { z } from 'zod';

// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      throw new ApiError(401, 'Unauthorized - Only admins can delete rooms');
    }

    // Await the params to get the id
    const { id } = await params;

    // Check if room exists and is not occupied (optional check for hard delete)
    const room = await prisma.accommodation.findUnique({
      where: { id },
    });

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    // // We are doing soft delete now, so occupied check is less critical for *deletion*, but maybe prevent soft-deleting occupied? 
    // // Let's allow soft-deleting occupied rooms for now, staff can deal with it later.
    // if (room.status === 'OCCUPIED') {
    //   throw new ApiError(400, 'Cannot delete an occupied room');
    // }

    // Revert to hard-delete the room
    await prisma.accommodation.delete({
      where: { id },
    });

    await logActivity(
      session.user.id,
      'ROOM_DELETE' as ActivityAction,
      `Deleted room: ${room.roomNumber}` // Revert log message
    );

    return NextResponse.json({ message: 'Room deleted successfully' }); // Revert success message
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Await the params to get the id
    const { id } = await params;
    const body = await request.json();

    // Validate incoming data with Zod
    const validatedData = roomUpdateSchema.parse(body);

    // Check if user is authorized
    if (!session?.user) {
        throw new ApiError(401, 'Unauthorized');
    }

    // Restrict full updates to ADMIN, allow STAFF to update status
    if (session.user.role !== 'ADMIN') {
        // If not ADMIN, only allow status update
        const allowedUpdates = Object.keys(validatedData);
        if (allowedUpdates.length !== 1 || !allowedUpdates.includes('status')) {
            throw new ApiError(403, 'Forbidden - Only admins can update fields other than status');
        }
        // Zod schema already ensures status is valid if provided
    } else { // ADMIN can update all fields included in the validatedData
       // Optional: Add more granular validation for ADMIN updates if needed
    }
    
    // Check if room exists
    const existingRoom = await prisma.accommodation.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      throw new ApiError(404, 'Room not found');
    }

    // Check if room number is being changed and if it's unique (only for ADMIN)
    if (session.user.role === 'ADMIN' && validatedData.roomNumber && validatedData.roomNumber !== existingRoom.roomNumber) {
      const duplicateRoom = await prisma.accommodation.findFirst({
        where: {
          roomNumber: validatedData.roomNumber,
          NOT: { id },
        },
      });

      if (duplicateRoom) {
        throw new ApiError(400, 'Room number already exists');
      }
    }

    // Update the room with validated data
    const updatedRoom = await prisma.accommodation.update({
      where: { id },
      data: validatedData,
    });

    await logActivity(
      session.user.id,
      'ROOM_UPDATE' as ActivityAction,
      `Updated room: ${updatedRoom.roomNumber}. Status: ${updatedRoom.status}`
    );

    return NextResponse.json(updatedRoom);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data for room update', details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}