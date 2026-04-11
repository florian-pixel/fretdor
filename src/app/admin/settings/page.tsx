'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Settings, Percent, DollarSign, ToggleLeft, ToggleRight, Save, AlertTriangle, Info } from 'lucide-react';

interface PlatformSettings {
  id: string;
  commissionRate: number;
  commissionEnabled: boolean;
  minimumCommission: number;
  maximumCommission: number | null;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    commissionRate: '0',
    commissionEnabled: false,
    minimumCommission: '0',
    maximumCommission: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setFormData({
          commissionRate: data.commissionRate.toString(),
          commissionEnabled: data.commissionEnabled,
          minimumCommission: data.minimumCommission.toString(),
          maximumCommission: data.maximumCommission?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionRate: parseFloat(formData.commissionRate),
          commissionEnabled: formData.commissionEnabled,
          minimumCommission: parseFloat(formData.minimumCommission),
          maximumCommission: formData.maximumCommission ? parseFloat(formData.maximumCommission) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Calculate example commission
  const examplePrice = 100000; // 100,000 FCFA
  const calculatedCommission = (examplePrice * parseFloat(formData.commissionRate || '0')) / 100;
  const finalCommission = Math.max(
    parseFloat(formData.minimumCommission || '0'),
    formData.maximumCommission 
      ? Math.min(calculatedCommission, parseFloat(formData.maximumCommission))
      : calculatedCommission
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="h-7 w-7 text-blue-600" />
          Paramètres de la plateforme
        </h1>
        <p className="text-slate-600 mt-1">Configurez les commissions et autres paramètres</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Save className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-green-700 font-medium">Paramètres enregistrés avec succès !</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-600" />
              Commission sur les transactions
            </h2>

            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">Activer la commission</p>
                <p className="text-sm text-slate-500">
                  {formData.commissionEnabled 
                    ? 'La commission sera prélevée sur chaque transaction'
                    : 'Aucune commission ne sera prélevée (désactivé)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, commissionEnabled: !formData.commissionEnabled })}
                className={`p-2 rounded-lg transition ${formData.commissionEnabled ? 'text-green-600' : 'text-slate-400'}`}
              >
                {formData.commissionEnabled ? (
                  <ToggleRight className="h-10 w-10" />
                ) : (
                  <ToggleLeft className="h-10 w-10" />
                )}
              </button>
            </div>

            {/* Commission Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Taux de commission (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.commissionEnabled}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Exemple: 5% signifie que sur une transaction de 100 000 FCFA, la plateforme percevra 5 000 FCFA
              </p>
            </div>

            {/* Minimum Commission */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Commission minimum (FCFA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.minimumCommission}
                  onChange={(e) => setFormData({ ...formData, minimumCommission: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-3 pr-16 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.commissionEnabled}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">FCFA</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                La commission ne sera jamais inférieure à ce montant (laissez 0 pour aucun minimum)
              </p>
            </div>

            {/* Maximum Commission */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Commission maximum (FCFA) - Optionnel
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.maximumCommission}
                  onChange={(e) => setFormData({ ...formData, maximumCommission: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-3 pr-16 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.commissionEnabled}
                  placeholder="Pas de limite"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">FCFA</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                La commission ne dépassera jamais ce montant (laissez vide pour aucune limite)
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Enregistrer les paramètres
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview / Info */}
        <div className="space-y-6">
          {/* Commission Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Aperçu du calcul
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Prix de la transaction</span>
                <span className="font-medium">{examplePrice.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Taux appliqué</span>
                <span className="font-medium">{formData.commissionRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Commission calculée</span>
                <span className="font-medium">{calculatedCommission.toLocaleString()} FCFA</span>
              </div>
              {parseFloat(formData.minimumCommission) > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Minimum appliqué</span>
                  <span>{parseFloat(formData.minimumCommission).toLocaleString()} FCFA</span>
                </div>
              )}
              {formData.maximumCommission && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Maximum appliqué</span>
                  <span>{parseFloat(formData.maximumCommission).toLocaleString()} FCFA</span>
                </div>
              )}
              <hr className="border-slate-200" />
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Commission finale</span>
                <span className={`font-bold ${formData.commissionEnabled ? 'text-green-600' : 'text-slate-400'}`}>
                  {formData.commissionEnabled ? `${finalCommission.toLocaleString()} FCFA` : 'Désactivée'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Montant au fréteur</span>
                <span className="font-medium">
                  {formData.commissionEnabled 
                    ? `${(examplePrice - finalCommission).toLocaleString()} FCFA`
                    : `${examplePrice.toLocaleString()} FCFA`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          {!formData.commissionEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Commission désactivée</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Actuellement, aucune commission n&apos;est prélevée sur les transactions. 
                    Activez la commission lorsque le système de paiement sera implémenté.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Comment ça fonctionne</p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• La commission sera calculée lors de la confirmation de la réservation</li>
                  <li>• Le montant sera déduit du paiement reçu par le fréteur</li>
                  <li>• Les paramètres s&apos;appliquent aux nouvelles transactions uniquement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
