'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Truck, User, Building2, Upload, FileText } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'AFFRETEUR',
    phone: '',
    entityType: 'COMPANY',
    rccm: '',
    cin: '',
  });
  const [rccmFile, setRccmFile] = useState<File | null>(null);
  const [cinFile, setCinFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const uploadDocument = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Upload documents if provided
      let rccmDocUrl = null;
      let cinDocUrl = null;

      if (rccmFile) {
        rccmDocUrl = await uploadDocument(rccmFile);
      }
      if (cinFile) {
        cinDocUrl = await uploadDocument(cinFile);
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rccmDocUrl,
          cinDocUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
            <Truck className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Créer un compte</h2>
          <p className="mt-2 text-sm text-slate-600">
            Rejoignez la plus grande communauté de transporteurs
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type d'entité - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Vous êtes ?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, entityType: 'COMPANY' })}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                    formData.entityType === 'COMPANY'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Building2 className="h-6 w-6 mb-2" />
                  <span className="font-medium">Une Entreprise</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, entityType: 'INDIVIDUAL' })}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                    formData.entityType === 'INDIVIDUAL'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <User className="h-6 w-6 mb-2" />
                  <span className="font-medium">Un Particulier</span>
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Je souhaite</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="AFFRETEUR">Expédier des marchandises (Affréteur)</option>
                <option value="FRETEUR">Proposer mes camions (Fréteur)</option>
              </select>
            </div>

            {/* Personal Info */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet / Raison Sociale</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Conditional Fields */}
            {formData.entityType === 'COMPANY' ? (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Numéro RCCM</label>
                  <input
                    type="text"
                    value={formData.rccm}
                    onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Ex: CG-BZV-01-2023-B12345"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Document RCCM (PDF, Image)
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition bg-slate-50">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setRccmFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Upload className="h-5 w-5 text-slate-400 mr-2" />
                      <span className="text-sm text-slate-600">
                        {rccmFile ? rccmFile.name : 'Cliquez pour téléverser le RCCM'}
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Formats acceptés: PDF, JPG, PNG (max 5MB)</p>
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Numéro CNI / Passeport</label>
                  <input
                    type="text"
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Ex: CI0012345678"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Document d&apos;identité (CNI ou Passeport)
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition bg-slate-50">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setCinFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Upload className="h-5 w-5 text-slate-400 mr-2" />
                      <span className="text-sm text-slate-600">
                        {cinFile ? cinFile.name : 'Cliquez pour téléverser votre pièce d\'identité'}
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Formats acceptés: PDF, JPG, PNG (max 5MB)</p>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            {isLoading ? 'Création du compte...' : "S'inscrire gratuitement"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-slate-600">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
