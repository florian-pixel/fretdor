import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Admin: Get platform statistics
export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      totalUsers,
      totalFreteurs,
      totalAffreteurs,
      verifiedUsers,
      pendingUsers,
      suspendedUsers,
      bannedUsers,
      totalVehicles,
      availableVehicles,
      totalBookings,
      pendingBookings,
      negotiatingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalReviews,
      avgRating,
      pendingReports,
      totalReports,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { role: 'FRETEUR' } }),
      prisma.user.count({ where: { role: 'AFFRETEUR' } }),
      prisma.user.count({ where: { isVerified: true, role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { isVerified: false, role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { isAvailable: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'NEGOTIATING' } }),
      prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'ACCEPTED'] } } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: { in: ['CANCELLED', 'REJECTED'] } } }),
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count(),
    ]);

    // Calculate revenue (sum of all confirmed/completed bookings)
    const bookingsWithTotal = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'ACCEPTED', 'COMPLETED'] } },
      select: { agreedPrice: true, initialPrice: true, createdAt: true },
    });
    const totalRevenue = bookingsWithTotal.reduce((sum, b) => sum + (b.agreedPrice || b.initialPrice), 0);

    // This month's revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthRevenue = bookingsWithTotal
      .filter(b => new Date(b.createdAt) >= startOfMonth)
      .reduce((sum, b) => sum + (b.agreedPrice || b.initialPrice), 0);

    return NextResponse.json({
      users: {
        total: totalUsers,
        freteurs: totalFreteurs,
        affreteurs: totalAffreteurs,
        verified: verifiedUsers,
        pending: pendingUsers,
        suspended: suspendedUsers,
        banned: bannedUsers,
      },
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        negotiating: negotiatingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      reviews: {
        total: totalReviews,
        averageRating: avgRating._avg.rating || 0,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
      },
      reports: {
        pending: pendingReports,
        total: totalReports,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 });
  }
}
