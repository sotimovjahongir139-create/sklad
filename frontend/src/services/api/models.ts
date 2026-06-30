import client from './client';
import type { ApiResponse, PaginatedResponse, ProductModel } from '@/types';

export const getModels = (params?: Record<string, unknown>) =>
  client.get<PaginatedResponse<ProductModel>>('/models', { params });

export const getModel = (id: string) =>
  client.get<ApiResponse<ProductModel>>(`/models/${id}`);

export const createModel = (data: Partial<ProductModel>) =>
  client.post<ApiResponse<ProductModel>>('/models', data);

export const updateModel = (id: string, data: Partial<ProductModel>) =>
  client.put<ApiResponse<ProductModel>>(`/models/${id}`, data);

export const deleteModel = (id: string) => client.delete(`/models/${id}`);

export const getModelInventory = (id: string) =>
  client.get(`/models/${id}/inventory`);

export const getModelMovements = (id: string, params?: Record<string, unknown>) =>
  client.get(`/models/${id}/movements`, { params });
