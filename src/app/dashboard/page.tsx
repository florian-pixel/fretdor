'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import BookingList from '@/components/BookingList';
import { LayoutDashboard, Package, Truck, Wallet, Clock, CheckCircle } from 'lucide-react';

interface FreteurStats {
  totalVehicles: number;
  availableVehicles: number;
  unavailableVehicles: number;
  activeCourses: number;
  pendingRequests: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface AffreteurStats {
  activeCourses: number;
  pendingRequests: number;
  completedCourses: number;
  totalSpent: number;
  totalBookings: number;
  availableVehicles: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<FreteurStats | AffreteurStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Redirect admin to admin panel
    if (!loading && user && user.role === 'ADMIN') {
      router.push('/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/stats')
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          setLoadingStats(false);
        })
        .catch((error) => {
          console.error('Error fetching stats:', error);
          setLoadingStats(false);
        });
    }
  }, [user]);

  if (loading || !user) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const freteurStats = user.role === 'FRETEUR' ? stats as FreteurStats : null;
  const affreteurStats = user.role === 'AFFRETEUR' ? stats as AffreteurStats : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">
            Bienvenue, <span className="font-semibold text-slate-700">{user.name}</span>
          </p>
        </div>
        <div className="flex gap-3">
          {user.role === 'AFFRETEUR' && (
            <button
              onClick={() => router.push('/search')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
            >
              Trouver un véhicule
            </button>
          )}
          {user.role === 'FRETEUR' && (
            <button
              onClick={() => router.push('/vehicles/add')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
            >
              Ajouter un véhicule
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Freteur */}
      {user.role === 'FRETEUR' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                <Package className="h-6 w-6" />
              </div>
              {freteurStats && freteurStats.activeCourses > 0 && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Actif</span>
              )}
            </div>
            <p className="text-slate-500 text-sm">Courses actives</p>
            <p className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : freteurStats?.activeCourses ?? 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                <Truck className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">Total</span>
            </div>
            <p className="text-slate-500 text-sm">Véhicules disponibles</p>
            <p className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : `${freteurStats?.availableVehicles ?? 0}/${freteurStats?.totalVehicles ?? 0}`}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg text-green-600">
                <Wallet className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">Mois</span>
            </div>
            <p className="text-slate-500 text-sm">Revenus (Mois)</p>
            <p className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : (freteurStats?.monthlyRevenue ?? 0) >= 1000000
                ? `${((freteurStats?.monthlyRevenue ?? 0) / 1000000).toFixed(1)}M FCFA`
                : `${(freteurStats?.monthlyRevenue ?? 0).toLocaleString()} FCFA`
              }
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards - Affreteur */}
      {user.role === 'AFFRETEUR' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                <Package className="h-6 w-6" />
              </div>
              {affreteurStats && affreteurStats.activeCourses > 0 && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Actif</span>
              )}
            </div>
            <p className="text-slate-500 text-sm">Courses actives</p>
            <p className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : affreteurStats?.activeCourses ?? 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
              {affreteurStats && affreteurStats.pendingRequests > 0 && (
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">{affreteurStats.pendingRequests}</span>
              )}
            </div>
            <p className="text-slate-500 text-sm">En attente</p>
            <p className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : affreteurStats?.pendingRequests ?? 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">Total</span>
            </div>
            <p className="text-slate-500 text-sm">Courses terminées</p>
            <p className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : affreteurStats?.completedCourses ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-slate-400" />
            {user.role === 'FRETEUR' ? 'Demandes reçues' : 'Mes réservations'}
          </h2>
        </div>
        <div className="p-6">
          <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <BookingList role={user.role} userId={user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
