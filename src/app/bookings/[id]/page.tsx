'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Truck, MapPin, Calendar, Clock, User, DollarSign,
  CheckCircle2, XCircle, AlertTriangle, X, MessageSquare,
  CreditCard, TrendingUp, Hash, Star, ChevronRight, Banknote,
  Package, Navigation, RefreshCw
} from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  type: string;
  photoFrontUrl: string | null;
  location: string;
}

interface Affreteur {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface Negotiation {
  id: string;
  proposedPrice: number;
  message: string | null;
  createdAt: string;
  proposedBy: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface Booking {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  affreteurId: string;
  affreteur: Affreteur;
  startDate: string;
  endDate: string;
  startLocation: string;
  endLocation: string;
  status: string;
  numberOfDays: number;
  pricePerDay: number;
  initialPrice: number;
  agreedPrice: number | null;
  minBudget: number | null;
  maxBudget: number | null;
  paymentReference: string | null;
  paymentStatus: string | null;
  paidAt: string | null;
  commissionRate: number | null;
  commissionAmount: number | null;
  netAmount: number | null;
  createdAt: string;
  updatedAt: string;
  negotiations: Negotiation[];
  reviews: Review[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:     { label: 'En attente',   color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  icon: <Clock size={14} /> },
  NEGOTIATING: { label: 'Négociation',  color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    icon: <MessageSquare size={14} /> },
  ACCEPTED:    { label: 'Acceptée',     color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: <CheckCircle2 size={14} /> },
  REJECTED:    { label: 'Refusée',      color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      icon: <XCircle size={14} /> },
  CANCELLED:   { label: 'Annulée',      color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-200',  icon: <X size={14} /> },
  PAID:        { label: 'Payée',        color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200', icon: <CreditCard size={14} /> },
  COMPLETED:   { label: 'Terminée',     color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200',icon: <CheckCircle2 size={14} /> },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'text-amber-600' },
  PAID:    { label: 'Payé',       color: 'text-green-600' },
  FAILED:  { label: 'Échoué',     color: 'text-red-600' },
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtFull(date: string) {
  return new Date(date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function BookingDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
  if (user && id) {
    console.log('fetching booking with id:', id); // 👈
    fetch(`/api/bookings/${id}`)
      .then(res => {
        console.log('response status:', res.status); // 👈
        return res.json();
      })
      .then(data => {
        console.log('booking data:', data); // 👈
        setBooking(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('fetch error:', err);
        setLoading(false);
      });
  }
}, [user, id]);

  const cancelBooking = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        setBooking({ ...booking, status: 'CANCELLED' });
        setCancelModal(false);
      }
    } catch (e) { console.error(e); }
    setCancelling(false);
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Package className="h-16 w-16 text-slate-300" />
        <p className="text-slate-500 text-lg">Réservation introuvable</p>
        <Link href="/bookings" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Retour aux réservations
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG['PENDING'];
  const canCancel = ['PENDING', 'NEGOTIATING', 'ACCEPTED'].includes(booking.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          key={booking.id}
              href={`/dashboard`}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium text-sm"
        >
          <ArrowLeft size={18} /> Retour aux réservations
        </Link>
        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              onClick={() => setCancelModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition text-sm font-medium"
            >
              <X size={16} /> Annuler la réservation
            </button>
          )}
          {booking.status === 'NEGOTIATING' && (
            <Link
              href={`/bookings/${booking.id}/negotiate`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <MessageSquare size={16} /> Voir la négociation
            </Link>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Vehicle banner */}
        <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
          {booking.vehicle.photoFrontUrl && (
            <img
              src={booking.vehicle.photoFrontUrl}
              alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 p-6 flex items-end justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Véhicule</p>
              <h2 className="text-white text-xl font-bold">
                {booking.vehicle.brand} {booking.vehicle.model}
              </h2>
              <p className="text-white/70 text-sm">{booking.vehicle.registrationNumber} · {booking.vehicle.type}</p>
            </div>
            <Link
              href={`/vehicles/${booking.vehicleId}`}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition backdrop-blur-sm"
            >
              Voir le véhicule <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Header info */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.color}`}>
                {status.icon} {status.label}
              </span>
            </div>
            <p className="text-slate-400 text-xs flex items-center gap-1 mt-2">
              <Hash size={12} /> {booking.id}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">Créée le {fmtFull(booking.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              {(booking.agreedPrice ?? booking.initialPrice).toLocaleString()}
              <span className="text-sm font-normal text-slate-400 ml-1">FCFA</span>
            </p>
            <p className="text-xs text-slate-400">
              {booking.agreedPrice ? 'Prix négocié' : 'Prix initial'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trajet */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Navigation size={18} className="text-blue-500" /> Trajet
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <div className="w-0.5 h-8 bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Départ</p>
                  <p className="text-sm font-semibold text-slate-800">{booking.startLocation}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Destination</p>
                  <p className="text-sm font-semibold text-slate-800">{booking.endLocation}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar size={11} /> Date de début</p>
                <p className="text-sm font-semibold text-slate-800">{fmt(booking.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar size={11} /> Date de fin</p>
                <p className="text-sm font-semibold text-slate-800">{fmt(booking.endDate)}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-slate-500">Durée</p>
              <p className="text-sm font-bold text-slate-800">{booking.numberOfDays} jour{booking.numberOfDays > 1 ? 's' : ''}</p>
            </div>
          </div>
        </section>

        {/* Affréteur */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User size={18} className="text-purple-500" /> Affréteur
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-lg font-bold text-purple-600">
              {booking.affreteur.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{booking.affreteur.name}</p>
              <p className="text-sm text-slate-500">{booking.affreteur.email}</p>
              {booking.affreteur.phone && (
                <p className="text-sm text-slate-500">{booking.affreteur.phone}</p>
              )}
            </div>
          </div>
          {(booking.minBudget || booking.maxBudget) && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">Budget déclaré</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Minimum</p>
                  <p className="text-sm font-bold text-slate-700">{booking.minBudget?.toLocaleString() ?? '—'} FCFA</p>
                </div>
                <div className="h-px w-8 bg-slate-300" />
                <div className="text-right">
                  <p className="text-xs text-slate-400">Maximum</p>
                  <p className="text-sm font-bold text-slate-700">{booking.maxBudget?.toLocaleString() ?? '—'} FCFA</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Tarification */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-green-500" /> Tarification
          </h2>
          <dl className="space-y-3">
            <PriceRow label="Prix / jour" value={`${booking.pricePerDay.toLocaleString()} FCFA`} />
            <PriceRow label="Nombre de jours" value={`${booking.numberOfDays} j`} />
            <PriceRow label="Prix initial" value={`${booking.initialPrice.toLocaleString()} FCFA`} />
            {booking.agreedPrice != null && (
              <PriceRow
                label="Prix négocié"
                value={`${booking.agreedPrice.toLocaleString()} FCFA`}
                highlight
              />
            )}
          </dl>
          {booking.commissionRate != null && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Commission</p>
              <dl className="space-y-2">
                <PriceRow label={`Taux (${booking.commissionRate}%)`} value={`${booking.commissionAmount?.toLocaleString() ?? '—'} FCFA`} muted />
                <PriceRow label="Montant net fréteur" value={`${booking.netAmount?.toLocaleString() ?? '—'} FCFA`} highlight />
              </dl>
            </div>
          )}
        </section>

        {/* Paiement */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-500" /> Paiement
          </h2>
          {booking.paymentStatus ? (
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-500">Statut</dt>
                <dd className={`text-sm font-semibold ${PAYMENT_STATUS_CONFIG[booking.paymentStatus]?.color ?? 'text-slate-700'}`}>
                  {PAYMENT_STATUS_CONFIG[booking.paymentStatus]?.label ?? booking.paymentStatus}
                </dd>
              </div>
              {booking.paymentReference && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-slate-500">Référence</dt>
                  <dd className="text-sm font-mono font-medium text-slate-700">{booking.paymentReference}</dd>
                </div>
              )}
              {booking.paidAt && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-slate-500">Payé le</dt>
                  <dd className="text-sm font-medium text-slate-700">{fmtFull(booking.paidAt)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-2">
              <Banknote size={28} className="text-slate-200" />
              <p className="text-sm">Aucun paiement enregistré</p>
            </div>
          )}
        </section>
      </div>

      {/* Négociations */}
      {booking.negotiations.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" /> Historique des négociations
          </h2>
          <div className="space-y-3">
            {booking.negotiations.map((n, i) => (
              <div key={n.id} className="flex gap-4 items-start">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${n.proposedBy === booking.affreteurId ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {i + 1}
                  </div>
                  {i < booking.negotiations.length - 1 && (
                    <div className="w-0.5 h-4 bg-slate-200" />
                  )}
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">
                      {n.proposedBy === booking.affreteurId ? 'Affréteur' : 'Fréteur'}
                    </span>
                    {/* <span className="text-sm font-bold text-slate-800">{n.proposedPrice.toLocaleString()} FCFA</span> */}
                  </div>
                  {n.message && <p className="text-sm text-slate-600">{n.message}</p>}
                  <p className="text-xs text-slate-400 mt-1">{fmtFull(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Avis */}
      {booking.reviews.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-500" /> Avis
          </h2>
          <div className="space-y-4">
            {booking.reviews.map((r) => (
              <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                    />
                  ))}
                  <span className="text-xs text-slate-400 ml-auto">{fmt(r.createdAt)}</span>
                </div>
                {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Annuler la réservation</h3>
              <button onClick={() => setCancelModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-red-900">Attention !</p>
                  <p className="text-sm text-red-700 mt-1">
                    Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setCancelModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Retour
              </button>
              <button
                onClick={cancelBooking}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {cancelling && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function PriceRow({
  label, value, highlight, muted
}: {
  label: string; value: string; highlight?: boolean; muted?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${highlight ? 'pt-2 border-t border-slate-100' : ''}`}>
      <dt className={`text-sm ${muted ? 'text-slate-400' : 'text-slate-500'}`}>{label}</dt>
      <dd className={`text-sm font-semibold ${highlight ? 'text-green-600 text-base' : muted ? 'text-slate-400' : 'text-slate-800'}`}>
        {value}
      </dd>
    </div>
  );
}