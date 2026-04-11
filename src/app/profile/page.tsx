'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  entityType: string;
  role: string;
  createdAt: string;
  averageRating: number;
  reviewCount: number;
  rccm: string | null;
  cin: string | null;
  rccmDocUrl: string | null;
  cinDocUrl: string | null;
  isVerified: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    name: string;
    entityType: string;
  };
  booking: {
    startDate: string;
    endDate: string;
    vehicle: {
      brand: string;
      model: string;
    };
  };
}

interface Bank {
  code: string;
  name: string;
}

interface BankInfo {
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  hasSubaccount: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'documents' | 'reviews' | 'bank'>('info');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Bank info states (for FRETEUR)
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();

      // Rediriger les admins vers le panel admin
      if (data.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setAddress(data.address || '');
    } catch {
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews?received=true');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const fetchBankInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/bank');
      if (res.ok) {
        const data = await res.json();
        setBanks(data.banks || []);
        setBankInfo(data.bankInfo || null);
        if (data.bankInfo) {
          setBankCode(data.bankInfo.bankCode || '');
          setAccountNumber(data.bankInfo.accountNumber || '');
          setAccountName(data.bankInfo.accountName || '');
        }
      }
    } catch (err) {
      console.error('Error fetching bank info:', err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchReviews();
  }, [fetchProfile]);

  // Fetch bank info when profile is loaded and user is FRETEUR
  useEffect(() => {
    if (profile?.role === 'FRETEUR') {
      fetchBankInfo();
    }
  }, [profile?.role, fetchBankInfo]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setSuccess('Profil mis à jour avec succès');
      fetchProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }

      setSuccess('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingBank(true);

    try {
      const res = await fetch('/api/profile/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankCode,
          accountNumber,
          accountName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      setSuccess(data.message || 'Informations bancaires enregistrées');
      setBankInfo(data.data);
      fetchBankInfo();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSavingBank(false);
    }
  };

  const handleDocumentUpload = async (file: File, docType: 'rccm' | 'cin') => {
    setError('');
    setSuccess('');
    setUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Erreur lors du téléversement du fichier');
      }

      const { url } = await uploadRes.json();

      // Update profile with document URL
      const updateData = docType === 'rccm'
        ? { rccmDocUrl: url }
        : { cinDocUrl: url };

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      setSuccess('Document téléversé avec succès');
      fetchProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setUploadingDoc(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile?.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.entityType === 'FRETEUR'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {profile?.entityType === 'FRETEUR' ? '🚛 Fréteur' : '📦 Affréteur'}
                </span>
                {profile?.averageRating !== undefined && profile.averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    {renderStars(Math.round(profile.averageRating))}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({profile.averageRating.toFixed(1)}) - {profile.reviewCount} avis
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Informations
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                📄 Documents {profile?.isVerified && <span className="text-green-500">✓</span>}
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Mot de passe
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Avis reçus ({reviews.length})
              </button>
              {profile?.role === 'FRETEUR' && (
                <button
                  onClick={() => setActiveTab('bank')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'bank'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  💳 Paiements {bankInfo?.hasSubaccount && <span className="text-green-500">✓</span>}
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                {success}
              </div>
            )}

            {/* Info Tab */}
            {activeTab === 'info' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    L&#39;email ne peut pas être modifié
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Adresse
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    placeholder="Votre adresse complète"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Modification...' : 'Changer le mot de passe'}
                  </button>
                </div>
              </form>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                {/* Verification Status */}
                <div className={`p-4 rounded-lg ${
                  profile?.isVerified
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
                }`}>
                  <div className="flex items-center gap-3">
                    {profile?.isVerified ? (
                      <>
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">Compte vérifié</p>
                          <p className="text-sm text-green-600 dark:text-green-400">Vos documents ont été vérifiés avec succès</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">⏳</span>
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-300">Vérification en attente</p>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">Veuillez téléverser vos documents pour vérification</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* RCCM Document (for companies) */}
                {profile?.entityType === 'COMPANY' && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      🏢 Document RCCM
                      {profile.rccmDocUrl && <span className="text-green-500 text-sm">✓ Téléversé</span>}
                    </h3>

                    {profile.rccm && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Numéro RCCM: <span className="font-mono font-medium">{profile.rccm}</span>
                      </p>
                    )}

                    {profile.rccmDocUrl ? (
                      <div className="space-y-3">
                        <a
                          href={profile.rccmDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                        >
                          📄 Voir le document
                        </a>
                        <div>
                          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Remplacer le document:
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(file, 'rccm');
                            }}
                            disabled={uploadingDoc}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:border-blue-400 transition">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(file, 'rccm');
                            }}
                            disabled={uploadingDoc}
                            className="hidden"
                          />
                          <div className="text-center">
                            {uploadingDoc ? (
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            ) : (
                              <>
                                <span className="text-3xl">📤</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cliquez pour téléverser le RCCM</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">PDF, JPG, PNG (max 5MB)</p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* CNI/Passport Document (for individuals) */}
                {profile?.entityType === 'INDIVIDUAL' && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      🪪 Pièce d&apos;identité (CNI / Passeport)
                      {profile.cinDocUrl && <span className="text-green-500 text-sm">✓ Téléversé</span>}
                    </h3>

                    {profile.cin && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Numéro: <span className="font-mono font-medium">{profile.cin}</span>
                      </p>
                    )}

                    {profile.cinDocUrl ? (
                      <div className="space-y-3">
                        <a
                          href={profile.cinDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                        >
                          📄 Voir le document
                        </a>
                        <div>
                          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Remplacer le document:
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(file, 'cin');
                            }}
                            disabled={uploadingDoc}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:border-blue-400 transition">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(file, 'cin');
                            }}
                            disabled={uploadingDoc}
                            className="hidden"
                          />
                          <div className="text-center">
                            {uploadingDoc ? (
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            ) : (
                              <>
                                <span className="text-3xl">📤</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cliquez pour téléverser votre pièce d&apos;identité</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">PDF, JPG, PNG (max 5MB)</p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="font-medium mb-2">🔒 Protection de vos données</p>
                  <p>Vos documents sont stockés de manière sécurisée et utilisés uniquement pour la vérification de votre identité. Ils ne seront jamais partagés avec des tiers sans votre consentement.</p>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-lg font-medium">Aucun avis pour le moment</p>
                    <p className="text-sm">Les avis apparaîtront ici après vos premières réservations terminées</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(review.rating)}
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                              &ldquo;{review.comment}&rdquo;
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Par <span className="font-medium">{review.reviewer.name}</span> ({review.reviewer.entityType === 'FRETEUR' ? 'Fréteur' : 'Affréteur'})
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Réservation: {review.booking.vehicle.brand} {review.booking.vehicle.model}
                          </p>
                        </div>
                        <span className="text-sm text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Bank Tab - Only for FRETEUR */}
            {activeTab === 'bank' && profile?.role === 'FRETEUR' && (
              <div className="space-y-6">
                <div className="bg-linear-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">💰 Recevoir vos paiements</h3>
                  <p className="text-emerald-100">
                    Configurez vos informations bancaires pour recevoir automatiquement vos paiements après chaque réservation payée.
                  </p>
                </div>

                {bankInfo?.hasSubaccount && (
                  <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Compte de paiement configuré</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                      Les paiements seront automatiquement versés sur votre compte après déduction de la commission FRETDOR.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSaveBankInfo} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Banque
                    </label>
                    <select
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    >
                      <option value="">Sélectionnez votre banque</option>
                      <optgroup label="Banques traditionnelles">
                        {banks.filter(b => !['WAVE', 'DJAMO'].includes(b.code)).map((bank) => (
                          <option key={bank.code} value={bank.code}>
                            {bank.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Comptes prépayés / Fintech">
                        {banks.filter(b => ['WAVE', 'DJAMO'].includes(b.code)).map((bank) => (
                          <option key={bank.code} value={bank.code}>
                            {bank.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      💡 Si vous avez une carte Wave ou Djamo, utilisez le RIB/IBAN associé à votre compte
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Numéro de compte / IBAN
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Ex: CI02 N 00000 00000 00000 0000 000"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom du titulaire du compte
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Ex: KOUAME Jean-Pierre"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Le nom doit correspondre exactement à celui enregistré à la banque
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <span className="font-medium">⚠️ Important :</span> Vérifiez bien vos informations bancaires.
                      Les paiements envoyés à un mauvais compte ne pourront pas être récupérés.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingBank}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingBank ? 'Enregistrement...' : bankInfo?.hasSubaccount ? 'Mettre à jour' : 'Configurer le compte'}
                    </button>
                  </div>
                </form>

                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="font-medium mb-2">ℹ️ Comment ça fonctionne ?</p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Quand un affréteur paie sa réservation, le montant est automatiquement splitté</li>
                    <li>Votre part (après commission FRETDOR) est envoyée directement sur votre compte</li>
                    <li>Les virements sont généralement reçus sous 24 à 72h</li>
                    <li>Vous recevrez une notification à chaque paiement reçu</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Membre depuis {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '-'}
        </div>
      </div>
    </div>
  );
}
