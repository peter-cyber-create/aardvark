import { z } from 'zod';
import { RoomStatus } from '@prisma/client';

export const roomCreationSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  roomType: z.enum(['STANDARD', 'DELUXE', 'SUITE'], { invalid_type_error: 'Invalid room type' }),
  pricePerNight: z.number().positive('Price per night must be a positive number'),
});

export const roomUpdateSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').optional(),
  roomType: z.enum(['STANDARD', 'DELUXE', 'SUITE'], { invalid_type_error: 'Invalid room type' }).optional(),
  status: z.nativeEnum(RoomStatus, { invalid_type_error: 'Invalid room status' }).optional(),
  pricePerNight: z.number().positive('Price per night must be a positive number').optional(),
});
