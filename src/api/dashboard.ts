import { apiClient } from './client';

export interface PaginateQuery {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  include?: string;
}

export interface TripsQuery extends PaginateQuery {
  status?: 'ONGOING' | 'COMPLETED';
  phase?: string;
  vehicleId?: number;
  originCenterId?: number;
  destinationCenterId?: number;
  centerId?: number;
  purpose?: 'DELIVERY' | 'PICKUP';
  createdAt?: string; // YYYY-MM-DD
}

export interface ReportsQuery {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  centerId?: number;
  vehicleId?: number;
  agentId?: number;
  groupBy?: 'day' | 'week' | 'month';
}

export interface PaginateResult<T> {
  data: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    sortBy?: [string, 'ASC' | 'DESC'][];
    search?: string;
    searchBy?: string[];
  };
  links?: {
    first?: string;
    previous?: string;
    current: string;
    next?: string;
    last?: string;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalCenters: number;
  totalVehicles: number;
  totalArrivals: number;
  totalExits: number;
  totalIncomingVehicles: number;
  totalProcessingStages: number;
  activeVehicles: number;
  vehiclesWithQrCode: number;
  recentArrivals: number;
  recentExits: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentActivity: {
    latestArrivals: any[];
    latestExits: any[];
    latestVehicles: any[];
  };
  summary: {
    vehiclesByStatus: Record<string, number>;
    arrivalsByStatus: Record<string, number>;
    exitsByType: Record<string, number>;
  };
}

export interface QrCodeResponse {
  qrCodeDataUrl: string;
  qrCodeString: string;
  vehicleId: number;
  vehicle: any;
}

export interface CurrentUser {
  id: string;
  accountId: number;
  createdAt: string;
  updatedAt: string;
  accid: string;
  subid: string;
  company?: string;
  username?: string;
  email?: string | null;
  role?: string;
  fullname?: string;
  lastLoginAt?: string | null;
  [key: string]: unknown;
}

export type VehicleStatus = 'available' | 'in_garage' | 'in_transit' | 'in_processing' | 'at_center' | 'unavailable';

export interface Vehicle {
  id: number;
  thirdPartyId: number;
  accountId: number;
  plate: string;
  model: string;
  brand?: string;
  year?: number;
  tag2?: string;
  isActive: boolean;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
  qrCode?: string | null | { qrCode?: string; qrCodeDataUrl?: string };
  qrCodeDataUrl?: string;
  qrCodeString?: string;
  currentStatus?: VehicleStatus;
  currentCenterId?: number;
  // When using include=currentCenter, the API returns the full center object (camelCase or snake_case).
  currentCenter?: { id: number; name?: string } | null;
  current_center?: { id: number; name?: string } | null;
}

export interface StatusSummary {
  available?: number;
  in_garage?: number;
  in_transit?: number;
  in_processing?: number;
  at_center?: number;
  unavailable?: number;
  // Doc API may return uppercase keys
  AVAILABLE?: number;
  IN_GARAGE?: number;
  IN_TRANSIT?: number;
  WAITING_IN_QUEUE?: number;
  LOADING?: number;
  UNLOADING?: number;
  [key: string]: number | undefined;
}

/** Normalize status summary to a single shape (prefer uppercase from API) */
export function normalizeStatusSummary(s: StatusSummary | undefined): Record<string, number> {
  if (!s) return {};
  const out: Record<string, number> = {};
  const keys = ['AVAILABLE', 'IN_TRANSIT', 'WAITING_IN_QUEUE', 'LOADING', 'UNLOADING', 'IN_GARAGE'] as const;
  keys.forEach((k) => {
    const v = s[k] ?? (s[k.toLowerCase() as keyof StatusSummary] as number | undefined);
    if (typeof v === 'number') out[k] = v;
  });
  return out;
}

// --- Reports & Trips (Dashboard Integration Workflow) ---

export interface ReportsDashboard {
  vehiclesByStatus?: Record<string, number>;
  trips?: { ongoing?: number; completed?: number; byPurpose?: Record<string, number>; byPhase?: Record<string, number> };
  queues?: { loading?: number; unloading?: number; byCenter?: Record<string, { loading?: number; unloading?: number }> };
  centers?: number | { total?: number };
  [key: string]: unknown;
}

