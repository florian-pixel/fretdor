'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  MapPin
} from 'lucide-react';

interface Booking {
  id: string;
  vehicle: {
    brand: string;
    model: string;
    registrationNumber: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
  affreteur: {
    id: string;
    name: string;
    email: string;
    entityType: string;
  };
  startDate: string;
  endDate: string;
  startLocation: string;
  endLocation: string;
  status: string;
  numberOfDays: number;
  pricePerDay: number;
  initialPrice: number;
  agreedPrice: number | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  NEGOTIATING: { label: 'Négociation', color: 'bg-blue-100 text-blue-700', icon: FileText },
  ACCEPTED: { label: 'Acceptée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECTED: { label: 'Refusée', color: 'bg-red-100 text-red-700', icon: XCircle },
  CANCELLED: { label: 'Annulée', color: 'bg-slate-100 text-slate-700', icon: XCircle },
  COMPLETED: { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

export default function AdminTransactionsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthRevenue: 0,
    totalTransactions: 0,
    completedTransactions: 0,
  });

  const fetchBookings = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats({
        totalRevenue: data.revenue?.total || 0,
        monthRevenue: data.revenue?.thisMonth || 0,
        totalTransactions: data.bookings?.total || 0,
        completedTransactions: data.bookings?.completed || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [statusFilter]);

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

  const filteredBookings = bookings.filter(booking =>
    search === '' ||
    booking.vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
    booking.vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
    booking.affreteur.name.toLowerCase().includes(search.toLowerCase()) ||
    booking.vehicle.owner.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Suivi des Transactions</h1>
        <p className="text-slate-500">Consultez toutes les réservations et transactions de la plateforme</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-3 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Revenus totaux</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ce mois</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.monthRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-3 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Transactions</p>
              <p className="text-lg font-bold text-slate-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Complétées</p>
              <p className="text-lg font-bold text-slate-900">{stats.completedTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> L'administrateur ne peut pas modifier les transactions.
          Les réservations sont gérées directement entre les fréteurs et les affréteurs.
          Cette page est uniquement pour le suivi et le monitoring.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par véhicule, fréteur ou affréteur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="NEGOTIATING">Négociation</option>
            <option value="ACCEPTED">Acceptée</option>
            <option value="COMPLETED">Terminée</option>
            <option value="REJECTED">Refusée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucune transaction trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Transaction</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Fréteur</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Affréteur</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Trajet</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Prix</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Statut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking) => {
                  const StatusIcon = STATUS_CONFIG[booking.status]?.icon || FileText;
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {booking.vehicle.brand} {booking.vehicle.model}
                          </p>
                          <p className="text-sm text-slate-500">{booking.vehicle.registrationNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">{booking.vehicle.owner.name}</p>
                        <p className="text-xs text-slate-500">{booking.vehicle.owner.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">{booking.affreteur.name}</p>
                        <p className="text-xs text-slate-500">
                          {booking.affreteur.entityType === 'COMPANY' ? 'Entreprise' : 'Particulier'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                          <div className="text-sm">
                            <p className="text-slate-900">{booking.startLocation}</p>
                            <p className="text-slate-500">→ {booking.endLocation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {formatCurrency(booking.agreedPrice || booking.initialPrice)}
                        </p>
                        {booking.numberOfDays && booking.pricePerDay && (
                          <p className="text-xs text-slate-400">
                            {formatCurrency(booking.pricePerDay)} × {booking.numberOfDays}j
                          </p>
                        )}
                        {booking.agreedPrice && booking.agreedPrice !== booking.initialPrice && (
                          <p className="text-xs text-slate-400 line-through">
                            {formatCurrency(booking.initialPrice)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${STATUS_CONFIG[booking.status]?.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_CONFIG[booking.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600">{formatDate(booking.createdAt)}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} transactions)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchBookings(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => fetchBookings(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
