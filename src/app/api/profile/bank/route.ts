import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSubaccount, updateSubaccount, IVORIAN_BANKS } from '@/lib/paystack';

// GET - Récupérer les infos bancaires et la liste des banques
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        bankCode: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        paystackSubaccountCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      bankInfo: {
        bankCode: user.bankCode,
        bankName: user.bankName,
        accountNumber: user.accountNumber,
        accountName: user.accountName,
        hasSubaccount: !!user.paystackSubaccountCode,
      },
      banks: IVORIAN_BANKS,
    });
  } catch (error) {
    console.error('Error fetching bank info:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Enregistrer les infos bancaires et créer/mettre à jour le subaccount
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        paystackSubaccountCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Seuls les fréteurs peuvent configurer leurs infos bancaires
    if (user.role !== 'FRETEUR') {
      return NextResponse.json(
        { error: 'Seuls les fréteurs peuvent configurer leurs informations bancaires' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bankCode, accountNumber, accountName } = body;

    if (!bankCode || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'Code banque, numéro de compte et nom du titulaire requis' },
        { status: 400 }
      );
    }

    // Trouver le nom de la banque
    const bank = IVORIAN_BANKS.find(b => b.code === bankCode);
    if (!bank) {
      return NextResponse.json({ error: 'Banque non supportée' }, { status: 400 });
    }

    // Récupérer le taux de commission depuis PlatformSettings
    const platformSettings = await prisma.platformSettings.findFirst();
    const commissionRate = platformSettings?.commissionRate || 5; // 5% par défaut

    let subaccountCode = user.paystackSubaccountCode;

    try {
      if (subaccountCode) {
        // Mettre à jour le subaccount existant
        await updateSubaccount(subaccountCode, {
          business_name: `FRETDOR - ${user.name}`,
          bank_code: bankCode,
          account_number: accountNumber,
          percentage_charge: commissionRate,
          primary_contact_email: user.email,
          primary_contact_name: accountName,
          primary_contact_phone: user.phone || undefined,
        });
      } else {
        // Créer un nouveau subaccount
        const result = await createSubaccount({
          business_name: `FRETDOR - ${user.name}`,
          bank_code: bankCode,
          account_number: accountNumber,
          percentage_charge: commissionRate, // FRETDOR reçoit ce pourcentage
          primary_contact_email: user.email,
          primary_contact_name: accountName,
          primary_contact_phone: user.phone || undefined,
        });

        subaccountCode = result.data.subaccount_code;
        console.log('Subaccount created successfully:', subaccountCode);
      }
    } catch (paystackError) {
      console.error('Paystack subaccount error:', paystackError);
      // Retourner l'erreur pour que l'utilisateur sache ce qui se passe
      return NextResponse.json(
        {
          error: `Erreur Paystack: ${paystackError instanceof Error ? paystackError.message : 'Erreur inconnue'}. Vérifiez le code banque et le numéro de compte.`,
          details: paystackError instanceof Error ? paystackError.message : String(paystackError)
        },
        { status: 400 }
      );
    }

    // Mettre à jour les infos bancaires de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bankCode,
        bankName: bank.name,
        accountNumber,
        accountName,
        paystackSubaccountCode: subaccountCode,
      },
      select: {
        bankCode: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        paystackSubaccountCode: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Informations bancaires enregistrées et compte Paystack configuré',
      data: {
        bankCode: updatedUser.bankCode,
        bankName: updatedUser.bankName,
        accountNumber: updatedUser.accountNumber,
        accountName: updatedUser.accountName,
        hasSubaccount: !!updatedUser.paystackSubaccountCode,
        subaccountCode: updatedUser.paystackSubaccountCode,
      },
    });
  } catch (error) {
    console.error('Error saving bank info:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement' },
      { status: 500 }
    );
  }
}
