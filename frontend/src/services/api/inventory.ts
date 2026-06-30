import client from './client';
import type { PaginatedResponse, Inventory, ApiResponse } from '@/types';

export const getInventory = (params?: Record<string, unknown>) =>
  client.get<PaginatedResponse<Inventory>>('/inventory', { params });

export const getInventorySummary = () => client.get<ApiResponse<{ totalQty: number; occupiedSlots: number; uniqueModels: number; uniqueLocations: number }>>('/inventory/summary');

export const getLowStock = () => client.get<ApiResponse<Array<{ model: import('@/types').ProductModel; totalQty: number; minStock: number }>>>('/inventory/low-stock');

export const getInventoryByLocation = (locationId: string) =>
  client.get<ApiResponse<Inventory[]>>(`/inventory/by-location/${locationId}`);

export const getInventoryByModel = (modelId: string) =>
  client.get<ApiResponse<Inventory[]>>(`/inventory/by-model/${modelId}`);

export const adjustInventory = (data: { modelId: string; locationId: string; quantity: number; notes?: string }) =>
  client.post('/inventory/adjust', data);
