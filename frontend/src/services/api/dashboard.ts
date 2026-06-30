import client from './client';
import type { ApiResponse, DashboardStats, Movement } from '@/types';

export const getDashboardStats = () =>
  client.get<ApiResponse<DashboardStats>>('/dashboard/stats');

export const getRecentActivity = () =>
  client.get<ApiResponse<Movement[]>>('/dashboard/recent-activity');

export const getDashboardAlerts = () =>
  client.get('/dashboard/alerts');
