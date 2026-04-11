import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notifications } from '@/lib/notifications';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const where: any = {};
    if (session.user.role === 'FRETEUR') {
      where.vehicle = { ownerId: session.user.id };
    } else if (session.user.role === 'AFFRETEUR') {
      where.affreteurId = session.user.id;
    }
    // Admin sees all

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        vehicle: { include: { owner: { select: { id: true, name: true, email: true, phone: true } } } },
        affreteur: { select: { id: true, name: true, email: true, phone: true } },
        negotiations: { orderBy: { createdAt: 'desc' } },
        reviews: { select: { id: true, reviewerId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const safeBookings = bookings.map(booking => {
      const isAccepted = ['ACCEPTED', 'CONFIRMED', 'PAID', 'COMPLETED'].includes(booking.status);
      const b = { ...booking };

      if (!isAccepted) {
        if (b.affreteur) {
          // @ts-ignore
          b.affreteur = { ...b.affreteur, email: null, phone: null };
        }
        if (b.vehicle && b.vehicle.owner) {
           // @ts-ignore
           b.vehicle.owner = { ...b.vehicle.owner, email: null, phone: null };
        }
      }
      return b;
    });

    return NextResponse.json(safeBookings);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'AFFRETEUR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { vehicleId, startDate, endDate, startLocation, endLocation, numberOfDays, pricePerDay, initialPrice, minBudget, maxBudget } = body;

    // Validate required fields
    if (!vehicleId || !startDate || !endDate || !startLocation || !endLocation || !numberOfDays || !initialPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Début de la journée

    if (start < today) {
      return NextResponse.json({ error: 'La date de début ne peut pas être dans le passé' }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    // Check for overlapping bookings (internal)
    const overlappingBookings = await prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING', 'NEGOTIATING', 'ACCEPTED', 'CONFIRMED'] },
        OR: [
          // New booking starts during an existing booking
          { startDate: { lte: start }, endDate: { gt: start } },
          // New booking ends during an existing booking
          { startDate: { lt: end }, endDate: { gte: end } },
          // New booking completely contains an existing booking
          { startDate: { gte: start }, endDate: { lte: end } },
        ],
      },
    });

    if (overlappingBookings) {
      return NextResponse.json({
        error: 'Ce véhicule est déjà réservé pour cette période'
      }, { status: 400 });
    }

    // Check for overlapping external bookings (vehicle unavailability)
    const overlappingExternal = await prisma.externalBooking.findFirst({
      where: {
        vehicleId,
        OR: [
          { startDate: { lte: start }, endDate: { gt: start } },
          { startDate: { lt: end }, endDate: { gte: end } },
          { startDate: { gte: start }, endDate: { lte: end } },
        ],
      },
    });

    if (overlappingExternal) {
      return NextResponse.json({
        error: 'Ce véhicule est indisponible pour cette période (réservé hors application)'
      }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        vehicleId,
        affreteurId: session.user.id,
        startDate: start,
        endDate: end,
        startLocation,
        endLocation,
        numberOfDays: parseInt(numberOfDays),
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : 0,
        initialPrice: parseFloat(initialPrice),
        status: 'PENDING',
        minBudget: minBudget ? parseFloat(minBudget) : null,
        maxBudget: maxBudget ? parseFloat(maxBudget) : null,
      },
    });

    // Create initial negotiation entry
    await prisma.negotiation.create({
      data: {
        bookingId: booking.id,
        proposerId: session.user.id,
        price: parseFloat(initialPrice),
      },
    });

    // Notifier le fréteur de la nouvelle demande
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { owner: true },
    });
    if (vehicle) {
      await notifications.bookingRequest(
        vehicle.ownerId,
        `${vehicle.brand} ${vehicle.model}`,
        session.user.name,
        booking.id
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Error creating booking' }, { status: 500 });
  }
}
