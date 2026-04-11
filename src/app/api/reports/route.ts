import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Create a new report (for all authenticated users)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reportedType, reportedId, reason, description } = await request.json();

    // Validate required fields
    if (!reportedType || !reportedId || !reason) {
      return NextResponse.json({ 
        error: 'reportedType, reportedId, and reason are required' 
      }, { status: 400 });
    }

    // Validate reportedType
    const validTypes = ['USER', 'VEHICLE', 'REVIEW', 'BOOKING'];
    if (!validTypes.includes(reportedType)) {
      return NextResponse.json({ error: 'Invalid reportedType' }, { status: 400 });
    }

    // Validate reason
    const validReasons = ['FRAUD', 'INAPPROPRIATE', 'SPAM', 'FAKE_DOCUMENTS', 'OTHER'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    // Check if the reported entity exists
    let entityExists = false;
    switch (reportedType) {
      case 'USER':
        entityExists = !!(await prisma.user.findUnique({ where: { id: reportedId } }));
        break;
      case 'VEHICLE':
        entityExists = !!(await prisma.vehicle.findUnique({ where: { id: reportedId } }));
        break;
      case 'REVIEW':
        entityExists = !!(await prisma.review.findUnique({ where: { id: reportedId } }));
        break;
      case 'BOOKING':
        entityExists = !!(await prisma.booking.findUnique({ where: { id: reportedId } }));
        break;
    }

    if (!entityExists) {
      return NextResponse.json({ error: 'Reported entity not found' }, { status: 404 });
    }

    // Check if user already reported this entity
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        reportedType,
        reportedId,
        status: 'PENDING',
      }
    });

    if (existingReport) {
      return NextResponse.json({ 
        error: 'Vous avez déjà signalé cet élément' 
      }, { status: 400 });
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        reportedType,
        reportedId,
        reason,
        description,
      },
    });

    return NextResponse.json({
      message: 'Signalement envoyé avec succès',
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Error creating report' }, { status: 500 });
  }
}

// Get user's own reports
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reports = await prisma.report.findMany({
      where: { reporterId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Error fetching reports' }, { status: 500 });
  }
}
