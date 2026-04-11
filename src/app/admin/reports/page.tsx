'use client';

import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Filter,
  CheckCircle,
  XCircle,
  User,
  Truck,
  MessageSquare,
  FileText,
  Ban,
  Trash2,
  Eye
} from 'lucide-react';

interface Report {
  id: string;
  reporterId: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reportedType: string;
  reportedId: string;
  reportedEntity: any;
  reason: string;
  description: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  FRAUD: 'Fraude',
  INAPPROPRIATE: 'Contenu inapproprié',
  SPAM: 'Spam',
  FAKE_DOCUMENTS: 'Faux documents',
  OTHER: 'Autre',
};

const TYPE_LABELS: Record<string, string> = {
  USER: 'Utilisateur',
  VEHICLE: 'Véhicule',
  REVIEW: 'Avis',
  BOOKING: 'Réservation',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
  REVIEWED: { label: 'Examiné', color: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: 'Résolu', color: 'bg-green-100 text-green-700' },
  DISMISSED: { label: 'Rejeté', color: 'bg-slate-100 text-slate-700' },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchReports = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);

      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      setReports(data.reports || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const handleUpdateReport = async (status: string) => {
    if (!selectedReport) return;
    
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status,
          adminNotes,
          action: selectedAction || undefined,
        }),
      });

      if (res.ok) {
        fetchReports(pagination.page);
        setSelectedReport(null);
        setAdminNotes('');
        setSelectedAction('');
      }
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'USER': return <User className="h-4 w-4" />;
      case 'VEHICLE': return <Truck className="h-4 w-4" />;
      case 'REVIEW': return <MessageSquare className="h-4 w-4" />;
      case 'BOOKING': return <FileText className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAvailableActions = (report: Report) => {
    const actions = [];
    switch (report.reportedType) {
      case 'USER':
        actions.push({ value: 'suspend_user', label: 'Suspendre l\'utilisateur' });
        actions.push({ value: 'ban_user', label: 'Bannir l\'utilisateur' });
        break;
      case 'VEHICLE':
        actions.push({ value: 'delete_vehicle', label: 'Supprimer le véhicule' });
        break;
      case 'REVIEW':
        actions.push({ value: 'delete_review', label: 'Supprimer l\'avis' });
        break;
    }
    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Signalements</h1>
          <p className="text-slate-500">Modérez les signalements des utilisateurs</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">
            {reports.filter(r => r.status === 'PENDING').length} en attente
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="REVIEWED">Examiné</option>
              <option value="RESOLVED">Résolu</option>
              <option value="DISMISSED">Rejeté</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              <option value="USER">Utilisateur</option>
              <option value="VEHICLE">Véhicule</option>
              <option value="REVIEW">Avis</option>
              <option value="BOOKING">Réservation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun signalement trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${
                        report.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getTypeIcon(report.reportedType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {REASON_LABELS[report.reason] || report.reason}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_LABELS[report.status]?.color}`}>
                            {STATUS_LABELS[report.status]?.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {TYPE_LABELS[report.reportedType]} signalé par {report.reporter.name}
                        </p>
                      </div>
                    </div>

                    {report.description && (
                      <p className="text-sm text-slate-600 mb-2 ml-12">{report.description}</p>
                    )}

                    {/* Reported Entity Info */}
                    {report.reportedEntity && (
                      <div className="ml-12 p-3 bg-slate-50 rounded-lg text-sm">
                        {report.reportedType === 'USER' && (
                          <p>
                            <span className="text-slate-500">Utilisateur:</span>{' '}
                            <span className="font-medium">{report.reportedEntity.name}</span>{' '}
                            ({report.reportedEntity.email})
                          </p>
                        )}
                        {report.reportedType === 'VEHICLE' && (
                          <p>
                            <span className="text-slate-500">Véhicule:</span>{' '}
                            <span className="font-medium">
                              {report.reportedEntity.brand} {report.reportedEntity.model}
                            </span>{' '}
                            ({report.reportedEntity.registrationNumber})
                          </p>
                        )}
                        {report.reportedType === 'REVIEW' && (
                          <p>
                            <span className="text-slate-500">Avis:</span>{' '}
                            <span className="font-medium">Note {report.reportedEntity.rating}/5</span>{' '}
                            - {report.reportedEntity.comment?.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-2 ml-12">
                      Signalé le {formatDate(report.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => { setSelectedReport(report); setAdminNotes(report.adminNotes || ''); }}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Traiter
                  </button>
                </div>
              </div>
            ))}
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
                onClick={() => fetchReports(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => fetchReports(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Treatment Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                Traiter le signalement
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Type: {TYPE_LABELS[selectedReport.reportedType]}
                </label>
                <p className="text-slate-600">
                  Raison: {REASON_LABELS[selectedReport.reason]}
                </p>
                {selectedReport.description && (
                  <p className="text-sm text-slate-500 mt-1">{selectedReport.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes admin
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ajoutez des notes sur votre décision..."
                />
              </div>

              {getAvailableActions(selectedReport).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Action à effectuer (optionnel)
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucune action</option>
                    {getAvailableActions(selectedReport).map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => { setSelectedReport(null); setAdminNotes(''); setSelectedAction(''); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => handleUpdateReport('DISMISSED')}
                disabled={processing}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Rejeter
              </button>
              <button
                onClick={() => handleUpdateReport('RESOLVED')}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Résoudre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
