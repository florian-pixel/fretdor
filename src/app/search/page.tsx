'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Truck, MapPin, Filter, Fuel, Users, Search, ChevronDown, FileText, Calendar, X, AlertCircle } from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BookedDate {
  startDate: string;
  endDate: string;
  startLocation?: string;
  endLocation?: string;
  type?: 'internal' | 'external';
  status?: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  type: string;
  location: string;
  pricePerDay: number | null;
  pricePerKm: number | null;
  pricePerTonneKm: number | null;
  pricingType: string;
  isOffRoadCapable: boolean;
  hasDriver: boolean;
  fuelType: string | null;
  imageUrl: string | null;
  conditions: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  owner: {
    name: string;
  };
}

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    isOffRoadCapable: false,
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewingConditions, setViewingConditions] = useState<Vehicle | null>(null);
  const [viewingDates, setViewingDates] = useState<{ vehicle: Vehicle; dates: BookedDate[] } | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchVehicles = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.location) params.append('location', filters.location);
    if (filters.isOffRoadCapable) params.append('isOffRoadCapable', 'true');

    const res = await fetch(`/api/vehicles?${params.toString()}`);
    const data = await res.json();
    setVehicles(data);
    setLoading(false);
  };

  const fetchBookedDates = async (vehicle: Vehicle) => {
    setLoadingDates(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/bookings`);
      const dates = await res.json();
      setViewingDates({ vehicle, dates });
    } catch (error) {
      console.error('Error fetching booked dates:', error);
    }
    setLoadingDates(false);
  };

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [filters, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trouver un véhicule</h1>
          <p className="text-slate-500 mt-1">Parcourez notre flotte de véhicules disponibles</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition md:hidden"
        >
          <Filter size={18} />
          Filtres
          <ChevronDown size={16} className={`transition ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 ${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
          <Filter size={18} className="text-blue-600" /> Filtres de recherche
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Type de véhicule</label>
            <select
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Tous les types</option>
              <option value="Plateau">Plateau</option>
              <option value="Benne">Benne</option>
              <option value="Citerne">Citerne</option>
              <option value="Frigo">Frigo</option>
              <option value="Bâché">Bâché</option>
              <option value="Porte-Char">Porte-Char</option>
              <option value="Fourgon">Fourgon</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Localisation</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ex: Abidjan"
                className="w-full pl-10 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition w-full">
              <input
                type="checkbox"
                checked={filters.isOffRoadCapable}
                onChange={(e) => setFilters({ ...filters, isOffRoadCapable: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Apte pour piste</span>
            </label>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchVehicles}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Search size={18} />
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-100">
          <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Aucun véhicule trouvé</h3>
          <p className="text-slate-500 mt-1">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{vehicles.length} véhicule(s) trouvé(s)</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                {/* Image placeholder */}
                <div className="aspect-video bg-linear-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  {vehicle.imageUrl ? (
                    <img src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Truck className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {vehicle.type}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{vehicle.brand} {vehicle.model}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                    <MapPin size={14} /> {vehicle.location}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {vehicle.isOffRoadCapable && (
                      <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Piste OK</span>
                    )}
                    {vehicle.hasDriver && (
                      <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <Users size={12} /> Chauffeur
                      </span>
                    )}
                    {vehicle.fuelType && (
                      <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <Fuel size={12} /> {vehicle.fuelType}
                      </span>
                    )}
                  </div>

                  {/* Conditions & Dates buttons */}
                  <div className="flex gap-2 mb-4">
                    {vehicle.conditions && (
                      <button
                        onClick={() => setViewingConditions(vehicle)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <FileText size={14} />
                        Conditions
                      </button>
                    )}
                    <button
                      onClick={() => fetchBookedDates(vehicle)}
                      className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
                    >
                      <Calendar size={14} />
                      Disponibilités
                    </button>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Prix</p>
                      <p className="font-bold text-xl text-slate-900">
                        {vehicle.pricingType === 'PER_KM' && vehicle.pricePerKm ? (
                          <>{vehicle.pricePerKm.toLocaleString()} <span className="text-sm font-normal text-slate-500">FCFA/km</span></>
                        ) : (
                          <>{vehicle.pricePerDay?.toLocaleString()} <span className="text-sm font-normal text-slate-500">FCFA/jour</span></>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedVehicle && (
        <BookingModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      )}

      {/* Conditions Modal */}
      {viewingConditions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Conditions du véhicule</h3>
                <p className="text-sm text-slate-500">{viewingConditions.brand} {viewingConditions.model}</p>
              </div>
              <button
                onClick={() => setViewingConditions(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="text-blue-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-blue-900 mb-2">Conditions d&apos;utilisation</p>
                    <p className="text-blue-800 whitespace-pre-wrap">{viewingConditions.conditions}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100">
              <button
                onClick={() => {
                  setViewingConditions(null);
                  setSelectedVehicle(viewingConditions);
                }}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Réserver ce véhicule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booked Dates Modal */}
      {viewingDates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Disponibilités</h3>
                <p className="text-sm text-slate-500">{viewingDates.vehicle.brand} {viewingDates.vehicle.model}</p>
              </div>
              <button
                onClick={() => setViewingDates(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {loadingDates ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : viewingDates.dates.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-12 w-12 text-green-300 mx-auto mb-3" />
                  <p className="font-medium text-green-700">Ce véhicule est disponible</p>
                  <p className="text-sm text-slate-500 mt-1">Aucune réservation en cours</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-blue-800">
                      Les dates et trajets affichés vous permettent de planifier un <strong>fret retour</strong> ou une nouvelle mission depuis la destination finale.
                    </p>
                  </div>
                  {viewingDates.dates.map((date, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-slate-400" size={16} />
                          <span className="text-sm font-medium text-slate-900">
                            {format(new Date(date.startDate), 'dd MMM yyyy', { locale: fr })}
                            {' → '}
                            {format(new Date(date.endDate), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          date.type === 'external'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {date.type === 'external' ? 'Hors appli' : 'Réservé'}
                        </span>
                      </div>
                      {date.startLocation && date.endLocation && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin size={14} className="text-green-500" />
                            <span>{date.startLocation}</span>
                          </div>
                          <span className="text-slate-400">→</span>
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin size={14} className="text-red-500" />
                            <span className="font-medium text-slate-800">{date.endLocation}</span>
                          </div>
                        </div>
                      )}
                      {date.endLocation && (
                        <p className="text-xs text-green-600 mt-2">
                          💡 Disponible à <strong>{date.endLocation}</strong> après le {format(new Date(date.endDate), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-100">
              <button
                onClick={() => {
                  setViewingDates(null);
                  setSelectedVehicle(viewingDates.vehicle);
                }}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Réserver ce véhicule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
