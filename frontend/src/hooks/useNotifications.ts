import { useQuery, useMutation } from '@tanstack/react-query';
import * as notifApi from '@/services/api/notifications';
import { queryClient } from '@/app/providers/queryClient';

export const useUnreadCount = () =>
  useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: () => notifApi.getUnreadCount().then((r) => r.data), refetchInterval: 30000 });

export const useNotifications = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['notifications', params], queryFn: () => notifApi.getNotifications(params).then((r) => r.data) });

export const useMarkRead = () =>
  useMutation({
    mutationFn: notifApi.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

export const useMarkAllRead = () =>
  useMutation({
    mutationFn: notifApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
