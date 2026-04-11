'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  AlertTriangle,
  FileText,
  History,
  Truck,
  BarChart3,
  Settings
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const menuItems = [
    { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/kyc', label: 'Validation KYC', icon: ShieldCheck },
    { href: '/admin/reports', label: 'Signalements', icon: AlertTriangle },
    { href: '/admin/transactions', label: 'Transactions', icon: FileText },
    { href: '/admin/vehicles', label: 'Véhicules', icon: Truck },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/history', label: 'Historique', icon: History },
    { href: '/admin/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 min-h-screen fixed left-0 top-0 pt-20">
          <div className="p-4">
            <div className="mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Administration</p>
              <p className="text-white font-semibold">{user.name}</p>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
