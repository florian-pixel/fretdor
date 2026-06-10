'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Truck, MapPin, ToggleLeft, ToggleRight, Edit, Trash2,
  AlertTriangle, X, Calendar, Fuel, Settings, Weight, Box,
  FileText, Image as ImageIcon, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Shield, Car, Navigation, DollarSign,
  Clock, Hash, Palette, Zap
} from 'lucide-react';

interface Vehicle {
  id: string;
  type: string;
  brand: string;
  model: string;
  registrationNumber: string;
  firstRegistrationDate: string | null;
  trailerRegistrationNumber: string | null;
  color: string | null;
  capacityWeight: number | null;
  capacityVolume: number | null;
  isOffRoadCapable: boolean;
  hasDriver: boolean;
  hasConvoyeur: boolean;
  fuelType: string;
  transmission: string;
  location: string;
  pricingType: string;
  pricePerDay: number | null;
  pricePerKm: number | null;
  pricePerTonneKm: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  conditions: string | null;
  isAvailable: boolean;
  assuranceDocUrl: string | null;
  visiteTechniqueDocUrl: string | null;
  carteGriseDocUrl: string | null;
  patenteDocUrl: string | null;
  photoFrontUrl: string | null;
  photoRearUrl: string | null;
  photoLeftUrl: string | null;
  photoRightUrl: string | null;
  images: string[];
}

const PRICING_LABELS: Record<string, string> = {
  PER_DAY: 'Par jour',
  PER_KM: 'Par km',
  PER_TONNE_KM: 'Par tonne/km',
};

const FUEL_ICONS: Record<string, string> = {
  Diesel: '⛽',
  Essence: '🔥',
  Électrique: '⚡',
  Hybride: '🔋',
};

