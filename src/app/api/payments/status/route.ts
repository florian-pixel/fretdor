import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { verifyPayment } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';
import { createNotification, NotificationType } from '@/lib/notifications';

// Vérifier le statut d'un paiement par référence
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Référence de paiement requise' }, { status: 400 });
    }

    // Vérifier le paiement avec Paystack
    const result = await verifyPayment(reference);

    // Récupérer la réservation liée
    const booking = await prisma.booking.findFirst({
      where: { paymentReference: reference },
      include: {
        vehicle: {
          include: { owner: true },
        },
        affreteur: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Si le paiement est réussi et pas encore marqué comme payé
    if (result.data.status === 'success' && booking.status !== 'PAID') {
      const amount = booking.agreedPrice || booking.initialPrice;

      // Mettre à jour le statut de la réservation
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'PAID',
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      // Notifier le propriétaire (fréteur)
      await createNotification({
        userId: booking.vehicle.ownerId,
        type: 'PAYMENT_RECEIVED' as NotificationType,
        title: 'Paiement reçu',
        message: `${booking.affreteur.name} a payé la réservation de votre ${booking.vehicle.brand} ${booking.vehicle.model}. Montant: ${amount.toLocaleString()} FCFA`,
        link: `/dashboard?booking=${booking.id}`,
      });

      // Notifier l'affréteur
      await createNotification({
        userId: booking.affreteurId,
        type: 'PAYMENT_CONFIRMED' as NotificationType,
        title: 'Paiement confirmé',
        message: `Votre paiement de ${amount.toLocaleString()} FCFA pour le ${booking.vehicle.brand} ${booking.vehicle.model} a été confirmé.`,
        link: `/dashboard?booking=${booking.id}`,
      });

      return NextResponse.json({
        success: true,
        status: 'success',
        message: 'Paiement confirmé',
        data: {
          bookingId: booking.id,
          amount: result.data.amount / 100,
          channel: result.data.channel,
        },
      });
    }

    // Statut du paiement
    return NextResponse.json({
      success: result.data.status === 'success',
      status: result.data.status,
      message: result.data.status === 'success' ? 'Paiement réussi' :
               result.data.status === 'pending' ? 'Paiement en attente de confirmation' :
               'Paiement non complété',
      data: {
        bookingId: booking.id,
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
