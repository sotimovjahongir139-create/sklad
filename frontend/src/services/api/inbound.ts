import client from './client';
import type { ApiResponse, PaginatedResponse, InboundOrder } from '@/types';

export const getInboundOrders = (params?: Record<string, unknown>) =>
  client.get<PaginatedResponse<InboundOrder>>('/inbound', { params });

export const getInboundOrder = (id: string) =>
  client.get<ApiResponse<InboundOrder>>(`/inbound/${id}`);

export const createInboundOrder = (data: { supplier?: string; items: { modelId: string; expectedQty: number }[]; expectedAt?: string; notes?: string }) =>
  client.post<ApiResponse<InboundOrder>>('/inbound', data);

export const updateInboundOrder = (id: string, data: Partial<InboundOrder>) =>
  client.put<ApiResponse<InboundOrder>>(`/inbound/${id}`, data);

export const deleteInboundOrder = (id: string) => client.delete(`/inbound/${id}`);

export const receiveInboundOrder = (id: string, data: { items: { modelId: string; locationId: string; quantity: number }[] }) =>
  client.post<ApiResponse<InboundOrder>>(`/inbound/${id}/receive`, data);

export const cancelInboundOrder = (id: string) =>
  client.post<ApiResponse<InboundOrder>>(`/inbound/${id}/cancel`);
