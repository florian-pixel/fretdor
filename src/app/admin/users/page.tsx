'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Ban,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  entityType: string;
  phone: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  suspendedReason: string | null;
  isBanned: boolean;
  bannedReason: string | null;
  createdAt: string;
  _count: {
    vehicles: number;
    bookings: number;
    reviewsReceived: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ role: '', verification: '', status: '' });
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState<{ user: User; action: string } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filters.role) params.append('role', filters.role);
      if (filters.verification) params.append('verification', filters.verification);
      if (filters.status) params.append('status', filters.status);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleAction = async () => {
    if (!actionModal) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: actionModal.user.id,
          action: actionModal.action,
          reason: actionReason,
        }),
      });

      if (res.ok) {
        fetchUsers(pagination.page);
        setActionModal(null);
        setActionReason('');
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isBanned) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Banni</span>;
    }
    if (user.isSuspended) {
      return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">Suspendu</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Actif</span>;
  };

  const filteredUsers = users.filter(user =>
    search === '' ||
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
          <p className="text-slate-500">Gérez les comptes utilisateurs de la plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{pagination.total} utilisateurs</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les rôles</option>
              <option value="FRETEUR">Fréteurs</option>
              <option value="AFFRETEUR">Affréteurs</option>
            </select>
            <select
              value={filters.verification}
              onChange={(e) => setFilters({ ...filters, verification: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes vérifications</option>
              <option value="verified">Vérifiés</option>
              <option value="pending">En attente</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="suspended">Suspendus</option>
              <option value="banned">Bannis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Rôle</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">KYC</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Statut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Activité</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          user.role === 'FRETEUR' ? 'bg-purple-500' : 'bg-blue-500'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'FRETEUR'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'FRETEUR' ? 'Fréteur' : 'Affréteur'}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {user.entityType === 'COMPANY' ? 'Entreprise' : 'Particulier'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {user.isVerified ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Vérifié</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-500">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">En attente</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(user)}
                      {(user.suspendedReason || user.bannedReason) && (
                        <p className="text-xs text-slate-400 mt-1 max-w-37.5 truncate">
                          {user.suspendedReason || user.bannedReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-500">
                        <p>{user._count.vehicles} véhicules</p>
                        <p>{user._count.bookings} réservations</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!user.isVerified && !user.isBanned && (
                          <button
                            onClick={() => setActionModal({ user, action: 'verify' })}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Valider KYC"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        {user.isVerified && !user.isBanned && (
                          <button
                            onClick={() => setActionModal({ user, action: 'unverify' })}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Retirer vérification"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                        {!user.isSuspended && !user.isBanned && (
                          <button
                            onClick={() => setActionModal({ user, action: 'suspend' })}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Suspendre"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        )}
                        {user.isSuspended && !user.isBanned && (
                          <button
                            onClick={() => setActionModal({ user, action: 'unsuspend' })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Lever la suspension"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {!user.isBanned && (
                          <button
                            onClick={() => setActionModal({ user, action: 'ban' })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Bannir"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {user.isBanned && (
                          <button
                            onClick={() => setActionModal({ user, action: 'unban' })}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Lever le bannissement"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} sur {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {actionModal.action === 'verify' && 'Valider le KYC'}
              {actionModal.action === 'unverify' && 'Retirer la vérification'}
              {actionModal.action === 'suspend' && 'Suspendre l\'utilisateur'}
              {actionModal.action === 'unsuspend' && 'Lever la suspension'}
              {actionModal.action === 'ban' && 'Bannir l\'utilisateur'}
              {actionModal.action === 'unban' && 'Lever le bannissement'}
            </h3>
            <p className="text-slate-600 mb-4">
              Utilisateur: <strong>{actionModal.user.name}</strong> ({actionModal.user.email})
            </p>

            {(actionModal.action === 'suspend' || actionModal.action === 'ban') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Raison (obligatoire)
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Expliquez la raison de cette action..."
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActionModal(null); setActionReason(''); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                disabled={processing || ((actionModal.action === 'suspend' || actionModal.action === 'ban') && !actionReason)}
                className={`px-4 py-2 rounded-lg text-white ${
                  actionModal.action === 'ban' ? 'bg-red-600 hover:bg-red-700' :
                  actionModal.action === 'suspend' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {processing ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
