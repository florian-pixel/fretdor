'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  User,
  Building2,
  Phone,
  Mail
} from 'lucide-react';

interface KYCUser {
  id: string;
  email: string;
  name: string;
  role: string;
  entityType: string;
  phone: string | null;
  rccm: string | null;
  cin: string | null;
  rccmDocUrl: string | null;
  cinDocUrl: string | null;
  isVerified: boolean;
  createdAt: string;
}

export default function AdminKYCPage() {
  const [users, setUsers] = useState<KYCUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchPendingKYC = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users?verification=pending&limit=100');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching KYC requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const handleVerify = async (userId: string, approve: boolean) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: approve ? 'verify' : 'unverify',
        }),
      });

      if (res.ok) {
        fetchPendingKYC();
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error verifying user:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Validation KYC</h1>
          <p className="text-slate-500">Vérifiez les documents d'identité des utilisateurs</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
          <ShieldCheck className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">
            {users.length} demandes en attente
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">Processus de vérification KYC</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Particuliers:</strong> Vérifiez le numéro CNI/Passeport et le document associé</li>
          <li>• <strong>Entreprises:</strong> Vérifiez le numéro RCCM et le document officiel</li>
          <li>• <strong>Fréteurs:</strong> Assurez-vous que les documents de transport sont valides</li>
        </ul>
      </div>

      {/* KYC List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune demande KYC en attente</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                      user.role === 'FRETEUR' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          user.role === 'FRETEUR'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role === 'FRETEUR' ? 'Fréteur' : 'Affréteur'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Inscrit le {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Examiner
                    </button>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    {user.entityType === 'COMPANY' ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span>{user.entityType === 'COMPANY' ? 'Entreprise' : 'Particulier'}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.cin && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="h-4 w-4" />
                      <span>CNI: {user.cin}</span>
                    </div>
                  )}
                  {user.rccm && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="h-4 w-4" />
                      <span>RCCM: {user.rccm}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                Vérification KYC - {selectedUser.name}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Nom complet</label>
                  <p className="text-slate-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Email</label>
                  <p className="text-slate-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Téléphone</label>
                  <p className="text-slate-900">{selectedUser.phone || 'Non renseigné'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Type de compte</label>
                  <p className="text-slate-900">
                    {selectedUser.entityType === 'COMPANY' ? 'Entreprise' : 'Particulier'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Rôle</label>
                  <p className="text-slate-900">
                    {selectedUser.role === 'FRETEUR' ? 'Fréteur (Transporteur)' : 'Affréteur (Chargeur)'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Date d'inscription</label>
                  <p className="text-slate-900">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {/* Documents */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-medium text-slate-900 mb-4">Documents fournis</h4>

                {selectedUser.entityType === 'INDIVIDUAL' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700">CNI / Passeport</span>
                        {selectedUser.cin ? (
                          <span className="text-green-600 text-sm">Fourni</span>
                        ) : (
                          <span className="text-red-600 text-sm">Manquant</span>
                        )}
                      </div>
                      {selectedUser.cin && (
                        <p className="text-slate-600 mb-2">Numéro: {selectedUser.cin}</p>
                      )}
                      {selectedUser.cinDocUrl ? (
                        <a
                          href={selectedUser.cinDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <Download className="h-4 w-4" />
                          Voir le document
                        </a>
                      ) : (
                        <p className="text-slate-400 text-sm">Aucun document téléchargé</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedUser.entityType === 'COMPANY' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700">RCCM</span>
                        {selectedUser.rccm ? (
                          <span className="text-green-600 text-sm">Fourni</span>
                        ) : (
                          <span className="text-red-600 text-sm">Manquant</span>
                        )}
                      </div>
                      {selectedUser.rccm && (
                        <p className="text-slate-600 mb-2">Numéro: {selectedUser.rccm}</p>
                      )}
                      {selectedUser.rccmDocUrl ? (
                        <a
                          href={selectedUser.rccmDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <Download className="h-4 w-4" />
                          Voir le document
                        </a>
                      ) : (
                        <p className="text-slate-400 text-sm">Aucun document téléchargé</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Fermer
              </button>
              <button
                onClick={() => handleVerify(selectedUser.id, false)}
                disabled={processing}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Refuser
              </button>
              <button
                onClick={() => handleVerify(selectedUser.id, true)}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Valider le KYC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
