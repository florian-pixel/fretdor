import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Admin: Get all bookings (READ-ONLY for monitoring purposes)
// L'admin ne peut PAS modifier les réservations - c'est le rôle des fréteurs/affréteurs
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const where: any = {};
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          affreteur: { select: { id: true, name: true, email: true, entityType: true } },
          vehicle: {
            include: {
              owner: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Error fetching bookings' }, { status: 500 });
  }
}

// NOTE: L'admin ne peut PAS modifier les réservations directement
// La méthode PUT a été supprimée car ce n'est pas le rôle de l'admin
// Les réservations sont gérées par les fréteurs et affréteurs via /api/bookings/[id]
