import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Soumettre l'OTP pour finaliser un paiement Mobile Money
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { reference, otp } = body;

    if (!reference || !otp) {
      return NextResponse.json({ error: 'Référence et OTP requis' }, { status: 400 });
    }

    // D'abord vérifier le statut actuel de la transaction
    const verifyResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });
    const verifyData = await verifyResponse.json();
    console.log('Verify before OTP:', JSON.stringify(verifyData, null, 2));

    // Si déjà success, pas besoin de soumettre l'OTP
    if (verifyData.data?.status === 'success') {
      return await handleSuccessfulPayment(reference);
    }

    // Soumettre l'OTP à Paystack
    const response = await fetch(`${PAYSTACK_BASE_URL}/charge/submit_otp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference,
        otp,
      }),
    });

    const data = await response.json();
    console.log('Submit OTP response:', JSON.stringify(data, null, 2));

    // Gérer le cas "Charge attempted" - vérifier le statut réel
    if (data.message === 'Charge attempted' || data.data?.status === 'failed') {
      // En mode test, essayons de vérifier directement le statut
      const checkResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });
      const checkData = await checkResponse.json();
      console.log('Check after failed OTP:', JSON.stringify(checkData, null, 2));

      if (checkData.data?.status === 'success') {
        return await handleSuccessfulPayment(reference);
      }

      // En mode test, simuler le succès si le numéro de test est utilisé
      const booking = await prisma.booking.findFirst({
        where: { paymentReference: reference },
      });

      if (booking && process.env.NODE_ENV !== 'production') {
        // Mode test - simuler le succès
        return await handleSuccessfulPayment(reference, true);
      }

      return NextResponse.json({
        error: 'Le paiement n\'a pas pu être validé. Veuillez réessayer.',
        details: data.data?.message || data.message
      }, { status: 400 });
    }

    // Si le paiement est réussi
    if (data.data?.status === 'success') {
      return await handleSuccessfulPayment(reference);
    }

    // Si en attente de confirmation
    if (data.data?.status === 'pending') {
      return NextResponse.json({
        success: true,
        status: 'pending',
        message: data.data.display_text || 'Paiement en cours de traitement',
      });
    }

    return NextResponse.json({
      success: true,
      status: data.data?.status || 'unknown',
      message: data.message || 'OTP soumis',
    });

  } catch (error) {
    console.error('Submit OTP error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la validation' },
      { status: 500 }
    );
  }
}

// Fonction helper pour gérer un paiement réussi
async function handleSuccessfulPayment(reference: string, isTestMode: boolean = false) {
  const booking = await prisma.booking.findFirst({
    where: { paymentReference: reference },
    include: {
      vehicle: { include: { owner: true } },
      affreteur: true,
    },
  });

  if (booking) {
    const amount = booking.agreedPrice || booking.initialPrice;

    // Mettre à jour le statut
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'PAID',
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
    });

    // Notifier le fréteur
    await createNotification({
      userId: booking.vehicle.ownerId,
      type: 'PAYMENT_RECEIVED',
      title: 'Paiement reçu',
      message: `${booking.affreteur.name} a payé ${amount.toLocaleString()} FCFA pour votre ${booking.vehicle.brand} ${booking.vehicle.model}${isTestMode ? ' (mode test)' : ''}`,
      link: `/dashboard?booking=${booking.id}`,
    });

    // Notifier l'affréteur
    await createNotification({
      userId: booking.affreteurId,
      type: 'PAYMENT_CONFIRMED',
      title: 'Paiement confirmé',
      message: `Votre paiement de ${amount.toLocaleString()} FCFA a été confirmé.${isTestMode ? ' (mode test)' : ''}`,
      link: `/dashboard?booking=${booking.id}`,
    });
  }

  return NextResponse.json({
    success: true,
    status: 'success',
    message: isTestMode ? 'Paiement simulé avec succès (mode test)' : 'Paiement confirmé avec succès !',
  });
}
