'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Truck, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Star,
  UserCheck,
  UserX
} from 'lucide-react';

interface AdminStats {
  users: {
    total: number;
    freteurs: number;
    affreteurs: number;
    verified: number;
    pending: number;
  };
  vehicles: {
    total: number;
    available: number;
  };
  bookings: {
    total: number;
    pending: number;
    negotiating: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  reviews: {
    total: number;
    averageRating: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
  reports?: {
    pending: number;
    total: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, reportsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users?limit=5'),
          fetch('/api/admin/reports?status=PENDING&limit=5'),
        ]);

        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        const reportsData = await reportsRes.json();

        setStats(statsData);
        setRecentUsers(usersData.users || []);
        setPendingReports(reportsData.reports || []);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tableau de bord Administration</h1>
        <p className="text-slate-500 mt-1">Vue d'ensemble de la plateforme FRETDOR</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              +{stats?.users.pending || 0} en attente
            </span>
          </div>
          <p className="text-slate-500 text-sm">Utilisateurs totaux</p>
          <p className="text-2xl font-bold text-slate-900">{stats?.users.total || 0}</p>
          <div className="mt-2 flex gap-4 text-xs text-slate-500">
            <span>Fréteurs: {stats?.users.freteurs || 0}</span>
            <span>Affréteurs: {stats?.users.affreteurs || 0}</span>
          </div>
        </div>

        {/* Verified Users */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-3 rounded-lg text-green-600">
              <UserCheck className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              KYC Validés
            </span>
          </div>
          <p className="text-slate-500 text-sm">Utilisateurs vérifiés</p>
          <p className="text-2xl font-bold text-slate-900">{stats?.users.verified || 0}</p>
          <div className="mt-2 text-xs text-slate-500">
            <span>{stats?.users.pending || 0} en attente de vérification</span>
          </div>
        </div>

        {/* Vehicles */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
              <Truck className="h-6 w-6" />
            </div>
          </div>
          <p className="text-slate-500 text-sm">Véhicules sur la plateforme</p>
          <p className="text-2xl font-bold text-slate-900">{stats?.vehicles.total || 0}</p>
          <div className="mt-2 text-xs text-slate-500">
            <span>{stats?.vehicles.available || 0} disponibles</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-slate-500 text-sm">Revenus du mois</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats?.revenue.thisMonth || 0)}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            <span>Total: {formatCurrency(stats?.revenue.total || 0)}</span>
          </div>
        </div>
      </div>

      {/* Bookings Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-400" />
            Réservations
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">En attente</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.bookings.pending || 0}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">En négociation</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.bookings.negotiating || 0}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Confirmées</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.bookings.confirmed || 0}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Terminées</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.bookings.completed || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
            <span className="text-slate-500">Total: {stats?.bookings.total || 0} réservations</span>
            <span className="text-red-500">{stats?.bookings.cancelled || 0} annulées</span>
          </div>
        </div>

        {/* Reviews & Reports */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-slate-400" />
            Qualité & Modération
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-500">Note moyenne</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-slate-900">
                    {(stats?.reviews.averageRating || 0).toFixed(1)}
                  </p>
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Avis totaux</p>
                <p className="text-xl font-bold text-slate-900">{stats?.reviews.total || 0}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                <div>
                  <p className="font-medium text-slate-900">Signalements en attente</p>
                  <p className="text-sm text-slate-500">À traiter</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-600">{pendingReports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            Nouveaux utilisateurs
          </h2>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-slate-500 text-sm">Aucun utilisateur récent</p>
            ) : (
              recentUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      user.role === 'FRETEUR' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'FRETEUR' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'FRETEUR' ? 'Fréteur' : 'Affréteur'}
                    </span>
                    {!user.isVerified && (
                      <p className="text-xs text-orange-500 mt-1">KYC en attente</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Reports */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-slate-400" />
            Signalements à traiter
          </h2>
          <div className="space-y-3">
            {pendingReports.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Aucun signalement en attente</p>
              </div>
            ) : (
              pendingReports.map((report: any) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-slate-900">{report.reason}</p>
                      <p className="text-xs text-slate-500">
                        Type: {report.reportedType} • Par: {report.reporter?.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    En attente
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
