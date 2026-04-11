import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Admin: Get all reports
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const reportedType = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const where: any = {};
    if (status) where.status = status;
    if (reportedType) where.reportedType = reportedType;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, name: true, email: true }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    // Enrich reports with reported entity details
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      let reportedEntity = null;
      
      switch (report.reportedType) {
        case 'USER':
          reportedEntity = await prisma.user.findUnique({
            where: { id: report.reportedId },
            select: { id: true, name: true, email: true, role: true }
          });
          break;
        case 'VEHICLE':
          reportedEntity = await prisma.vehicle.findUnique({
            where: { id: report.reportedId },
            select: { id: true, brand: true, model: true, registrationNumber: true }
          });
          break;
        case 'REVIEW':
          reportedEntity = await prisma.review.findUnique({
            where: { id: report.reportedId },
            select: { id: true, rating: true, comment: true }
          });
          break;
        case 'BOOKING':
          reportedEntity = await prisma.booking.findUnique({
            where: { id: report.reportedId },
            select: { id: true, status: true, startLocation: true, endLocation: true }
          });
          break;
      }

      return { ...report, reportedEntity };
    }));

    return NextResponse.json({
      reports: enrichedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Error fetching reports' }, { status: 500 });
  }
}

// Admin: Update report status
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reportId, status, adminNotes, action } = await request.json();

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Report ID and status required' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the report first
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update report
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes,
        resolvedAt: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : null,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        actionType: 'RESOLVE_REPORT',
        targetType: 'REPORT',
        targetId: reportId,
        reason: adminNotes || `Status changed to ${status}`,
      },
    });

    // If action is specified, perform additional operations
    if (action && status === 'RESOLVED') {
      switch (action) {
        case 'suspend_user':
          if (existingReport.reportedType === 'USER') {
            await prisma.user.update({
              where: { id: existingReport.reportedId },
              data: { isSuspended: true, suspendedReason: adminNotes || 'Suite à un signalement' }
            });
            await prisma.adminAction.create({
              data: {
                adminId: session.user.id,
                actionType: 'SUSPEND_USER',
                targetType: 'USER',
                targetId: existingReport.reportedId,
                reason: adminNotes || 'Suite à un signalement',
              },
            });
          }
          break;
        case 'ban_user':
          if (existingReport.reportedType === 'USER') {
            await prisma.user.update({
              where: { id: existingReport.reportedId },
              data: { isBanned: true, bannedReason: adminNotes || 'Suite à un signalement' }
            });
            await prisma.adminAction.create({
              data: {
                adminId: session.user.id,
                actionType: 'BAN_USER',
                targetType: 'USER',
                targetId: existingReport.reportedId,
                reason: adminNotes || 'Suite à un signalement',
              },
            });
          }
          break;
        case 'delete_vehicle':
          if (existingReport.reportedType === 'VEHICLE') {
            await prisma.vehicle.delete({
              where: { id: existingReport.reportedId }
            });
            await prisma.adminAction.create({
              data: {
                adminId: session.user.id,
                actionType: 'DELETE_CONTENT',
                targetType: 'VEHICLE',
                targetId: existingReport.reportedId,
                reason: adminNotes || 'Contenu supprimé suite à un signalement',
              },
            });
          }
          break;
        case 'delete_review':
          if (existingReport.reportedType === 'REVIEW') {
            await prisma.review.delete({
              where: { id: existingReport.reportedId }
            });
            await prisma.adminAction.create({
              data: {
                adminId: session.user.id,
                actionType: 'DELETE_CONTENT',
                targetType: 'REVIEW',
                targetId: existingReport.reportedId,
                reason: adminNotes || 'Avis supprimé suite à un signalement',
              },
            });
          }
          break;
      }
    }

    return NextResponse.json({
      message: 'Signalement mis à jour',
      report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Error updating report' }, { status: 500 });
  }
}
