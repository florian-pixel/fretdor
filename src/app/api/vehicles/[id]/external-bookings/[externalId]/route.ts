import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// DELETE - Supprimer une réservation externe
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; externalId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const { id: vehicleId, externalId } = await params;

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

    // Vérifier que la réservation externe existe et appartient au véhicule
    const externalBooking = await prisma.externalBooking.findFirst({
      where: {
        id: externalId,
        vehicleId,
      },
    });

    if (!externalBooking) {
      return NextResponse.json(
        { error: 'External booking not found' },
        { status: 404 }
      );
    }

    await prisma.externalBooking.delete({
      where: { id: externalId },
    });

    return NextResponse.json({ message: 'Indisponibilité supprimée' });
  } catch (error) {
    console.error('Error deleting external booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une réservation externe
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; externalId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const { id: vehicleId, externalId } = await params;

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

    if (end <= start) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    // Vérifier les conflits (exclure l'entrée actuelle)
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
        id: { not: externalId },
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

    const updated = await prisma.externalBooking.update({
      where: { id: externalId },
      data: {
        startDate: start,
        endDate: end,
        startLocation,
        endLocation,
        description,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating external booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
