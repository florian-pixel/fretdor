import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Admin: Get admin action history
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const actionType = searchParams.get('actionType');
  const targetType = searchParams.get('targetType');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const where: any = {};
    if (actionType) where.actionType = actionType;
    if (targetType) where.targetType = targetType;

    const [actions, total] = await Promise.all([
      prisma.adminAction.findMany({
        where,
        include: {
          admin: {
            select: { id: true, name: true, email: true }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminAction.count({ where }),
    ]);

    // Enrich actions with target entity details
    const enrichedActions = await Promise.all(actions.map(async (action) => {
      let targetEntity = null;
      
      switch (action.targetType) {
        case 'USER':
          targetEntity = await prisma.user.findUnique({
            where: { id: action.targetId },
            select: { id: true, name: true, email: true, role: true }
          });
          break;
        case 'VEHICLE':
          targetEntity = await prisma.vehicle.findUnique({
            where: { id: action.targetId },
            select: { id: true, brand: true, model: true, registrationNumber: true }
          });
          break;
        case 'REPORT':
          targetEntity = await prisma.report.findUnique({
            where: { id: action.targetId },
            select: { id: true, reason: true, status: true }
          });
          break;
      }

      return { ...action, targetEntity };
    }));

    return NextResponse.json({
      actions: enrichedActions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin actions:', error);
    return NextResponse.json({ error: 'Error fetching admin actions' }, { status: 500 });
  }
}