export interface TripEvent {
  id: number;
  tripId: number;
  eventType: string;
  centerId?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Trip {
  id: number;
  vehicleId: number;
  originCenterId: number;
  destinationCenterId?: number;
  purpose: 'DELIVERY' | 'PICKUP';
  phase: string;
  status: 'ONGOING' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  vehicle?: Vehicle;
  originCenter?: { id: number; name?: string; geozoneId?: string };
  destinationCenter?: { id: number; name?: string; geozoneId?: string };
  events?: TripEvent[];
}

export interface TripsSummaryReport {
  ongoingCount?: number;
  completedInPeriod?: number;
  totalStarted?: number;
  completionRate?: number;
  byStatus?: Record<string, number>;
  byPurpose?: Record<string, number>;
  byPhase?: Record<string, number>;
}

export interface QueuesSummaryReport {
  loading?: { active?: number; total?: number };
  unloading?: { active?: number; total?: number };
  byCenter?: Array<{ centerId: number; centerName?: string; loading?: number; unloading?: number }>;
}

export interface CenterQueueItem {
  id: number;
  vehicleId: number;
  vehicle?: Vehicle;
  centerId: number;
  type: 'LOADING' | 'UNLOADING';
  position?: number;
  isActive?: boolean;
  queuedAt: string;
  startedAt?: string;
  [key: string]: unknown;
}

export interface CenterQueueSummary {
  loading?: number | { total?: number; active?: number };
  unloading?: number | { total?: number; active?: number };
  [key: string]: unknown;
}

export interface BulkAssignmentItem {
  vehicleId: number;
  centerId: number | null;
}

export interface BulkAssignmentResult {
  updatedCount: number;
  results: Array<{ vehicleId: number; centerId: number | null; success: boolean; error?: string }>;
}

export interface StatusHistory {
  id: number;
  vehicleId: number;
  status: VehicleStatus;
  centerId?: number;
  centerName?: string;
  changedBy?: string;
  notes?: string;
  changedAt: string;
}

export interface UpdateStatusRequest {
  status: VehicleStatus;
  centerId?: number;
  notes?: string;
}

export interface VehicleGroup {
  groupId: number;
  groupName: string;
  total: number;
  vehicles: Vehicle[];
}

export interface BulkQrCodeRequest {
  vehicleIds: number[];
}

export interface BulkQrCodeResponse {
  success: boolean;
  created: number;
  failed: number;
  errors?: Array<{ vehicleId: number; error: string }>;
}

export const dashboardApi = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await apiClient.get<DashboardOverview>('/dashboard/overview');
    return response.data;
  },

  getUsers: async (query?: PaginateQuery): Promise<PaginateResult<any>> => {
    const response = await apiClient.get<PaginateResult<any>>('/users', {
      params: query,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<CurrentUser> => {
    const response = await apiClient.get<CurrentUser>('/users/me');
    return response.data;
  },

  getCenters: async (query?: PaginateQuery): Promise<PaginateResult<any>> => {
    const response = await apiClient.get<PaginateResult<any>>('/centers', {
      params: query,
    });
    return response.data;
  },

  getVehicles: async (query?: PaginateQuery): Promise<PaginateResult<any>> => {
    const response = await apiClient.get<PaginateResult<any>>('/vehicles', {
      params: query,
    });
    return response.data;
  },

  getArrivals: async (query?: PaginateQuery): Promise<PaginateResult<any>> => {
    const response = await apiClient.get<PaginateResult<any>>('/dashboard/arrivals', {
      params: query,
    });
    return response.data;
  },

  getExits: async (query?: PaginateQuery): Promise<PaginateResult<any>> => {
    const response = await apiClient.get<PaginateResult<any>>('/dashboard/exits', {
      params: query,
    });
    return response.data;
  },

  getIncomingVehicles: async (query?: PaginateQuery): Promise<PaginateResult<any>> => {
    const response = await apiClient.get<PaginateResult<any>>('/dashboard/incoming-vehicles', {
      params: query,
    });
    return response.data;
  },

  getProcessingStages: async (query?: PaginateQuery): Promise<PaginateResult<any>> => {
    const response = await apiClient.get<PaginateResult<any>>('/dashboard/processing-stages', {
      params: query,
    });
    return response.data;
  },

  generateQrCode: async (vehicleId: string | number): Promise<QrCodeResponse> => {
    const response = await apiClient.post<QrCodeResponse>(
      `/dashboard/vehicles/${vehicleId}/qr-code`
    );
    return response.data;
  },

  /** Get vehicle QR code details by thirdPartyId (used for display in sheet) */
  getVehicleQrCode: async (thirdPartyId: number): Promise<QrCodeResponse> => {
    const response = await apiClient.get<QrCodeResponse>(
      `/vehicles/qr-code/vehicle/${thirdPartyId}`
    );
    return response.data;
  },

  /** Generate QR code for a vehicle by thirdPartyId (POST) */
  generateVehicleQrCode: async (thirdPartyId: number): Promise<QrCodeResponse> => {
    const response = await apiClient.post<QrCodeResponse>(
      `/vehicles/${thirdPartyId}/qr-code`
    );
    return response.data;
  },

  /** Get vehicles grouped by groups */
  getVehicleGroups: async (database?: string, include?: string): Promise<VehicleGroup[]> => {
    const endpoint = database ? `/vehicles/groups/${database}` : '/vehicles/groups';
    const response = await apiClient.get<VehicleGroup[]>(endpoint, {
      params: include ? { include } : undefined,
    });
    return response.data;
  },

  /** Bulk create QR codes for multiple vehicles */
  bulkCreateQrCodes: async (vehicleIds: number[]): Promise<BulkQrCodeResponse> => {
    const response = await apiClient.post<BulkQrCodeResponse>(
      '/vehicles/qr-codes/bulk',
      { vehicleIds }
    );
    return response.data;
  },

  /** Regenerate QR code for a vehicle by thirdPartyId */
  regenerateVehicleQrCode: async (thirdPartyId: number): Promise<QrCodeResponse> => {
    const response = await apiClient.post<QrCodeResponse>(
      `/vehicles/${thirdPartyId}/qr-code/regenerate`
    );
    return response.data;
  },

  /** Get vehicle groups from Malambi API with pagination, filtering, searching, and sorting */
  getVehicleGroupsFromApi: async (params?: {
    page?: number;
    limit?: number;
    node?: string;
    sync?: boolean;
    search?: string;
    sortBy?: string;
  }): Promise<PaginateResult<VehicleGroup>> => {
    const response = await apiClient.get<PaginateResult<VehicleGroup>>(
      '/vehicles/groups/from-api',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 100,
          node: params?.node ?? 'root',
          sync: params?.sync ?? false,
          search: params?.search,
          sortBy: params?.sortBy,
        },
      }
    );
    return response.data;
  },

  /** Update vehicle status */
  updateVehicleStatus: async (vehicleId: number, data: UpdateStatusRequest): Promise<Vehicle> => {
    const response = await apiClient.put<Vehicle>(`/vehicles/${vehicleId}/status`, data);
    return response.data;
  },

  /** Get vehicle status history */
  getVehicleStatusHistory: async (vehicleId: number, limit?: number): Promise<StatusHistory[]> => {
    const response = await apiClient.get<StatusHistory[]>(`/vehicles/${vehicleId}/status-history`, {
      params: limit ? { limit } : undefined,
    });
    return response.data;
  },

  /** Get vehicles by status */
  getVehiclesByStatus: async (status: VehicleStatus): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>(`/vehicles/by-status/${status}`, {
      params: {
        include: 'qrCodes,group,assignedCenter,currentCenter',
      },
    });
    return response.data;
  },

  /** Get vehicles by center */
  getVehiclesByCenter: async (centerId: number): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>(`/vehicles/by-center/${centerId}`, {
      params: {
        include: 'qrCodes,group,assignedCenter,currentCenter',
      },
    });
    return response.data;
  },

  /** Get status summary (supports both lowercase and uppercase keys from API) */
  getStatusSummary: async (): Promise<StatusSummary> => {
    const response = await apiClient.get<StatusSummary>('/vehicles/status-summary');
    return response.data;
  },

  // --- Reports (Dashboard Integration) ---
  getReportsDashboard: async (params?: ReportsQuery): Promise<ReportsDashboard> => {
    const response = await apiClient.get<ReportsDashboard>('/reports/dashboard', { params });
    return response.data;
  },

  getReportsTripsSummary: async (params?: ReportsQuery): Promise<TripsSummaryReport> => {
    const response = await apiClient.get<TripsSummaryReport>('/reports/trips/summary', { params });
    return response.data;
  },

  getReportsTripsByDate: async (params?: ReportsQuery & { groupBy?: 'day' | 'week' | 'month' }): Promise<{ data: Array<{ date: string; count: number }> }> => {
    const response = await apiClient.get('/reports/trips/by-date', { params });
    return response.data;
  },

  getReportsQueuesSummary: async (params?: ReportsQuery): Promise<QueuesSummaryReport> => {
    const response = await apiClient.get<QueuesSummaryReport>('/reports/queues/summary', { params });
    return response.data;
  },

  getReportsQueuesByCenter: async (params?: ReportsQuery): Promise<QueuesSummaryReport['byCenter']> => {
    const response = await apiClient.get('/reports/queues/by-center', { params });
    return response.data;
  },

  // --- Trips ---
  getTrips: async (params?: TripsQuery): Promise<PaginateResult<Trip>> => {
    const { sortOrder, sortBy: _sortBy, ...rest } = params ?? {};
    const requestParams: Record<string, unknown> = { ...rest };
    if (sortOrder) requestParams.sortOrder = sortOrder.toLowerCase();
    const cleaned = Object.fromEntries(
      Object.entries(requestParams).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get<PaginateResult<Trip>>('/trips', { params: cleaned });
    const raw = response.data as any;
    if (Array.isArray(raw)) {
      return { data: raw, meta: { itemsPerPage: raw.length, totalItems: raw.length, currentPage: 1, totalPages: 1 } };
    }
    if (raw?.data && Array.isArray(raw.data)) {
      return raw as PaginateResult<Trip>;
    }
    if (raw?.items && Array.isArray(raw.items)) {
      return {
        data: raw.items,
        meta: {
          itemsPerPage: raw.items.length,
          totalItems: raw.totalItems ?? raw.items.length,
          currentPage: raw.currentPage ?? 1,
          totalPages: raw.totalPages ?? 1,
        },
      };
    }
    return { data: [], meta: { itemsPerPage: 0, totalItems: 0, currentPage: 1, totalPages: 1 } };
  },

  /** Get all trips. Uses GET /trips with pagination. sortBy is not sent. */
  getAllTrips: async (params?: {
    page?: number;
    limit?: number;
    sortOrder?: 'ASC' | 'DESC';
    include?: string;
    search?: string;
    status?: 'ONGOING' | 'COMPLETED';
    purpose?: 'DELIVERY' | 'PICKUP';
    createdAt?: string; // YYYY-MM-DD
  }): Promise<PaginateResult<Trip>> => {
    const { sortOrder, include, ...rest } = params ?? {};
    const requestParams: Record<string, unknown> = {
      ...rest,
      include: include ?? 'vehicle,originCenter,destinationCenter,events',
    };
    if (sortOrder) requestParams.sortOrder = sortOrder.toLowerCase();
    // Only send defined params
    const cleaned = Object.fromEntries(
      Object.entries(requestParams).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get<PaginateResult<Trip>>('/trips', {
      params: cleaned,
    });
    const raw = response.data;
    // Normalize: some APIs return { data: [], meta: {} } or { items: [], totalPages } or direct array
    if (Array.isArray(raw)) {
      return { data: raw, meta: { itemsPerPage: raw.length, totalItems: raw.length, currentPage: 1, totalPages: 1 } };
    }
    if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) {
      return raw as PaginateResult<Trip>;
    }
    if (raw && typeof raw === 'object' && Array.isArray((raw as any).items)) {
      const r = raw as unknown as { items: Trip[]; totalPages?: number; totalItems?: number; currentPage?: number };
      return {
        data: r.items,
        meta: {
          itemsPerPage: r.items.length,
          totalItems: r.totalItems ?? r.items.length,
          currentPage: r.currentPage ?? 1,
          totalPages: r.totalPages ?? 1,
        },
      };
    }
    return { data: [], meta: { itemsPerPage: 0, totalItems: 0, currentPage: 1, totalPages: 1 } };
  },

  getTripById: async (id: number, include?: string): Promise<Trip> => {
    const response = await apiClient.get<Trip>(`/trips/${id}`, {
      params: include ? { include } : undefined,
    });
    const raw = response.data as any;
    if (!raw || typeof raw !== 'object') return raw as Trip;
    // API may return { data: trip } or trip directly
    if (Array.isArray(raw)) return raw[0] as Trip;
    if (raw.data && typeof raw.data === 'object') return raw.data as Trip;
    return raw as Trip;
  },

  // --- Center queue ---
  getCenterQueue: async (
    centerId: number,
    params?: { type?: 'LOADING' | 'UNLOADING'; isActive?: boolean; date?: string }
  ): Promise<{ data: CenterQueueItem[] }> => {
    const response = await apiClient.get(`/centers/${centerId}/queue`, { params });
    return response.data;
  },

  getCenterQueueSummary: async (centerId: number): Promise<CenterQueueSummary> => {
    const response = await apiClient.get<CenterQueueSummary>(`/centers/${centerId}/queue/summary`);
    return response.data;
  },

  startNextService: async (
    centerId: number,
    body: { queueType: 'LOADING' | 'UNLOADING' }
  ): Promise<{ success?: boolean; queue?: CenterQueueItem[] }> => {
    const response = await apiClient.post(`/centers/${centerId}/queue/next`, body);
    return response.data;
  },

  // --- Vehicle assignment ---
  updateVehicleAssignment: async (vehicleId: number, centerId: number | null): Promise<Vehicle> => {
    const response = await apiClient.put<Vehicle>(`/vehicles/${vehicleId}/assignment`, {
      centerId,
    });
    return response.data;
  },

  bulkAssignVehicles: async (assignments: BulkAssignmentItem[]): Promise<BulkAssignmentResult> => {
    const response = await apiClient.put<BulkAssignmentResult>('/vehicles/assignments/bulk', {
      assignments,
    });
    return response.data;
  },

  getCenterById: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/centers/${id}`);
    return response.data;
  },
};
