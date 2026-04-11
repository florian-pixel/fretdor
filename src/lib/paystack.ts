// Paystack API Integration

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Liste des banques de Côte d'Ivoire supportées par Paystack
// Note: En mode test, Paystack accepte le code "057" (Zenith Bank) pour les tests
export const IVORIAN_BANKS = [
  { code: '057', name: 'Compte Test (Zenith Bank)' }, // Pour les tests
  { code: '134', name: 'NSIA Banque Côte d\'Ivoire' },
  { code: '044', name: 'Access Bank' },
  { code: '084', name: 'Atlantic Business International' },
  { code: '129', name: 'Banque Atlantique Côte d\'Ivoire' },
  { code: '027', name: 'Bank of Africa Côte d\'Ivoire' },
  { code: '046', name: 'BICICI' },
  { code: '149', name: 'Bridge Bank Group Côte d\'Ivoire' },
  { code: '087', name: 'Coris Bank International CI' },
  { code: '085', name: 'Ecobank Côte d\'Ivoire' },
  { code: '065', name: 'GT Bank Côte d\'Ivoire' },
  { code: '137', name: 'Orabank Côte d\'Ivoire' },
  { code: '059', name: 'SIB (Société Ivoirienne de Banque)' },
  { code: '089', name: 'SGCI (Société Générale CI)' },
  { code: '060', name: 'UBA Côte d\'Ivoire' },
  { code: '062', name: 'Versus Bank' },
];

interface InitializePaymentParams {
  email: string;
  amount: number; // en FCFA
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  subaccount?: string; // Code du subaccount pour split payment
  transaction_charge?: number; // Commission plateforme en FCFA (centimes)
  bearer?: 'account' | 'subaccount'; // Qui paie les frais Paystack
}

interface MobileMoneyChargeParams {
  email: string;
  amount: number; // en FCFA
  phone: string;
  provider: 'mtn' | 'orange' | 'wave';
  reference?: string;
  metadata?: Record<string, unknown>;
}

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface InitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface ChargeData {
  reference: string;
  status: string;
  display_text?: string;
}

interface VerifyData {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  paid_at: string;
  customer: {
    email: string;
  };
  metadata: Record<string, unknown>;
}

// Générer une référence unique
export function generateReference(): string {
  return `FRET_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Initialiser un paiement (redirection vers page Paystack)
export async function initializePayment(params: InitializePaymentParams): Promise<PaystackResponse<InitializeData>> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100, // Paystack utilise les sous-unités (kobo/centimes)
      reference: params.reference || generateReference(),
      callback_url: params.callback_url,
      metadata: params.metadata,
      currency: 'XOF', // Franc CFA
      // Split payment params
      ...(params.subaccount && { subaccount: params.subaccount }),
      ...(params.transaction_charge && { transaction_charge: params.transaction_charge }),
      ...(params.bearer && { bearer: params.bearer }),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erreur lors de l\'initialisation du paiement');
  }

  return data;
}

// Charge Mobile Money (MTN, Orange, Wave)
export async function chargeMobileMoney(params: MobileMoneyChargeParams): Promise<PaystackResponse<ChargeData>> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/charge`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100, // Paystack utilise les sous-unités
      currency: 'XOF',
      reference: params.reference || generateReference(),
      mobile_money: {
        phone: params.phone,
        provider: params.provider,
      },
      metadata: params.metadata,
    }),
  });

  const data = await response.json();

  // Debug: log la réponse Paystack
  console.log('Paystack response:', JSON.stringify(data, null, 2));

  // "Charge attempted" n'est pas une erreur - c'est le flux normal pour Mobile Money
  // qui nécessite une validation OTP ou confirmation
  // Paystack retourne status=false mais c'est le comportement attendu
  if (!response.ok && !data.message?.includes('Charge attempted')) {
    throw new Error(data.message || 'Erreur lors de l\'initiation du paiement Mobile Money');
  }

  return data;
}

// Vérifier un paiement
export async function verifyPayment(reference: string): Promise<PaystackResponse<VerifyData>> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erreur lors de la vérification du paiement');
  }

  return data;
}

// Vérifier le statut d'une charge en attente
export async function checkPendingCharge(reference: string): Promise<PaystackResponse<ChargeData>> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/charge/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erreur lors de la vérification de la charge');
  }

  return data;
}

// ===== SUBACCOUNTS (Split Payments) =====

interface CreateSubaccountParams {
  business_name: string;
  bank_code: string;
  account_number: string;
  percentage_charge: number; // Pourcentage que reçoit le compte principal (FRETDOR)
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
}

interface SubaccountData {
  subaccount_code: string;
  business_name: string;
  account_number: string;
  percentage_charge: number;
  settlement_bank: string;
  account_name: string;
  currency: string;
  active: number;
}

// Créer un subaccount pour un fréteur
export async function createSubaccount(params: CreateSubaccountParams): Promise<PaystackResponse<SubaccountData>> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_name: params.business_name,
      bank_code: params.bank_code,
      account_number: params.account_number,
      percentage_charge: params.percentage_charge,
      primary_contact_email: params.primary_contact_email,
      primary_contact_name: params.primary_contact_name,
      primary_contact_phone: params.primary_contact_phone,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erreur lors de la création du subaccount');
  }

  return data;
}

// Mettre à jour un subaccount
export async function updateSubaccount(
  subaccountCode: string,
  params: Partial<CreateSubaccountParams>
): Promise<PaystackResponse<SubaccountData>> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount/${subaccountCode}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erreur lors de la mise à jour du subaccount');
  }

  return data;
}

// Récupérer un subaccount
export async function getSubaccount(subaccountCode: string): Promise<PaystackResponse<SubaccountData>> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount/${subaccountCode}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erreur lors de la récupération du subaccount');
  }

  return data;
}
