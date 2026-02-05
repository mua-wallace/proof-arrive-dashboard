import { apiClient } from './client';

export interface PaginateQuery {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: string;
  sortBy?: string;
  include?: string;
}

export interface PaginateResult<T> {
  data: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    sortBy: [string, 'ASC' | 'DESC'][];
    search?: string;
    searchBy?: string[];
  };
  links: {
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
};
