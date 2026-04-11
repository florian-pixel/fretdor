'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Phone, Mail, Clock, CheckCircle, XCircle, MessageSquare, Star, Check, CreditCard, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  affreteurId: string;
  vehicle: {
    brand: string;
    model: string;
    registrationNumber: string;
    ownerId: string;
    owner?: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
    };
  };
  affreteur: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  startDate: string;
  endDate: string;
  startLocation: string;
  endLocation: string;
  status: string;
  paymentStatus?: string;
  numberOfDays: number;
  pricePerDay: number;
  initialPrice: number;
  agreedPrice: number | null;
  // Commission fields
  commissionRate?: number;
  commissionAmount?: number;
  netAmount?: number;
  negotiations: {
    id: string;
    price: number;
    proposerId: string;
    createdAt: string;
  }[];
  reviews?: {
    id: string;
    reviewerId: string;
  }[];
}

export default function BookingList({ role, userId }: { role: string, userId: string }) {
  const searchParams = useSearchParams();
  const highlightedBookingId = searchParams.get('booking');
  const highlightRef = useRef<HTMLDivElement>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [negotiationPrice, setNegotiationPrice] = useState<{ [key: string]: string }>({});
  const [reviewModal, setReviewModal] = useState<{ bookingId: string; revieweeId: string; revieweeName: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(highlightedBookingId);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ bookingId: string; amount: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo'>('card');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'orange' | 'wave'>('orange');
  const [pendingPaymentRef, setPendingPaymentRef] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(5);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionRate = async () => {
    try {
      const res = await fetch('/api/settings/commission');
      const data = await res.json();
      setCommissionRate(data.commissionRate || 5);
    } catch (error) {
      console.error('Error fetching commission rate', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchCommissionRate();
  }, []);

  // Scroll to highlighted booking when loaded
  useEffect(() => {
    if (highlightedBookingId && !loading && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Remove highlight after 5 seconds
      const timer = setTimeout(() => setHighlightedId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedBookingId, loading]);

  const handleAction = async (id: string, action: 'accept' | 'reject' | 'negotiate') => {
    const body: { action: string; price?: string } = { action };
    if (action === 'negotiate') {
      body.price = negotiationPrice[id];
    }

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchBookings();
        setNegotiationPrice({ ...negotiationPrice, [id]: '' });
      }
    } catch (error) {
      console.error('Error updating booking', error);
    }
  };

  const openPaymentModal = (bookingId: string, amount: number) => {
    setPaymentModal({ bookingId, amount });
    setPaymentMethod('card');
    setMomoPhone('');
    setMomoProvider('orange');
    setPendingPaymentRef(null);
  };

  const handlePayment = async () => {
    if (!paymentModal) return;
    setPayingBookingId(paymentModal.bookingId);

    try {
      if (paymentMethod === 'card') {
        // Paiement par carte - redirection vers Paystack
        const res = await fetch('/api/payments/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: paymentModal.bookingId }),
        });
        const data = await res.json();
        if (data.success && data.data?.authorization_url) {
          window.location.href = data.data.authorization_url;
        } else {
          showToast('error', data.error || 'Erreur lors de l\'initialisation du paiement');
        }
      } else {
        // Paiement Mobile Money
        if (!momoPhone) {
          showToast('error', 'Veuillez entrer votre numéro de téléphone');
          setPayingBookingId(null);
          return;
        }

        const res = await fetch('/api/payments/mobile-money', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: paymentModal.bookingId,
            phone: momoPhone,
            provider: momoProvider,
          }),
        });
        const data = await res.json();

        if (data.success) {
          setPendingPaymentRef(data.data.reference);
          if (data.status === 'otp_required') {
            setOtpRequired(true);
            setOtpValue('');
            showToast('info', 'Entrez le code OTP reçu par SMS');
          } else if (data.status === 'pending_confirmation') {
            showToast('info', data.message || 'Veuillez confirmer le paiement sur votre téléphone');
          } else if (data.status === 'pending') {
            showToast('info', 'Paiement en cours de traitement. Vérifiez le statut dans quelques instants.');
          }
        } else {
          showToast('error', data.error || 'Erreur lors de l\'initialisation du paiement');
        }
      }
    } catch (error) {
      console.error('Error initializing payment', error);
      showToast('error', 'Erreur lors de l\'initialisation du paiement');
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleSubmitOtp = async () => {
    if (!pendingPaymentRef || !otpValue) return;
    setSubmittingOtp(true);

    try {
      const res = await fetch('/api/payments/submit-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: pendingPaymentRef,
          otp: otpValue,
        }),
      });
      const data = await res.json();

      if (data.success && data.status === 'success') {
        showToast('success', 'Paiement confirmé avec succès !');
        setPaymentModal(null);
        setPendingPaymentRef(null);
        setOtpRequired(false);
        setOtpValue('');
        fetchBookings();
      } else if (data.status === 'pending') {
        showToast('info', data.message || 'Paiement en cours de traitement...');
      } else {
        showToast('error', data.error || 'Erreur lors de la validation de l\'OTP');
      }
    } catch (error) {
      console.error('Error submitting OTP', error);
      showToast('error', 'Erreur lors de la validation de l\'OTP');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!pendingPaymentRef) return;
    setCheckingPayment(true);

    try {
      const res = await fetch(`/api/payments/status?reference=${pendingPaymentRef}`);
      const data = await res.json();

      if (data.success && data.status === 'success') {
        showToast('success', 'Paiement confirmé !');
        setPaymentModal(null);
        setPendingPaymentRef(null);
        setOtpRequired(false);
        fetchBookings();
      } else {
        showToast('info', data.message || 'Paiement en attente...');
      }
    } catch (error) {
      console.error('Error checking payment', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error completing booking', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reviewModal.bookingId,
          revieweeId: reviewModal.revieweeId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewModal(null);
        setReviewRating(5);
        setReviewComment('');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error submitting review', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const hasReviewed = (booking: Booking) => {
    return booking.reviews?.some(r => r.reviewerId === userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Aucune réservation</h3>
        <p className="text-slate-500 mt-1">
          {role === 'FRETEUR' ? "Vous n'avez pas encore reçu de demandes" : "Vous n'avez pas encore fait de réservation"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-100 max-w-sm p-4 rounded-lg shadow-lg border animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-start gap-3">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />}
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-auto -mr-1 -mt-1 p-1 rounded hover:bg-black/5"
            >
              <XCircle className="h-4 w-4 opacity-50" />
            </button>
          </div>
        </div>
      )}

      {bookings.map((booking) => {
        const lastNegotiation = booking.negotiations[0];
        const currentPrice = lastNegotiation ? lastNegotiation.price : booking.initialPrice;
        const lastProposerId = lastNegotiation ? lastNegotiation.proposerId : booking.affreteurId;
        const isMyTurn = lastProposerId !== userId;
        const isFinal = ['ACCEPTED', 'CONFIRMED', 'COMPLETED', 'PAID', 'REJECTED', 'CANCELLED'].includes(booking.status);

        const statusConfig = {
          PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En attente' },
          NEGOTIATING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Négociation' },
          CONFIRMED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Confirmée' },
          ACCEPTED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Validé' },
          PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Payé' },
          COMPLETED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Terminée' },
          REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Refusé' },
          CANCELLED: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'Annulé' },
        };
        const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.PENDING;
        const isHighlighted = highlightedId === booking.id;

        return (
          <div
            key={booking.id}
            ref={isHighlighted ? highlightRef : null}
            className={`bg-white border ${status.border} rounded-xl overflow-hidden transition-all hover:shadow-md ${
              isHighlighted ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg animate-pulse' : ''
            }`}
          >
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {booking.vehicle.brand} {booking.vehicle.model}
                    </h3>
                    <span className={`${status.bg} ${status.text} px-2.5 py-1 rounded-full text-xs font-medium`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>
                        {format(new Date(booking.startDate), 'dd MMM yyyy', { locale: fr })} → {format(new Date(booking.endDate), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{booking.startLocation} → {booking.endLocation}</span>
                    </div>
                  </div>

                  {/* Contact Info - Only shown when accepted/confirmed/paid */}
                  {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || booking.status === 'PAID') && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs font-medium text-green-800 mb-2">Informations de contact</p>
                      {role === 'FRETEUR' && booking.affreteur.phone && (
                        <div className="space-y-1">
                          <p className="text-sm text-green-700 flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" /> {booking.affreteur.phone}
                          </p>
                          {booking.affreteur.email && (
                            <p className="text-sm text-green-700 flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5" /> {booking.affreteur.email}
                            </p>
                          )}
                        </div>
                      )}
                      {role === 'AFFRETEUR' && booking.vehicle.owner?.phone && (
                        <div className="space-y-1">
                          <p className="text-sm text-green-700 flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" /> {booking.vehicle.owner.phone}
                          </p>
                          {booking.vehicle.owner.email && (
                            <p className="text-sm text-green-700 flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5" /> {booking.vehicle.owner.email}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Payment button for affréteur when booking is accepted/confirmed but not paid */}
                      {role === 'AFFRETEUR' && (booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED') && booking.paymentStatus !== 'PAID' && (
                        <button
                          onClick={() => openPaymentModal(booking.id, booking.agreedPrice || booking.initialPrice)}
                          className="mt-3 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                        >
                          <CreditCard className="h-4 w-4" />
                          Payer maintenant
                        </button>
                      )}

                      {/* Payment status indicator */}
                      {booking.paymentStatus === 'PAID' && (
                        <div className="mt-3 flex items-center gap-2 text-green-700 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Paiement effectué
                        </div>
                      )}

                      {/* Mark as complete button */}
                      {role === 'FRETEUR' && (booking.status === 'PAID' || booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleMarkComplete(booking.id)}
                          className="mt-3 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                        >
                          <Check className="h-4 w-4" />
                          Marquer comme terminée
                        </button>
                      )}
                    </div>
                  )}

                  {/* Completed - Leave review */}
                  {booking.status === 'COMPLETED' && (
                    <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <p className="text-xs font-medium text-indigo-800 mb-2">Course terminée</p>
                      {hasReviewed(booking) ? (
                        <p className="text-sm text-indigo-700 flex items-center gap-2">
                          <Star className="h-4 w-4 fill-current" /> Vous avez déjà laissé un avis
                        </p>
                      ) : (
                        <button
                          onClick={() => setReviewModal({
                            bookingId: booking.id,
                            revieweeId: role === 'FRETEUR' ? booking.affreteur.id : booking.vehicle.owner!.id,
                            revieweeName: role === 'FRETEUR' ? booking.affreteur.name : booking.vehicle.owner!.name,
                          })}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                        >
                          <Star className="h-4 w-4" />
                          Laisser un avis
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  {/* For Affréteur: show total amount */}
                  {role === 'AFFRETEUR' && (
                    <>
                      <p className="text-xs text-slate-500 mb-1">Montant total</p>
                      <p className="text-2xl font-bold text-slate-900">{(booking.agreedPrice || currentPrice).toLocaleString()} <span className="text-sm font-normal">FCFA</span></p>
                    </>
                  )}

                  {/* For Fréteur: show net amount after commission */}
                  {role === 'FRETEUR' && (
                    <>
                      <p className="text-xs text-slate-500 mb-1">Vous recevrez</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {(booking.netAmount || booking.agreedPrice || currentPrice).toLocaleString()} <span className="text-sm font-normal">FCFA</span>
                      </p>
                      {booking.commissionRate && booking.commissionRate > 0 && (
                        <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                          <p>Montant brut: {(booking.agreedPrice || currentPrice).toLocaleString()} FCFA</p>
                          <p>Commission FRETDOR ({booking.commissionRate}%): -{booking.commissionAmount?.toLocaleString()} FCFA</p>
                        </div>
                      )}
                    </>
                  )}

                  {booking.numberOfDays && booking.pricePerDay && (
                    <p className="text-xs text-slate-400 mt-1">
                      {booking.pricePerDay.toLocaleString()} FCFA × {booking.numberOfDays} jour{booking.numberOfDays > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!isFinal && isMyTurn && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    <p className="text-sm font-medium text-slate-700">Action requise</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={negotiationPrice[booking.id] || ''}
                          onChange={(e) => setNegotiationPrice({ ...negotiationPrice, [booking.id]: e.target.value })}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Contre-proposition (FCFA)"
                        />
                        <button
                          onClick={() => handleAction(booking.id, 'negotiate')}
                          disabled={!negotiationPrice[booking.id]}
                          className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition disabled:opacity-50"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Proposer
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(booking.id, 'accept')}
                        className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accepter
                      </button>
                      <button
                        onClick={() => handleAction(booking.id, 'reject')}
                        className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                      >
                        <XCircle className="h-4 w-4" />
                        Refuser
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isFinal && !isMyTurn && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-sm text-slate-500 italic flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    En attente de la réponse de l&#39;autre partie...
                  </p>
                </div>
              )}

              {/* Negotiation History */}
              {booking.negotiations.length > 1 && (
                <details className="mt-4">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                    Voir l&#39;historique ({booking.negotiations.length} propositions)
                  </summary>
                  <div className="mt-2 space-y-1">
                    {booking.negotiations.map((neg) => (
                      <div key={neg.id} className="flex justify-between text-xs text-slate-500 py-1">
                        <span>{neg.price.toLocaleString()} FCFA</span>
                        <span>{format(new Date(neg.createdAt), 'dd/MM HH:mm')}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        );
      })}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Laisser un avis pour {reviewModal.revieweeName}
            </h3>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Note</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= reviewRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Décrivez votre expérience..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReviewModal(null);
                  setReviewRating(5);
                  setReviewComment('');
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submittingReview ? 'Envoi...' : 'Envoyer l\'avis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Payer la réservation</h3>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {paymentModal.amount.toLocaleString()} <span className="text-sm font-normal">FCFA</span>
              </p>
            </div>

            <div className="p-5">
              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mode de paiement
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition ${
                      paymentMethod === 'card'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 mx-auto mb-1" />
                    Carte bancaire
                  </button>
                  <button
                    onClick={() => setPaymentMethod('momo')}
                    className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition ${
                      paymentMethod === 'momo'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Phone className="h-5 w-5 mx-auto mb-1" />
                    Mobile Money
                  </button>
                </div>
              </div>

              {/* Mobile Money Options */}
              {paymentMethod === 'momo' && (
                <div className="space-y-4">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Opérateur
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMomoProvider('orange')}
                        className={`flex-1 p-2 rounded-lg border-2 text-xs font-medium transition ${
                          momoProvider === 'orange'
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Orange Money
                      </button>
                      <button
                        onClick={() => setMomoProvider('mtn')}
                        className={`flex-1 p-2 rounded-lg border-2 text-xs font-medium transition ${
                          momoProvider === 'mtn'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        MTN MoMo
                      </button>
                      {/* Wave désactivé temporairement - nécessite une intégration spécifique */}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      placeholder="Ex: 0700000000"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      disabled={otpRequired}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Test Orange: 0700000000 (OTP: 1234) | Test MTN: 0551234987 (sans OTP)
                    </p>
                  </div>

                  {/* OTP Input - Shown after payment initiation */}
                  {otpRequired && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Code OTP reçu par SMS
                      </label>
                      <input
                        type="text"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value)}
                        placeholder="Entrez le code OTP"
                        maxLength={6}
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <p className="text-xs text-amber-600 mt-2">
                        En mode test Orange, utilisez: <span className="font-bold">1234</span>
                      </p>
                      <button
                        onClick={handleSubmitOtp}
                        disabled={submittingOtp || otpValue.length < 4}
                        className="w-full mt-3 p-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingOtp ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Validation...
                          </>
                        ) : (
                          'Valider le code OTP'
                        )}
                      </button>
                    </div>
                  )}

                  {/* Check Payment Status Button */}
                  {pendingPaymentRef && !otpRequired && (
                    <button
                      onClick={checkPaymentStatus}
                      disabled={checkingPayment}
                      className="w-full p-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition disabled:opacity-50"
                    >
                      {checkingPayment ? 'Vérification...' : 'J\'ai confirmé sur mon téléphone'}
                    </button>
                  )}
                </div>
              )}

              {/* Fee Info */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                <p className="font-medium mb-1">Commission FRETDOR : {commissionRate}%</p>
                <p className="text-slate-500">Cette commission sera prélevée sur le montant total pour assurer le bon fonctionnement de la plateforme.</p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  setPaymentModal(null);
                  setPendingPaymentRef(null);
                  setOtpRequired(false);
                  setOtpValue('');
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              {!otpRequired && (
                <button
                  onClick={handlePayment}
                  disabled={payingBookingId === paymentModal.bookingId || (paymentMethod === 'momo' && !momoPhone)}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payingBookingId === paymentModal.bookingId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Payer'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
