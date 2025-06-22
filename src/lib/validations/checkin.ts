import { z } from 'zod';

export const GuestNameSchema = z.object({
  name: z.string().min(1, 'Guest name is required')
});

export const AGE_BRACKETS = [
  '0-6 years',
  '6-12 years',
  'Above 12 years'
] as const;

export const COTTAGES = [
  'Gonolek Cottage',
  'Fish Eagle Cottage',
  'Piapiac Cottage',
  'Sunbird Cottage',
  'Shoebill Cottage',
  'Little Eagle Cottage',
  'Wagtail Cottage'
] as const;

// Create a base schema first
const baseSchema = {
  // Required fields
  clientName: z.string().min(1, 'Client name is required'),
  cottageType: z.enum(['SINGLE', 'DOUBLE', 'TWIN', 'TRIPLE', 'QUADRUPLE']),
  cottageNumber: z.enum(COTTAGES),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkInTime: z.string().min(1, 'Check-in time is required'),
  
  // Optional fields with validation if provided
  clientPhone: z.string().optional(),
  clientEmail: z.string().email('Invalid email format').optional(),
  tourCompany: z.string().optional(),
  otherInfo: z.string().optional(),
  numChildren: z.number().min(0).default(0),
  childrenAges: z.array(z.enum(AGE_BRACKETS)).default([]),
  guestNames: z.array(GuestNameSchema).default([])
};

export const CheckinSchema = z.object(baseSchema)
  .refine(
    (data) => data.clientPhone || data.clientEmail,
    { message: 'Either phone number or email must be provided' }
  )
  .refine(
    (data) => {
      if (data.numChildren > 0) {
        return data.childrenAges.length === data.numChildren;
      }
      return true;
    },
    { message: 'Please provide age brackets for all children' }
  );

export type CheckinFormData = z.infer<typeof CheckinSchema>;