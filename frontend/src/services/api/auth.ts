import client from './client';
import type { ApiResponse, User } from '@/types';

export const login = (data: { email: string; password: string }) =>
  client.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', data);

export const logoutApi = () => client.post('/auth/logout');

export const getMe = () => client.get<ApiResponse<User>>('/auth/me');

export const updateProfile = (data: { name: string }) => client.put<ApiResponse<User>>('/auth/me', data);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  client.put('/auth/me/password', data);

export const register = (data: { email: string; password: string; name: string; role?: string }) =>
  client.post<ApiResponse<User>>('/auth/register', data);
