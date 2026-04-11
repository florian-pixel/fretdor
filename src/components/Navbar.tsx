'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Truck, LogOut, User, Menu, X, Settings, UserCircle } from 'lucide-react';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold">
            <div className="bg-amber-500 text-white p-1.5 rounded-lg">
              <Truck className="h-5 w-5" />
            </div>
            <span className="text-slate-900">FRET<span className="text-amber-500">DOR</span></span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {user.role !== 'ADMIN' && (
                  <Link href="/dashboard" className="text-slate-600 hover:text-blue-600 font-medium transition">
                    Tableau de bord
                  </Link>
                )}
                {user.role === 'FRETEUR' && (
                  <Link href="/vehicles" className="text-slate-600 hover:text-blue-600 font-medium transition">
                    Mes Véhicules
                  </Link>
                )}
                {user.role === 'AFFRETEUR' && (
                  <Link href="/search" className="text-slate-600 hover:text-blue-600 font-medium transition">
                    Rechercher
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="text-slate-600 hover:text-blue-600 font-medium transition">
                    Administration
                  </Link>
                )}

                <div className="h-6 w-px bg-slate-200 mx-2"></div>

                <div className="flex items-center space-x-3">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role === 'FRETEUR' ? 'Transporteur' : user.role === 'AFFRETEUR' ? 'Expéditeur' : 'Admin'}</p>
                  </div>
                  {user.role !== 'ADMIN' && (
                    <NotificationBell />
                  )}
                  {user.role !== 'ADMIN' && (
                    <Link href="/profile" className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition" title="Mon profil">
                      <User className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="text-slate-400 hover:text-red-600 transition"
                    title="Déconnexion"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-600 hover:text-blue-600 font-medium transition">
                  Connexion
                </Link>
                <Link href="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm hover:shadow-md">
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-blue-600">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-4 py-4 space-y-3">
            {user ? (
              <>
                <div className="flex items-center space-x-3 mb-4 p-3 bg-slate-50 rounded-lg">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role}</p>
                  </div>
                </div>
                <Link href="/dashboard" className="block text-slate-600 hover:text-blue-600 py-2">
                  Tableau de bord
                </Link>
                {user.role === 'FRETEUR' && (
                  <Link href="/vehicles" className="block text-slate-600 hover:text-blue-600 py-2">
                    Mes Véhicules
                  </Link>
                )}
                {user.role === 'AFFRETEUR' && (
                  <Link href="/search" className="block text-slate-600 hover:text-blue-600 py-2">
                    Rechercher
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <>
                    <Link href="/admin" className="block text-slate-600 hover:text-blue-600 py-2">
                      Administration
                    </Link>
                  </>
                )}
                {user.role !== 'ADMIN' && (
                  <Link href="/profile" className="block text-slate-600 hover:text-blue-600 py-2">
                    Mon Profil
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-red-600 py-2 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link href="/login" className="text-center text-slate-600 hover:text-blue-600 py-2">
                  Connexion
                </Link>
                <Link href="/register" className="text-center bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700">
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
