import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notifications } from '@/lib/notifications';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: { include: { owner: true } },
        affreteur: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = booking.vehicle.ownerId === session.user.id;
    const isAffreteur = booking.affreteurId === session.user.id;

    if (!isOwner && !isAffreteur && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, price } = body; // action: 'accept', 'reject', 'negotiate', 'complete'

    if (action === 'negotiate') {
      if (!price) return NextResponse.json({ error: 'Price required for negotiation' }, { status: 400 });

      await prisma.negotiation.create({
        data: {
          bookingId: id,
          proposerId: session.user.id,
          price: parseFloat(price),
        },
      });

      await prisma.booking.update({
        where: { id },
        data: { status: 'NEGOTIATING' },
      });

      // Notifier l'autre partie de la nouvelle proposition
      const otherPartyId = session.user.id === booking.affreteurId
        ? booking.vehicle.ownerId
        : booking.affreteurId;
      await notifications.negotiationProposal(
        otherPartyId,
        `${booking.vehicle.brand} ${booking.vehicle.model}`,
        session.user.name,
        parseFloat(price),
        id
      );
    } else if (action === 'accept') {
      // If accepting, we need to know which price is accepted. Usually the last one.
      // Or if the user just clicks "Accept", it means they accept the last offer.
      // Let's fetch the last negotiation to get the price.
      const lastNegotiation = await prisma.negotiation.findFirst({
        where: { bookingId: id },
        orderBy: { createdAt: 'desc' },
      });

      const finalPrice = lastNegotiation ? lastNegotiation.price : booking.initialPrice;

      // Get platform settings to calculate commission
      let commissionData = {};
      const settings = await prisma.platformSettings.findUnique({
        where: { id: 'default' },
      });

      if (settings && settings.commissionEnabled && settings.commissionRate > 0) {
        // Calculate commission
        let commissionAmount = (finalPrice * settings.commissionRate) / 100;

        // Apply minimum commission
        if (settings.minimumCommission > 0) {
          commissionAmount = Math.max(commissionAmount, settings.minimumCommission);
        }

        // Apply maximum commission
        if (settings.maximumCommission !== null) {
          commissionAmount = Math.min(commissionAmount, settings.maximumCommission);
        }

        const netAmount = finalPrice - commissionAmount;

        commissionData = {
          commissionRate: settings.commissionRate,
          commissionAmount: commissionAmount,
          netAmount: netAmount,
        };
      } else {
        // No commission
        commissionData = {
          commissionRate: 0,
          commissionAmount: 0,
          netAmount: finalPrice,
        };
      }

      await prisma.booking.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          agreedPrice: finalPrice,
          ...commissionData,
        },
      });

      // Notifier l'affréteur que sa réservation est acceptée
      await notifications.bookingAccepted(
        booking.affreteurId,
        `${booking.vehicle.brand} ${booking.vehicle.model}`,
        booking.vehicle.owner.name,
        id
      );
    } else if (action === 'reject') {
      await prisma.booking.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      // Notifier l'affréteur que sa réservation est refusée
      await notifications.bookingRejected(
        booking.affreteurId,
        `${booking.vehicle.brand} ${booking.vehicle.model}`,
        booking.vehicle.owner.name,
        id
      );
    } else if (action === 'complete') {
      // Only the vehicle owner (Freteur) can mark as complete
      if (!isOwner) {
        return NextResponse.json({ error: 'Only the vehicle owner can mark as complete' }, { status: 403 });
      }

      // Only confirmed/accepted bookings can be completed
      if (!['CONFIRMED', 'ACCEPTED'].includes(booking.status)) {
        return NextResponse.json({ error: 'Only confirmed bookings can be completed' }, { status: 400 });
      }

      await prisma.booking.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      // Notifier les deux parties que la réservation est terminée
      const vehicleName = `${booking.vehicle.brand} ${booking.vehicle.model}`;
      await notifications.bookingCompleted(booking.affreteurId, vehicleName, id);
      await notifications.bookingCompleted(booking.vehicle.ownerId, vehicleName, id);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error updating booking' }, { status: 500 });
  }
}
