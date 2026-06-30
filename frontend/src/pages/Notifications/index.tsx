import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '@/services/api/notifications';
import { queryClient } from '@/app/providers/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  LOW_STOCK: '⚠️', INBOUND_RECEIVED: '📦', OUTBOUND_SHIPPED: '🚚', MOVEMENT_COMPLETED: '↔️', SYSTEM: '🔔',
};

export default function Notifications() {
  const { data, isLoading } = useQuery({ queryKey: ['notifications', {}], queryFn: () => getNotifications({ limit: 50 }).then((r) => r.data) });
  const markRead = useMutation({ mutationFn: markNotificationRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });
  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });
  const remove = useMutation({ mutationFn: deleteNotification, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });

  const notifications: Notification[] = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bildirishnomalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unreadCount > 0 ? `${unreadCount} ta o'qilmagan` : 'Hammasi o\'qilgan'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAll.mutate()} disabled={markAll.isPending} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <CheckCheck size={16} /> Hammasini o'qilgan deb belgilash
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">Bildirishnomalar yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                <div className="text-2xl mt-0.5 flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{n.title}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: uz })}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.isRead && (
                    <button onClick={() => markRead.mutate(n.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-blue-500" title="O'qilgan deb belgilash">
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button onClick={() => remove.mutate(n.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
