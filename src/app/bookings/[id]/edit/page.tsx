'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Calendar, MapPin, Package, Save, AlertTriangle } from 'lucide-react';

interface Booking {
  id: string;
  affreteurId: string;
  vehicle: { brand: string; model: string; registrationNumber: string };
  startDate: string;
  endDate: string;
  startLocation: string;
  endLocation: string;
  status: string;
  numberOfDays: number;
  pricePerDay: number;
  initialPrice: number;
  minBudget: number | null;
  maxBudget: number | null;
}

const EDITABLE_STATUSES = ['PENDING'];

const toDateInput = (iso: string) => iso.slice(0, 10);

function diffDays(start: string, end: string) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export default function EditBookingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [initialPrice, setInitialPrice] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id) return;

    fetch(`/api/bookings/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || !data.vehicle) {
          setBooking(null);
          return;
        }
        setBooking(data);
        setStartDate(toDateInput(data.startDate));
        setEndDate(toDateInput(data.endDate));
        setStartLocation(data.startLocation ?? '');
        setEndLocation(data.endLocation ?? '');
        setMinBudget(data.minBudget != null ? String(data.minBudget) : '');
        setMaxBudget(data.maxBudget != null ? String(data.maxBudget) : '');
        setInitialPrice(data.initialPrice != null ? String(data.initialPrice) : '');
      })
      .catch((err) => {
        console.error('fetch error:', err);
        setBooking(null);
      })
      .finally(() => setLoading(false));
  }, [user, id]);

  const numberOfDays = useMemo(() => diffDays(startDate, endDate), [startDate, endDate]);
  const estimatedPrice = booking ? numberOfDays * booking.pricePerDay : 0;

  const validate = (): string | null => {
    if (!startDate || !endDate) return 'Les dates sont obligatoires.';
    if (new Date(endDate) < new Date(startDate)) return 'La date de fin doit être après la date de début.';
    if (!startLocation.trim() || !endLocation.trim()) return 'Le départ et la destination sont obligatoires.';
    if (minBudget && maxBudget && Number(minBudget) > Number(maxBudget)) {
      return 'Le budget minimum ne peut pas dépasser le maximum.';
    }
    if (!initialPrice || Number(initialPrice) <= 0) return 'Le prix initial est obligatoire.';
    return null;
  };

  const handleSubmit = async () => {
    if (!booking) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        action: 'update',
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        startLocation: startLocation.trim(),
        endLocation: endLocation.trim(),
        numberOfDays,
        initialPrice: Number(initialPrice),
        minBudget: minBudget ? Number(minBudget) : null,
        maxBudget: maxBudget ? Number(maxBudget) : null,
      };
      console.log('PUT payload:', payload);

      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      console.log('PUT raw response:', res.status, raw);
      const data = (() => {
        try { return JSON.parse(raw); } catch { return null; }
      })();

      if (!res.ok) {
        console.error('update failed:', res.status, data ?? raw);
        setError(data?.error || data?.message || raw || `Erreur ${res.status}`);
        return;
      }

      router.push(`/bookings/${booking.id}`);
      router.refresh();
    } catch (e) {
      console.error(e);
      setError('Erreur réseau, réessayez.');
    } finally {
      setSaving(false);
    }
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
        <Link href="/dashboard" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Retour aux réservations
        </Link>
      </div>
    );
  }

  const isAffreteur = user.id === booking.affreteurId;
  const canEdit = isAffreteur && EDITABLE_STATUSES.includes(booking.status);

  if (!canEdit) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="h-16 w-16 text-amber-400" />
        <p className="text-slate-600 text-lg">
          {isAffreteur
            ? 'Cette réservation ne peut plus être modifiée.'
            : "Vous n'avez pas l'autorisation de modifier cette réservation."}
        </p>
        <Link
          href={`/bookings/${booking.id}`}
          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={16} /> Retour à la réservation
        </Link>
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href={`/bookings/${booking.id}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium text-sm"
      >
        <ArrowLeft size={18} /> Retour à la réservation
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Modifier la réservation</h1>
        <p className="text-sm text-slate-500 mt-1">
          {booking.vehicle.brand} {booking.vehicle.model} · {booking.vehicle.registrationNumber}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        {/* Trajet */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <MapPin size={18} className="text-blue-500" /> Trajet
          </h2>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Départ</label>
            <input
              type="text"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Destination</label>
            <input
              type="text"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              className={inputClass}
            />
          </div>
        </section>

        {/* Dates */}
        <section className="space-y-4 pt-6 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-purple-500" /> Dates
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date de fin</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Durée</p>
              <p className="text-sm font-bold text-slate-800">
                {numberOfDays} jour{numberOfDays > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Prix initial estimé</p>
              <p className="text-sm font-bold text-slate-800">{estimatedPrice.toLocaleString()} FCFA</p>
            </div>
          </div>
        </section>

        {/* Prix */}
        <section className="space-y-4 pt-6 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Prix initial</h2>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Prix initial (FCFA)</label>
            <input
              type="number"
              min={0}
              value={initialPrice}
              onChange={(e) => setInitialPrice(e.target.value)}
              className={inputClass}
            />
          </div>
        </section>

        {/* Budget */}
        <section className="space-y-4 pt-6 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Budget (optionnel)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Minimum (FCFA)</label>
              <input
                type="number"
                min={0}
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Maximum (FCFA)</label>
              <input
                type="number"
                min={0}
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Link
            href={`/bookings/${booking.id}`}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium text-sm"
          >
            Annuler
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save size={16} />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}