export default function VehicleDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && id) {
      fetch(`/api/vehicles/${id}`)
        .then(res => res.json())
        .then(data => {
          setVehicle(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, id]);

  const allPhotos = vehicle
    ? [
        vehicle.photoFrontUrl,
        vehicle.photoRearUrl,
        vehicle.photoLeftUrl,
        vehicle.photoRightUrl,
        ...(vehicle.images || []),
      ].filter(Boolean) as string[]
    : [];

  const formatPrice = (v: Vehicle) => {
    if (v.pricingType === 'PER_KM' && v.pricePerKm)
      return `${v.pricePerKm.toLocaleString()} FCFA/km`;
    if (v.pricingType === 'PER_TONNE_KM' && v.pricePerTonneKm)
      return `${v.pricePerTonneKm.toLocaleString()} FCFA/t·km`;
    if (v.pricePerDay)
      return `${v.pricePerDay.toLocaleString()} FCFA/jour`;
    return '—';
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Truck className="h-16 w-16 text-slate-300" />
        <p className="text-slate-500 text-lg">Véhicule introuvable</p>
        <Link href="/vehicles" className="text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium text-sm"
        >
          <ArrowLeft size={18} /> Retour aux véhicules
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/vehicles/${vehicle.id}/availability`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition text-sm font-medium"
          >
            <Calendar size={16} /> Indisponibilités
          </Link>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Photo Gallery */}
        <div className="relative bg-slate-100 aspect-video md:aspect-[21/8]">
          {allPhotos.length > 0 ? (
            <>
              <img
                src={allPhotos[activePhoto]}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhoto(p => (p - 1 + allPhotos.length) % allPhotos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActivePhoto(p => (p + 1) % allPhotos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
                  >
                    <ChevronRight size={18} />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allPhotos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`h-1.5 rounded-full transition-all ${i === activePhoto ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Truck className="h-16 w-16 text-slate-300" />
              <p className="text-slate-400 text-sm">Aucune photo</p>
            </div>
          )}

          {/* Availability badge */}
          <div
            className={`absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition ${
              vehicle.isAvailable
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-slate-600 hover:bg-slate-700 text-white'
            }`}
          >
            {vehicle.isAvailable ? 'Disponible' : 'Indisponible'}
          </div>

          {/* Type badge */}
          <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow">
            {vehicle.type}
          </span>
        </div>

        {/* Header info */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{vehicle.brand} {vehicle.model}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  <Hash size={14} /> {vehicle.registrationNumber}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  <MapPin size={14} /> {vehicle.location}
                </span>
                {vehicle.color && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-500 text-sm">
                      <Palette size={14} /> {vehicle.color}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{formatPrice(vehicle)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{PRICING_LABELS[vehicle.pricingType]}</p>
              {vehicle.minPrice && vehicle.maxPrice && (
                <p className="text-xs text-slate-400">
                  Min {vehicle.minPrice.toLocaleString()} — Max {vehicle.maxPrice.toLocaleString()} FCFA
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Caractéristiques */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Car size={18} className="text-blue-500" /> Caractéristiques
          </h2>
          <dl className="space-y-3">
            <DetailRow label="Type" value={vehicle.type} />
            <DetailRow label="Carburant" value={`${FUEL_ICONS[vehicle.fuelType] ?? ''} ${vehicle.fuelType}`} />
            <DetailRow label="Transmission" value={vehicle.transmission} />
            {vehicle.firstRegistrationDate && (
              <DetailRow
                label="1ère immatriculation"
                value={new Date(vehicle.firstRegistrationDate).toLocaleDateString('fr-FR')}
              />
            )}
            {vehicle.trailerRegistrationNumber && (
              <DetailRow label="Immat. remorque" value={vehicle.trailerRegistrationNumber} />
            )}
            {vehicle.color && <DetailRow label="Couleur" value={vehicle.color} />}
          </dl>
        </section>

        {/* Capacités */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Weight size={18} className="text-orange-500" /> Capacités & Options
          </h2>
          <dl className="space-y-3">
            {vehicle.capacityWeight != null && (
              <DetailRow label="Charge utile" value={`${vehicle.capacityWeight.toLocaleString()} kg`} />
            )}
            {vehicle.capacityVolume != null && (
              <DetailRow label="Volume" value={`${vehicle.capacityVolume.toLocaleString()} m³`} />
            )}
            <DetailRow
              label="Chauffeur inclus"
              value={<BoolBadge ok={vehicle.hasDriver} yes="Oui" no="Non" />}
            />
            <DetailRow
              label="Convoyeur inclus"
              value={<BoolBadge ok={vehicle.hasConvoyeur} yes="Oui" no="Non" />}
            />
            <DetailRow
              label="Tout-terrain"
              value={<BoolBadge ok={vehicle.isOffRoadCapable} yes="Capable" no="Non" />}
            />
          </dl>
        </section>

        {/* Tarification */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-green-500" /> Tarification
          </h2>
          <dl className="space-y-3">
            <DetailRow label="Mode de tarif" value={PRICING_LABELS[vehicle.pricingType] ?? vehicle.pricingType} />
            {vehicle.pricePerDay != null && (
              <DetailRow label="Prix / jour" value={`${vehicle.pricePerDay.toLocaleString()} FCFA`} />
            )}
            {vehicle.pricePerKm != null && (
              <DetailRow label="Prix / km" value={`${vehicle.pricePerKm.toLocaleString()} FCFA`} />
            )}
            {vehicle.pricePerTonneKm != null && (
              <DetailRow label="Prix / tonne·km" value={`${vehicle.pricePerTonneKm.toLocaleString()} FCFA`} />
            )}
            {vehicle.minPrice != null && (
              <DetailRow label="Prix minimum" value={`${vehicle.minPrice.toLocaleString()} FCFA`} />
            )}
            {vehicle.maxPrice != null && (
              <DetailRow label="Prix maximum" value={`${vehicle.maxPrice.toLocaleString()} FCFA`} />
            )}
          </dl>
          {vehicle.conditions && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600">
              <p className="font-medium text-slate-700 mb-1">Conditions</p>
              <p>{vehicle.conditions}</p>
            </div>
          )}
        </section>
      </div>

      {/* Photos gallery grid */}
      {allPhotos.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-pink-500" /> Photos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { url: vehicle.photoFrontUrl, label: 'Avant' },
              { url: vehicle.photoRearUrl, label: 'Arrière' },
              { url: vehicle.photoLeftUrl, label: 'Gauche' },
              { url: vehicle.photoRightUrl, label: 'Droite' },
              ...(vehicle.images || []).map((url, i) => ({ url, label: `Photo ${i + 1}` })),
            ]
              .filter(p => p.url)
              .map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                    activePhoto === i ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={p.url!} alt={p.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs text-center py-1">
                    {p.label}
                  </span>
                </button>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 text-right">{value ?? '—'}</dd>
    </div>
  );
}

function BoolBadge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
      <CheckCircle2 size={14} /> {yes}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <XCircle size={14} /> {no}
    </span>
  );
}