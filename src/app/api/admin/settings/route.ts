import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - Retrieve platform settings
export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let settings = await prisma.platformSettings.findUnique({
      where: { id: 'default' },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          id: 'default',
          commissionRate: 0,
          commissionEnabled: false,
          minimumCommission: 0,
          maximumCommission: null,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
  }
}

// PUT - Update platform settings
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { commissionRate, commissionEnabled, minimumCommission, maximumCommission } = body;

    // Validate commission rate
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return NextResponse.json({ error: 'Commission rate must be between 0 and 100' }, { status: 400 });
    }

    const updateData: any = {
      updatedBy: session.user.id,
    };

    if (commissionRate !== undefined) updateData.commissionRate = parseFloat(commissionRate);
    if (commissionEnabled !== undefined) updateData.commissionEnabled = commissionEnabled;
    if (minimumCommission !== undefined) updateData.minimumCommission = parseFloat(minimumCommission);
    if (maximumCommission !== undefined) updateData.maximumCommission = maximumCommission ? parseFloat(maximumCommission) : null;

    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        commissionRate: commissionRate || 0,
        commissionEnabled: commissionEnabled || false,
        minimumCommission: minimumCommission || 0,
        maximumCommission: maximumCommission || null,
        updatedBy: session.user.id,
      },
    });

    // Log the action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        actionType: 'UPDATE_SETTINGS',
        targetType: 'PLATFORM',
        targetId: 'default',
        reason: `Commission: ${settings.commissionRate}%, Enabled: ${settings.commissionEnabled}`,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Error updating settings' }, { status: 500 });
  }
}
