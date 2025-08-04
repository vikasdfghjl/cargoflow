// API Response types for frontend
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Booking related types
export interface Booking {
  id: string;
  userId: string;
  bookingNumber: string;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  pickupAddress: Address;
  deliveryAddress: Address;
  weight: number;
  dimensions: Dimensions;
  serviceType: 'standard' | 'express' | 'same_day';
  packageType: 'document' | 'package' | 'fragile' | 'bulk';
  pickupDate: string;
  specialInstructions?: string;
  insurance?: boolean;
  insuranceValue?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  address: string;
  contactName: string;
  phone: string;
  city: string;
  postalCode: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

// User types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'customer' | 'admin';
  phone?: string;
  companyName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Address types
export interface SavedAddress {
  id: string;
  label: string;
  type: 'home' | 'office' | 'warehouse' | 'other';
  contactName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
