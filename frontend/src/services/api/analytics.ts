import client from './client';

export const getInventoryTrend = (days = 30) =>
  client.get('/analytics/inventory-trend', { params: { days } });

export const getMovementVolume = (days = 30) =>
  client.get('/analytics/movement-volume', { params: { days } });

export const getTurnover = (days = 30) =>
  client.get('/analytics/turnover', { params: { days } });

export const getDeadstock = (days = 90) =>
  client.get('/analytics/deadstock', { params: { days } });

export const getForecast = (modelId: string, periods = 7) =>
  client.get(`/analytics/forecast/${modelId}`, { params: { periods } });

export const getCategoryBreakdown = () =>
  client.get('/analytics/category-breakdown');
