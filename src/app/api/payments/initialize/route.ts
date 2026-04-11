import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { initializePayment, generateReference } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';

// Initialiser un paiement pour une réservation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, callback_url } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'ID de réservation requis' }, { status: 400 });
    }

    // Récupérer la réservation avec les infos du propriétaire du véhicule
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        affreteur: true,
        vehicle: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                paystackSubaccountCode: true,
                bankCode: true,
                accountNumber: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est bien l'affréteur
    if (booking.affreteurId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Vérifier que la réservation est acceptée/confirmée mais pas encore payée
    if (!['ACCEPTED', 'CONFIRMED'].includes(booking.status)) {
      return NextResponse.json({ error: 'Cette réservation ne peut pas être payée' }, { status: 400 });
    }

    // Générer une référence unique
    const reference = generateReference();

    // Calculer le montant à payer (prix convenu ou prix initial)
    const amount = booking.agreedPrice || booking.initialPrice;

    // Récupérer les paramètres de commission
    const platformSettings = await prisma.platformSettings.findFirst();
    const commissionRate = platformSettings?.commissionRate || 5;
    const commissionEnabled = platformSettings?.commissionEnabled ?? true;

    // Calculer la commission (en centimes pour Paystack)
    const commissionAmount = commissionEnabled ? Math.round(amount * commissionRate / 100) : 0;

    // Préparer les paramètres de split payment
    const freteurSubaccount = booking.vehicle.owner.paystackSubaccountCode;

    // Initialiser le paiement avec Paystack
    const paymentParams: Parameters<typeof initializePayment>[0] = {
      email: booking.affreteur.email,
      amount: amount,
      reference,
      callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/payments/verify?reference=${reference}`,
      metadata: {
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        affreteurId: booking.affreteurId,
        freteurId: booking.vehicle.owner.id,
        commissionAmount,
        commissionRate,
        custom_fields: [
          {
            display_name: 'Réservation',
            variable_name: 'booking_id',
            value: booking.id,
          },
          {
            display_name: 'Véhicule',
            variable_name: 'vehicle',
            value: `${booking.vehicle.brand} ${booking.vehicle.model}`,
          },
        ],
      },
    };

    // Si le fréteur a un subaccount configuré, utiliser le split payment
    if (freteurSubaccount && commissionEnabled) {
      paymentParams.subaccount = freteurSubaccount;
      // transaction_charge est le montant que FRETDOR garde (la commission), en centimes
      paymentParams.transaction_charge = commissionAmount * 100;
      // Le compte principal (FRETDOR) paie les frais Paystack
      paymentParams.bearer = 'account';

      console.log(`Split payment: ${amount} FCFA - Commission FRETDOR: ${commissionAmount} FCFA - Fréteur: ${amount - commissionAmount} FCFA`);
    }

    const result = await initializePayment(paymentParams);

    // Mettre à jour la réservation avec la référence de paiement
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentReference: reference,
        paymentStatus: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: result.data.authorization_url,
        reference: result.data.reference,
      },
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'initialisation du paiement' },
      { status: 500 }
    );
  }
}
