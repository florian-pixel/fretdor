'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  X,
  Truck,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Get today's date in YYYY-MM-DD format
const getTodayString = () => new Date().toISOString().split('T')[0];

interface ExternalBooking {
  id: string;
  startDate: string;
  endDate: string;
  startLocation: string;
  endLocation: string;
  description: string | null;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  type: string;
}

export default function VehicleAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [externalBookings, setExternalBookings] = useState<ExternalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<ExternalBooking | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startLocation: '',
    endLocation: '',
    description: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, id]);

  const fetchData = async () => {
    try {
      const [vehicleRes, bookingsRes] = await Promise.all([
        fetch(`/api/vehicles/${id}`),
        fetch(`/api/vehicles/${id}/external-bookings`)
      ]);

      if (vehicleRes.ok) {
        const vehicleData = await vehicleRes.json();

        // Vérifier que l'utilisateur est le propriétaire
        if (vehicleData.ownerId !== user?.id && user?.role !== 'ADMIN') {
          router.push('/vehicles');
          return;
        }

        setVehicle(vehicleData);
      }

      if (bookingsRes.ok) {
        setExternalBookings(await bookingsRes.json());
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (booking?: ExternalBooking) => {
    if (booking) {
      setEditingBooking(booking);
      setFormData({
        startDate: booking.startDate.split('T')[0],
        endDate: booking.endDate.split('T')[0],
        startLocation: booking.startLocation,
        endLocation: booking.endLocation,
        description: booking.description || '',
      });
    } else {
      setEditingBooking(null);
      setFormData({
        startDate: '',
        endDate: '',
        startLocation: '',
        endLocation: '',
        description: '',
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBooking(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const url = editingBooking
        ? `/api/vehicles/${id}/external-bookings/${editingBooking.id}`
        : `/api/vehicles/${id}/external-bookings`;

      const method = editingBooking ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      setSuccess(editingBooking ? 'Indisponibilité mise à jour' : 'Indisponibilité ajoutée');
      handleCloseModal();
      fetchData();
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette indisponibilité ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${id}/external-bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('Indisponibilité supprimée');
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysCount = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isUpcoming = (endDate: string) => {
    return new Date(endDate) >= new Date();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Véhicule non trouvé</p>
        <Link href="/vehicles" className="text-blue-600 hover:underline mt-2 inline-block">
          Retour à mes véhicules
        </Link>
      </div>
    );
  }

  const upcomingBookings = externalBookings.filter(b => isUpcoming(b.endDate));
  const pastBookings = externalBookings.filter(b => !isUpcoming(b.endDate));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/vehicles"
          className="inline-flex items-center text-slate-600 hover:text-blue-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à mes véhicules
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-slate-500">
                {vehicle.type} • {vehicle.registrationNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Gestion des indisponibilités</h2>
          <p className="text-sm text-slate-500">
            Déclarez les périodes où votre véhicule est loué hors de l&apos;application
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          Ajouter
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Pourquoi déclarer les locations externes ?</p>
            <p>
              Lorsque vous déclarez une location hors application, les affréteurs peuvent voir
              où sera votre véhicule après cette période. Cela peut générer des opportunités de
              <strong> fret retour</strong> ou de nouvelles missions depuis la destination finale.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming External Bookings */}
      <div className="mb-8">
        <h3 className="text-md font-medium text-slate-900 mb-4">
          Indisponibilités à venir ({upcomingBookings.length})
        </h3>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucune indisponibilité déclarée</p>
            <p className="text-sm text-slate-400 mt-1">
              Votre véhicule est disponible pour toutes les réservations
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-200 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-slate-900">
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {getDaysCount(booking.startDate, booking.endDate)} jour(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-slate-500 text-xs">Départ</span>
                          <p className="text-slate-900">{booking.startLocation}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-slate-500 text-xs">Arrivée</span>
                          <p className="text-slate-900">{booking.endLocation}</p>
                        </div>
                      </div>
                    </div>

                    {booking.description && (
                      <p className="text-sm text-slate-500 mt-3 italic">
                        &quot;{booking.description}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleOpenModal(booking)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past External Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-slate-500 mb-4">
            Historique ({pastBookings.length})
          </h3>
          <div className="space-y-3">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-slate-50 rounded-xl border border-slate-200 p-4 opacity-70"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {booking.startLocation} → {booking.endLocation}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(booking.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingBooking ? 'Modifier l\'indisponibilité' : 'Nouvelle indisponibilité'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    required
                    min={getTodayString()}
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || getTodayString()}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1 text-green-600" />
                  Lieu de départ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Brazzaville, Entrepôt Zone Industrielle"
                  value={formData.startLocation}
                  onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1 text-red-600" />
                  Lieu d&apos;arrivée (où sera le véhicule après) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pointe-Noire, Port Autonome"
                  value={formData.endLocation}
                  onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Cette info aide les affréteurs à planifier un fret retour
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Location pour chantier BTP"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : (editingBooking ? 'Mettre à jour' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
