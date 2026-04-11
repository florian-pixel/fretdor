'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Plus, Truck, MapPin, ToggleLeft, ToggleRight, Edit, Trash2, X, AlertTriangle, Calendar } from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  type: string;
  location: string;
  isAvailable: boolean;
  pricePerDay: number;
  pricePerKm: number | null;
  pricingType: string;
  imageUrl: string | null;
}

interface Stats {
  totalVehicles: number;
  availableVehicles: number;
  unavailableVehicles: number;
  activeCourses: number;
  pendingRequests: number;
  monthlyRevenue: number;
}

export default function VehiclesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [deleteModal, setDeleteModal] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Fetch vehicles
      fetch(`/api/vehicles?ownerId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setVehicles(data);
          setLoading(false);
        });

      // Fetch stats
      fetch('/api/stats')
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch(console.error);
    }
  }, [user]);

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (res.ok) {
        setVehicles(vehicles.map(v => v.id === id ? { ...v, isAvailable: !currentStatus } : v));
      }
    } catch (error) {
      console.error('Error updating vehicle', error);
    }
  };

  const deleteVehicle = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${deleteModal.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setVehicles(vehicles.filter(v => v.id !== deleteModal.id));
        setDeleteModal(null);
      }
    } catch (error) {
      console.error('Error deleting vehicle', error);
    }
    setDeleting(false);
  };

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
          <h1 className="text-3xl font-bold text-slate-900">Mes Véhicules</h1>
          <p className="text-slate-500 mt-1">Gérez votre flotte de véhicules</p>
        </div>
        <Link
          href="/vehicles/add"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> Ajouter un véhicule
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-bold text-slate-900">{stats?.totalVehicles ?? vehicles.length}</p>
          <p className="text-sm text-slate-500">Total véhicules</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-bold text-green-600">{stats?.availableVehicles ?? vehicles.filter(v => v.isAvailable).length}</p>
          <p className="text-sm text-slate-500">Disponibles</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-bold text-orange-500">{stats?.unavailableVehicles ?? vehicles.filter(v => !v.isAvailable).length}</p>
          <p className="text-sm text-slate-500">Indisponibles</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-bold text-blue-600">{stats?.activeCourses ?? 0}</p>
          <p className="text-sm text-slate-500">En course</p>
        </div>
      </div>

      {/* Vehicle List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-100">
          <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Aucun véhicule</h3>
          <p className="text-slate-500 mt-1 mb-6">Commencez par ajouter votre premier véhicule</p>
          <Link
            href="/vehicles/add"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <Plus size={20} /> Ajouter un véhicule
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="aspect-video bg-linear-to-br from-slate-100 to-slate-200 relative">
                {vehicle.imageUrl ? (
                  <img src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Truck className="h-12 w-12 text-slate-300" />
                  </div>
                )}
                <button
                  onClick={() => toggleAvailability(vehicle.id, vehicle.isAvailable)}
                  className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    vehicle.isAvailable
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-slate-500 text-white hover:bg-slate-600'
                  }`}
                >
                  {vehicle.isAvailable ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {vehicle.isAvailable ? 'Disponible' : 'Indisponible'}
                </button>
                <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
                  {vehicle.type}
                </span>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{vehicle.brand} {vehicle.model}</h3>
                    <p className="text-slate-500 text-sm">{vehicle.registrationNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                  <MapPin size={14} /> {vehicle.location}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div>
                    <p className="font-bold text-lg text-slate-900">
                      {vehicle.pricingType === 'PER_KM' && vehicle.pricePerKm ? (
                        <>{vehicle.pricePerKm.toLocaleString()} <span className="text-sm font-normal text-slate-500">FCFA/km</span></>
                      ) : (
                        <>{vehicle.pricePerDay?.toLocaleString()} <span className="text-sm font-normal text-slate-500">FCFA/jour</span></>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/vehicles/${vehicle.id}/availability`}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Gérer les indisponibilités"
                    >
                      <Calendar size={18} />
                    </Link>
                    <Link
                      href={`/vehicles/edit/${vehicle.id}`}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => setDeleteModal(vehicle)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Supprimer le véhicule</h3>
              <button
                onClick={() => setDeleteModal(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg mb-4">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-red-900">Attention !</p>
                  <p className="text-sm text-red-700 mt-1">
                    Êtes-vous sûr de vouloir supprimer le véhicule <strong>{deleteModal.brand} {deleteModal.model}</strong> ({deleteModal.registrationNumber}) ? Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={deleteVehicle}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
