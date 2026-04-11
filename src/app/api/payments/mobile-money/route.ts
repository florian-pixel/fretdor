import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { chargeMobileMoney, generateReference } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';

// Initier un paiement Mobile Money pour une réservation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, phone, provider } = body;

    // Validation
    if (!bookingId) {
      return NextResponse.json({ error: 'ID de réservation requis' }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 });
    }

    if (!provider || !['mtn', 'orange', 'wave'].includes(provider)) {
      return NextResponse.json({
        error: 'Provider invalide. Choisissez parmi: mtn, orange, wave'
      }, { status: 400 });
    }

    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        affreteur: true,
        vehicle: true,
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

    // Formater le numéro de téléphone (enlever les espaces et le +)
    const formattedPhone = phone.replace(/[\s+]/g, '');

    // Initier le paiement Mobile Money
    const result = await chargeMobileMoney({
      email: booking.affreteur.email,
      amount: amount,
      phone: formattedPhone,
      provider: provider as 'mtn' | 'orange' | 'wave',
      reference,
      metadata: {
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        affreteurId: booking.affreteurId,
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
    });

    // Mettre à jour la réservation avec la référence de paiement
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentReference: reference,
        paymentStatus: 'PENDING',
      },
    });

    // Gérer les différents statuts de réponse Paystack
    const status = result.data?.status || result.status;

    // Si le statut est "send_otp", le client doit entrer l'OTP
    if (status === 'send_otp' || result.message === 'Charge attempted') {
      return NextResponse.json({
        success: true,
        status: 'otp_required',
        message: result.data?.display_text || 'Veuillez entrer le code OTP reçu par SMS',
        data: {
          reference: result.data?.reference || reference,
        },
      });
    }

    // Si le statut est "pay_offline", le client doit confirmer sur son téléphone
    if (status === 'pay_offline') {
      return NextResponse.json({
        success: true,
        status: 'pending_confirmation',
        message: result.data?.display_text || 'Veuillez confirmer le paiement sur votre téléphone',
        data: {
          reference: result.data?.reference || reference,
        },
      });
    }

    // Si le statut est "pending", en attente de confirmation
    if (status === 'pending') {
      return NextResponse.json({
        success: true,
        status: 'pending',
        message: 'Paiement en cours de traitement',
        data: {
          reference: result.data?.reference || reference,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        reference: result.data?.reference || reference,
        status: status,
      },
    });
  } catch (error) {
    console.error('Mobile Money payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'initialisation du paiement' },
      { status: 500 }
    );
  }
}
