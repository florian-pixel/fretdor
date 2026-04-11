import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - Récupérer les réservations externes d'un véhicule
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vehicleId } = await params;

    const externalBookings = await prisma.externalBooking.findMany({
      where: { vehicleId },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json(externalBookings);
  } catch (error) {
    console.error('Error fetching external bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Créer une réservation externe (fréteur uniquement)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const { id: vehicleId } = await params;

    // Vérifier que le véhicule appartient à l'utilisateur
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    if (vehicle.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only manage your own vehicles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, startLocation, endLocation, description } = body;

    // Validation
    if (!startDate || !endDate || !startLocation || !endLocation) {
      return NextResponse.json(
        { error: 'Les dates et les lieux de départ/arrivée sont requis' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return NextResponse.json(
        { error: 'La date de début ne peut pas être dans le passé' },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    // Vérifier les conflits avec les réservations existantes (internes et externes)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING', 'NEGOTIATING', 'ACCEPTED', 'CONFIRMED'] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Il y a déjà une réservation sur cette période' },
        { status: 400 }
      );
    }

    const conflictingExternal = await prisma.externalBooking.findFirst({
      where: {
        vehicleId,
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (conflictingExternal) {
      return NextResponse.json(
        { error: 'Il y a déjà une indisponibilité déclarée sur cette période' },
        { status: 400 }
      );
    }

    const externalBooking = await prisma.externalBooking.create({
      data: {
        vehicleId,
        startDate: start,
        endDate: end,
        startLocation,
        endLocation,
        description,
      },
    });

    return NextResponse.json(externalBooking, { status: 201 });
  } catch (error) {
    console.error('Error creating external booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
