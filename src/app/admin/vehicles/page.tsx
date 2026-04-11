'use client';

import { useEffect, useState } from 'react';
import { 
  Truck, 
  Search, 
  Eye,
  MapPin,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Vehicle {
  id: string;
  type: string;
  brand: string;
  model: string;
  registrationNumber: string;
  capacityWeight: number | null;
  capacityVolume: number | null;
  location: string;
  pricingType: string;
  pricePerDay: number | null;
  pricePerKm: number | null;
  isAvailable: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
  };
  _count: {
    bookings: number;
  };
}

const TYPE_LABELS: Record<string, string> = {
  BENNE: 'Benne',
  PLATEAU: 'Plateau',
  CITERNE: 'Citerne',
  FRIGO: 'Frigorifique',
  BACHE: 'Bâché',
};

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vehicles?limit=100');
      const data = await res.json();
      setVehicles(data.vehicles || data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = search === '' || 
      vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.owner.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === '' || vehicle.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Véhicules sur la Plateforme</h1>
          <p className="text-slate-500">Consultez tous les véhicules enregistrés</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
          <Truck className="h-5 w-5 text-purple-500" />
          <span className="text-sm font-medium text-purple-700">
            {vehicles.length} véhicules
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par marque, modèle, immatriculation ou propriétaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les types</option>
            <option value="BENNE">Benne</option>
            <option value="PLATEAU">Plateau</option>
            <option value="CITERNE">Citerne</option>
            <option value="FRIGO">Frigorifique</option>
            <option value="BACHE">Bâché</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucun véhicule trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Véhicule</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Propriétaire</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Capacité</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Localisation</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Tarif</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Statut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Réservations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-sm text-slate-500">{vehicle.registrationNumber}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-900">{vehicle.owner.name}</p>
                          <p className="text-xs text-slate-500">{vehicle.owner.email}</p>
                        </div>
                        {vehicle.owner.isVerified && (
                          <span className="text-green-500 text-xs">✓</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                        {TYPE_LABELS[vehicle.type] || vehicle.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {vehicle.capacityWeight && <p>{vehicle.capacityWeight}T</p>}
                      {vehicle.capacityVolume && <p>{vehicle.capacityVolume}m³</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span>{vehicle.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {vehicle.pricePerDay && (
                        <p className="text-slate-900">{formatCurrency(vehicle.pricePerDay)}/jour</p>
                      )}
                      {vehicle.pricePerKm && (
                        <p className="text-slate-500">{formatCurrency(vehicle.pricePerKm)}/km</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        vehicle.isAvailable 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {vehicle.isAvailable ? 'Disponible' : 'Indisponible'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-600">{vehicle._count?.bookings || 0} réservations</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
