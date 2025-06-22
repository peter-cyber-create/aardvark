import { z } from 'zod';

export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
});

// Define schema for user updates
export const userUpdateSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  username: z.string().min(3, 'Username must be at least 3 characters long').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
});
