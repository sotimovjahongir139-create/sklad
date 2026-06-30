import client from './client';
import type { ApiResponse, PaginatedResponse, Notification } from '@/types';

export const getNotifications = (params?: Record<string, unknown>) =>
  client.get<PaginatedResponse<Notification>>('/notifications', { params });

export const getUnreadCount = () =>
  client.get<ApiResponse<{ count: number }>>('/notifications/unread-count');

export const markNotificationRead = (id: string) =>
  client.put(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  client.put('/notifications/read-all');

export const deleteNotification = (id: string) =>
  client.delete(`/notifications/${id}`);
