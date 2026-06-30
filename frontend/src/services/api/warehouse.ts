import client from './client';
import type { ApiResponse, Zone, Location } from '@/types';

export const getZones = () => client.get<ApiResponse<Zone[]>>('/warehouse/zones');
export const createZone = (data: Partial<Zone>) => client.post<ApiResponse<Zone>>('/warehouse/zones', data);
export const updateZone = (id: string, data: Partial<Zone>) => client.put<ApiResponse<Zone>>(`/warehouse/zones/${id}`, data);

export const getLocations = (params?: Record<string, unknown>) =>
  client.get<ApiResponse<Location[]>>('/warehouse/locations', { params });

export const getLocation = (id: string) =>
  client.get<ApiResponse<Location>>(`/warehouse/locations/${id}`);

export const createLocation = (data: Partial<Location>) =>
  client.post<ApiResponse<Location>>('/warehouse/locations', data);

export const updateLocation = (id: string, data: Partial<Location>) =>
  client.put<ApiResponse<Location>>(`/warehouse/locations/${id}`, data);

export const getWarehouseMap = () => client.get('/warehouse/map');
