'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('Référence de paiement manquante');
      return;
    }

    // Vérifier le paiement
    fetch(`/api/payments/verify?reference=${reference}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage('Votre paiement a été confirmé avec succès !');
          setBookingId(data.data?.bookingId);
        } else {
          setStatus('error');
          setMessage(data.message || 'Le paiement n\'a pas pu être vérifié');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Erreur lors de la vérification du paiement');
      });
  }, [reference]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Vérification en cours...</h1>
            <p className="text-slate-500">Veuillez patienter pendant que nous vérifions votre paiement.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 rounded-full p-4 w-fit mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Paiement réussi !</h1>
            <p className="text-slate-500 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              {bookingId && (
                <Link
                  href={`/dashboard?booking=${bookingId}`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Voir ma réservation
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-100 rounded-full p-4 w-fit mx-auto mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Échec du paiement</h1>
            <p className="text-slate-500 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.back()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Réessayer
              </button>
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
