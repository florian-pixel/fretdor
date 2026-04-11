'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Truck, Info, DollarSign, MapPin, Image as ImageIcon, Upload, X, FileText, Weight } from 'lucide-react';

const PHOTO_SIDES = [
  { key: 'photoFrontUrl', label: 'Avant' },
  { key: 'photoRearUrl', label: 'Arrière' },
  { key: 'photoLeftUrl', label: 'Gauche' },
  { key: 'photoRightUrl', label: 'Droite' },
] as const;

const DOCS = [
  { key: 'assuranceDocUrl', label: 'Assurance', required: true },
  { key: 'visiteTechniqueDocUrl', label: 'Visite technique', required: true },
  { key: 'carteGriseDocUrl', label: 'Carte grise', required: true },
  { key: 'patenteDocUrl', label: 'Patente', required: false },
] as const;

type SideKey = typeof PHOTO_SIDES[number]['key'];
type DocKey = typeof DOCS[number]['key'];

export default function AddVehiclePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'Plateau',
    brand: '',
    model: '',
    registrationNumber: '',
    firstRegistrationDate: '',
    trailerRegistrationNumber: '',
    color: '',
    capacityWeight: '',
    capacityVolume: '',
    isOffRoadCapable: false,
    hasDriver: true,
    hasConvoyeur: false,
    fuelType: 'Diesel',
    transmission: 'Manuelle',
    location: '',
    pricingType: 'PER_TONNE_KM',
    pricePerDay: '',
    pricePerKm: '',
    pricePerTonneKm: '',
    minPrice: '',
    maxPrice: '',
    conditions: '',
    assuranceDocUrl: '',
    visiteTechniqueDocUrl: '',
    carteGriseDocUrl: '',
    patenteDocUrl: '',
    photoFrontUrl: '',
    photoRearUrl: '',
    photoLeftUrl: '',
    photoRightUrl: '',
    images: [] as string[],
  });

  const uploadFile = async (file: File, key: string): Promise<string | null> => {
    setUploading(key);
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const json = await res.json();
      return json.success ? json.url : null;
    } catch {
      return null;
    } finally {
      setUploading(null);
    }
  };

  const handleSidePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: SideKey) => {
    if (!e.target.files?.[0]) return;
    const url = await uploadFile(e.target.files[0], key);
    if (url) setFormData(prev => ({ ...prev, [key]: url }));
    else alert('Erreur lors de l\'upload');
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: DocKey) => {
    if (!e.target.files?.[0]) return;
    const url = await uploadFile(e.target.files[0], key);
    if (url) setFormData(prev => ({ ...prev, [key]: url }));
    else alert('Erreur lors de l\'upload');
  };

  const handleExtraPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const url = await uploadFile(e.target.files[0], 'extra');
    if (url) setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    else alert('Erreur lors de l\'upload');
  };

  const removeExtraImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push('/vehicles');
      } else {
        alert('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating vehicle', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Ajouter un véhicule</h1>
        <p className="text-slate-500 mt-2">Remplissez les informations ci-dessous pour mettre votre véhicule en location.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Section 1: Informations Générales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Truck className="text-blue-600 h-5 w-5" />
            <h2 className="text-xl font-semibold text-slate-800">Informations du véhicule</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type de véhicule</label>
              <select
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Plateau">Plateau</option>
                <option value="Benne">Benne</option>
                <option value="Citerne">Citerne</option>
                <option value="Frigo">Frigo</option>
                <option value="Bâché">Bâché</option>
                <option value="Porte-Char">Porte-Char</option>
                <option value="Fourgon">Fourgon</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Immatriculation tracteur</label>
              <input
                type="text"
                required
                placeholder="Ex: 1234 AB 01"
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Immatriculation remorque</label>
              <input
                type="text"
                placeholder="Ex: 5678 CD 01"
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.trailerRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, trailerRegistrationNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date de première mise en circulation</label>
              <input
                type="date"
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.firstRegistrationDate}
                onChange={(e) => setFormData({ ...formData, firstRegistrationDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marque</label>
              <input
                type="text"
                required
                placeholder="Ex: Mercedes-Benz"
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modèle</label>
              <input
                type="text"
                required
                placeholder="Ex: Actros 3340"
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
              <input
                type="text"
                placeholder="Ex: Blanc, Rouge, Bleu..."
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Caractéristiques Techniques */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Info className="text-blue-600 h-5 w-5" />
            <h2 className="text-xl font-semibold text-slate-800">Caractéristiques Techniques</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Carburant</label>
              <select
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
              >
                <option value="Diesel">Diesel</option>
                <option value="Essence">Essence</option>
                <option value="Hybride">Hybride</option>
                <option value="Electrique">Electrique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transmission</label>
              <select
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
              >
                <option value="Manuelle">Manuelle</option>
                <option value="Automatique">Automatique</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capacité de charge (Tonnes)</label>
              <input
                type="number"
                placeholder="Ex: 30"
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.capacityWeight}
                onChange={(e) => setFormData({ ...formData, capacityWeight: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">Laisser vide si non applicable</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Volume (m³)</label>
              <input
                type="number"
                placeholder="Ex: 80"
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.capacityVolume}
                onChange={(e) => setFormData({ ...formData, capacityVolume: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">Laisser vide si non applicable</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={formData.isOffRoadCapable}
                onChange={(e) => setFormData({ ...formData, isOffRoadCapable: e.target.checked })}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Piste autorisée</span>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={formData.hasDriver}
                onChange={(e) => setFormData({ ...formData, hasDriver: e.target.checked })}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Chauffeur inclus</span>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={formData.hasConvoyeur}
                onChange={(e) => setFormData({ ...formData, hasConvoyeur: e.target.checked })}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Convoyeur inclus</span>
            </label>
          </div>
        </div>

        {/* Section 3: Tarification & Localisation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <DollarSign className="text-blue-600 h-5 w-5" />
            <h2 className="text-xl font-semibold text-slate-800">Tarification & Localisation</h2>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Localisation actuelle</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ville, Quartier (Ex: Abidjan, Yopougon)"
                className="w-full pl-10 border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Mode de tarification</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'PER_TONNE_KM', label: 'Par Tonne-Km', icon: Weight },
                { value: 'PER_DAY', label: 'Par Jour', icon: null },
                { value: 'PER_KM', label: 'Par Kilomètre', icon: null },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, pricingType: value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    formData.pricingType === value
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {formData.pricingType === 'PER_TONNE_KM' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3 mb-4">
                <Weight className="text-blue-600 h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Tarification par Tonne-Kilomètre</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Le prix total sera calculé selon : <strong>Tonnage × Distance (km) × Tarif</strong>.<br/>
                    Ex: 20T × 300km × 50 FCFA/T·km = 300 000 FCFA
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prix par Tonne-Kilomètre (FCFA/T·km)</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 50"
                  min="0"
                  step="0.5"
                  className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.pricePerTonneKm}
                  onChange={(e) => setFormData({ ...formData, pricePerTonneKm: e.target.value })}
                />
              </div>
            </div>
          )}

          {formData.pricingType === 'PER_DAY' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Prix par jour (FCFA)</label>
              <input
                type="number"
                required
                placeholder="Ex: 150 000"
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.pricePerDay}
                onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
              />
            </div>
          )}

          {formData.pricingType === 'PER_KM' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Prix par Kilomètre (FCFA/km)</label>
              <input
                type="number"
                required
                placeholder="Ex: 1 000"
                className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={formData.pricePerKm}
                onChange={(e) => setFormData({ ...formData, pricePerKm: e.target.value })}
              />
            </div>
          )}

          {/* Prix plancher / plafond */}
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-700 mb-3">Prix plancher & plafond (optionnel)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Prix plancher (FCFA)</label>
                <input
                  type="number"
                  placeholder="Minimum accepté"
                  className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={formData.minPrice}
                  onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Prix plafond (FCFA)</label>
                <input
                  type="number"
                  placeholder="Maximum demandé"
                  className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={formData.maxPrice}
                  onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Ces prix guident la négociation mais ne sont pas visibles publiquement.</p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Conditions de location</label>
            <textarea
              rows={4}
              placeholder="Précisez vos conditions (Ex: Carburant à la charge du client, Caution demandée, Zone géographique limitée...)"
              className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
            />
          </div>
        </div>

        {/* Section 4: Photos par côté */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <ImageIcon className="text-blue-600 h-5 w-5" />
            <h2 className="text-xl font-semibold text-slate-800">Photos du véhicule</h2>
          </div>

          <p className="text-sm text-slate-500 mb-4">Ajoutez une photo pour chaque côté du véhicule.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {PHOTO_SIDES.map(({ key, label }) => {
              const url = formData[key];
              return (
                <div key={key} className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-600 text-center">{label}</span>
                  {url ? (
                    <div className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <Image src={url} alt={label} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, [key]: '' }))}
                        className="absolute top-1 right-1 p-1 bg-white/90 text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                      {uploading === key ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      ) : (
                        <Upload className="w-6 h-6 text-slate-400" />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleSidePhotoUpload(e, key)}
                        disabled={uploading !== null}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm text-slate-500 mb-3">Photos supplémentaires (intérieur, chargement, etc.)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images.map((url, index) => (
              <div key={index} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <Image src={url} alt={`Photo ${index + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeExtraImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
              {uploading === 'extra' ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              ) : (
                <>
                  <Upload className="w-6 h-6 mb-1 text-slate-400" />
                  <p className="text-xs text-slate-500">Ajouter</p>
                </>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleExtraPhotoUpload} disabled={uploading !== null} />
            </label>
          </div>
        </div>

        {/* Section 5: Documents */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <FileText className="text-blue-600 h-5 w-5" />
            <h2 className="text-xl font-semibold text-slate-800">Documents du véhicule</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DOCS.map(({ key, label, required }) => {
              const url = formData[key];
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  {url ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-700 truncate flex-1">Document ajouté</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, [key]: '' }))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 transition ${uploading === key ? 'border-blue-300' : 'border-slate-300 hover:border-blue-400'}`}>
                      {uploading === key ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      ) : (
                        <Upload className="h-5 w-5 text-slate-400" />
                      )}
                      <span className="text-sm text-slate-500">
                        {uploading === key ? 'Envoi...' : 'Cliquez pour ajouter'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocUpload(e, key)}
                        disabled={uploading !== null}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-4 px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70"
          >
            {isLoading ? 'Création...' : 'Publier le véhicule'}
          </button>
        </div>
      </form>
    </div>
  );
}
