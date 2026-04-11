'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, MapPin, Truck, CreditCard, Info, Calculator, Weight } from 'lucide-react';

const getTodayString = () => new Date().toISOString().split('T')[0];

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  type: string;
  pricePerDay: number | null;
  pricePerKm: number | null;
  pricePerTonneKm: number | null;
  pricingType: string;
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
}

export default function BookingModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startLocation: vehicle.location || '',
    endLocation: '',
    customPrice: '',
    tonnage: '',
    distanceKm: '',
    minBudget: '',
    maxBudget: '',
  });

  const { numberOfDays, suggestedPrice } = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return { numberOfDays: 0, suggestedPrice: 0 };

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { numberOfDays: 0, suggestedPrice: 0 };

    let price = 0;
    if (vehicle.pricingType === 'PER_DAY') {
      price = days * (vehicle.pricePerDay || 0);
    } else if (vehicle.pricingType === 'PER_KM') {
      const km = parseFloat(formData.distanceKm) || 0;
      price = km * (vehicle.pricePerKm || 0);
    } else if (vehicle.pricingType === 'PER_TONNE_KM') {
      const t = parseFloat(formData.tonnage) || 0;
      const km = parseFloat(formData.distanceKm) || 0;
      price = t * km * (vehicle.pricePerTonneKm || 0);
    }

    return { numberOfDays: days, suggestedPrice: price };
  }, [formData.startDate, formData.endDate, formData.tonnage, formData.distanceKm, vehicle]);

  const totalPrice = formData.customPrice ? parseFloat(formData.customPrice) : suggestedPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (numberOfDays <= 0) {
      alert('La date de fin doit être après la date de début');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          startLocation: formData.startLocation,
          endLocation: formData.endLocation,
          numberOfDays,
          pricePerDay: vehicle.pricePerDay,
          initialPrice: totalPrice,
          minBudget: formData.minBudget ? parseFloat(formData.minBudget) : null,
          maxBudget: formData.maxBudget ? parseFloat(formData.maxBudget) : null,
        }),
      });
      if (res.ok) {
        onClose();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error creating booking', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPriceTonneKm = vehicle.pricingType === 'PER_TONNE_KM';
  const isPricePerKm = vehicle.pricingType === 'PER_KM';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full relative max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{vehicle.brand} {vehicle.model}</h2>
              <p className="text-sm text-slate-500">{vehicle.type}</p>
            </div>
          </div>

          {/* Show freteur's price range if set */}
          {(vehicle.minPrice || vehicle.maxPrice) && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              <Info className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                Fourchette indicative du propriétaire :{' '}
                {vehicle.minPrice ? <strong>{vehicle.minPrice.toLocaleString()} FCFA</strong> : '?'}
                {' → '}
                {vehicle.maxPrice ? <strong>{vehicle.maxPrice.toLocaleString()} FCFA</strong> : '?'}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Dates */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              Période de location
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date début</label>
                <input
                  type="date"
                  required
                  min={getTodayString()}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date fin</label>
                <input
                  type="date"
                  required
                  min={formData.startDate || getTodayString()}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Tonne-km inputs */}
          {(isPriceTonneKm || isPricePerKm) && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Weight className="h-4 w-4 text-slate-400" />
                Détails du transport
              </label>
              <div className="grid grid-cols-2 gap-3">
                {isPriceTonneKm && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tonnage (T)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      placeholder="Ex: 20"
                      className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={formData.tonnage}
                      onChange={(e) => setFormData({ ...formData, tonnage: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Distance estimée (km)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Ex: 300"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.distanceKm}
                    onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Locations */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              Trajet
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Lieu de départ</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Abidjan, Zone Industrielle"
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={formData.startLocation}
                  onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Lieu d&#39;arrivée</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: San Pedro, Port"
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={formData.endLocation}
                  onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <CreditCard className="h-4 w-4 text-slate-400" />
              Prix proposé
            </label>

            {suggestedPrice > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 mb-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-slate-700">Calcul automatique</span>
                </div>
                {isPriceTonneKm ? (
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-slate-500 text-xs">Tarif</p>
                      <p className="font-bold text-slate-900">{vehicle.pricePerTonneKm} F/T·km</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-slate-500 text-xs">Tonnage</p>
                      <p className="font-bold text-slate-900">{formData.tonnage || '?'} T</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-slate-500 text-xs">Distance</p>
                      <p className="font-bold text-slate-900">{formData.distanceKm || '?'} km</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-blue-600 text-xs">Total</p>
                      <p className="font-bold text-blue-700">{suggestedPrice.toLocaleString()} F</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-slate-500 text-xs">{vehicle.pricingType === 'PER_DAY' ? 'Prix/jour' : 'Prix/km'}</p>
                      <p className="font-bold text-slate-900">{(vehicle.pricePerDay || vehicle.pricePerKm)?.toLocaleString()} F</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-slate-500 text-xs">{vehicle.pricingType === 'PER_DAY' ? 'Jours' : 'km'}</p>
                      <p className="font-bold text-slate-900">{vehicle.pricingType === 'PER_DAY' ? numberOfDays : formData.distanceKm || '?'}</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-blue-600 text-xs">Total suggéré</p>
                      <p className="font-bold text-blue-700">{suggestedPrice.toLocaleString()} F</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative mb-3">
              <input
                type="number"
                required
                min="1"
                className="w-full border border-slate-200 rounded-lg p-3 pr-16 text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={formData.customPrice || (suggestedPrice > 0 ? suggestedPrice : '')}
                onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
                placeholder="Entrez un prix"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">FCFA</span>
            </div>

            {/* Affréteur budget range */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2">Votre fourchette de budget (optionnel)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Budget plancher (FCFA)</label>
                  <input
                    type="number"
                    placeholder="Minimum"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 bg-white"
                    value={formData.minBudget}
                    onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Budget plafond (FCFA)</label>
                  <input
                    type="number"
                    placeholder="Maximum"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 bg-white"
                    value={formData.maxBudget}
                    onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">Visible par le propriétaire pour guider la négociation.</p>
            </div>

            <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                Vous pouvez proposer un prix différent du calcul pour négocier.
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70"
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
          <p className="text-xs text-slate-500 text-center mt-3">
            Le propriétaire recevra votre proposition et pourra l&#39;accepter, la refuser ou négocier.
          </p>
        </div>
      </div>
    </div>
  );
}
