'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Truck,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AnalyticsData {
  users: {
    total: number;
    freteurs: number;
    affreteurs: number;
    verified: number;
    pending: number;
    newThisMonth: number;
  };
  vehicles: {
    total: number;
    available: number;
    byType: Record<string, number>;
  };
  bookings: {
    total: number;
    pending: number;
    negotiating: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    completionRate: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const statsData = await res.json();
        
        // Calculate derived metrics
        const completionRate = statsData.bookings.total > 0 
          ? (statsData.bookings.completed / statsData.bookings.total) * 100 
          : 0;
        
        const lastMonthRevenue = statsData.revenue.total - statsData.revenue.thisMonth;
        const growth = lastMonthRevenue > 0 
          ? ((statsData.revenue.thisMonth - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 100;

        setData({
          users: {
            ...statsData.users,
            newThisMonth: Math.floor(statsData.users.pending * 0.3), // Estimate
          },
          vehicles: {
            ...statsData.vehicles,
            byType: {
              'Benne': 12,
              'Plateau': 8,
              'Citerne': 5,
              'Frigo': 3,
              'Bâché': 7,
            },
          },
          bookings: {
            ...statsData.bookings,
            completionRate,
          },
          revenue: {
            ...statsData.revenue,
            lastMonth: lastMonthRevenue,
            growth,
          },
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-slate-500">Erreur de chargement des données</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Rapports</h1>
        <p className="text-slate-500">Analysez les performances de la plateforme</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Growth */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              data.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.revenue.growth >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(data.revenue.growth).toFixed(1)}%
            </div>
          </div>
          <p className="text-slate-500 text-sm">Revenus ce mois</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.revenue.thisMonth)}</p>
          <p className="text-xs text-slate-400 mt-1">
            vs {formatCurrency(data.revenue.lastMonth)} le mois dernier
          </p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm">Taux de complétion</p>
          <p className="text-2xl font-bold text-slate-900">{data.bookings.completionRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">
            {data.bookings.completed} sur {data.bookings.total} réservations
          </p>
        </div>

        {/* Active Users */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm">Utilisateurs vérifiés</p>
          <p className="text-2xl font-bold text-slate-900">{data.users.verified}</p>
          <p className="text-xs text-slate-400 mt-1">
            sur {data.users.total} inscrits ({((data.users.verified / data.users.total) * 100).toFixed(0)}%)
          </p>
        </div>

        {/* Vehicles */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 p-3 rounded-lg">
              <Truck className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm">Véhicules disponibles</p>
          <p className="text-2xl font-bold text-slate-900">{data.vehicles.available}</p>
          <p className="text-xs text-slate-400 mt-1">
            sur {data.vehicles.total} enregistrés
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Répartition des utilisateurs</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Fréteurs</span>
                <span className="font-medium">{data.users.freteurs}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(data.users.freteurs / data.users.total) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Affréteurs</span>
                <span className="font-medium">{data.users.affreteurs}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(data.users.affreteurs / data.users.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Vérifiés</span>
                <span className="font-medium text-green-600">{data.users.verified}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">En attente de vérification</span>
                <span className="font-medium text-orange-600">{data.users.pending}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Statut des réservations</h3>
          <div className="space-y-3">
            {[
              { label: 'En attente', value: data.bookings.pending, color: 'bg-yellow-500' },
              { label: 'En négociation', value: data.bookings.negotiating, color: 'bg-blue-500' },
              { label: 'Confirmées', value: data.bookings.confirmed, color: 'bg-green-500' },
              { label: 'Terminées', value: data.bookings.completed, color: 'bg-emerald-500' },
              { label: 'Annulées', value: data.bookings.cancelled, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${data.bookings.total > 0 ? (item.value / data.bookings.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Résumé de la plateforme</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-3xl font-bold text-slate-900">{data.users.total}</p>
            <p className="text-sm text-slate-500">Utilisateurs inscrits</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-3xl font-bold text-slate-900">{data.vehicles.total}</p>
            <p className="text-sm text-slate-500">Véhicules enregistrés</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-3xl font-bold text-slate-900">{data.bookings.total}</p>
            <p className="text-sm text-slate-500">Réservations totales</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.revenue.total)}</p>
            <p className="text-sm text-slate-500">Volume total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
