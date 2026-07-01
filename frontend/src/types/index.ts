export type Role = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
export type ZoneType = 'RECEIVING' | 'STORAGE' | 'STAGING' | 'SHIPPING' | 'QUARANTINE';
export type InboundStatus = 'PENDING' | 'IN_TRANSIT' | 'RECEIVING' | 'COMPLETED' | 'CANCELLED';
export type OutboundStatus = 'PENDING' | 'PICKING' | 'PACKING' | 'SHIPPED' | 'CANCELLED';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type MovementType = 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
export type NotificationType = 'LOW_STOCK' | 'INBOUND_RECEIVED' | 'OUTBOUND_SHIPPED' | 'MOVEMENT_COMPLETED' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface ProductModel {
  id: string;
  modelCode: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  minStock: number;
  maxStock?: number;
  weight?: number;
  dimensions?: { l: number; w: number; h: number };
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  type: ZoneType;
  capacity?: number;
  isActive: boolean;
  locations?: Location[];
}

export interface Location {
  id: string;
  code: string;
  zoneId: string;
  zone?: Zone;
  aisle?: string;
  shelf?: string;
  bin?: string;
  capacity?: number;
  isActive: boolean;
  inventory?: Inventory[];
}

export interface Inventory {
  id: string;
  modelId: string;
  model?: ProductModel;
  locationId: string;
  location?: Location;
  quantity: number;
  reservedQty: number;
  updatedAt: string;
}

export interface InboundItem {
  id: string;
  orderId: string;
  modelId: string;
  model?: ProductModel;
  expectedQty: number;
  receivedQty: number;
}

export interface InboundOrder {
  id: string;
  orderNumber: string;
  supplier?: string;
  status: InboundStatus;
  expectedAt?: string;
  receivedAt?: string;
  notes?: string;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'name'>;
  items: InboundItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OutboundItem {
  id: string;
  orderId: string;
  modelId: string;
  model?: ProductModel;
  requestedQty: number;
  pickedQty: number;
}

export interface OutboundOrder {
  id: string;
  orderNumber: string;
  customer?: string;
  status: OutboundStatus;
  priority: Priority;
  requestedAt?: string;
  shippedAt?: string;
  notes?: string;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'name'>;
  items: OutboundItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  type: MovementType;
  modelId: string;
  model?: Pick<ProductModel, 'id' | 'modelCode' | 'name'>;
  fromLocationId?: string;
  fromLocation?: Pick<Location, 'id' | 'code'>;
  toLocationId?: string;
  toLocation?: Pick<Location, 'id' | 'code'>;
  quantity: number;
  performedById: string;
  performedBy?: Pick<User, 'id' | 'name'>;
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DashboardStats {
  totalInventoryQty: number;
  totalModels: number;
  inboundPending: number;
  outboundPending: number;
  todayMovements: number;
  lowStockCount: number;
}
