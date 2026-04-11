import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Get all accepted/confirmed bookings for this vehicle
    const bookings = await prisma.booking.findMany({
      where: {
        vehicleId: id,
        status: { in: ['ACCEPTED', 'CONFIRMED', 'PENDING', 'NEGOTIATING'] },
        endDate: { gte: new Date() },
      },
      select: {
        startDate: true,
        endDate: true,
        startLocation: true,
        endLocation: true,
        status: true,
      },
      orderBy: { startDate: 'asc' },
    });

    // Get external bookings (locations hors application)
    const externalBookings = await prisma.externalBooking.findMany({
      where: {
        vehicleId: id,
        endDate: { gte: new Date() },
      },
      select: {
        startDate: true,
        endDate: true,
        startLocation: true,
        endLocation: true,
      },
      orderBy: { startDate: 'asc' },
    });

    // Combine and sort all unavailable periods
    const allBookings = [
      ...bookings.map(b => ({
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString(),
        startLocation: b.startLocation,
        endLocation: b.endLocation,
        type: 'internal' as const,
        status: b.status,
      })),
      ...externalBookings.map(b => ({
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString(),
        startLocation: b.startLocation,
        endLocation: b.endLocation,
        type: 'external' as const,
        status: 'EXTERNAL',
      })),
    ].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return NextResponse.json(allBookings);
  } catch (error) {
    console.error('Error fetching vehicle bookings:', error);
    return NextResponse.json({ error: 'Error fetching bookings' }, { status: 500 });
  }
}
