import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { user } = session;

    if (user.role === 'FRETEUR') {
      // Get freteur's vehicles
      const vehicles = await prisma.vehicle.findMany({
        where: { ownerId: user.id },
      });

      const vehicleIds = vehicles.map(v => v.id);

      // Get bookings for freteur's vehicles
      const bookings = await prisma.booking.findMany({
        where: { vehicleId: { in: vehicleIds } },
      });

      // Calculate stats
      const totalVehicles = vehicles.length;
      const availableVehicles = vehicles.filter(v => v.isAvailable).length;
      const unavailableVehicles = totalVehicles - availableVehicles;

      // Active courses = ACCEPTED bookings where endDate is in the future
      const now = new Date();
      const activeCourses = bookings.filter(
        b => (b.status === 'ACCEPTED' || b.status === 'CONFIRMED') && new Date(b.endDate) >= now
      ).length;

      // Pending requests
      const pendingRequests = bookings.filter(
        b => b.status === 'PENDING' || b.status === 'NEGOTIATING'
      ).length;

      // Total revenue from accepted and completed bookings
      const totalRevenue = bookings
        .filter(b => b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.agreedPrice || b.initialPrice || 0), 0);

      // Monthly revenue (current month) - completed bookings only
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRevenue = bookings
        .filter(b => (b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'COMPLETED') && new Date(b.createdAt) >= startOfMonth)
        .reduce((sum, b) => sum + (b.agreedPrice || b.initialPrice || 0), 0);

      return NextResponse.json({
        totalVehicles,
        availableVehicles,
        unavailableVehicles,
        activeCourses,
        pendingRequests,
        totalRevenue,
        monthlyRevenue,
      });
    } else if (user.role === 'AFFRETEUR') {
      // Get affreteur's bookings
      const bookings = await prisma.booking.findMany({
        where: { affreteurId: user.id },
      });

      const now = new Date();

      // Active courses = ACCEPTED/CONFIRMED bookings where endDate is in the future
      const activeCourses = bookings.filter(
        b => (b.status === 'ACCEPTED' || b.status === 'CONFIRMED') && new Date(b.endDate) >= now
      ).length;

      // Pending requests
      const pendingRequests = bookings.filter(
        b => b.status === 'PENDING' || b.status === 'NEGOTIATING'
      ).length;

      // Completed courses
      const completedCourses = bookings.filter(
        b => b.status === 'COMPLETED'
      ).length;

      // Total spent on accepted/completed bookings
      const totalSpent = bookings
        .filter(b => b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.agreedPrice || b.initialPrice || 0), 0);

      // Total bookings
      const totalBookings = bookings.length;

      // Get count of available vehicles in the platform
      const availableVehicles = await prisma.vehicle.count({
        where: { isAvailable: true },
      });

      return NextResponse.json({
        activeCourses,
        pendingRequests,
        completedCourses,
        totalSpent,
        totalBookings,
        availableVehicles,
      });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 });
  }
}
