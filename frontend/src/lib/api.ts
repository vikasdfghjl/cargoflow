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

// Address interface for reuse
export interface Address {
  address: string;
  contactName: string;
  phone: string;
  city: string;
  postalCode: string;
  instructions?: string;
}

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
  pickupAddress: Address;
  deliveryAddress: Address;
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
    licenseNumber: string;
    vehicle?: {
      number: string;
      type: string;
      model: string;
      capacity: number;
    };
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
  pickupAddress: Address;
  deliveryAddress: Address;
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

// Driver types
export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  experience: number;
  rating: number;
  totalDeliveries: number;
  status: 'active' | 'inactive' | 'suspended';
  vehicle: {
    number: string;
    type: 'truck' | 'van' | 'bike' | 'car';
    model: string;
    capacity: number;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: string;
  };
  certifications: string[];
  documents: {
    license: string;
    insurance: string;
    registration: string;
  };
  availability: {
    isAvailable: boolean;
    availableFrom?: string;
    availableTo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  experience: number;
  vehicle: {
    number: string;
    type: 'truck' | 'van' | 'bike' | 'car';
    model: string;
    capacity: number;
  };
  certifications?: string[];
  documents: {
    license: string;
    insurance: string;
    registration: string;
  };
}

export interface DriversResponse {
  drivers: Driver[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface DriverStatistics {
  overview: {
    totalDrivers: number;
    activeDrivers: number;
    availableDrivers: number;
    avgRating: number;
    totalDeliveries: number;
  };
  vehicleDistribution: Record<string, number>;
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

  async updateBooking(bookingId: string, updateData: Partial<Booking>): Promise<Booking> {
    const response = await apiRequest<Booking>(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to update booking');
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

  async deleteBooking(bookingId: string): Promise<void> {
    const response = await apiRequest<void>(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });

    if (response.success) {
      return;
    }

    throw new ApiError(400, response.message || 'Failed to delete booking');
  },
};

// Admin API interfaces
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  companyAddress?: string;
  businessType?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalBookings: number;
  activeBookings: number;
}

export interface CustomerDetails extends Customer {
  statistics: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    activeBookings: number;
    totalRevenue: number;
  };
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    totalCost: number;
    pickupDate: string;
    createdAt: string;
    pickupAddress: Address;
    deliveryAddress: Address;
  }>;
}

export interface CustomersResponse {
  customers: Customer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCustomers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UpdateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  companyAddress?: string;
  businessType?: string;
  isActive: boolean;
}

