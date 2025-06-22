import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { userRegistrationSchema } from '@/lib/validations/user';
import { logActivity } from '@/lib/activity-logger';
import bcrypt from 'bcryptjs';
// Remove the headers import as it's not used in this file
// MongoDB ObjectId regex pattern
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// GET: List all users
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  // Allow ADMIN and STAFF to view users
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Select different fields based on role
    const selectFields = session.user.role === 'ADMIN' ?
      { id: true, username: true, email: true, role: true, createdAt: true } :
      { id: true, username: true, role: true };

    // Get search query from request
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';
    // Remove trash parameter handling
    // const trash = searchParams.get('trash') === 'true';
    // const deletedFilter = trash
    //   ? { deletedAt: { not: null } }
    //   : { deletedAt: null };

    // Keep only search filter
    const where: any = {};

    if (searchQuery) {
      where.OR = [
        { username: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Remove console log
    // console.log('Users API - GET where clause:', { ...deletedFilter, OR: [{ username: { contains: searchQuery, mode: 'insensitive' } }, { email: { contains: searchQuery, mode: 'insensitive' } }] });

    const users = await prisma.user.findMany({
      where, // Use the simplified where clause
      select: selectFields,
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Create a new user
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const validated = userRegistrationSchema.parse(body);
    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const user = await prisma.user.create({
      data: {
        username: validated.username,
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    await logActivity(session.user.id, 'USER_CREATED', `Created user ${user.username}`);
    return NextResponse.json(user);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'name' in error && typeof (error as any).name === 'string' && (error as any).name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }
    if (error instanceof Error) {
      console.error('Error creating user:', error);
    } else {
      console.error('An unknown error occurred while creating user:', error);
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PATCH: Update a user (expects { id, ...fields })
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id || !objectIdRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }
    if (fields.password) {
      fields.password = await bcrypt.hash(fields.password, 10);
    }
    // Don't allow update if user is deleted
    const user = await prisma.user.updateMany({
      where: { id },
      data: fields,
    });
    if (user.count === 0) {
      return NextResponse.json({ error: 'User not found or deleted' }, { status: 404 });
    }
    await logActivity(session.user.id, 'USER_UPDATED', `Updated user ${id}`);
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE: Delete a user (expects { id })
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id } = body;
    if (!id || !objectIdRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }
    // Revert to hard-delete
    const user = await prisma.user.delete({
      where: { id },
    });
    await logActivity(session.user.id, 'USER_DELETED', `Deleted user ${user.username}`);
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
