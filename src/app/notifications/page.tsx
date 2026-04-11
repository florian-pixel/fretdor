'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'BOOKING_REQUEST': return { label: 'Demande', color: 'bg-blue-100 text-blue-700' };
      case 'BOOKING_ACCEPTED': return { label: 'Acceptée', color: 'bg-green-100 text-green-700' };
      case 'BOOKING_REJECTED': return { label: 'Refusée', color: 'bg-red-100 text-red-700' };
      case 'BOOKING_CANCELLED': return { label: 'Annulée', color: 'bg-orange-100 text-orange-700' };
      case 'NEGOTIATION': return { label: 'Négociation', color: 'bg-amber-100 text-amber-700' };
      case 'BOOKING_COMPLETED': return { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700' };
      case 'REVIEW_RECEIVED': return { label: 'Avis', color: 'bg-purple-100 text-purple-700' };
      default: return { label: 'Système', color: 'bg-slate-100 text-slate-700' };
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500">
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
          >
            <CheckCheck size={18} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">Aucune notification</h3>
            <p className="text-slate-500 mt-1">Vous n&apos;avez pas encore de notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const typeInfo = getTypeLabel(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 transition cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id);
                    if (notification.link) router.push(notification.link);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                      notification.isRead ? 'bg-slate-100' : 'bg-blue-100'
                    }`}>
                      <Bell size={20} className={notification.isRead ? 'text-slate-400' : 'text-blue-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className={`font-medium ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatDate(notification.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
