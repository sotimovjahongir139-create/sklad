export const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const WS_URL = import.meta.env.VITE_WS_URL || '';

export const INBOUND_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Kutilmoqda', IN_TRANSIT: "Yo'lda", RECEIVING: 'Qabul qilinmoqda', COMPLETED: 'Yakunlangan', CANCELLED: 'Bekor qilingan',
};

export const OUTBOUND_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Kutilmoqda', PICKING: 'Yig\'ilmoqda', PACKING: 'Qadoqlanmoqda', SHIPPED: "Jo'natilgan", CANCELLED: 'Bekor qilingan',
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Past', NORMAL: 'Oddiy', HIGH: 'Yuqori', URGENT: 'Shoshilinch',
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  INBOUND: 'Kirim', OUTBOUND: 'Chiqim', TRANSFER: "Ko'chirish", ADJUSTMENT: 'Tuzatish', RETURN: 'Qaytarish',
};

export const ZONE_TYPE_LABELS: Record<string, string> = {
  RECEIVING: 'Qabul', STORAGE: 'Saqlash', STAGING: 'Tayyorlov', SHIPPING: "Jo'natish", QUARANTINE: 'Karantin',
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  RECEIVING: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PICKING: 'bg-orange-100 text-orange-800',
  PACKING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-green-100 text-green-800',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export const PAGE_SIZE = 20;
