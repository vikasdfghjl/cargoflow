import { ApiResponse } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface DashboardStats {
  customers: {
    total: number;
    active: number;
    inactive: number;
  };
  bookings: {
    total: number;
    pending: number;
    inTransit: number;
    completed: number;
  };
  drivers: {
    total: number;
    active: number;
    available: number;
    inactive: number;
    suspended: number;
    averageRating: number;
    totalDeliveries: number;
    vehicleDistribution: Record<string, number>;
  };
  revenue: {
    total: number;
    monthly: Array<{
      _id: number;
      revenue: number;
      bookings: number;
    }>;
  };
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch dashboard statistics');
  }

  const data: ApiResponse<DashboardStats> = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch dashboard statistics');
  }

  return data.data!;
};