// Invoice interfaces
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  bookingId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string;
    phone?: string;
    companyAddress?: string;
  };
  bookings?: Array<{
    _id: string;
    bookingNumber: string;
    status: string;
    totalCost: number;
  }>;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  paymentTerms: string;
  sentAt?: string;
  paidAt?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  bookingCount?: number;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalInvoices: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateInvoiceRequest {
  customerId: string;
  bookingIds?: string[];
  dueDate: string;
  items: InvoiceItem[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
  paymentTerms?: string;
}

export interface UpdateInvoiceRequest {
  dueDate?: string;
  items?: InvoiceItem[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
  paymentTerms?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

export interface GenerateInvoiceFromBookingsRequest {
  customerId: string;
  bookingIds: string[];
  dueDate: string;
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalRevenue: number;
  monthlyRevenue: Array<{
    _id: number;
    revenue: number;
    invoices: number;
  }>;
}

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
  revenue: {
    total: number;
    monthly: Array<{
      _id: number;
      revenue: number;
      bookings: number;
    }>;
  };
}

// Admin API functions
export const adminApi = {
  async getAllCustomers(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: 'active' | 'inactive';
    search?: string;
  } = {}): Promise<CustomersResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/admin/customers?${queryString}` : '/admin/customers';
    
    const response = await apiRequest<CustomersResponse>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch customers');
  },

  async getCustomerDetails(customerId: string): Promise<CustomerDetails> {
    const response = await apiRequest<CustomerDetails>(`/admin/customers/${customerId}`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch customer details');
  },

  async updateCustomerStatus(customerId: string, isActive: boolean): Promise<Customer> {
    const response = await apiRequest<Customer>(`/admin/customers/${customerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to update customer status');
  },

  async updateCustomer(customerId: string, updateData: UpdateCustomerRequest): Promise<Customer> {
    const response = await apiRequest<Customer>(`/admin/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to update customer details');
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiRequest<DashboardStats>('/admin/dashboard/stats', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch dashboard statistics');
  },

  async getCustomerBookings(customerId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<BookingsResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `/admin/customers/${customerId}/bookings?${queryString}` 
      : `/admin/customers/${customerId}/bookings`;
    
    const response = await apiRequest<BookingsResponse>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch customer bookings');
  },
};

// Invoice API functions
export const invoiceApi = {
  async getAllInvoices(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
    customerId?: string;
    search?: string;
  } = {}): Promise<InvoicesResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/invoices?${queryString}` : '/invoices';
    
    const response = await apiRequest<InvoicesResponse>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch invoices');
  },

  async getInvoiceDetails(invoiceId: string): Promise<Invoice> {
    const response = await apiRequest<Invoice>(`/invoices/${invoiceId}`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch invoice details');
  },

  async createInvoice(invoiceData: CreateInvoiceRequest): Promise<Invoice> {
    const response = await apiRequest<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to create invoice');
  },

  async updateInvoice(invoiceId: string, updateData: UpdateInvoiceRequest): Promise<Invoice> {
    const response = await apiRequest<Invoice>(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to update invoice');
  },

  async generateInvoiceFromBookings(invoiceData: GenerateInvoiceFromBookingsRequest): Promise<Invoice> {
    const response = await apiRequest<Invoice>('/invoices/generate-from-bookings', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to generate invoice from bookings');
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    const response = await apiRequest<void>(`/invoices/${invoiceId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new ApiError(400, response.message || 'Failed to delete invoice');
    }
  },

  async getInvoiceStats(): Promise<InvoiceStats> {
    const response = await apiRequest<InvoiceStats>('/invoices/stats', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch invoice statistics');
  },
};

// Customer API functions
export const customerApi = {
  async getMyInvoices(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<InvoicesResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/customer/invoices?${queryString}` : '/customer/invoices';
    
    const response = await apiRequest<InvoicesResponse>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch customer invoices');
  },

  async getInvoiceDetails(invoiceId: string): Promise<Invoice> {
    const response = await apiRequest<Invoice>(`/customer/invoices/${invoiceId}`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch invoice details');
  },
};

// Driver API functions
export const driverApi = {
  async getAllDrivers(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'suspended';
    vehicleType?: 'truck' | 'van' | 'bike' | 'car';
    isAvailable?: boolean;
    minRating?: number;
    minExperience?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<DriversResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/drivers?${queryString}` : '/drivers';
    
    const response = await apiRequest<DriversResponse>(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch drivers');
  },

  async getDriverById(driverId: string): Promise<Driver> {
    const response = await apiRequest<Driver>(`/drivers/${driverId}`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch driver details');
  },

  async createDriver(driverData: CreateDriverRequest): Promise<Driver> {
    const response = await apiRequest<Driver>('/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to create driver');
  },

  async updateDriver(driverId: string, driverData: Partial<CreateDriverRequest>): Promise<Driver> {
    const response = await apiRequest<Driver>(`/drivers/${driverId}`, {
      method: 'PUT',
      body: JSON.stringify(driverData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to update driver');
  },

  async deleteDriver(driverId: string): Promise<void> {
    const response = await apiRequest<void>(`/drivers/${driverId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new ApiError(400, response.message || 'Failed to delete driver');
    }
  },

  async updateDriverStatus(driverId: string, status: 'active' | 'inactive' | 'suspended'): Promise<Driver> {
    const response = await apiRequest<Driver>(`/drivers/${driverId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to update driver status');
  },

  async updateDriverLocation(driverId: string, location: {
    latitude: number;
    longitude: number;
    address?: string;
  }): Promise<Driver> {
    const response = await apiRequest<Driver>(`/drivers/${driverId}/location`, {
      method: 'PATCH',
      body: JSON.stringify(location),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to update driver location');
  },

  async updateDriverAvailability(driverId: string, availability: {
    isAvailable: boolean;
    availableFrom?: string;
    availableTo?: string;
  }): Promise<Driver> {
    const response = await apiRequest<Driver>(`/drivers/${driverId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify(availability),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to update driver availability');
  },

  async getAvailableDrivers(location: {
    latitude: number;
    longitude: number;
    vehicleType?: 'truck' | 'van' | 'bike' | 'car';
    minCapacity?: number;
    radius?: number;
  }): Promise<Driver[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(location).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiRequest<Driver[]>(`/drivers/available?${queryParams.toString()}`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch available drivers');
  },

  async getDriverStatistics(): Promise<DriverStatistics> {
    const response = await apiRequest<DriverStatistics>('/drivers/statistics', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(400, response.message || 'Failed to fetch driver statistics');
  },

  async assignDriverToBooking(driverId: string, bookingId: string): Promise<void> {
    const response = await apiRequest<void>('/drivers/assign', {
      method: 'POST',
      body: JSON.stringify({ driverId, bookingId }),
    });

    if (!response.success) {
      throw new ApiError(400, response.message || 'Failed to assign driver to booking');
    }
  },

  async getDriverBookings(driverId: string): Promise<Booking[]> {
    const response = await apiRequest<{
      driverId: string;
      bookings: Booking[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(`/drivers/${driverId}/bookings`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data.bookings;
    }

    throw new ApiError(400, response.message || 'Failed to fetch driver bookings');
  },
};

export { ApiError };
