// API configuration and service functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Types for API requests and responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'customer' | 'admin';
  phone?: string;
  companyName?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'customer' | 'admin';
  companyName?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API utility functions
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error. Please check your connection.');
  }
}

// Authentication API functions
export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      // Store the token
      localStorage.setItem('authToken', response.data.token);
      return response.data;
    }

    throw new ApiError(400, response.message || 'Login failed');
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      // Store the token
      localStorage.setItem('authToken', response.data.token);
      return response.data;
    }

    throw new ApiError(400, response.message || 'Registration failed');
  },

  async getProfile(): Promise<User> {
    const response = await apiRequest<User>('/auth/profile', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to get profile');
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.warn('Logout request failed:', error);
    } finally {
      localStorage.removeItem('authToken');
    }
  },
};

// Booking types
export interface Booking {
  _id: string;
  bookingNumber: string;
  customerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  pickupAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  deliveryAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  packageType: 'document' | 'package' | 'fragile' | 'bulk';
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  serviceType: 'standard' | 'express' | 'same_day';
  pickupDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed';
  specialInstructions?: string;
  insurance: boolean;
  insuranceValue?: number;
  baseCost: number;
  weightCharges: number;
  insuranceCharges: number;
  totalCost: number;
  trackingNumber?: string;
  driverId?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBookings: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AdminBookingsResponse extends BookingsResponse {
  statistics?: {
    totalBookings: Array<{ count: number }>;
    todayBookings: Array<{ count: number }>;
    statusCounts: Array<{ _id: string; count: number }>;
    monthlyRevenue: Array<{ _id: null; total: number }>;
  };
}

export interface CreateBookingRequest {
  pickupAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  deliveryAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  packageType: 'document' | 'package' | 'fragile' | 'bulk';
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  serviceType: 'standard' | 'express' | 'same_day';
  pickupDate: string;
  specialInstructions?: string;
  insurance: boolean;
  insuranceValue?: number;
  baseCost: number;
  weightCharges: number;
  insuranceCharges: number;
  totalCost: number;
}

// Booking API functions
export const bookingApi = {
  async getMyBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<BookingsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/bookings?${queryString}` : '/bookings';

    const response = await apiRequest<BookingsResponse>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to get bookings');
  },

  async getAllBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AdminBookingsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/bookings/admin/all?${queryString}` : '/bookings/admin/all';

    const response = await apiRequest<AdminBookingsResponse>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to get all bookings');
  },

  async getBookingById(bookingId: string): Promise<Booking> {
    const response = await apiRequest<Booking>(`/bookings/${bookingId}`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to get booking');
  },

  async createBooking(bookingData: CreateBookingRequest): Promise<Booking> {
    const response = await apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to create booking');
  },
};

export { ApiError };
