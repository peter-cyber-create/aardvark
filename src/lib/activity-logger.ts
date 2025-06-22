import { prisma } from './prisma';

export type ActivityAction = 
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'PARKING_CHECK_IN'
  | 'PARKING_CHECK_OUT'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED';

export async function logActivity(
  userId: string,
  action: ActivityAction,
  description: string
) {
  try {
    await prisma.liveActivity.create({
      data: {
        userId,
        action,
        description,
      },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
