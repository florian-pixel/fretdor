'use client';

import { useEffect, useState } from 'react';
import { 
  History, 
  User,
  ShieldCheck,
  Ban,
  AlertTriangle,
  Trash2,
  CheckCircle,
  Filter
} from 'lucide-react';

interface AdminAction {
  id: string;
  adminId: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  actionType: string;
  targetType: string;
  targetId: string;
  targetEntity: any;
  reason: string | null;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  VERIFY_USER: { label: 'Vérification KYC', icon: ShieldCheck, color: 'text-green-600 bg-green-50' },
  UNVERIFY_USER: { label: 'Retrait vérification', icon: ShieldCheck, color: 'text-orange-600 bg-orange-50' },
  SUSPEND_USER: { label: 'Suspension', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
  UNSUSPEND_USER: { label: 'Levée suspension', icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
  BAN_USER: { label: 'Bannissement', icon: Ban, color: 'text-red-600 bg-red-50' },
  UNBAN_USER: { label: 'Levée bannissement', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  RESOLVE_REPORT: { label: 'Traitement signalement', icon: AlertTriangle, color: 'text-blue-600 bg-blue-50' },
  DELETE_CONTENT: { label: 'Suppression contenu', icon: Trash2, color: 'text-red-600 bg-red-50' },
  WARNING: { label: 'Avertissement', icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' },
};

export default function AdminHistoryPage() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ actionType: '', targetType: '' });

  const fetchActions = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '30' });
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.targetType) params.append('targetType', filters.targetType);

      const res = await fetch(`/api/admin/actions?${params}`);
      const data = await res.json();
      setActions(data.actions || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [filters]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionConfig = (actionType: string) => {
    return ACTION_CONFIG[actionType] || { 
      label: actionType, 
      icon: History, 
      color: 'text-slate-600 bg-slate-50' 
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historique des Actions Admin</h1>
        <p className="text-slate-500">Consultez toutes les actions administratives effectuées</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={filters.actionType}
            onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les actions</option>
            <option value="VERIFY_USER">Vérification KYC</option>
            <option value="SUSPEND_USER">Suspension</option>
            <option value="UNSUSPEND_USER">Levée suspension</option>
            <option value="BAN_USER">Bannissement</option>
            <option value="RESOLVE_REPORT">Traitement signalement</option>
            <option value="DELETE_CONTENT">Suppression contenu</option>
          </select>
          <select
            value={filters.targetType}
            onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les cibles</option>
            <option value="USER">Utilisateur</option>
            <option value="VEHICLE">Véhicule</option>
            <option value="REVIEW">Avis</option>
            <option value="REPORT">Signalement</option>
          </select>
        </div>
      </div>

      {/* Actions List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : actions.length === 0 ? (
          <div className="p-8 text-center">
            <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune action admin enregistrée</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {actions.map((action) => {
              const config = getActionConfig(action.actionType);
              const Icon = config.icon;
              
              return (
                <div key={action.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{config.label}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-sm text-slate-500">
                          par {action.admin.name}
                        </span>
                      </div>
                      
                      {/* Target Info */}
                      <div className="text-sm text-slate-600 mb-1">
                        {action.targetType === 'USER' && action.targetEntity && (
                          <span>
                            Utilisateur: <strong>{action.targetEntity.name}</strong> ({action.targetEntity.email})
                          </span>
                        )}
                        {action.targetType === 'VEHICLE' && action.targetEntity && (
                          <span>
                            Véhicule: <strong>{action.targetEntity.brand} {action.targetEntity.model}</strong>
                          </span>
                        )}
                        {action.targetType === 'REPORT' && action.targetEntity && (
                          <span>
                            Signalement: <strong>{action.targetEntity.reason}</strong> - {action.targetEntity.status}
                          </span>
                        )}
                        {!action.targetEntity && (
                          <span className="text-slate-400">
                            {action.targetType} (ID: {action.targetId.substring(0, 8)}...)
                          </span>
                        )}
                      </div>

                      {action.reason && (
                        <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded mt-2">
                          <span className="font-medium">Raison:</span> {action.reason}
                        </p>
                      )}

                      <p className="text-xs text-slate-400 mt-2">
                        {formatDate(action.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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
                onClick={() => fetchActions(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => fetchActions(pagination.page + 1)}
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
