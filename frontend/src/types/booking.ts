// Frontend types for bookings (matching the API structure)
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

export type BookingStatus = Booking['status'];
export type ServiceType = Booking['serviceType'];
export type PackageType = Booking['packageType'];
