import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Admin: Get all users
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const verification = searchParams.get('verification');
  const status = searchParams.get('status'); // active, suspended, banned
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const where: any = {
      role: { not: 'ADMIN' }, // Exclude admin from list
    };
    if (role) where.role = role;

    // Filter by verification status
    if (verification === 'pending') {
      where.isVerified = false;
    } else if (verification === 'verified') {
      where.isVerified = true;
    }

    // Filter by account status
    if (status === 'suspended') {
      where.isSuspended = true;
    } else if (status === 'banned') {
      where.isBanned = true;
    } else if (status === 'active') {
      where.isSuspended = false;
      where.isBanned = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          entityType: true,
          phone: true,
          rccm: true,
          cin: true,
          rccmDocUrl: true,
          cinDocUrl: true,
          isVerified: true,
          isSuspended: true,
          suspendedReason: true,
          isBanned: true,
          bannedReason: true,
          createdAt: true,
          _count: {
            select: {
              vehicles: true,
              bookings: true,
              reviewsReceived: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}

// Admin: Update user (verification, suspension, ban)
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser || existingUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: any = {};
    let actionType = '';
    let message = '';

    switch (action) {
      case 'verify':
        updateData = { isVerified: true };
        actionType = 'VERIFY_USER';
        message = 'Utilisateur vérifié avec succès';
        break;
      case 'unverify':
        updateData = { isVerified: false };
        actionType = 'UNVERIFY_USER';
        message = 'Vérification retirée';
        break;
      case 'suspend':
        if (!reason) {
          return NextResponse.json({ error: 'Reason is required for suspension' }, { status: 400 });
        }
        updateData = { isSuspended: true, suspendedReason: reason };
        actionType = 'SUSPEND_USER';
        message = 'Utilisateur suspendu';
        break;
      case 'unsuspend':
        updateData = { isSuspended: false, suspendedReason: null };
        actionType = 'UNSUSPEND_USER';
        message = 'Suspension levée';
        break;
      case 'ban':
        if (!reason) {
          return NextResponse.json({ error: 'Reason is required for ban' }, { status: 400 });
        }
        updateData = { isBanned: true, bannedReason: reason, isSuspended: false, suspendedReason: null };
        actionType = 'BAN_USER';
        message = 'Utilisateur banni définitivement';
        break;
      case 'unban':
        updateData = { isBanned: false, bannedReason: null };
        actionType = 'UNBAN_USER';
        message = 'Bannissement levé';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update user and log admin action in a transaction
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
          isSuspended: true,
          isBanned: true,
        },
      }),
      prisma.adminAction.create({
        data: {
          adminId: session.user.id,
          actionType,
          targetType: 'USER',
          targetId: userId,
          reason,
        },
      }),
    ]);

    return NextResponse.json({ message, user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}
