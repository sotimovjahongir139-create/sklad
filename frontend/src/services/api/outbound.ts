import client from './client';
import type { ApiResponse, PaginatedResponse, OutboundOrder } from '@/types';

export const getOutboundOrders = (params?: Record<string, unknown>) =>
  client.get<PaginatedResponse<OutboundOrder>>('/outbound', { params });

export const getOutboundOrder = (id: string) =>
  client.get<ApiResponse<OutboundOrder>>(`/outbound/${id}`);

export const createOutboundOrder = (data: { customer?: string; priority?: string; items: { modelId: string; requestedQty: number }[]; requestedAt?: string; notes?: string }) =>
  client.post<ApiResponse<OutboundOrder>>('/outbound', data);

export const updateOutboundOrder = (id: string, data: Partial<OutboundOrder>) =>
  client.put<ApiResponse<OutboundOrder>>(`/outbound/${id}`, data);

export const deleteOutboundOrder = (id: string) => client.delete(`/outbound/${id}`);

export const pickOutboundOrder = (id: string, data: { items: { modelId: string; locationId: string; quantity: number }[] }) =>
  client.post<ApiResponse<OutboundOrder>>(`/outbound/${id}/pick`, data);

export const shipOutboundOrder = (id: string) =>
  client.post<ApiResponse<OutboundOrder>>(`/outbound/${id}/ship`);

export const cancelOutboundOrder = (id: string) =>
  client.post<ApiResponse<OutboundOrder>>(`/outbound/${id}/cancel`);
