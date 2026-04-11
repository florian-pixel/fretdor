import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// Vérifier un paiement
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Référence de paiement requise' }, { status: 400 });
    }

    // Vérifier le paiement avec Paystack
    const result = await verifyPayment(reference);

    if (result.data.status === 'success') {
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

      if (booking) {
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
          type: 'PAYMENT_RECEIVED',
          title: 'Paiement reçu',
          message: `${booking.affreteur.name} a payé la réservation de votre ${booking.vehicle.brand} ${booking.vehicle.model}. Montant: ${amount.toLocaleString()} FCFA`,
          link: `/dashboard?booking=${booking.id}`,
        });

        // Notifier l'affréteur
        await createNotification({
          userId: booking.affreteurId,
          type: 'PAYMENT_CONFIRMED',
          title: 'Paiement confirmé',
          message: `Votre paiement de ${amount.toLocaleString()} FCFA pour le ${booking.vehicle.brand} ${booking.vehicle.model} a été confirmé.`,
          link: `/dashboard?booking=${booking.id}`,
        });

        return NextResponse.json({
          success: true,
          message: 'Paiement vérifié avec succès',
          data: {
            status: 'success',
            bookingId: booking.id,
            amount: result.data.amount / 100,
          },
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Le paiement n\'a pas été complété',
      data: {
        status: result.data.status,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la vérification du paiement' },
      { status: 500 }
    );
  }
}
